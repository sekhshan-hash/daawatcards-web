import asyncio
import logging
import os
import smtplib
from email.message import EmailMessage

logger = logging.getLogger("invites.mail")


def _send(to, subject, body):
    user, password = os.environ.get("GMAIL_USER"), os.environ.get("GMAIL_APP_PASSWORD")
    if not user or not password:
        logger.warning("Gmail not configured; email to %s not sent", to)
        return False
    msg = EmailMessage()
    msg["From"], msg["To"], msg["Subject"] = user, to, subject
    msg.set_content(body)
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=20) as s:
        s.login(user, password.replace(" ", ""))
        s.send_message(msg)
    return True


async def send_mail(to, subject, body):
    try:
        return await asyncio.to_thread(_send, to, subject, body)
    except Exception as e:  # noqa: BLE001
        logger.error("Email to %s failed: %s", to, e)
        return False
