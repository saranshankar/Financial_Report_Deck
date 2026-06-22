from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal

from ..database import get_db
from ..models import Transaction, User, CashbackRule
from ..schemas import Transaction as TransactionSchema, TransactionCreate, TransactionUpdate
from ..security import get_current_user
from ..services.ocr_service import OCRService
from ..services.agents import TransactionClassificationAgent, CashbackEligibilityAgent

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("/", response_model=List[TransactionSchema])
def get_transactions(
    category: Optional[str] = None,
    payment_method: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    if category:
        query = query.filter(Transaction.category == category)
    if payment_method:
        query = query.filter(Transaction.payment_method.ilike(f"%{payment_method}%"))
    if search:
        query = query.filter(Transaction.merchant.ilike(f"%{search}%"))
        
    if start_date:
        try:
            sd = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Transaction.date >= sd)
        except ValueError:
            pass
            
    if end_date:
        try:
            ed = datetime.strptime(end_date, "%Y-%m-%d")
            query = query.filter(Transaction.date <= ed)
        except ValueError:
            pass
            
    return query.order_by(Transaction.date.desc()).all()

@router.post("/", response_model=TransactionSchema, status_code=status.HTTP_201_CREATED)
def create_transaction(
    tx_data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch active cashback rules
    rules = db.query(CashbackRule).all()
    
    # AI Classify if Others or not specified
    category = tx_data.category
    if not category or category == "Others" or category == "Unknown":
        category = TransactionClassificationAgent.classify(tx_data.merchant)
        
    # Evaluate cashback eligibility
    cb_analysis = CashbackEligibilityAgent.evaluate_transaction(
        merchant=tx_data.merchant,
        category=category,
        amount=tx_data.amount,
        payment_method=tx_data.payment_method,
        rules=rules
    )
    
    db_tx = Transaction(
        user_id=current_user.id,
        date=tx_data.date,
        merchant=tx_data.merchant,
        amount=tx_data.amount,
        type=tx_data.type,
        category=category,
        payment_method=tx_data.payment_method,
        cashback_earned=cb_analysis["cashback_earned"],
        potential_cashback=cb_analysis["potential_cashback"],
        best_payment_method=cb_analysis["best_payment_method"],
        status=tx_data.status or "CLEARED",
        source=tx_data.source or "MANUAL",
        source_file=tx_data.source_file
    )
    
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return db_tx

@router.put("/{tx_id}", response_model=TransactionSchema)
def update_transaction(
    tx_id: UUID,
    tx_data: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_tx = db.query(Transaction).filter(
        Transaction.id == tx_id, 
        Transaction.user_id == current_user.id
    ).first()
    
    if not db_tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
        
    # Update fields
    update_dict = tx_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(db_tx, key, value)
        
    # Re-evaluate cashback if amount, category or payment method changed
    if any(k in update_dict for k in ["amount", "category", "payment_method"]):
        rules = db.query(CashbackRule).all()
        cb_analysis = CashbackEligibilityAgent.evaluate_transaction(
            merchant=db_tx.merchant,
            category=db_tx.category,
            amount=db_tx.amount,
            payment_method=db_tx.payment_method,
            rules=rules
        )
        db_tx.cashback_earned = cb_analysis["cashback_earned"]
        db_tx.potential_cashback = cb_analysis["potential_cashback"]
        db_tx.best_payment_method = cb_analysis["best_payment_method"]
        
    db.commit()
    db.refresh(db_tx)
    return db_tx

@router.delete("/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    tx_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_tx = db.query(Transaction).filter(
        Transaction.id == tx_id, 
        Transaction.user_id == current_user.id
    ).first()
    
    if not db_tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
        
    db.delete(db_tx)
    db.commit()
    return None

@router.post("/upload", response_model=List[TransactionSchema])
async def upload_statement(
    source_type: str = Form(...),  # CSV, PDF, SMS, OCR
    file: Optional[UploadFile] = File(None),
    sms_text: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rules = db.query(CashbackRule).all()
    transactions_to_save = []
    
    try:
        # Handle manual SMS pasting
        if source_type.upper() == "SMS" and sms_text:
            transactions_to_save = OCRService.parse_sms_logs(sms_text, rules)
            
        # Handle file upload formats
        elif file:
            contents = await file.read()
            filename = file.filename
            
            if source_type.upper() == "CSV":
                transactions_to_save = OCRService.parse_csv(contents, rules)
            elif source_type.upper() == "PDF":
                transactions_to_save = OCRService.parse_pdf_statement(contents, rules)
            elif source_type.upper() == "OCR":
                transactions_to_save = OCRService.parse_ocr_image(contents, rules)
            elif source_type.upper() == "SMS":
                # SMS log file uploaded
                text_content = contents.decode("utf-8", errors="ignore")
                transactions_to_save = OCRService.parse_sms_logs(text_content, rules)
            else:
                raise HTTPException(status_code=400, detail="Invalid source type specified.")
                
            # Tag source file name
            for tx in transactions_to_save:
                tx["source_file"] = filename
        else:
            raise HTTPException(status_code=400, detail="Either a file upload or SMS text must be provided.")
            
        if not transactions_to_save:
            raise HTTPException(status_code=400, detail="No transactions could be extracted from the upload.")
            
        # Save to database
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
                source=tx_dict["source"],
                source_file=tx_dict.get("source_file")
            )
            db.add(entity)
            db_entities.append(entity)
            
        db.commit()
        for entity in db_entities:
            db.refresh(entity)
            
        return db_entities
        
    except Exception as e:
        logger.error(f"Error parsing upload: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Statement aggregation failed: {str(e)}"
        )
