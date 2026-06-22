from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from ..database import get_db
from ..models import CashbackRule, User
from ..schemas import CashbackRule as CashbackRuleSchema, CashbackRuleCreate
from ..security import get_current_user

router = APIRouter(prefix="/cashback-rules", tags=["Cashback Rules"])

@router.get("/", response_model=List[CashbackRuleSchema])
def get_rules(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(CashbackRule).order_by(CashbackRule.card_name.asc()).all()

@router.post("/", response_model=CashbackRuleSchema, status_code=status.HTTP_201_CREATED)
def create_rule(
    rule_data: CashbackRuleCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    db_rule = CashbackRule(
        card_name=rule_data.card_name,
        merchant_pattern=rule_data.merchant_pattern,
        category_pattern=rule_data.category_pattern,
        cashback_percentage=rule_data.cashback_percentage,
        max_limit=rule_data.max_limit,
        min_transaction_amount=rule_data.min_transaction_amount,
        conditions=rule_data.conditions
    )
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.put("/{rule_id}", response_model=CashbackRuleSchema)
def update_rule(
    rule_id: UUID,
    rule_data: CashbackRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_rule = db.query(CashbackRule).filter(CashbackRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Cashback rule not found")
        
    for key, value in rule_data.model_dump().items():
        setattr(db_rule, key, value)
        
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rule(
    rule_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_rule = db.query(CashbackRule).filter(CashbackRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Cashback rule not found")
        
    db.delete(db_rule)
    db.commit()
    return None
