import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from decimal import Decimal

from ..database import get_db
from ..models import Budget, Transaction, User
from ..schemas import Budget as BudgetSchema, BudgetCreate
from ..security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.get("/", response_model=List[BudgetSchema])
def get_budgets(
    month: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List budgets for the user. Optionally filter by month (YYYY-MM)."""
    query = db.query(Budget).filter(Budget.user_id == current_user.id)
    if month:
        query = query.filter(Budget.month == month)
    else:
        # Default to current month
        curr_month = datetime.utcnow().strftime("%Y-%m")
        query = query.filter(Budget.month == curr_month)
    return query.all()

@router.post("/", response_model=BudgetSchema)
def create_or_update_budget(
    budget_data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create or update a budget limit."""
    # Check if budget for this category and month already exists
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == budget_data.month,
        Budget.category == budget_data.category
    ).first()

    if existing:
        existing.limit_amount = budget_data.limit_amount
        db.commit()
        db.refresh(existing)
        return existing

    db_budget = Budget(
        user_id=current_user.id,
        month=budget_data.month,
        category=budget_data.category,
        limit_amount=budget_data.limit_amount
    )
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

@router.get("/summary")
def get_budget_summary(
    month: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dynamic category spend vs. budget limit summary."""
    curr_month = month or datetime.utcnow().strftime("%Y-%m")
    
    # 1. Fetch Budgets
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == curr_month
    ).all()
    
    # 2. Fetch Debit Transactions for this month
    # Parse month start/end
    try:
        start_date = datetime.strptime(f"{curr_month}-01 00:00:00", "%Y-%m-%d %H:%M:%S")
        if start_date.month == 12:
            end_date = datetime.strptime(f"{start_date.year + 1}-01-01 00:00:00", "%Y-%m-%d %H:%M:%S")
        else:
            end_date = datetime.strptime(f"{start_date.year}-{start_date.month + 1:02d}-01 00:00:00", "%Y-%m-%d %H:%M:%S")
    except Exception:
        start_date = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=31)

    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "DEBIT",
        Transaction.date >= start_date,
        Transaction.date < end_date
    ).all()
    
    # Calculate spends by category
    category_spends: Dict[str, Decimal] = {}
    total_spend = Decimal("0.00")
    for tx in transactions:
        category_spends[tx.category] = category_spends.get(tx.category, Decimal("0.00")) + tx.amount
        total_spend += tx.amount
        
    # Build summary
    summary = []
    alerts = []
    
    # Track categories that have a budget
    budgeted_categories = set()
    
    # Total budget tracker
    total_budget_limit = Decimal("0.00")
    
    for b in budgets:
        cat = b.category
        limit = b.limit_amount
        spent = category_spends.get(cat, Decimal("0.00"))
        remaining = max(Decimal("0.00"), limit - spent)
        pct = (float(spent) / float(limit) * 100) if limit > 0 else 0.0
        
        if cat == "*":
            total_budget_limit = limit
            continue
            
        budgeted_categories.add(cat)
        
        summary_item = {
            "category": cat,
            "limit": limit,
            "spent": spent,
            "remaining": remaining,
            "percentage": round(pct, 2)
        }
        summary.append(summary_item)
        
        # Trigger warnings
        if pct >= 100:
            alerts.append({
                "type": "CRITICAL",
                "message": f"Critical! Your {cat} budget (₹{limit}) has been exceeded. Total spent: ₹{spent}."
            })
        elif pct >= 80:
            alerts.append({
                "type": "WARNING",
                "message": f"Warning! Your {cat} budget (₹{limit}) has reached {pct:.1f}% capacity. Remaining: ₹{remaining}."
            })
            
    # Include unbudgeted categories in summary if there is spend
    for cat, spent in category_spends.items():
        if cat not in budgeted_categories:
            summary.append({
                "category": cat,
                "limit": Decimal("0.00"),
                "spent": spent,
                "remaining": Decimal("0.00"),
                "percentage": 100.0 if spent > 0 else 0.0
            })
            
    return {
        "month": curr_month,
        "total_budget_limit": total_budget_limit,
        "total_spend": total_spend,
        "categories": summary,
        "alerts": alerts
}
