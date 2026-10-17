import os
import secrets


class OtpProvider:
    """Base OTP provider. Subclass and register in PROVIDERS to add SMS/WhatsApp delivery."""
    channel = "sms"
    is_mock = False

    def generate_code(self) -> str:
        return f"{secrets.randbelow(10**6):06d}"

    async def send(self, phone: str, code: str) -> None:
        raise NotImplementedError


class MockWhatsAppProvider(OtpProvider):
    channel = "whatsapp"
    is_mock = True

    def generate_code(self) -> str:
        return os.environ["MOCK_OTP_CODE"]

    async def send(self, phone: str, code: str) -> None:
        return None


PROVIDERS = {"mock_whatsapp": MockWhatsAppProvider}


def get_otp_provider() -> OtpProvider:
    return PROVIDERS[os.environ["OTP_PROVIDER"]]()
