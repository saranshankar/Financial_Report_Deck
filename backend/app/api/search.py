import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from ..database import get_db
from ..models import Transaction, Offer, Subscription, ConnectedAccount, User
from ..schemas import GlobalSearchResponse
from ..security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["Global Search"])

@router.get("/", response_model=GlobalSearchResponse)
def global_search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Perform a global cross-entity search for transactions, merchants, active offers, subscriptions, and connections."""
    search_term = f"%{q}%"
    
    # 1. Search Transactions
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        (Transaction.merchant.ilike(search_term)) | 
        (Transaction.category.ilike(search_term)) |
        (Transaction.payment_method.ilike(search_term))
    ).order_by(Transaction.date.desc()).limit(10).all()
    
    # 2. Search Offers
    offers = db.query(Offer).filter(
        (Offer.title.ilike(search_term)) | 
        (Offer.merchant.ilike(search_term)) |
        (Offer.original_terms.ilike(search_term))
    ).limit(5).all()
    
    # 3. Search Subscriptions
    subscriptions = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.name.ilike(search_term)
    ).limit(5).all()
    
    # 4. Search Connected Accounts
    accounts = db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == current_user.id,
        (ConnectedAccount.account_name.ilike(search_term)) | 
        (ConnectedAccount.provider.ilike(search_term))
    ).limit(5).all()
    
    return {
        "transactions": transactions,
        "offers": offers,
        "subscriptions": subscriptions,
        "accounts": accounts
    }
