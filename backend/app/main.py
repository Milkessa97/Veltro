from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routes.auth import router as auth_router
from app.routes.user_preferences import router as preferences_router
from app.routes.repositories import router as repositories_router
from app.routes.webhooks import router as webhooks_router


settings = get_settings()

app = FastAPI(title="Veltro API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(preferences_router)
app.include_router(repositories_router)
app.include_router(webhooks_router)

@app.get("/")
def root():
    return {"message": "Welcome to Veltro Backend"}