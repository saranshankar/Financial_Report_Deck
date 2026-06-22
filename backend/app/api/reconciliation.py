from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from ..database import get_db
from ..models import ReconciliationLog, Transaction, User
from ..schemas import ReconciliationLog as LogSchema
from ..security import get_current_user
from ..services.agents import ReconciliationAgent

router = APIRouter(prefix="/reconciliation", tags=["Reconciliation"])

@router.get("/logs", response_model=List[LogSchema])
def get_reconciliation_logs(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return db.query(ReconciliationLog).filter(
        ReconciliationLog.user_id == current_user.id
    ).order_by(ReconciliationLog.created_at.desc()).all()

@router.post("/run", response_model=List[LogSchema])
def run_reconciliation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Execute the Reconciliation Agent logic
    ReconciliationAgent.run_reconciliation(current_user.id, db)
    
    # Return all active (unresolved) reconciliation logs
    return db.query(ReconciliationLog).filter(
        ReconciliationLog.user_id == current_user.id,
        ReconciliationLog.resolved == False
    ).order_by(ReconciliationLog.created_at.desc()).all()

@router.post("/logs/{log_id}/resolve", response_model=LogSchema)
def resolve_log(
    log_id: UUID,
    action: str = "keep",  # "keep" (keep transaction but resolve warning) or "delete" (remove duplicate transaction)
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    log_entry = db.query(ReconciliationLog).filter(
        ReconciliationLog.id == log_id,
        ReconciliationLog.user_id == current_user.id
    ).first()
    
    if not log_entry:
        raise HTTPException(status_code=404, detail="Reconciliation log entry not found")
        
    log_entry.resolved = True
    
    # Resolve the linked transaction status
    if log_entry.transaction_id:
        tx = db.query(Transaction).filter(
            Transaction.id == log_entry.transaction_id,
            Transaction.user_id == current_user.id
        ).first()
        
        if tx:
            if action == "delete":
                db.delete(tx)
            else:
                tx.status = "CLEARED"
                
    db.commit()
    if action != "delete" and log_entry.transaction_id:
        db.refresh(log_entry)
        
    return log_entry
