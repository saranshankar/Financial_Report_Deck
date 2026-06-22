import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict

from ..database import get_db
from ..models import Transaction, Budget, SavingsGoal, Subscription, Recommendation, User
from ..security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/export", tags=["Report Generation"])

@router.get("/report")
def export_financial_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a printable HTML statement summarizing monthly transactions, budget performance, subscription audits, and AI tips."""
    # 1. Fetch User Data
    user_id = current_user.id
    today = datetime.utcnow()
    month_str = today.strftime("%B %Y")
    
    # 2. Fetch Transactions for active month
    start_date = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    end_date = start_date + timedelta(days=31)
    
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.date >= start_date,
        Transaction.date < end_date
    ).order_by(Transaction.date.desc()).all()
    
    # Calculate stats
    total_spending = Decimal("0.00")
    total_cashback = Decimal("0.00")
    total_potential = Decimal("0.00")
    
    category_spends: Dict[str, Decimal] = {}
    for tx in transactions:
        if tx.type == "DEBIT":
            total_spending += tx.amount
            category_spends[tx.category] = category_spends.get(tx.category, Decimal("0.00")) + tx.amount
        total_cashback += tx.cashback_earned
        total_potential += tx.potential_cashback
        
    missed_cashback = max(Decimal("0.00"), total_potential - total_cashback)
    
    # 3. Fetch Budgets
    curr_month_code = today.strftime("%Y-%m")
    budgets = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.month == curr_month_code
    ).all()
    
    # 4. Fetch Savings Goals
    goals = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == user_id
    ).all()
    
    # 5. Fetch Subscriptions
    subs = db.query(Subscription).filter(
        Subscription.user_id == user_id,
        Subscription.status == "ACTIVE"
    ).all()
    total_sub_monthly = sum(s.monthly_cost for s in subs)
    
    # 6. Fetch AI Recommendations
    recs = db.query(Recommendation).filter(
        Recommendation.user_id == user_id
    ).all()
    
    # 7. Render Styled HTML Template
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>FinSight AI Financial Report - {month_str}</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                color: #334155;
                background-color: #f8fafc;
                margin: 0;
                padding: 40px;
                line-height: 1.5;
            }}
            .report-card {{
                max-width: 900px;
                margin: 0 auto;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.03);
                padding: 40px;
            }}
            .header {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #f1f5f9;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }}
            .logo {{
                font-size: 24px;
                font-weight: 900;
                color: #0f172a;
                letter-spacing: -0.5px;
            }}
            .logo span {{
                color: #2874F0;
            }}
            .meta-info {{
                text-align: right;
                font-size: 12px;
                color: #64748b;
            }}
            .report-title {{
                font-size: 22px;
                font-weight: 800;
                color: #0f172a;
                margin-bottom: 20px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }}
            .stats-grid {{
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
                margin-bottom: 35px;
            }}
            .stat-card {{
                background-color: #f8fafc;
                border: 1px solid #f1f5f9;
                border-radius: 12px;
                padding: 15px;
                text-align: center;
            }}
            .stat-card span {{
                font-size: 10px;
                color: #64748b;
                text-transform: uppercase;
                font-weight: 800;
                letter-spacing: 0.5px;
            }}
            .stat-card h3 {{
                font-size: 20px;
                font-weight: 900;
                color: #0f172a;
                margin: 5px 0 0 0;
            }}
            .section-title {{
                font-size: 15px;
                font-weight: 800;
                color: #0f172a;
                border-bottom: 1px solid #f1f5f9;
                padding-bottom: 8px;
                margin-bottom: 15px;
                margin-top: 30px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                text-align: left;
                font-size: 12px;
                margin-bottom: 25px;
            }}
            th {{
                padding: 10px 8px;
                border-bottom: 2px solid #e2e8f0;
                color: #64748b;
                font-weight: 800;
                text-transform: uppercase;
            }}
            td {{
                padding: 12px 8px;
                border-bottom: 1px solid #f1f5f9;
                color: #334155;
            }}
            .badge {{
                background: #f1f5f9;
                color: #475569;
                border-radius: 999px;
                padding: 2px 8px;
                font-size: 10px;
                font-weight: 700;
                display: inline-block;
            }}
            .badge.success {{
                background: #ecfdf5;
                color: #047857;
            }}
            .badge.danger {{
                background: #fef2f2;
                color: #b91c1c;
            }}
            .rec-card {{
                background-color: #eff6ff;
                border: 1px solid #bfdbfe;
                border-radius: 12px;
                padding: 15px;
                margin-bottom: 10px;
            }}
            .rec-card h4 {{
                margin: 0 0 5px 0;
                color: #1e3a8a;
                font-size: 13px;
                font-weight: 700;
            }}
            .rec-card p {{
                margin: 0;
                color: #1e40af;
                font-size: 11px;
            }}
            .footer-note {{
                text-align: center;
                font-size: 10px;
                color: #94a3b8;
                margin-top: 40px;
                border-top: 1px solid #f1f5f9;
                padding-top: 20px;
            }}
            @media print {{
                body {{
                    background: none;
                    padding: 0;
                }}
                .report-card {{
                    box-shadow: none;
                    border: none;
                    padding: 0;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="report-card">
            <!-- Header section -->
            <div class="header">
                <div class="logo">FINSIGHT <span>AI</span></div>
                <div class="meta-info">
                    <strong>Statement Period:</strong> {month_str}<br>
                    <strong>Generated on:</strong> {datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")} UTC<br>
                    <strong>User:</strong> {current_user.full_name} ({current_user.email})
                </div>
            </div>
            
            <div class="report-title">Monthly Performance Statement</div>
            
            <!-- Key KPIs -->
            <div class="stats-grid">
                <div class="stat-card">
                    <span>Total Spending</span>
                    <h3>₹{total_spending:,.2f}</h3>
                </div>
                <div class="stat-card">
                    <span>Cashback Earned</span>
                    <h3 style="color:#059669;">₹{total_cashback:,.2f}</h3>
                </div>
                <div class="stat-card">
                    <span>Missed Cashback</span>
                    <h3 style="color:#dc2626;">₹{missed_cashback:,.2f}</h3>
                </div>
                <div class="stat-card">
                    <span>Active Subscriptions</span>
                    <h3>₹{total_sub_monthly:,.2f}/mo</h3>
                </div>
            </div>
            
            <!-- Category Spend Summary -->
            <div class="section-title">Category Spending Overview</div>
            <table>
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Amount Spent</th>
                        <th>Share %</th>
                    </tr>
                </thead>
                <tbody>
    """
    
    for cat, amt in category_spends.items():
        share = (float(amt) / float(total_spending) * 100) if total_spending > 0 else 0.0
        html_content += f"""
                    <tr>
                        <td><strong>{cat}</strong></td>
                        <td>₹{amt:,.2f}</td>
                        <td>{share:.1f}%</td>
                    </tr>
        """
        
    html_content += """
                </tbody>
            </table>
            
            <!-- Budget Performance -->
            <div class="section-title">Monthly Budget Status</div>
            <table>
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Monthly Cap</th>
                        <th>Actual Spend</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    """
    
    # Calculate spends per budget category
    for b in budgets:
        cat = b.category
        limit = b.limit_amount
        spent = category_spends.get(cat, Decimal("0.00"))
        
        status_class = "success"
        status_label = "Under Budget"
        if spent > limit:
            status_class = "danger"
            status_label = "Exceeded"
            
        html_content += f"""
                    <tr>
                        <td><strong>{cat}</strong></td>
                        <td>₹{limit:,.2f}</td>
                        <td>₹{spent:,.2f}</td>
                        <td><span class="badge {status_class}">{status_label}</span></td>
                    </tr>
        """
        
    html_content += """
                </tbody>
            </table>
            
            <!-- Subscriptions tracker audit -->
            <div class="section-title">Subscription Audits & Cost Analysis</div>
            <table>
                <thead>
                    <tr>
                        <th>Subscription</th>
                        <th>Monthly Bill</th>
                        <th>Annual Cost</th>
                        <th>Renewal Day</th>
                    </tr>
                </thead>
                <tbody>
    """
    
    for s in subs:
        html_content += f"""
                    <tr>
                        <td><strong>{s.name}</strong></td>
                        <td>₹{s.monthly_cost:,.2f}</td>
                        <td>₹{s.monthly_cost * 12:,.2f}</td>
                        <td>Day {s.renewal_day}</td>
                    </tr>
        """
        
    html_content += """
                </tbody>
            </table>
            
            <!-- AI Recommendations block -->
            <div class="section-title">AI Recommendation Advisor Tips</div>
    """
    
    if recs:
        for r in recs:
            html_content += f"""
            <div class="rec-card">
                <h4>{r.title}</h4>
                <p>{r.message} Estimated Impact: <strong>₹{r.impact_amount:,.2f}</strong></p>
            </div>
            """
    else:
        html_content += """
            <div class="rec-card">
                <h4>Welcome to FinSight AI</h4>
                <p>Start connecting accounts and statements to log intelligent personal recommendations.</p>
            </div>
        """
        
    html_content += f"""
            <div class="footer-note">
                FinSight AI Statement Generator. Strictly passive intelligence statement. This report does not represent a financial transaction receipt.<br>
                &copy; 2026 FinSight AI Inc. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    """
    
    # Set headers for downloading the styled HTML file
    headers = {
        "Content-Disposition": f"attachment; filename=finsight_report_{curr_month_code}.html"
    }
    return HTMLResponse(content=html_content, headers=headers)
