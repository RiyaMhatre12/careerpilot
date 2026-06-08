import resend
import os
from dotenv import load_dotenv

load_dotenv()
resend.api_key = os.getenv("RESEND_API_KEY")

def send_welcome_email(name: str, email: str):
    try:
        resend.Emails.send({
            "from": "CareerPilot <onboarding@resend.dev>",
            "to": ["riyamhatree12@gmail.com"],
            "subject": f"Welcome to CareerPilot - Account created for {email}",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #ffffff; padding: 40px; border-radius: 12px;">
                <h1 style="color: #7c3aed;">CareerPilot</h1>
                <h2>Welcome, {name}! 🎉</h2>
                <p style="color: #9ca3af;">Account created for: {email}</p>
                <p style="color: #9ca3af;">You can now analyze resumes, find skill gaps, and prepare for interviews.</p>
                <a href="http://localhost:5173/login" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 20px;">
                    Go to Dashboard
                </a>
            </div>
            """
        })
    except Exception as e:
        print(f"Email error: {e}")

def send_reset_email(name: str, email: str, token: str):
    reset_link = f"http://localhost:5173/reset-password?token={token}"
    try:
        resend.Emails.send({
            "from": "CareerPilot <onboarding@resend.dev>",
            "to": ["riyamhatree12@gmail.com"],
            "subject": "Reset Your CareerPilot Password",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #ffffff; padding: 40px; border-radius: 12px;">
                <h1 style="color: #7c3aed;">CareerPilot</h1>
                <h2>Reset Your Password</h2>
                <p style="color: #9ca3af;">Hi {name}, click below to reset your password.</p>
                <a href="{reset_link}" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 20px;">
                    Reset Password
                </a>
                <p style="color: #9ca3af; margin-top: 20px;">Link expires in 1 hour.</p>
            </div>
            """
        })
    except Exception as e:
        print(f"Email error: {e}")