from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal

from ..database import get_db
from ..models import Transaction, User, Recommendation, Insight, CashbackRule
from ..schemas import DashboardData, DashboardStats, SpendingByCategory, MonthlyTrend, CashbackTrend, Recommendation as RecSchema, Insight as InsightSchema
from ..security import get_current_user
from ..services.agents import FinancialRecommendationAgent

router = APIRouter(prefix="/insights", tags=["Insights & Analytics"])

@router.get("/dashboard-data", response_model=DashboardData)
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch all transactions for this user
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    
    # 1. Calculate Stats
    total_spending = Decimal("0.0")
    total_cashback = Decimal("0.0")
    total_potential = Decimal("0.0")
    
    category_totals: Dict[str, Decimal] = {}
    best_methods: Dict[str, int] = {}
    
    for tx in transactions:
        if tx.type == "DEBIT":
            total_spending += tx.amount
            category_totals[tx.category] = category_totals.get(tx.category, Decimal("0.0")) + tx.amount
            
            # Track best cards recommendation count
            if tx.best_payment_method:
                best_methods[tx.best_payment_method] = best_methods.get(tx.best_payment_method, 0) + 1
        
        total_cashback += tx.cashback_earned
        total_potential += tx.potential_cashback
        
    missed_cashback = max(Decimal("0.0"), total_potential - total_cashback)
    
    # Top Expense Category
    top_cat = "None"
    if category_totals:
        top_cat = max(category_totals, key=category_totals.get)
        
    # Best Payment Method
    best_method = "UPI"
    if best_methods:
        best_method = max(best_methods, key=best_methods.get)
        
    # Stats Summary
    stats = DashboardStats(
        total_spending=total_spending,
        total_cashback=total_cashback,
        missed_cashback=missed_cashback,
        best_payment_method=best_method,
        monthly_savings_prediction=missed_cashback + Decimal("300.00"),  # Add standard buffer savings prediction
        top_expense_category=top_cat
    )
    
    # 2. Spending by Category (Percentages)
    spending_by_category = []
    for cat, amt in category_totals.items():
        pct = (float(amt) / float(total_spending) * 100) if total_spending > 0 else 0.0
        spending_by_category.append(SpendingByCategory(
            category=cat,
            amount=amt,
            percentage=round(pct, 2)
        ))
    spending_by_category.sort(key=lambda x: x.amount, reverse=True)
    
    # 3. Monthly Trends (Grouped by Year-Month)
    # We will simulate monthly trends by splitting transactions or aggregating database records
    # Let's query SQL group by for rich database aggregation
    monthly_data = db.query(
        func.to_char(Transaction.date, 'YYYY-MM').label('month'),
        func.sum(Transaction.amount).label('spend'),
        func.sum(Transaction.cashback_earned).label('cashback'),
        func.sum(Transaction.potential_cashback).label('potential')
    ).filter(
        Transaction.user_id == current_user.id
    ).group_by(
        'month'
    ).order_by(
        'month'
    ).all()
    
    monthly_trends = []
    cashback_trends = []
    
    if monthly_data:
        for row in monthly_data:
            month_label = row[0]
            spend_val = Decimal(str(row[1] or 0.0))
            cashback_val = Decimal(str(row[2] or 0.0))
            potential_val = Decimal(str(row[3] or 0.0))
            
            monthly_trends.append(MonthlyTrend(
                month=month_label,
                spending=spend_val,
                cashback=cashback_val
            ))
            
            cashback_trends.append(CashbackTrend(
                month=month_label,
                earned=cashback_val,
                potential=potential_val
            ))
    else:
        # Defaults if empty
        current_month = datetime.utcnow().strftime("%Y-%m")
        monthly_trends.append(MonthlyTrend(month=current_month, spending=total_spending, cashback=total_cashback))
        cashback_trends.append(CashbackTrend(month=current_month, earned=total_cashback, potential=total_potential))
        
    # 4. Recent Transactions
    recent = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(
        Transaction.date.desc()
    ).limit(5).all()
    
    return DashboardData(
        stats=stats,
        spending_by_category=spending_by_category,
        monthly_trends=monthly_trends,
        cashback_trends=cashback_trends,
        recent_transactions=recent
    )

@router.get("/recommendations", response_model=List[RecSchema])
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch existing recommendations
    recs = db.query(Recommendation).filter(Recommendation.user_id == current_user.id).all()
    
    # If no recommendations, generate using the AI Advisor Agent
    if not recs:
        recs = refresh_recommendations(db, current_user)
        
    return recs

@router.post("/recommendations/refresh", response_model=List[RecSchema])
def refresh_recommendations_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return refresh_recommendations(db, current_user)

def refresh_recommendations(db: Session, user: User) -> List[Recommendation]:
    # Clear old recommendations
    db.query(Recommendation).filter(Recommendation.user_id == user.id).delete()
    db.commit()
    
    # Analyze spending & rules to generate recommendations
    raw_recs = FinancialRecommendationAgent.analyze(user.id, db)
    
    db_recs = []
    for rec in raw_recs:
        db_rec = Recommendation(
            user_id=user.id,
            title=rec.get("title", "Smart Financial Advice"),
            message=rec.get("message", "Continue monitoring transactions to boost cashback."),
            recommendation_type=rec.get("recommendation_type", "SAVINGS"),
            impact_amount=Decimal(str(rec.get("impact_amount", 0.0)))
        )
        db.add(db_rec)
        db_recs.append(db_rec)
        
    db.commit()
    for rec in db_recs:
        db.refresh(rec)
        
    return db_recs

@router.get("/monthly-summary", response_model=List[InsightSchema])
def get_monthly_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch insights
    return db.query(Insight).filter(Insight.user_id == current_user.id).order_by(Insight.month.desc()).all()
