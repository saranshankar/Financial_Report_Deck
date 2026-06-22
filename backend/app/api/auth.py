from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserLogin, Token, User as UserSchema
from ..security import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    
    # Hash password and save user
    hashed_pwd = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        hashed_password=hashed_pwd,
        full_name=user_data.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create token
    access_token = create_access_token(data={"sub": str(db_user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/token", response_model=Token)
def login_swagger(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """FastAPI Swagger form-based authentication endpoint."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserSchema)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/reset")
def reset_database(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        from ..models import CashbackRule, Transaction, Offer, Recommendation, Insight, ReconciliationLog
        from decimal import Decimal
        from datetime import datetime
        
        # 1. Delete user specific data
        db.query(ReconciliationLog).filter(ReconciliationLog.user_id == current_user.id).delete()
        db.query(Recommendation).filter(Recommendation.user_id == current_user.id).delete()
        db.query(Insight).filter(Insight.user_id == current_user.id).delete()
        db.query(Transaction).filter(Transaction.user_id == current_user.id).delete()
        
        # 2. Reset Cashback rules globally (so cards database is populated)
        db.query(CashbackRule).delete()
        db.query(Offer).delete()
        db.commit()
        
        # 3. Seed Cashback Rules
        rules = [
            CashbackRule(card_name="Amazon Pay ICICI", merchant_pattern="Amazon", category_pattern="*", cashback_percentage=Decimal("5.00"), conditions="5% cashback for Amazon Prime members on Amazon purchases."),
            CashbackRule(card_name="Amazon Pay ICICI", merchant_pattern="*", category_pattern="*", cashback_percentage=Decimal("1.00"), conditions="1% flat cashback on other purchases."),
            CashbackRule(card_name="Axis Ace", merchant_pattern="*", category_pattern="Bills", cashback_percentage=Decimal("5.00"), max_limit=Decimal("500.00"), conditions="5% cashback on utility bills paid via Google Pay."),
            CashbackRule(card_name="Axis Ace", merchant_pattern="*", category_pattern="*", cashback_percentage=Decimal("2.00"), conditions="2% flat cashback on all other transactions."),
            CashbackRule(card_name="SBI Cashback", merchant_pattern="*", category_pattern="Shopping", cashback_percentage=Decimal("5.00"), max_limit=Decimal("5000.00"), conditions="5% cashback on online shopping."),
            CashbackRule(card_name="SBI Cashback", merchant_pattern="*", category_pattern="*", cashback_percentage=Decimal("1.00"), conditions="1% cashback on offline spends."),
            CashbackRule(card_name="Flipkart Axis", merchant_pattern="Flipkart", category_pattern="*", cashback_percentage=Decimal("5.00"), conditions="5% cashback on Flipkart purchases."),
            CashbackRule(card_name="Flipkart Axis", merchant_pattern="Myntra", category_pattern="*", cashback_percentage=Decimal("4.00"), conditions="4% cashback on Myntra purchases.")
        ]
        db.add_all(rules)
        
        # 4. Seed default transactions for current_user.id
        txs = [
            Transaction(user_id=current_user.id, date=datetime.strptime("2026-06-01 12:30:00", "%Y-%m-%d %H:%M:%S"), merchant="Amazon", amount=Decimal("15000.00"), type="DEBIT", category="Shopping", payment_method="SBI Cashback", cashback_earned=Decimal("750.00"), potential_cashback=Decimal("750.00"), best_payment_method="SBI Cashback", status="CLEARED", source="CSV"),
            Transaction(user_id=current_user.id, date=datetime.strptime("2026-06-02 18:45:00", "%Y-%m-%d %H:%M:%S"), merchant="Zomato", amount=Decimal("1200.00"), type="DEBIT", category="Food", payment_method="UPI", cashback_earned=Decimal("0.00"), potential_cashback=Decimal("24.00"), best_payment_method="Axis Ace", status="CLEARED", source="SMS"),
            Transaction(user_id=current_user.id, date=datetime.strptime("2026-06-05 10:15:00", "%Y-%m-%d %H:%M:%S"), merchant="Uber", amount=Decimal("450.00"), type="DEBIT", category="Travel", payment_method="Amazon Pay ICICI", cashback_earned=Decimal("4.50"), potential_cashback=Decimal("9.00"), best_payment_method="Axis Ace", status="CLEARED", source="SMS"),
            Transaction(user_id=current_user.id, date=datetime.strptime("2026-06-10 20:00:00", "%Y-%m-%d %H:%M:%S"), merchant="Netflix", amount=Decimal("799.00"), type="DEBIT", category="Entertainment", payment_method="Axis Ace", cashback_earned=Decimal("15.98"), potential_cashback=Decimal("39.95"), best_payment_method="SBI Cashback", status="CLEARED", source="PDF"),
            Transaction(user_id=current_user.id, date=datetime.strptime("2026-06-12 11:00:00", "%Y-%m-%d %H:%M:%S"), merchant="Electricity Bill", amount=Decimal("3500.00"), type="DEBIT", category="Bills", payment_method="Axis Ace", cashback_earned=Decimal("175.00"), potential_cashback=Decimal("175.00"), best_payment_method="Axis Ace", status="CLEARED", source="PDF"),
            Transaction(user_id=current_user.id, date=datetime.strptime("2026-06-15 09:30:00", "%Y-%m-%d %H:%M:%S"), merchant="Apollo Pharmacy", amount=Decimal("850.00"), type="DEBIT", category="Healthcare", payment_method="UPI", cashback_earned=Decimal("0.00"), potential_cashback=Decimal("17.00"), best_payment_method="Axis Ace", status="CLEARED", source="SMS"),
            Transaction(user_id=current_user.id, date=datetime.strptime("2026-06-18 15:00:00", "%Y-%m-%d %H:%M:%S"), merchant="Flipkart", amount=Decimal("5000.00"), type="DEBIT", category="Shopping", payment_method="Flipkart Axis", cashback_earned=Decimal("250.00"), potential_cashback=Decimal("250.00"), best_payment_method="Flipkart Axis", status="CLEARED", source="CSV"),
            Transaction(user_id=current_user.id, date=datetime.strptime("2026-06-19 19:30:00", "%Y-%m-%d %H:%M:%S"), merchant="Starbucks", amount=Decimal("350.00"), type="DEBIT", category="Food", payment_method="UPI", cashback_earned=Decimal("0.00"), potential_cashback=Decimal("7.00"), best_payment_method="Axis Ace", status="CLEARED", source="SMS"),
            Transaction(user_id=current_user.id, date=datetime.strptime("2026-06-19 19:31:00", "%Y-%m-%d %H:%M:%S"), merchant="Starbucks", amount=Decimal("350.00"), type="DEBIT", category="Food", payment_method="UPI", cashback_earned=Decimal("0.00"), potential_cashback=Decimal("7.00"), best_payment_method="Axis Ace", status="PENDING", source="SMS")
        ]
        db.add_all(txs)
        db.commit()
        
        # 5. Seed active offers
        offers = [
            Offer(title="Amazon Prime Day Cashback", merchant="Amazon", original_terms="Get 10% cashback up to ₹200 on transactions above ₹999.", simplified_explanation="Spend at least ₹999 on Amazon and receive 10% cashback, capped at a maximum of ₹200.", status="ACTIVE", expires_at=datetime.strptime("2026-07-31 23:59:59", "%Y-%m-%d %H:%M:%S")),
            Offer(title="Axis Ace Bill Pay Promo", merchant="Google Pay", original_terms="Earn flat 5% cashback on utility payments (Electricity, Water, Gas) when paid using Axis Ace Card, minimum transaction value ₹500. Maximum cashback ₹250 per billing cycle.", simplified_explanation="Pay a utility bill of at least ₹500 via Google Pay using Axis Ace Card to get 5% cashback (capped at ₹250).", status="ACTIVE", expires_at=datetime.strptime("2026-08-31 23:59:59", "%Y-%m-%d %H:%M:%S")),
            Offer(title="Swiggy HDFC Special Offer", merchant="Swiggy", original_terms="Enjoy 10% instant discount up to ₹100 on orders of ₹499 and above. Valid twice per user per month using HDFC Credit Cards.", simplified_explanation="Get 10% off (up to ₹100) on Swiggy for orders above ₹499 when paying with an HDFC Credit Card. Can be used 2 times a month.", status="ACTIVE", expires_at=datetime.strptime("2026-07-15 23:59:59", "%Y-%m-%d %H:%M:%S"))
        ]
        db.add_all(offers)
        
        # 6. Seed recommendations
        recs = [
            Recommendation(user_id=current_user.id, title="Card Recommendation for Zomato", message="You spent ₹1,200 on Zomato this month using UPI, earning ₹0 cashback. If you used your Axis Ace card, you would have earned ₹24 extra cashback (2% rate).", recommendation_type="CASHBACK", impact_amount=Decimal("24.00")),
            Recommendation(user_id=current_user.id, title="Unusual Spending Warning", message="Your Shopping expenses are 45% higher than your average monthly shopping spend. This was mostly due to your ₹15,000 purchase on Amazon.", recommendation_type="EXPENSE_WARNING", impact_amount=Decimal("0.00")),
            Recommendation(user_id=current_user.id, title="Utility Bill Savings Success", message="Excellent work! You paid your electricity bill of ₹3,500 using Axis Ace, maximizing your cashback at 5% (₹175 earned).", recommendation_type="SAVINGS", impact_amount=Decimal("175.00"))
        ]
        db.add_all(recs)
        
        # 7. Seed insights
        insights = [
            Insight(user_id=current_user.id, month="2026-06", total_spending=Decimal("27298.00"), total_cashback=Decimal("1195.48"), top_category="Shopping", summary="You spent mostly on Shopping this month (₹20,000), driven by purchases on Amazon and Flipkart. Your overall cashback rate was 4.38%, which is excellent. However, you missed out on ₹53.47 of additional cashback by using UPI/Debit instead of Axis Ace or SBI Cashback for food/travel. Switching to the recommended cards would save you more.")
        ]
        db.add_all(insights)
        
        # 8. Seed Reconciliation Logs (Link to the Starbucks duplicate transaction)
        db.commit() # Commit first to write transactions and get IDs
        starbucks_pending = db.query(Transaction).filter(
            Transaction.user_id == current_user.id, 
            Transaction.merchant == "Starbucks", 
            Transaction.status == "PENDING"
        ).first()
        
        if starbucks_pending:
            recon_log = ReconciliationLog(
                user_id=current_user.id,
                transaction_id=starbucks_pending.id,
                issue_type="DUPLICATE",
                details="Duplicate transaction identified: Two debits of ₹350.00 to Starbucks within 1 minute (19:30:00 vs 19:31:00).",
                resolved=False
            )
            db.add(recon_log)
            db.commit()
            
        return {"status": "success", "message": "Demo data restored successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database reset failure: {str(e)}")
