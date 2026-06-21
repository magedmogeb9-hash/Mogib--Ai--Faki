"""
خدمة الدفع عبر Stripe
يدعم: Visa, Mastercard, Amex, Apple Pay, Google Pay, وعشرات العملات المحلية حول العالم
"""
import stripe
from typing import Optional
from app.core.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

PLAN_PRICES_USD = {
    "pro": {"monthly": 49, "name": "Pro Plan"},
    "enterprise": {"monthly": 499, "name": "Enterprise Plan"},
}


def create_checkout_session(
    user_email: str,
    plan: str,
    success_url: str,
    cancel_url: str,
    customer_id: Optional[str] = None,
) -> dict:
    """ينشئ جلسة دفع Stripe Checkout - تدعم تلقائيًا كل وسائل الدفع المفعّلة في حساب Stripe"""
    plan_info = PLAN_PRICES_USD.get(plan)
    if not plan_info:
        raise ValueError(f"خطة غير معروفة: {plan}")

    session_params = {
        "payment_method_types": ["card"],  # Stripe يضيف Apple/Google Pay تلقائيًا عند الدعم
        "line_items": [
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": plan_info["name"]},
                    "unit_amount": plan_info["monthly"] * 100,
                    "recurring": {"interval": "month"},
                },
                "quantity": 1,
            }
        ],
        "mode": "subscription",
        "success_url": success_url,
        "cancel_url": cancel_url,
        "customer_email": user_email if not customer_id else None,
        "customer": customer_id,
    }
    session_params = {k: v for k, v in session_params.items() if v is not None}

    session = stripe.checkout.Session.create(**session_params)
    return {"checkout_url": session.url, "session_id": session.id}


def create_enterprise_invoice(
    customer_email: str,
    company_name: str,
    amount_usd: float,
    description: str,
) -> dict:
    """ينشئ فاتورة مخصصة للعقود مع الشركات الكبرى (دفعة واحدة كبيرة أو حسب جدول العقد)"""
    customer = stripe.Customer.create(email=customer_email, name=company_name)

    stripe.InvoiceItem.create(
        customer=customer.id,
        amount=int(amount_usd * 100),
        currency="usd",
        description=description,
    )

    invoice = stripe.Invoice.create(
        customer=customer.id,
        collection_method="send_invoice",
        days_until_due=30,
    )
    invoice.finalize_invoice()

    return {
        "invoice_id": invoice.id,
        "invoice_url": invoice.hosted_invoice_url,
        "customer_id": customer.id,
    }


def verify_webhook_signature(payload: bytes, sig_header: str) -> stripe.Event:
    """يتحقق من أن إشعار الـ webhook فعلًا من Stripe (حماية ضد التزييف)"""
    return stripe.Webhook.construct_event(
        payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
    )


def cancel_subscription(subscription_id: str) -> dict:
    result = stripe.Subscription.delete(subscription_id)
    return {"status": result.status}
