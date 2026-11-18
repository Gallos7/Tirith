import bcrypt
import resend
from app.core.config import settings

resend.api_key = settings.RESEND_API_KEY

def hash_password(password: str) -> str:
    """Generates a secure cryptographic hash using bcrypt with an automated salt."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(password_bytes, salt)
    return hashed_bytes.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Validates a plaintext password against a stored bcrypt hash."""
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

def send_email_code(target_email: str, code: str) -> bool:
    """
    Dispatches a secure 6-digit recovery code via the Resend API.
    Used for account recovery and password reset flows.
    """
    try:
        response = resend.Emails.send({
            "from": "Tirith Security <onboarding@resend.dev>",
            "to": target_email,
            "subject": "Your Tirith Password Reset Code",
            "html": f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 30px; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #0f172a; margin-bottom: 15px;">Password Reset Request</h2>
                <p style="color: #475569; font-size: 16px; line-height: 1.5;">Your 6-digit verification code to reset your Tirith password is:</p>
                <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 6px; margin: 25px 0;">
                    <h1 style="color: #2563eb; letter-spacing: 8px; margin: 0; font-size: 32px;">{code}</h1>
                </div>
                <p style="color: #64748b; font-size: 14px;">This code will expire in 15 minutes. If you did not request this, please ignore this email to keep your account secure.</p>
            </div>
            """
        })
        print(f"Email sent successfully: {response}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False