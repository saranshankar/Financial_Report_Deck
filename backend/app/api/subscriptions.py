import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
from decimal import Decimal

from ..database import get_db
from ..models import Subscription, Transaction, User
from ..schemas import Subscription as SubscriptionSchema, SubscriptionCreate
from ..security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

@router.get("/", response_model=List[SubscriptionSchema])
def get_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List active user subscriptions."""
    return db.query(Subscription).filter(Subscription.user_id == current_user.id).order_by(Subscription.created_at.desc()).all()

@router.post("/", response_model=SubscriptionSchema)
def create_subscription(
    sub_data: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually add a subscription."""
    db_sub = Subscription(
        user_id=current_user.id,
        name=sub_data.name,
        monthly_cost=sub_data.monthly_cost,
        renewal_day=sub_data.renewal_day,
        status="ACTIVE"
    )
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    return db_sub

@router.post("/detect", response_model=List[SubscriptionSchema])
def detect_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Automatically scan transaction history to detect monthly recurring subscriptions."""
    # Fetch user's debit transactions
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "DEBIT"
    ).order_by(Transaction.date.desc()).all()
    
    # Heuristic recurring detection
    # Group transactions by merchant
    merchant_txs: Dict[str, List[Transaction]] = {}
    for tx in transactions:
        m_lower = tx.merchant.lower().strip()
        # Clean up merchant name slightly to combine keys
        m_key = m_lower
        for word in ["pvt", "ltd", "india", "subscription", "bill", "pay"]:
            m_key = m_key.replace(word, "").strip()
        if len(m_key) < 3:
            m_key = m_lower
            
        if m_key not in merchant_txs:
            merchant_txs[m_key] = []
        merchant_txs[m_key].append(tx)
        
    detected_subs = []
    
    # Keywords indicating a subscription service
    SUB_KEYWORDS = ["netflix", "spotify", "prime", "youtube", "gpay", "google", "apple", "icloud", "aws", "gym", "adobe", "office", "microsoft", "broadband", "jio", "airtel", "netflix entertainment", "amazon prime"]
    
    for m_key, tx_list in merchant_txs.items():
        if len(tx_list) < 2:
            # Check if single transaction matches popular subscription names
            any_keyword = any(kw in m_key for kw in SUB_KEYWORDS)
            if any_keyword:
                tx = tx_list[0]
                # Default to monthly cost is amount, renewal_day is day of transaction
                detected_subs.append({
                    "name": tx.merchant,
                    "cost": tx.amount,
                    "day": tx.date.day
                })
            continue
            
        # If we have multiple transactions, calculate intervals
        tx_list.sort(key=lambda x: x.date)
        intervals = []
        for i in range(len(tx_list) - 1):
            diff = (tx_list[i+1].date - tx_list[i].date).days
            intervals.append(diff)
            
        # Check if intervals are approximately monthly (25 to 35 days)
        is_recurring = any(25 <= gap <= 35 for gap in intervals) or any(kw in m_key for kw in SUB_KEYWORDS)
        
        if is_recurring:
            # Compute average cost
            avg_cost = sum(t.amount for t in tx_list) / len(tx_list)
            # Use latest transaction's day as renewal day
            latest_tx = tx_list[-1]
            detected_subs.append({
                "name": latest_tx.merchant,
                "cost": avg_cost,
                "day": latest_tx.date.day
            })
            
    # Save newly detected subscriptions to DB if they don't already exist
    new_subs_saved = []
    for sub in detected_subs:
        # Check if already registered
        existing = db.query(Subscription).filter(
            Subscription.user_id == current_user.id,
            Subscription.name.ilike(f"%{sub['name']}%")
        ).first()
        
        if not existing:
            db_sub = Subscription(
                user_id=current_user.id,
                name=sub["name"],
                monthly_cost=Decimal(str(round(sub["cost"], 2))),
                renewal_day=sub["day"],
                status="ACTIVE"
            )
            db.add(db_sub)
            new_subs_saved.append(db_sub)
            
    if new_subs_saved:
        db.commit()
        for s in new_subs_saved:
            db.refresh(s)
            
    # Return all current subscriptions
    return db.query(Subscription).filter(Subscription.user_id == current_user.id).order_by(Subscription.created_at.desc()).all()

@router.delete("/{sub_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subscription(
    sub_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove/Cancel a subscription."""
    db_sub = db.query(Subscription).filter(
        Subscription.id == sub_id,
        Subscription.user_id == current_user.id
    ).first()
    
    if not db_sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found."
        )
        
    db.delete(db_sub)
    db.commit()
    return None
