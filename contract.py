"""
نموذج العقود مع الشركات الكبرى: يدير دورة حياة عرض السعر، التوقيع، الفوترة
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime
from app.db.session import Base


class ContractStatus(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    NEGOTIATING = "negotiating"
    SIGNED = "signed"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class BillingCycle(str, enum.Enum):
    ONE_TIME = "one_time"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"


class EnterpriseContract(Base):
    __tablename__ = "enterprise_contracts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    company_name = Column(String, nullable=False)
    contact_email = Column(String, nullable=False)
    contact_person = Column(String, nullable=True)

    scope_of_work = Column(Text, nullable=True)
    status = Column(SAEnum(ContractStatus), default=ContractStatus.DRAFT)

    total_value = Column(Numeric(12, 2), nullable=True)
    currency = Column(String, default="USD")
    billing_cycle = Column(SAEnum(BillingCycle), default=BillingCycle.ONE_TIME)

    stripe_subscription_id = Column(String, nullable=True)
    pdf_contract_path = Column(String, nullable=True)  # رابط نسخة PDF من العقد

    signed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("User", back_populates="contracts")
