from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from ..database import get_db
from ..models import Offer, User
from ..schemas import Offer as OfferSchema, OfferCreate, OfferSimplificationRequest, OfferSimplificationResponse
from ..security import get_current_user
from ..services.agents import OfferSimplificationAgent

router = APIRouter(prefix="/offers", tags=["Offers"])

@router.get("/", response_model=List[OfferSchema])
def get_offers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Offer).order_by(Offer.expires_at.asc()).all()

@router.post("/", response_model=OfferSchema, status_code=status.HTTP_201_CREATED)
def create_offer(
    offer_data: OfferCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Auto-simplify the offer text if no simplified explanation was provided
    simplified = offer_data.simplified_explanation
    if not simplified:
        simplified = OfferSimplificationAgent.simplify(offer_data.original_terms)
        
    db_offer = Offer(
        title=offer_data.title,
        merchant=offer_data.merchant,
        original_terms=offer_data.original_terms,
        simplified_explanation=simplified,
        status=offer_data.status or "ACTIVE",
        expires_at=offer_data.expires_at
    )
    db.add(db_offer)
    db.commit()
    db.refresh(db_offer)
    return db_offer

@router.post("/simplify", response_model=OfferSimplificationResponse)
def simplify_offer_terms(
    req: OfferSimplificationRequest,
    current_user: User = Depends(get_current_user)
):
    simplified = OfferSimplificationAgent.simplify(req.original_terms)
    return {
        "original_terms": req.original_terms,
        "simplified_explanation": simplified
    }

@router.delete("/{offer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_offer(
    offer_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not db_offer:
        raise HTTPException(status_code=404, detail="Offer not found")
        
    db.delete(db_offer)
    db.commit()
    return None
