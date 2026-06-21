"""
مسارات إدارة العقود مع الشركات الكبرى: من العرض حتى التوقيع والفوترة
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.db.session import get_db
from app.models.user import User
from app.models.contract import EnterpriseContract, ContractStatus
from app.schemas.payment import ContractCreate, ContractUpdate, ContractResponse
from app.api.deps import get_current_user
from app.services import stripe_service

router = APIRouter(prefix="/contracts", tags=["عقود الشركات"])


@router.post("/", response_model=ContractResponse, status_code=201)
def create_contract(
    payload: ContractCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = EnterpriseContract(client_id=current_user.id, **payload.model_dump())
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


@router.get("/", response_model=List[ContractResponse])
def list_my_contracts(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return (
        db.query(EnterpriseContract)
        .filter(EnterpriseContract.client_id == current_user.id)
        .all()
    )


@router.patch("/{contract_id}", response_model=ContractResponse)
def update_contract(
    contract_id: uuid.UUID,
    payload: ContractUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = _get_owned_contract(db, contract_id, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(contract, field, value)
    db.commit()
    db.refresh(contract)
    return contract


@router.post("/{contract_id}/generate-invoice")
def generate_contract_invoice(
    contract_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """يولّد فاتورة Stripe رسمية للعقد - مناسبة للدفعات الكبيرة لمرة واحدة من الشركات"""
    contract = _get_owned_contract(db, contract_id, current_user)
    if not contract.total_value:
        raise HTTPException(status_code=400, detail="يجب تحديد قيمة العقد أولًا")

    result = stripe_service.create_enterprise_invoice(
        customer_email=contract.contact_email,
        company_name=contract.company_name,
        amount_usd=float(contract.total_value),
        description=contract.scope_of_work or f"عقد مع {contract.company_name}",
    )

    contract.status = ContractStatus.SENT
    db.commit()

    return result


def _get_owned_contract(
    db: Session, contract_id: uuid.UUID, user: User
) -> EnterpriseContract:
    contract = (
        db.query(EnterpriseContract)
        .filter(EnterpriseContract.id == contract_id, EnterpriseContract.client_id == user.id)
        .first()
    )
    if not contract:
        raise HTTPException(status_code=404, detail="العقد غير موجود")
    return contract
