import logging
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from uuid import UUID

from ..database import get_db
from ..models import SavingsGoal, GoalContribution, User
from ..schemas import SavingsGoal as SavingsGoalSchema, SavingsGoalCreate
from ..security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/savings-goals", tags=["Savings Goals"])

@router.get("/", response_model=List[SavingsGoalSchema])
def get_savings_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all savings goals for the user."""
    return db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).order_by(SavingsGoal.created_at.desc()).all()

@router.post("/", response_model=SavingsGoalSchema)
def create_savings_goal(
    goal_data: SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new savings goal."""
    db_goal = SavingsGoal(
        user_id=current_user.id,
        name=goal_data.name,
        target_amount=goal_data.target_amount,
        current_amount=goal_data.current_amount or 0.00,
        status="ACTIVE"
    )
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    
    # If starting with a non-zero current amount, record an initial contribution event
    if db_goal.current_amount > 0:
        contribution = GoalContribution(
            goal_id=db_goal.id,
            amount=db_goal.current_amount
        )
        db.add(contribution)
        db.commit()
        
    return db_goal

@router.put("/{goal_id}/add-funds", response_model=SavingsGoalSchema)
def add_funds(
    goal_id: UUID,
    amount: float = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add/allocate funds to a savings goal and record contribution event."""
    db_goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()
    
    if not db_goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found."
        )
        
    db_goal.current_amount = float(db_goal.current_amount or 0.00) + amount
    
    # Check if target achieved
    if db_goal.current_amount >= float(db_goal.target_amount):
        db_goal.status = "COMPLETED"
        
    db.commit()
    
    # Record contribution log
    contribution = GoalContribution(
        goal_id=db_goal.id,
        amount=amount
    )
    db.add(contribution)
    db.commit()
    
    db.refresh(db_goal)
    return db_goal

@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_savings_goal(
    goal_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a savings goal."""
    db_goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()
    
    if not db_goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found."
        )
        
    db.delete(db_goal)
    db.commit()
    return None
