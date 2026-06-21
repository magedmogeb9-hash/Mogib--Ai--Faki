"""
مسارات الدفع: اشتراكات Stripe (تدعم كل البطاقات العالمية) وPayPal
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, SubscriptionPlan
from app.models.payment import Payment, PaymentProvider, PaymentStatus
from app.schemas.payment import CheckoutSessionRequest, CheckoutSessionResponse
from app.api.deps import get_current_user
from app.services import stripe_service, paypal_service
from app.core.config import settings

router = APIRouter(prefix="/payments", tags=["الدفع"])


@router.post("/stripe/checkout", response_model=CheckoutSessionResponse)
def create_stripe_checkout(
    payload: CheckoutSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = stripe_service.create_checkout_session(
        user_email=current_user.email,
        plan=payload.plan,
        success_url=payload.success_url,
        cancel_url=payload.cancel_url,
        customer_id=current_user.stripe_customer_id,
    )
    return result


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """يستقبل إشعارات Stripe (نجاح الدفع، فشل الدفع، إلغاء الاشتراك) ويحدّث حالة المستخدم"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe_service.verify_webhook_signature(payload, sig_header)
    except Exception:
        raise HTTPException(status_code=400, detail="توقيع webhook غير صالح")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user = db.query(User).filter(User.email == session.get("customer_email")).first()
        if user:
            user.stripe_customer_id = session.get("customer")
            user.subscription_plan = SubscriptionPlan.PRO
            db.add(
                Payment(
                    user_id=user.id,
                    provider=PaymentProvider.STRIPE,
                    provider_transaction_id=session["id"],
                    amount=session.get("amount_total", 0) / 100,
                    status=PaymentStatus.SUCCEEDED,
                    description="اشتراك عبر Stripe Checkout",
                )
            )
            db.commit()

    return {"status": "received"}


@router.post("/paypal/create-order")
async def create_paypal_order(
    amount_usd: float,
    description: str,
    current_user: User = Depends(get_current_user),
):
    result = await paypal_service.create_paypal_order(amount_usd, description)
    return result


@router.post("/paypal/capture/{order_id}")
async def capture_paypal_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await paypal_service.capture_paypal_order(order_id)
    if result.get("status") == "COMPLETED":
        amount = float(
            result["purchase_units"][0]["payments"]["captures"][0]["amount"]["value"]
        )
        db.add(
            Payment(
                user_id=current_user.id,
                provider=PaymentProvider.PAYPAL,
                provider_transaction_id=order_id,
                amount=amount,
                status=PaymentStatus.SUCCEEDED,
                description="دفعة عبر PayPal",
            )
        )
        db.commit()
    return result
