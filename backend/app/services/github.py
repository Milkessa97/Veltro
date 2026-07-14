import time
import logging
from datetime import datetime, timedelta, UTC
from typing import Any, Dict, List, Optional
import httpx
import jwt

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# In-memory global cache for installation access tokens to avoid redundant token generation.
# Maps installation_id (int) -> {"token": str, "expires_at": datetime}
_token_cache: Dict[int, Dict[str, Any]] = {}

class GitHubRateLimitError(Exception):
    """
    Raised when the GitHub API rate limit is exceeded and the reset window
    is too long to wait.
    """
    def __init__(self, message: str, reset_at: float):
        super().__init__(message)
        self.reset_at = reset_at

class GitHubAPIClient:
    """
    An authenticated GitHub API client that uses GitHub App Installation access tokens.
    It automatically handles installation token retrieval/caching, pagination, and
    rate limit backoff.
    """
    def __init__(self, installation_id: int):
        self.installation_id = installation_id
        self.client = httpx.Client(
            base_url="https://api.github.com",
            timeout=30.0,
            headers={
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28"
            }
        )

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.client.close()

    def _get_app_jwt(self) -> str:
        """
        Generates a signed JWT for authentication as the GitHub App.
        """
        now = int(time.time())
        # GitHub allows a max JWT expiration of 10 minutes.
        payload = {
            "iat": now - 60,   # Set 1 minute in the past to allow for clock drift
            "exp": now + 540,  # 9 minutes in the future
            "iss": int(settings.GITHUB_APP_ID)
        }
        private_key = settings.GITHUB_PRIVATE_KEY
        if isinstance(private_key, str):
            private_key = private_key.replace("\\n", "\n").encode("utf-8")
        
        return jwt.encode(payload, private_key, algorithm="RS256")

    def _get_token(self) -> str:
        """
        Retrieves a cached installation token or requests a new one from GitHub.
        """
        now = datetime.now(UTC)
        cached = _token_cache.get(self.installation_id)
        
        # Reuse token if it has at least 2 minutes of lifetime remaining
        if cached and cached["expires_at"] > now + timedelta(minutes=2):
            return cached["token"]

        app_jwt = self._get_app_jwt()
        url = f"/app/installations/{self.installation_id}/access_tokens"
        headers = {
            "Authorization": f"Bearer {app_jwt}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }
        
        # Use an independent request to bypass the client's base_url if needed,
        # but since we are targeting api.github.com, we can just execute it via httpx.
        with httpx.Client(base_url="https://api.github.com") as client:
            response = client.post(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            token = data["token"]
            expires_at_str = data["expires_at"]
            expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
            
            _token_cache[self.installation_id] = {
                "token": token,
                "expires_at": expires_at
            }
            return token

    def _request(
        self, 
        method: str, 
        url: str, 
        params: Optional[Dict[str, Any]] = None, 
        json_data: Optional[Any] = None,
        max_retries: int = 3
    ) -> httpx.Response:
        """
        Wraps HTTP requests to inject authentication headers and handle rate limits automatically.
        """
        token = self._get_token()
        headers = {"Authorization": f"Bearer {token}"}
        
        retry_count = 0
        while True:
            try:
                response = self.client.request(
                    method, 
                    url, 
                    params=params, 
                    json=json_data, 
                    headers=headers
                )
                
                # Check for rate limits (HTTP 403 Forbidden or 429 Too Many Requests)
                if response.status_code in (403, 429):
                    is_rate_limit = False
                    
                    # Remaining requests in the rate limit window
                    remaining = response.headers.get("x-ratelimit-remaining")
                    if remaining == "0":
                        is_rate_limit = True
                    
                    body_text = response.text
                    if "rate limit" in body_text.lower() or "secondary rate limit" in body_text.lower():
                        is_rate_limit = True
                        
                    if is_rate_limit:
                        # Parse retry windows
                        retry_after = response.headers.get("Retry-After")
                        reset_timestamp = response.headers.get("x-ratelimit-reset")
                        
                        sleep_time = 5.0
                        if retry_after:
                            sleep_time = float(retry_after)
                        elif reset_timestamp:
                            reset_at = float(reset_timestamp)
                            sleep_time = max(reset_at - time.time(), 0) + 1.0
                            
                        # If rate limit reset is longer than 60 seconds, fail instead of blocking the thread
                        if sleep_time > 60.0:
                            reset_time = time.time() + sleep_time
                            raise GitHubRateLimitError(
                                f"GitHub Rate Limit hit. Reset at {reset_time} (in {sleep_time}s). Failing request.", 
                                reset_time
                            )
                            
                        logger.warning(
                            f"GitHub rate limit hit. Sleeping for {sleep_time:.2f}s "
                            f"(attempt {retry_count + 1}/{max_retries + 1})"
                        )
                        time.sleep(sleep_time)
                        retry_count += 1
                        if retry_count <= max_retries:
                            continue
                
                response.raise_for_status()
                return response
                
            except httpx.HTTPStatusError as e:
                # Reraise rate limits if retries were exceeded
                if response.status_code in (403, 429) and retry_count > max_retries:
                    raise e
                raise e

    def get(self, url: str, params: Optional[Dict[str, Any]] = None) -> Any:
        """
        Executes an authenticated GET request and returns JSON.
        """
        response = self._request("GET", url, params=params)
        return response.json()

    def get_all(self, url: str, params: Optional[Dict[str, Any]] = None) -> List[Any]:
        """
        Executes a GET request and automatically collects items across all paginated Link headers.
        """
        if params is None:
            params = {}
        if "per_page" not in params:
            params["per_page"] = 100

        results = []
        next_url: Optional[str] = url
        
        while next_url:
            # Initial request uses configured params, pagination requests contain query strings already
            if next_url == url:
                response = self._request("GET", next_url, params=params)
            else:
                # Remove base url part from link headers if present (as self.client has base_url configured)
                req_url = next_url
                if next_url.startswith("https://api.github.com"):
                    req_url = next_url[len("https://api.github.com"):]
                response = self._request("GET", req_url)
            
            data = response.json()
            if isinstance(data, list):
                results.extend(data)
            elif isinstance(data, dict) and "items" in data:
                results.extend(data["items"])
            else:
                results.append(data)
                break
                
            link_header = response.headers.get("Link")
            next_url = self._parse_next_link(link_header)
            
        return results

    def _parse_next_link(self, link_header: Optional[str]) -> Optional[str]:
        """
        Parses the Link header to find the next page's URL.
        """
        if not link_header:
            return None
            
        # Example Link header format:
        # <https://api.github.com/repositories/1234/pulls?page=2>; rel="next", ...
        parts = link_header.split(",")
        for part in parts:
            if 'rel="next"' in part:
                start = part.find("<") + 1
                end = part.find(">")
                if start > 0 and end > start:
                    return part[start:end]
        return None
