"""
Schemas للعقود مع الشركات وعمليات الدفع
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from decimal import Decimal
from datetime import datetime
import uuid
from app.models.contract import ContractStatus, BillingCycle
from app.models.payment import PaymentProvider, PaymentStatus


class ContractCreate(BaseModel):
    company_name: str
    contact_email: EmailStr
    contact_person: Optional[str] = None
    scope_of_work: Optional[str] = None
    total_value: Optional[Decimal] = None
    currency: str = "USD"
    billing_cycle: BillingCycle = BillingCycle.ONE_TIME


class ContractUpdate(BaseModel):
    status: Optional[ContractStatus] = None
    total_value: Optional[Decimal] = None
    scope_of_work: Optional[str] = None


class ContractResponse(BaseModel):
    id: uuid.UUID
    company_name: str
    contact_email: EmailStr
    status: ContractStatus
    total_value: Optional[Decimal]
    currency: str
    billing_cycle: BillingCycle
    created_at: datetime

    class Config:
        from_attributes = True


class CheckoutSessionRequest(BaseModel):
    """طلب إنشاء جلسة دفع - يدعم كل بطاقات الدفع العالمية عبر Stripe"""
    plan: str  # "pro" | "enterprise"
    success_url: str
    cancel_url: str


class CheckoutSessionResponse(BaseModel):
    checkout_url: str
    session_id: str


class PaymentResponse(BaseModel):
    id: uuid.UUID
    provider: PaymentProvider
    amount: Decimal
    currency: str
    status: PaymentStatus
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
