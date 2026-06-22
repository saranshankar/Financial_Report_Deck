from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from decimal import Decimal

# JWT and Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[UUID] = None
    email: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Transaction schemas
class TransactionBase(BaseModel):
    date: datetime
    merchant: str
    amount: Decimal
    type: str  # DEBIT / CREDIT
    category: str
    payment_method: str
    status: Optional[str] = "CLEARED"
    source: Optional[str] = "MANUAL"
    source_file: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    date: Optional[datetime] = None
    merchant: Optional[str] = None
    amount: Optional[Decimal] = None
    type: Optional[str] = None
    category: Optional[str] = None
    payment_method: Optional[str] = None
    status: Optional[str] = None

class Transaction(TransactionBase):
    id: UUID
    user_id: UUID
    cashback_earned: Decimal
    potential_cashback: Decimal
    best_payment_method: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# CashbackRule schemas
class CashbackRuleBase(BaseModel):
    card_name: str
    merchant_pattern: str = "*"
    category_pattern: str = "*"
    cashback_percentage: Decimal
    max_limit: Optional[Decimal] = None
    min_transaction_amount: Decimal = Decimal(0.0)
    conditions: Optional[str] = None

class CashbackRuleCreate(CashbackRuleBase):
    pass

class CashbackRule(CashbackRuleBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Offer schemas
class OfferBase(BaseModel):
    title: str
    merchant: str
    original_terms: str
    simplified_explanation: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    expires_at: Optional[datetime] = None

class OfferCreate(OfferBase):
    pass

class Offer(OfferBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Recommendation schemas
class Recommendation(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    message: str
    recommendation_type: str  # SAVINGS, CASHBACK, EXPENSE_WARNING
    impact_amount: Decimal
    created_at: datetime

    class Config:
        from_attributes = True

# Insight schemas
class Insight(BaseModel):
    id: UUID
    user_id: UUID
    month: str
    total_spending: Decimal
    total_cashback: Decimal
    top_category: str
    summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ReconciliationLog schemas
class ReconciliationLog(BaseModel):
    id: UUID
    user_id: UUID
    transaction_id: Optional[UUID] = None
    issue_type: str  # DUPLICATE, MISSING_RECORD, MISMATCHED_AMOUNT
    details: str
    resolved: bool
    created_at: datetime
    transaction: Optional[Transaction] = None

    class Config:
        from_attributes = True

# Dashboard Response schemas
class DashboardStats(BaseModel):
    total_spending: Decimal
    total_cashback: Decimal
    missed_cashback: Decimal
    best_payment_method: str
    monthly_savings_prediction: Decimal
    top_expense_category: str

class SpendingByCategory(BaseModel):
    category: str
    amount: Decimal
    percentage: float

class MonthlyTrend(BaseModel):
    month: str
    spending: Decimal
    cashback: Decimal

class CashbackTrend(BaseModel):
    month: str
    earned: Decimal
    potential: Decimal

class DashboardData(BaseModel):
    stats: DashboardStats
    spending_by_category: List[SpendingByCategory]
    monthly_trends: List[MonthlyTrend]
    cashback_trends: List[CashbackTrend]
    recent_transactions: List[Transaction]

class OfferSimplificationRequest(BaseModel):
    original_terms: str

class OfferSimplificationResponse(BaseModel):
    original_terms: str
    simplified_explanation: str

# ConnectedAccount schemas
class ConnectedAccountBase(BaseModel):
    provider: str
    account_name: str
    status: Optional[str] = "CONNECTED"

class ConnectedAccountCreate(ConnectedAccountBase):
    pass

class ConnectedAccount(ConnectedAccountBase):
    id: UUID
    user_id: UUID
    last_synced: datetime
    created_at: datetime

    class Config:
        from_attributes = True

# AccountImport schemas
class AccountImport(BaseModel):
    id: UUID
    user_id: UUID
    file_name: str
    import_date: datetime
    status: str
    records_count: int

    class Config:
        from_attributes = True

# Budget schemas
class BudgetBase(BaseModel):
    month: str
    category: str
    limit_amount: Decimal

class BudgetCreate(BudgetBase):
    pass

class Budget(BudgetBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# SavingsGoal schemas
class SavingsGoalBase(BaseModel):
    name: str
    target_amount: Decimal
    current_amount: Optional[Decimal] = Decimal(0.0)
    status: Optional[str] = "ACTIVE"

class SavingsGoalCreate(SavingsGoalBase):
    pass

class SavingsGoal(SavingsGoalBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Subscription schemas
class SubscriptionBase(BaseModel):
    name: str
    monthly_cost: Decimal
    renewal_day: int
    status: Optional[str] = "ACTIVE"

class SubscriptionCreate(SubscriptionBase):
    pass

class Subscription(SubscriptionBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
