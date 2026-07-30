from datetime import datetime
import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
import resend

from app.config import get_settings, Settings

router = APIRouter(prefix="/feedback", tags=["Feedback"])

# Owner email to receive notifications
OWNER_EMAIL = "milkessahabtamukebu@gmail.com"


class ContactRequest(BaseModel):
    email: EmailStr
    message: str


class FeedbackRequest(BaseModel):
    rating: int
    name: Optional[str] = None
    role: Optional[str] = None
    email: Optional[EmailStr] = None
    quote: Optional[str] = None
    allowPublic: bool = True


def get_star_string(rating: int) -> str:
    """Helper to generate star characters based on rating number"""
    return "★" * rating + "☆" * (5 - rating)


def get_email_template(title: str, content_html: str) -> str:
    """Standard Dark Mode Email Wrap matching Dashboard Settings theme"""
    current_year = datetime.now().year
    return f"""
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
        <style>
          body {{
            background-color: #09090b;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #f4f4f5;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }}
          .wrapper {{
            width: 100%;
            background-color: #09090b;
            padding: 40px 16px;
            box-sizing: border-box;
          }}
          .container {{
            max-width: 580px;
            margin: 0 auto;
            background-color: #0f0f12;
            border: 1px solid #27272a;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
          }}
          .header {{
            padding: 24px 32px;
            border-bottom: 1px solid #27272a;
            text-align: left;
            background-color: #0f0f12;
          }}
          .logo-text {{
            font-size: 20px;
            font-weight: 700;
            letter-spacing: -0.03em;
            margin: 0;
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }}
          .content {{
            padding: 32px;
            line-height: 1.6;
          }}
          .title {{
            font-size: 18px;
            font-weight: 600;
            color: #ffffff;
            margin-top: 0;
            margin-bottom: 16px;
            letter-spacing: -0.01em;
          }}
          .paragraph {{
            font-size: 14px;
            color: #a1a1aa;
            margin-bottom: 24px;
            line-height: 1.6;
          }}
          .highlight-box {{
            background-color: #18181b;
            border: 1px solid #27272a;
            border-radius: 8px;
            padding: 16px 20px;
            margin: 24px 0;
          }}
          .rating-stars {{
            color: #fbbf24;
            font-size: 20px;
            margin-bottom: 8px;
            letter-spacing: 2px;
          }}
          .quote-text {{
            font-style: italic;
            color: #e4e4e7;
            font-size: 14px;
            margin: 0;
            line-height: 1.5;
          }}
          .details-table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }}
          .details-table td {{
            padding: 10px 0;
            border-bottom: 1px solid #27272a;
            font-size: 13px;
            vertical-align: top;
          }}
          .details-table tr:last-child td {{
            border-bottom: none;
          }}
          .details-label {{
            color: #71717a;
            width: 35%;
            font-weight: 500;
          }}
          .details-val {{
            color: #e4e4e7;
            font-weight: 400;
          }}
          .btn-container {{
            margin-top: 32px;
            text-align: left;
          }}
          .btn {{
            display: inline-block;
            padding: 8px 16px;
            background-color: #f4f4f5;
            color: #09090b !important;
            font-size: 12px;
            font-weight: 600;
            text-decoration: none;
            border-radius: 8px;
            transition: background-color 0.2s;
          }}
          .footer {{
            padding: 20px 32px;
            background-color: #09090b;
            border-top: 1px solid #27272a;
            text-align: left;
            font-size: 11px;
            color: #71717a;
          }}
          .footer a {{
            color: #ffffff;
            text-decoration: none;
            font-weight: 500;
          }}
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <span class="logo-text">Veltro</span>
            </div>
            <div class="content">
              {content_html}
            </div>
            <div class="footer">
              <p style="margin: 0;">Built by <a href="mailto:{OWNER_EMAIL}">Milkessa Habtamu Kebu</a>. Shaping engineering team visibility.</p>
              <p style="margin: 8px 0 0 0; color: #3f3f46;">&copy; {current_year} Veltro. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
    """



@router.post("/contact")
def send_contact(
    body: ContactRequest,
    settings: Settings = Depends(get_settings)
):
    """
    Receives contact/feedback form submissions and sends
    via Resend. API key stays server-side only.
    """
    resend.api_key = settings.resend_api_key
    from_email = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
    owner_email = settings.contact_email or OWNER_EMAIL

    # 1. Send details to Owner
    owner_email_html = get_email_template(
        "New Contact Message Received",
        f"""
        <h2 class="title">New Contact Submission</h2>
        <p class="paragraph">You received a new message from the contact form on Veltro.</p>
        
        <table class="details-table">
          <tr>
            <td class="details-label">Sender</td>
            <td class="details-val">{body.email}</td>
          </tr>
          <tr>
            <td class="details-label">Message</td>
            <td class="details-val" style="white-space: pre-line;">{body.message}</td>
          </tr>
        </table>
        """
    )

    try:
        resend.Emails.send({
            "from": from_email,
            "to": owner_email,
            "subject": f"[Veltro Contact] Message from {body.email}",
            "html": owner_email_html,
        })
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to send message. Please try again. Error: {str(e)}"
        )

    # 2. Send thank you confirmation to User
    user_email_html = get_email_template(
        "Thanks for reaching out to Veltro!",
        f"""
        <h2 class="title">Thanks for reaching out! 🙌</h2>
        <p class="paragraph">Hi there,</p>
        <p class="paragraph">
          Thanks for sending me a message regarding Veltro. I've received your note and will get back to you shortly (typically within a day).
        </p>
        <p class="paragraph">
          As a solo developer, building and running Veltro is a personal journey. Feedback, questions, and feature requests from other engineering teams are what keep me going and make the platform better.
        </p>
        <p class="paragraph">
          <strong>I am currently open to new opportunities, contract work, or interesting collaborations!</strong> If you want to discuss potential roles, schedule a custom walkthrough of Veltro, or simply connect, feel free to reply directly to this email or reach me directly at <a href="mailto:{owner_email}" style="color:#a855f7; text-decoration:none;">{owner_email}</a>.
        </p>
        
        <div class="btn-container">
          <a href="mailto:{owner_email}" class="btn">Let's Connect</a>
        </div>
        """
    )

    try:
        resend.Emails.send({
            "from": from_email,
            "to": body.email,
            "subject": "Thanks for reaching out to Veltro! 💜",
            "html": user_email_html,
        })
    except Exception:
        # Failing to send user thank-you (e.g. sandbox restriction) should not fail the API call
        pass

    return {"success": True, "message": "Message sent successfully"}


@router.post("/rating")
def send_rating(
    body: FeedbackRequest,
    settings: Settings = Depends(get_settings)
):
    """
    Receives star ratings and quotes from the feedback form and sends
    them via Resend.
    """
    resend.api_key = settings.resend_api_key
    from_email = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
    owner_email = settings.contact_email or OWNER_EMAIL

    # 1. Send details to Owner
    rating_stars = get_star_string(body.rating)
    quote_section = (
        f'<p class="quote-text">"{body.quote}"</p>'
        if body.quote
        else '<p class="quote-text" style="color: #71717a;">No review comment left.</p>'
    )

    owner_email_html = get_email_template(
        "New Rating Submitted",
        f"""
        <h2 class="title">New Feedback Submission</h2>
        <p class="paragraph">A user submitted a new rating on Veltro.</p>
        
        <div class="highlight-box">
          <div class="rating-stars">{rating_stars} ({body.rating}/5)</div>
          {quote_section}
        </div>
        
        <table class="details-table">
          <tr>
            <td class="details-label">Name</td>
            <td class="details-val">{body.name or "Anonymous"}</td>
          </tr>
          <tr>
            <td class="details-label">Role/Company</td>
            <td class="details-val">{body.role or "N/A"}</td>
          </tr>
          <tr>
            <td class="details-label">User Email</td>
            <td class="details-val">{body.email or "Not provided"}</td>
          </tr>
          <tr>
            <td class="details-label">Show Publicly</td>
            <td class="details-val">{"Yes" if body.allowPublic else "No"}</td>
          </tr>
        </table>
        """
    )

    try:
        resend.Emails.send({
            "from": from_email,
            "to": owner_email,
            "subject": f"[Veltro Rating] {body.rating} Star Rating from {body.name or 'Anonymous'}",
            "html": owner_email_html,
        })
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to send rating. Please try again. Error: {str(e)}"
        )

    # 2. Send thank you confirmation to User (if email provided)
    if body.email:
        user_email_html = get_email_template(
            "Thank you for rating Veltro!",
            f"""
            <h2 class="title">Thank you for the support! 💜</h2>
            <p class="paragraph">Hi {body.name or "there"},</p>
            <p class="paragraph">
              I noticed you just left a <strong>{body.rating}-star</strong> rating for Veltro:
            </p>
            
            <div class="highlight-box" style="text-align: center;">
              <div class="rating-stars" style="font-size: 26px; margin-bottom: 0;">{rating_stars}</div>
              {f'<p class="quote-text" style="margin-top: 12px; color: #d4d4d8;">"{body.quote}"</p>' if body.quote else ""}
            </div>
            
            <p class="paragraph">
              As a solo developer, feedback and reviews from creators and engineers like you are incredibly important. Your submission helps me expand my personal portfolio and continuously refine the platform.
            </p>
            <p class="paragraph">
              <strong>Note: I am currently open to full-time roles, contracts, and new opportunities!</strong> If you'd like to chat about a potential fit, discuss custom features, or collaborate on a project, please feel free to reply directly to this email or reach out to me at <a href="mailto:{owner_email}" style="color:#a855f7; text-decoration:none;">{owner_email}</a>.
            </p>
            
            <div class="btn-container">
              <a href="mailto:{owner_email}" class="btn">Reach Out to Milkessa</a>
            </div>
            """
        )

        try:
            resend.Emails.send({
                "from": from_email,
                "to": body.email,
                "subject": "Thank you for your rating on Veltro! 💜",
                "html": user_email_html,
            })
        except Exception:
            pass

    return {"success": True, "message": "Feedback sent successfully"}
