import logging
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from ..database import get_db
from ..models import ConnectedAccount, AccountImport, Transaction, User, CashbackRule
from ..schemas import (
    ConnectedAccount as ConnectedAccountSchema,
    ConnectedAccountCreate,
    AccountImport as AccountImportSchema,
    Transaction as TransactionSchema
)
from ..security import get_current_user
from ..services.ocr_service import OCRService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/accounts", tags=["Accounts"])

@router.get("/", response_model=List[ConnectedAccountSchema])
def get_connected_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all connected accounts for the current user."""
    return db.query(ConnectedAccount).filter(ConnectedAccount.user_id == current_user.id).order_by(ConnectedAccount.created_at.desc()).all()

@router.post("/connect", response_model=ConnectedAccountSchema, status_code=status.HTTP_201_CREATED)
def connect_account(
    account_data: ConnectedAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Simulate connecting a new account."""
    # Check if this provider + name already connected to avoid duplicates
    existing = db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == current_user.id,
        ConnectedAccount.provider == account_data.provider,
        ConnectedAccount.account_name == account_data.account_name
    ).first()
    
    if existing:
        # If disconnected, reconnect it
        if existing.status == "DISCONNECTED":
            existing.status = "CONNECTED"
            existing.last_synced = datetime.now()
            db.commit()
            db.refresh(existing)
            return existing
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Account '{account_data.account_name}' is already connected."
        )

    db_account = ConnectedAccount(
        user_id=current_user.id,
        provider=account_data.provider,
        account_name=account_data.account_name,
        status="CONNECTED",
        last_synced=datetime.now()
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def disconnect_account(
    account_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Disconnect/Delete a connected account."""
    db_account = db.query(ConnectedAccount).filter(
        ConnectedAccount.id == account_id,
        ConnectedAccount.user_id == current_user.id
    ).first()
    
    if not db_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connected account not found."
        )
        
    db.delete(db_account)
    db.commit()
    return None

@router.get("/imports", response_model=List[AccountImportSchema])
def get_import_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all account import logs for the current user."""
    return db.query(AccountImport).filter(AccountImport.user_id == current_user.id).order_by(AccountImport.import_date.desc()).all()

@router.post("/upload", response_model=List[TransactionSchema])
async def upload_csv_statement(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a CSV statement, parse it into transactions, and create an import log."""
    filename = file.filename
    contents = await file.read()
    
    rules = db.query(CashbackRule).all()
    transactions_to_save = []
    
    # Create the import history record initially as FAILED, update to SUCCESS if parsed correctly
    db_import = AccountImport(
        user_id=current_user.id,
        file_name=filename,
        import_date=datetime.now(),
        status="FAILED",
        records_count=0
    )
    db.add(db_import)
    db.commit()
    db.refresh(db_import)

    try:
        # Parse CSV
        transactions_to_save = OCRService.parse_csv(contents, rules)
        
        if not transactions_to_save:
            raise ValueError("No valid transactions found in the CSV.")
            
        # Tag source file name and user
        db_entities = []
        for tx_dict in transactions_to_save:
            entity = Transaction(
                user_id=current_user.id,
                date=tx_dict["date"],
                merchant=tx_dict["merchant"],
                amount=tx_dict["amount"],
                type=tx_dict["type"],
                category=tx_dict["category"],
                payment_method=tx_dict["payment_method"],
                cashback_earned=tx_dict["cashback_earned"],
                potential_cashback=tx_dict["potential_cashback"],
                best_payment_method=tx_dict["best_payment_method"],
                status=tx_dict["status"],
                source="CSV",
                source_file=filename
            )
            db.add(entity)
            db_entities.append(entity)
            
        db.commit()
        
        # Update import history success
        db_import.status = "SUCCESS"
        db_import.records_count = len(db_entities)
        db.commit()
        
        # Refresh entities
        for entity in db_entities:
            db.refresh(entity)
            
        return db_entities
        
    except Exception as e:
        logger.error(f"Error parsing upload in accounts router: {e}")
        # db_import is already in database with status FAILED, so we just log details if needed
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Statement import failed: {str(e)}"
        )
