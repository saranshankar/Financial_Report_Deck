import uuid
from sqlalchemy import Column, String, Numeric, DateTime, Boolean, ForeignKey, Text, func, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
    insights = relationship("Insight", back_populates="user", cascade="all, delete-orphan")
    reconciliation_logs = relationship("ReconciliationLog", back_populates="user", cascade="all, delete-orphan")
    connected_accounts = relationship("ConnectedAccount", back_populates="user", cascade="all, delete-orphan")
    account_imports = relationship("AccountImport", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    savings_goals = relationship("SavingsGoal", back_populates="user", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    merchant = Column(String(255), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    type = Column(String(10), nullable=False)  # DEBIT or CREDIT
    category = Column(String(50), nullable=False)  # Food, Travel, Shopping, Bills, Healthcare, Education, Entertainment, Investments, Others
    payment_method = Column(String(100), nullable=False)  # UPI, Card Name, etc.
    cashback_earned = Column(Numeric(12, 2), default=0.0)
    potential_cashback = Column(Numeric(12, 2), default=0.0)
    best_payment_method = Column(String(100))
    status = Column(String(20), default="CLEARED")  # CLEARED, PENDING, RECONCILED
    source = Column(String(20), default="MANUAL")  # MANUAL, CSV, PDF, SMS, OCR
    source_file = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="transactions")
    reconciliation_logs = relationship("ReconciliationLog", back_populates="transaction", cascade="all, delete-orphan")

class CashbackRule(Base):
    __tablename__ = "cashback_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_name = Column(String(100), nullable=False)
    merchant_pattern = Column(String(255), default="*")
    category_pattern = Column(String(255), default="*")
    cashback_percentage = Column(Numeric(5, 2), nullable=False)
    max_limit = Column(Numeric(12, 2), nullable=True)
    min_transaction_amount = Column(Numeric(12, 2), default=0.0)
    conditions = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Offer(Base):
    __tablename__ = "offers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    merchant = Column(String(255), nullable=False)
    original_terms = Column(Text, nullable=False)
    simplified_explanation = Column(Text, nullable=True)
    status = Column(String(20), default="ACTIVE")  # ACTIVE, EXPIRED
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    recommendation_type = Column(String(50), nullable=False)  # SAVINGS, CASHBACK, EXPENSE_WARNING
    impact_amount = Column(Numeric(12, 2), default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="recommendations")

class Insight(Base):
    __tablename__ = "insights"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    month = Column(String(7), nullable=False)  # YYYY-MM
    total_spending = Column(Numeric(12, 2), nullable=False)
    total_cashback = Column(Numeric(12, 2), nullable=False)
    top_category = Column(String(50), nullable=False)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="insights")

class ReconciliationLog(Base):
    __tablename__ = "reconciliation_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True)
    issue_type = Column(String(50), nullable=False)  # DUPLICATE, MISSING_RECORD, MISMATCHED_AMOUNT
    details = Column(Text, nullable=False)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="reconciliation_logs")
    transaction = relationship("Transaction", back_populates="reconciliation_logs")

class ConnectedAccount(Base):
    __tablename__ = "connected_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(100), nullable=False)  # Google Pay, PhonePe, Paytm, Amazon Pay, Bank Account, Credit Card
    account_name = Column(String(255), nullable=False)
    status = Column(String(20), default="CONNECTED")  # CONNECTED, DISCONNECTED
    last_synced = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="connected_accounts")

class AccountImport(Base):
    __tablename__ = "account_imports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    import_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), default="SUCCESS")  # SUCCESS, FAILED
    records_count = Column(Integer, default=0)

    user = relationship("User", back_populates="account_imports")

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    month = Column(String(7), nullable=False)  # YYYY-MM
    category = Column(String(50), nullable=False)  # Food, Shopping, etc., or * for total
    limit_amount = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="budgets")

class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    target_amount = Column(Numeric(12, 2), nullable=False)
    current_amount = Column(Numeric(12, 2), default=0.00)
    status = Column(String(20), default="ACTIVE")  # ACTIVE, COMPLETED
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="savings_goals")
    contributions = relationship("GoalContribution", back_populates="goal", cascade="all, delete-orphan")

class GoalContribution(Base):
    __tablename__ = "goal_contributions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    goal_id = Column(UUID(as_uuid=True), ForeignKey("savings_goals.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    goal = relationship("SavingsGoal", back_populates="contributions")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    monthly_cost = Column(Numeric(12, 2), nullable=False)
    renewal_day = Column(Integer, nullable=False)
    status = Column(String(20), default="ACTIVE")  # ACTIVE, CANCELLED
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="subscriptions")
