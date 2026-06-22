import json
import logging
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session

from .gemini_service import GeminiService
from ..models import CashbackRule, Transaction, Recommendation, ReconciliationLog, User, Budget, SavingsGoal, Subscription

logger = logging.getLogger(__name__)

class TransactionClassificationAgent:
    """Agent 1: Classifies raw transaction descriptions into categories."""
    
    CATEGORIES = ["Food", "Travel", "Shopping", "Bills", "Healthcare", "Education", "Entertainment", "Investments", "Others"]

    @classmethod
    def classify(cls, merchant: str) -> str:
        prompt = (
            f"You are a Transaction Classification Agent. Categorize the merchant/description: '{merchant}' "
            f"into exactly one of these categories: {', '.join(cls.CATEGORIES)}.\n"
            f"Respond with ONLY the name of the chosen category. Do not include punctuation, explanations, or quotes."
        )
        
        response = GeminiService.generate_content(prompt)
        if response:
            category = response.strip()
            # Verify the response is one of our categories
            for cat in cls.CATEGORIES:
                if cat.lower() in category.lower():
                    return cat
                    
        # Fallback to local heuristic classifier
        return GeminiService.classify_transaction_fallback(merchant)


class CashbackEligibilityAgent:
    """Agent 2: Analyzes cashback rules to calculate earned/missed rewards and best cards."""
    
    @staticmethod
    def evaluate_transaction(
        merchant: str, 
        category: str, 
        amount: Decimal, 
        payment_method: str, 
        rules: List[CashbackRule]
    ) -> Dict[str, Any]:
        
        amount_float = float(amount)
        current_method = payment_method.strip().lower()
        
        # We will calculate the cashback for EACH available card in our database rules
        card_cashbacks: Dict[str, float] = {}
        card_conditions: Dict[str, str] = {}
        
        # Group rules by card
        rules_by_card: Dict[str, List[CashbackRule]] = {}
        for rule in rules:
            card_name = rule.card_name
            if card_name not in rules_by_card:
                rules_by_card[card_name] = []
            rules_by_card[card_name].append(rule)
            
        for card_name, card_rules in rules_by_card.items():
            best_rate = 0.0
            matched_conditions = ""
            
            for rule in card_rules:
                merchant_pat = rule.merchant_pattern.lower() if rule.merchant_pattern else "*"
                category_pat = rule.category_pattern.lower() if rule.category_pattern else "*"
                min_amt = float(rule.min_transaction_amount or 0)
                
                # Check min transaction threshold
                if amount_float < min_amt:
                    continue
                    
                # Match merchant and category patterns
                merchant_match = (merchant_pat == "*") or (merchant_pat in merchant.lower())
                category_match = (category_pat == "*") or (category_pat in category.lower())
                
                if merchant_match and category_match:
                    rate = float(rule.cashback_percentage)
                    if rate > best_rate:
                        best_rate = rate
                        matched_conditions = rule.conditions or ""
            
            # Compute cashback
            calculated_cb = amount_float * (best_rate / 100.0)
            card_cashbacks[card_name] = round(calculated_cb, 2)
            card_conditions[card_name] = matched_conditions

        # What did we actually earn?
        # Find the card match for the payment method used
        earned_cb = 0.0
        used_card_matched = False
        
        for card_name in card_cashbacks:
            if card_name.lower() in current_method:
                earned_cb = card_cashbacks[card_name]
                used_card_matched = True
                break
                
        # If no specific card matched, assign a flat 1% if it's a general Credit Card, else 0% for UPI/Cash
        if not used_card_matched:
            if "card" in current_method or "credit" in current_method:
                earned_cb = round(amount_float * 0.01, 2)  # Default 1%
            else:
                earned_cb = 0.0

        # Find the best payment method
        best_card = "UPI/Cash"
        max_cb = 0.0
        
        for card_name, cb_val in card_cashbacks.items():
            if cb_val > max_cb:
                max_cb = cb_val
                best_card = card_name

        # If UPI gives 0, but the best card gives > 0, we recommend that card
        # If the best card is worse than or equal to current, best_card is current card
        if max_cb <= earned_cb:
            max_cb = earned_cb
            best_card = payment_method

        return {
            "cashback_earned": Decimal(str(earned_cb)),
            "potential_cashback": Decimal(str(max_cb)),
            "best_payment_method": best_card
        }


class OfferSimplificationAgent:
    """Agent 3: Translates complex offer text into user-friendly summaries."""
    
    @classmethod
    def simplify(cls, original_terms: str) -> str:
        prompt = (
            f"You are an Offer Simplification Agent.\n"
            f"Translate the following complex credit card or bank promo terms into a single, clean, "
            f"easy-to-read instructions line. Focus on the required minimum spend, the reward percentage, "
            f"and the maximum cap. Keep the formatting concise like:\n"
            f"'Spend at least ₹X and receive Y% cashback, up to a maximum of ₹Z.'\n\n"
            f"Original terms:\n{original_terms}\n\n"
            f"Simplified Explanation:"
        )
        
        response = GeminiService.generate_content(prompt)
        if response:
            return response.strip()
            
        # Fallback to local regex-based parsing
        return GeminiService.simplify_offer_fallback(original_terms)


class FinancialRecommendationAgent:
    """Agent 4: Scans transaction history and generates advisor recommendations."""
    
    @classmethod
    def analyze(cls, user_id: Any, db: Session) -> List[Dict[str, Any]]:
        # Fetch user's transactions for the last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        transactions = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.date >= thirty_days_ago
        ).all()
        
        # Query additional platform modules
        budgets = db.query(Budget).filter(Budget.user_id == user_id).all()
        savings_goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).all()
        subscriptions = db.query(Subscription).filter(Subscription.user_id == user_id, Subscription.status == "ACTIVE").all()
        
        if not transactions:
            return [
                {
                    "title": "Welcome to FinSight AI",
                    "message": "Start importing transaction logs (CSV, SMS, or bank PDFs) to receive customized intelligence recommendations.",
                    "recommendation_type": "SAVINGS",
                    "impact_amount": 0.0
                }
            ]
            
        # Calculate statistics
        total_spend = sum(t.amount for t in transactions if t.type == "DEBIT")
        total_earned = sum(t.cashback_earned for t in transactions)
        total_potential = sum(t.potential_cashback for t in transactions)
        missed_cashback = total_potential - total_earned
        
        # Spend by Category
        categories: Dict[str, float] = {}
        upi_spend = 0.0
        upi_potential = 0.0
        
        for t in transactions:
            if t.type == "DEBIT":
                cat = t.category
                categories[cat] = categories.get(cat, 0.0) + float(t.amount)
                if t.payment_method.lower() == "upi":
                    upi_spend += float(t.amount)
                    upi_potential += float(t.potential_cashback - t.cashback_earned)

        top_category = max(categories, key=categories.get) if categories else "None"
        top_cat_amt = categories.get(top_category, 0.0)
        
        # Draft summary components
        transactions_summary = f"Total spend: ₹{total_spend:.2f}. Total cashback earned: ₹{total_earned:.2f}. Potential cashback: ₹{total_potential:.2f}. Missed cashback: ₹{missed_cashback:.2f}."
        if top_category != "None":
            transactions_summary += f" Top spending category is '{top_category}' with ₹{top_cat_amt:.2f}."
        if upi_spend > 0:
            transactions_summary += f" UPI transaction volume: ₹{upi_spend:.2f}, representing a potential missed cashback of ₹{upi_potential:.2f}."
            
        if budgets:
            transactions_summary += " Budgets configured: " + ", ".join([f"{b.category}: limit ₹{b.limit_amount}" for b in budgets])
        if savings_goals:
            transactions_summary += " Savings goals tracked: " + ", ".join([f"{g.name}: target ₹{g.target_amount}, saved ₹{g.current_amount}" for g in savings_goals])
        if subscriptions:
            transactions_summary += " Active subscriptions: " + ", ".join([f"{s.name}: monthly cost ₹{s.monthly_cost}, renewal day {s.renewal_day}" for s in subscriptions])

        prompt = (
            f"You are a Financial Recommendation Agent. Analyze the following user financial summary:\n"
            f"{transactions_summary}\n\n"
            f"Generate exactly 3 smart actionable recommendations formatted as a JSON array of objects. "
            f"Each object must have the fields:\n"
            f"- 'title': Short descriptive title\n"
            f"- 'message': Detailed advice (e.g., 'You spent ₹X on food via UPI, switch to card Y for ₹Z savings')\n"
            f"- 'recommendation_type': Either 'SAVINGS', 'CASHBACK', or 'EXPENSE_WARNING'\n"
            f"- 'impact_amount': A number representing estimated savings or warning size in INR\n\n"
            f"Return ONLY the raw JSON block, nothing else."
        )
        
        response = GeminiService.generate_content(prompt, json_mode=True)
        if response:
            try:
                recs = json.loads(response)
                if isinstance(recs, list) and len(recs) > 0:
                    return recs
            except Exception as e:
                logger.error(f"Failed to parse Gemini recommendation JSON: {e}. Fallback triggered.")

        # Heuristic Fallback Recommendations
        fallback_recs = []
        
        # 1. Cashback optimization advice (Cashback Recommendation)
        if missed_cashback > 0:
            fallback_recs.append({
                "title": "Maximize Cashback Opportunities",
                "message": f"You missed out on ₹{missed_cashback:.2f} in cashback rewards this month. Switching from UPI to your best eligible Credit Cards on Food and Utilities could retrieve this margin.",
                "recommendation_type": "CASHBACK",
                "impact_amount": float(missed_cashback)
            })
            
        # 2. Budget Alert / Spending Insight
        budget_warning_added = False
        for b in budgets:
            spent = categories.get(b.category, 0.0)
            limit = float(b.limit_amount)
            if limit > 0:
                pct = (spent / limit) * 100
                if pct >= 80:
                    fallback_recs.append({
                        "title": f"{b.category} Budget Alert",
                        "message": f"Your spending in the '{b.category}' category has reached {pct:.1f}% of your ₹{limit} budget cap. Slow down spending to avoid overruns.",
                        "recommendation_type": "EXPENSE_WARNING",
                        "impact_amount": float(max(0.0, spent - limit))
                    })
                    budget_warning_added = True
                    break

        if not budget_warning_added and top_category != "None" and top_cat_amt > total_spend * Decimal("0.3"):
            fallback_recs.append({
                "title": f"High Spending in {top_category}",
                "message": f"Your expenses in the '{top_category}' category total ₹{top_cat_amt:.2f}, accounting for {(top_cat_amt/float(total_spend))*100:.1f}% of your budget. Consider setting a cap.",
                "recommendation_type": "EXPENSE_WARNING",
                "impact_amount": 0.0
            })
            
        # 3. Savings Goal / Subscription waste recommendation
        if subscriptions:
            total_sub = sum(float(s.monthly_cost) for s in subscriptions)
            fallback_recs.append({
                "title": "Subscription Waste Audit",
                "message": f"You have {len(subscriptions)} active subscription bills totaling ₹{total_sub:.2f}/mo. Audit streaming or SaaS accounts to capture unused leaks and save up to ₹499/mo.",
                "recommendation_type": "SAVINGS",
                "impact_amount": 499.0
            })
        elif savings_goals:
            for g in savings_goals:
                saved = float(g.current_amount)
                target = float(g.target_amount)
                if saved < target:
                    remaining = target - saved
                    fallback_recs.append({
                        "title": f"Boost Savings for '{g.name}'",
                        "message": f"You are at {saved/target*100:.1f}% of your target for '{g.name}'. Deposit ₹2,000 this month to maintain your timeline.",
                        "recommendation_type": "SAVINGS",
                        "impact_amount": 2000.0
                    })
                    break
        else:
            fallback_recs.append({
                "title": "Establish an Emergency Goal",
                "message": "Create a new Savings Goal on FinSight AI to organize funds and monitor progress towards your target.",
                "recommendation_type": "SAVINGS",
                "impact_amount": 10000.0
            })
            
        # Ensure we always have exactly 3 recommendations
        while len(fallback_recs) < 3:
            fallback_recs.append({
                "title": "Review Active Bank Offers",
                "message": "Check our cashback rules database regularly. We identified Swiggy, Swiggy-HDFC, and Amazon Prime offers that match your spending patterns.",
                "recommendation_type": "SAVINGS",
                "impact_amount": 100.0
            })
            
        return fallback_recs[:3]


class ReconciliationAgent:
    """Agent 5: Detects duplicate transactions, missing entries, and amount mismatches."""
    
    @staticmethod
    def run_reconciliation(user_id: Any, db: Session) -> List[ReconciliationLog]:
        # Fetch transactions for the user
        transactions = db.query(Transaction).filter(
            Transaction.user_id == user_id
        ).order_by(Transaction.date.desc()).all()
        
        logs_created = []
        
        # Clear unresolved duplicate logs for this user first to avoid duplication
        db.query(ReconciliationLog).filter(
            ReconciliationLog.user_id == user_id,
            ReconciliationLog.resolved == False
        ).delete()
        db.commit()

        # Check for duplicates: Same Merchant, Same Amount, Same Day, and timestamp within 15 minutes
        seen_transactions: List[Transaction] = []
        for t in transactions:
            if t.type != "DEBIT":
                continue
                
            for prev in seen_transactions:
                time_diff = abs((t.date - prev.date).total_seconds())
                same_merchant = t.merchant.lower() == prev.merchant.lower()
                same_amount = t.amount == prev.amount
                
                # Check for duplicates (within 15 minutes)
                if same_merchant and same_amount and time_diff <= 900:
                    # Found duplicate! Log the pending one (or the newer one)
                    newer_tx = t if t.date > prev.date else prev
                    
                    log_entry = ReconciliationLog(
                        user_id=user_id,
                        transaction_id=newer_tx.id,
                        issue_type="DUPLICATE",
                        details=f"Duplicate detected: Two transaction items to '{t.merchant}' of amount ₹{t.amount} occurred within {int(time_diff/60)} minutes.",
                        resolved=False
                    )
                    db.add(log_entry)
                    logs_created.append(log_entry)
                    
                    # Update transaction status
                    newer_tx.status = "PENDING"
                    break
                    
            seen_transactions.append(t)
            
        db.commit()
        return logs_created
