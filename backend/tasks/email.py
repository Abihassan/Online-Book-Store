from celery_app.celery import celery_app
import os, smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def _send_smtp(to: str, subject: str, html: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = os.getenv("MAIL_DEFAULT_SENDER", "BookHaven <no-reply@bookhaven.com>")
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(os.getenv("MAIL_SERVER", "smtp.gmail.com"),
                      int(os.getenv("MAIL_PORT", 587))) as server:
        server.ehlo()
        server.starttls()
        server.login(os.getenv("MAIL_USERNAME"), os.getenv("MAIL_PASSWORD"))
        server.sendmail(msg["From"], to, msg.as_string())


# ── Order confirmation ────────────────────────────────────────────────────────
@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_order_confirmation(self, user_email: str, user_name: str, order_id: str,
                             items: list, total: float):
    try:
        items_html = "".join(
            f"<tr><td>{i['title']}</td><td>x{i['quantity']}</td>"
            f"<td>${i['price']:.2f}</td></tr>"
            for i in items
        )
        html = f"""
        <html><body style="font-family:sans-serif;color:#333">
          <h2 style="color:#f97316">Order Confirmed! 📚</h2>
          <p>Hi {user_name}, thank you for your purchase.</p>
          <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%">
            <tr style="background:#fff7ed"><th>Book</th><th>Qty</th><th>Price</th></tr>
            {items_html}
          </table>
          <p><strong>Total: ${total:.2f}</strong></p>
          <p>Your books are now available in your <a href="http://localhost:5173/library">Library</a>.</p>
          <p style="color:#aaa;font-size:12px">BookHaven — Your Digital Bookstore</p>
        </body></html>
        """
        _send_smtp(user_email, f"Order Confirmed — #{order_id[:8]}", html)
    except Exception as exc:
        raise self.retry(exc=exc)


# ── Password reset email ──────────────────────────────────────────────────────
@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_password_reset_email(self, user_email: str, reset_token: str):
    try:
        frontend = os.getenv("FRONTEND_URL", "http://localhost:5173")
        reset_url = f"{frontend}/reset-password?token={reset_token}"
        html = f"""
        <html><body style="font-family:sans-serif;color:#333">
          <h2 style="color:#f97316">Reset Your Password</h2>
          <p>Click the button below to reset your BookHaven password.
             This link expires in 1 hour.</p>
          <a href="{reset_url}" style="background:#f97316;color:white;padding:12px 24px;
             border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">
            Reset Password
          </a>
          <p style="color:#aaa;font-size:12px">
            If you didn't request this, ignore this email.
          </p>
        </body></html>
        """
        _send_smtp(user_email, "Reset your BookHaven password", html)
    except Exception as exc:
        raise self.retry(exc=exc)