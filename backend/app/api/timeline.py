import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

from ..database import get_db
from ..models import Transaction, Budget, SavingsGoal, GoalContribution, Subscription, User
from ..schemas import TimelineEvent
from ..security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/timeline", tags=["Timeline"])

@router.get("/", response_model=List[TimelineEvent])
def get_timeline(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Aggregate transactions, cashbacks, budget alerts, deposits, and subscription renewals into a single timeline feed."""
    events: List[TimelineEvent] = []
    
    # 1. Transactions & Cashback
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.date.desc()).limit(30).all()
    
    for tx in transactions:
        # Standard Transaction event
        events.append(TimelineEvent(
            id=f"tx-{tx.id}",
            type="TRANSACTION",
            title=f"Spent at {tx.merchant}" if tx.type == "DEBIT" else f"Received from {tx.merchant}",
            description=f"Category: {tx.category} | Method: {tx.payment_method}",
            amount=tx.amount,
            date=tx.date,
            status="INFO" if tx.type == "DEBIT" else "SUCCESS"
        ))
        
        # Cashback Earned event
        if tx.cashback_earned > 0:
            events.append(TimelineEvent(
                id=f"cb-earned-{tx.id}",
                type="CASHBACK_EARNED",
                title="Cashback Rewards Earned",
                description=f"You earned ₹{tx.cashback_earned} rewards on '{tx.merchant}' using {tx.payment_method}.",
                amount=tx.cashback_earned,
                date=tx.date,
                status="SUCCESS"
            ))
            
        # Cashback Missed event
        if tx.potential_cashback > tx.cashback_earned:
            missed = tx.potential_cashback - tx.cashback_earned
            events.append(TimelineEvent(
                id=f"cb-missed-{tx.id}",
                type="CASHBACK_MISSED",
                title="Missed Cashback Opportunity",
                description=f"You missed ₹{missed} cashback. Switch to your best card: {tx.best_payment_method or 'Credit Card'}.",
                amount=missed,
                date=tx.date,
                status="WARNING"
            ))
            
    # 2. Budget Alerts (Dynamic for current month)
    curr_month = datetime.utcnow().strftime("%Y-%m")
    
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == curr_month
    ).all()
    
    # Calculate spends by category
    # Parse month start/end
    start_date = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    end_date = start_date + timedelta(days=31)
    
    month_txs = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "DEBIT",
        Transaction.date >= start_date,
        Transaction.date < end_date
    ).all()
    
    category_spends: Dict[str, Decimal] = {}
    for tx in month_txs:
        category_spends[tx.category] = category_spends.get(tx.category, Decimal("0.00")) + tx.amount
        
    for b in budgets:
        cat = b.category
        limit = b.limit_amount
        spent = category_spends.get(cat, Decimal("0.00"))
        
        if limit > 0:
            pct = (float(spent) / float(limit)) * 100
            if pct >= 100:
                events.append(TimelineEvent(
                    id=f"budget-alert-critical-{cat}-{curr_month}",
                    type="BUDGET_ALERT",
                    title="Critical: Budget Exceeded!",
                    description=f"Your '{cat}' monthly budget of ₹{limit} has been fully exceeded. Spent: ₹{spent}.",
                    amount=spent - limit,
                    date=datetime.utcnow() - timedelta(minutes=5),  # set near current time for priority
                    status="WARNING"
                ))
            elif pct >= 80:
                events.append(TimelineEvent(
                    id=f"budget-alert-warning-{cat}-{curr_month}",
                    type="BUDGET_ALERT",
                    title="Warning: Budget Near Capacity",
                    description=f"Your '{cat}' budget is at {pct:.1f}% capacity. Limit: ₹{limit} | Spent: ₹{spent}.",
                    amount=limit - spent,
                    date=datetime.utcnow() - timedelta(minutes=10),
                    status="WARNING"
                ))
                
    # 3. Savings Goal Contributions
    contributions = db.query(GoalContribution).join(SavingsGoal).filter(
        SavingsGoal.user_id == current_user.id
    ).order_by(GoalContribution.created_at.desc()).limit(20).all()
    
    for c in contributions:
        goal_name = db.query(SavingsGoal.name).filter(SavingsGoal.id == c.goal_id).scalar() or "Savings Goal"
        events.append(TimelineEvent(
            id=f"goal-contrib-{c.id}",
            type="GOAL_CONTRIBUTION",
            title=f"Saved toward '{goal_name}'",
            description=f"Allocated ₹{c.amount} to your savings target.",
            amount=Decimal(str(c.amount)),
            date=c.created_at,
            status="SUCCESS"
        ))
        
    # 4. Subscription Renewals (Calculate renewals for the current month)
    subscriptions = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == "ACTIVE"
    ).all()
    
    today = datetime.utcnow()
    for sub in subscriptions:
        # Create a renewal event date for this subscription for current month
        try:
            renewal_date = datetime(today.year, today.month, sub.renewal_day)
        except ValueError:
            # Fallback for days like 31 on months with 30 days
            renewal_date = datetime(today.year, today.month, 28)
            
        events.append(TimelineEvent(
            id=f"sub-renew-{sub.id}-{today.month}",
            type="SUBSCRIPTION_RENEWAL",
            title=f"Renewal Alert: {sub.name}",
            description=f"Subscription charge of ₹{sub.monthly_cost} will renew on day {sub.renewal_day} of this month.",
            amount=sub.monthly_cost,
            date=renewal_date,
            status="INFO"
        ))
        
    # Sort all events chronologically (newest first)
    events.sort(key=lambda x: x.date, reverse=True)
    return events
