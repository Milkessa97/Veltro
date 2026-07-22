"use server"

import { Resend } from "resend"

// Helper to initialize Resend safely
function getResendInstance() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("RESEND_API_KEY environment variable is not defined.")
    return null
  }
  return new Resend(apiKey)
}

// Get the from email address (default to Resend onboarding address if custom not defined)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
const OWNER_EMAIL = "milkessahabtamukebu@gmail.com"

/**
 * Helper to generate star characters based on rating number
 */
function getStarString(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating)
}

/**
 * Standard Dark Mode Email Wrap
 */
function getEmailTemplate(title: string, contentHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            background-color: #09090b;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #e4e4e7;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .wrapper {
            width: 100%;
            background-color: #09090b;
            padding: 40px 16px;
            box-sizing: border-box;
          }
          .container {
            max-width: 580px;
            margin: 0 auto;
            background-color: #121215;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          }
          .header {
            padding: 32px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            text-align: center;
            background: linear-gradient(to bottom, rgba(168, 85, 247, 0.08), transparent);
          }
          .logo-text {
            font-size: 26px;
            font-weight: 800;
            letter-spacing: -0.05em;
            margin: 0;
            background: linear-gradient(to right, #a855f7, #4b2fcb);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: inline-block;
            font-family: "Outfit", "Inter", sans-serif;
          }
          .content {
            padding: 32px;
            line-height: 1.6;
          }
          .title {
            font-size: 20px;
            font-weight: 700;
            color: #ffffff;
            margin-top: 0;
            margin-bottom: 16px;
            letter-spacing: -0.02em;
          }
          .paragraph {
            font-size: 15px;
            color: #a1a1aa;
            margin-bottom: 24px;
          }
          .highlight-box {
            background-color: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 12px;
            padding: 20px;
            margin: 24px 0;
          }
          .rating-stars {
            color: #fbbf24;
            font-size: 22px;
            margin-bottom: 10px;
            letter-spacing: 2px;
          }
          .quote-text {
            font-style: italic;
            color: #f4f4f5;
            font-size: 15px;
            margin: 0;
            line-height: 1.5;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .details-table td {
            padding: 10px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            font-size: 14px;
            vertical-align: top;
          }
          .details-table tr:last-child td {
            border-bottom: none;
          }
          .details-label {
            color: #71717a;
            width: 30%;
            font-weight: 500;
          }
          .details-val {
            color: #e4e4e7;
            font-weight: 400;
          }
          .btn-container {
            margin-top: 32px;
            text-align: center;
          }
          .btn {
            display: inline-block;
            padding: 12px 28px;
            background: linear-gradient(to right, #a855f7, #6366f1);
            color: #ffffff !important;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(168, 85, 247, 0.25);
            transition: all 0.2s;
          }
          .footer {
            padding: 24px 32px;
            background-color: rgba(0, 0, 0, 0.2);
            border-top: 1px solid rgba(255, 255, 255, 0.04);
            text-align: center;
            font-size: 12px;
            color: #52525b;
          }
          .footer a {
            color: #a855f7;
            text-decoration: none;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <span class="logo-text">Veltro</span>
            </div>
            <div class="content">
              ${contentHtml}
            </div>
            <div class="footer">
              <p>Built by <a href="mailto:${OWNER_EMAIL}">Milkessa Kebu</a>. Shaping engineering team visibility.</p>
              <p style="margin-top: 8px; color: #3f3f46;">&copy; ${new Date().getFullYear()} Veltro. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Action to send email for contact form submissions
 */
export async function sendContactEmailAction(formData: {
  email: string
  message: string
}) {
  const { email, message } = formData

  if (!email || !message) {
    return { success: false, error: "Email and message are required." }
  }

  const resend = getResendInstance()
  if (!resend) {
    return { success: false, error: "Resend is not configured on this server." }
  }

  try {
    // 1. Send details to Owner (milkessahabtamukebu@gmail.com)
    const ownerEmailHtml = getEmailTemplate(
      "New Contact Message Received",
      `
      <h2 class="title">New Contact Submission</h2>
      <p class="paragraph">You received a new message from the contact form on Veltro.</p>
      
      <table class="details-table">
        <tr>
          <td class="details-label">Sender</td>
          <td class="details-val">${email}</td>
        </tr>
        <tr>
          <td class="details-label">Message</td>
          <td class="details-val" style="white-space: pre-line;">${message}</td>
        </tr>
      </table>
      `
    )

    const result1 = await resend.emails.send({
      from: FROM_EMAIL,
      to: OWNER_EMAIL,
      subject: `[Veltro Contact] Message from ${email}`,
      html: ownerEmailHtml,
    })

    if (result1.error) {
      console.error("Resend owner notification failed:", result1.error)
      return { success: false, error: result1.error.message }
    }

    // 2. Send thank you confirmation to User
    const userEmailHtml = getEmailTemplate(
      "Thanks for reaching out to Veltro!",
      `
      <h2 class="title">Thanks for reaching out! 🙌</h2>
      <p class="paragraph">Hi there,</p>
      <p class="paragraph">
        Thanks for sending me a message regarding Veltro. I've received your note and will get back to you shortly (typically within a day).
      </p>
      <p class="paragraph">
        As a solo developer, building and running Veltro is a personal journey. Feedback, questions, and feature requests from other engineering teams are what keep me going and make the platform better.
      </p>
      <p class="paragraph">
        <strong>I am currently open to new opportunities, contract work, or interesting collaborations!</strong> If you want to discuss potential roles, schedule a custom walkthrough of Veltro, or simply connect, feel free to reply directly to this email or reach me directly at <a href="mailto:${OWNER_EMAIL}" style="color:#a855f7; text-decoration:none;">${OWNER_EMAIL}</a>.
      </p>
      
      <div class="btn-container">
        <a href="mailto:${OWNER_EMAIL}" class="btn">Let's Connect</a>
      </div>
      `
    )

    try {
      const result2 = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "Thanks for reaching out to Veltro! 💜",
        html: userEmailHtml,
      })
      if (result2.error) {
        console.warn("Could not send confirmation email to the user (probably due to Resend sandbox restriction):", result2.error.message)
      }
    } catch (e) {
      console.warn("Could not send confirmation email to the user (probably due to Resend sandbox restriction).", e)
    }

    return { success: true }
  } catch (error: any) {
    console.error("Failed to send contact email through Resend:", error)
    return { success: false, error: error.message || "Failed to send email." }
  }
}

/**
 * Action to send email for rating/feedback submissions
 */
export async function sendFeedbackEmailAction(formData: {
  rating: number
  name?: string
  role?: string
  email?: string
  quote?: string
  allowPublic: boolean
}) {
  const { rating, name, role, email, quote, allowPublic } = formData

  if (!rating) {
    return { success: false, error: "Rating is required." }
  }

  const resend = getResendInstance()
  if (!resend) {
    return { success: false, error: "Resend is not configured on this server." }
  }

  try {
    // 1. Send details to Owner (milkessahabtamukebu@gmail.com)
    const ownerEmailHtml = getEmailTemplate(
      "New Rating Submitted",
      `
      <h2 class="title">New Feedback Submission</h2>
      <p class="paragraph">A user submitted a new rating on Veltro.</p>
      
      <div class="highlight-box">
        <div class="rating-stars">${getStarString(rating)} (${rating}/5)</div>
        ${quote ? `<p class="quote-text">"${quote}"</p>` : `<p class="quote-text" style="color: #71717a;">No review comment left.</p>`}
      </div>
      
      <table class="details-table">
        <tr>
          <td class="details-label">Name</td>
          <td class="details-val">${name || "Anonymous"}</td>
        </tr>
        <tr>
          <td class="details-label">Role/Company</td>
          <td class="details-val">${role || "N/A"}</td>
        </tr>
        <tr>
          <td class="details-label">User Email</td>
          <td class="details-val">${email || "Not provided"}</td>
        </tr>
        <tr>
          <td class="details-label">Show Publicly</td>
          <td class="details-val">${allowPublic ? "Yes" : "No"}</td>
        </tr>
      </table>
      `
    )

    const result1 = await resend.emails.send({
      from: FROM_EMAIL,
      to: OWNER_EMAIL,
      subject: `[Veltro Rating] ${rating} Star Rating from ${name || "Anonymous"}`,
      html: ownerEmailHtml,
    })

    if (result1.error) {
      console.error("Resend owner notification failed:", result1.error)
      return { success: false, error: result1.error.message }
    }

    // 2. Send thank you confirmation to User (if email provided)
    if (email && email.trim() !== "") {
      const starIcons = getStarString(rating)
      const userEmailHtml = getEmailTemplate(
        "Thank you for rating Veltro!",
        `
        <h2 class="title">Thank you for the support! 💜</h2>
        <p class="paragraph">Hi ${name || "there"},</p>
        <p class="paragraph">
          I noticed you just left a <strong>${rating}-star</strong> rating for Veltro:
        </p>
        
        <div class="highlight-box" style="text-align: center;">
          <div class="rating-stars" style="font-size: 26px; margin-bottom: 0;">${starIcons}</div>
          ${quote ? `<p class="quote-text" style="margin-top: 12px; color: #d4d4d8;">"${quote}"</p>` : ""}
        </div>
        
        <p class="paragraph">
          As a solo developer, feedback and reviews from creators and engineers like you are incredibly important. Your submission helps me expand my personal portfolio and continuously refine the platform.
        </p>
        <p class="paragraph">
          <strong>Note: I am currently open to full-time roles, contracts, and new opportunities!</strong> If you'd like to chat about a potential fit, discuss custom features, or collaborate on a project, please feel free to reply directly to this email or reach out to me at <a href="mailto:${OWNER_EMAIL}" style="color:#a855f7; text-decoration:none;">${OWNER_EMAIL}</a>.
        </p>
        
        <div class="btn-container">
          <a href="mailto:${OWNER_EMAIL}" class="btn">Reach Out to Milkessa</a>
        </div>
        `
      )

      try {
        const result2 = await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: "Thank you for your rating on Veltro! 💜",
          html: userEmailHtml,
        })
        if (result2.error) {
          console.warn("Could not send feedback thank-you email to the user (probably due to Resend sandbox restriction):", result2.error.message)
        }
      } catch (e) {
        console.warn("Could not send feedback thank-you email to the user (probably due to Resend sandbox restriction).", e)
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Failed to send feedback email through Resend:", error)
    return { success: false, error: error.message || "Failed to send email." }
  }
}
