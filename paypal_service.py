"""
خدمة الدفع عبر PayPal
تغطية إضافية للعملاء الذين يفضلون PayPal على بطاقات الائتمان المباشرة
"""
import httpx
from app.core.config import settings

PAYPAL_BASE_URL = (
    "https://api-m.paypal.com"
    if settings.PAYPAL_MODE == "live"
    else "https://api-m.sandbox.paypal.com"
)


async def get_paypal_access_token() -> str:
    """يحصل على توكن وصول مؤقت من PayPal باستخدام بيانات اعتماد التطبيق"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{PAYPAL_BASE_URL}/v1/oauth2/token",
            auth=(settings.PAYPAL_CLIENT_ID, settings.PAYPAL_CLIENT_SECRET),
            data={"grant_type": "client_credentials"},
        )
        response.raise_for_status()
        return response.json()["access_token"]


async def create_paypal_order(amount_usd: float, description: str) -> dict:
    """ينشئ طلب دفع PayPal يوافق عليه العميل عبر واجهة PayPal"""
    token = await get_paypal_access_token()
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{PAYPAL_BASE_URL}/v2/checkout/orders",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "intent": "CAPTURE",
                "purchase_units": [
                    {
                        "amount": {"currency_code": "USD", "value": f"{amount_usd:.2f}"},
                        "description": description,
                    }
                ],
            },
        )
        response.raise_for_status()
        data = response.json()
        approve_link = next(
            (link["href"] for link in data["links"] if link["rel"] == "approve"), None
        )
        return {"order_id": data["id"], "approve_url": approve_link}


async def capture_paypal_order(order_id: str) -> dict:
    """يؤكد ويُتم تحصيل الدفعة بعد موافقة العميل"""
    token = await get_paypal_access_token()
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{PAYPAL_BASE_URL}/v2/checkout/orders/{order_id}/capture",
            headers={"Authorization": f"Bearer {token}"},
        )
        response.raise_for_status()
        return response.json()
