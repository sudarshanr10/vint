from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, schemas
from app.routes.deps import get_db, get_current_user
from datetime import datetime
from sqlalchemy import func


router = APIRouter(prefix="/transactions", tags=["transactions"])
@router.post("/", response_model=schemas.Transaction, status_code=status.HTTP_201_CREATED)
def create_transaction(transaction_in: schemas.TransactionCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
   transaction =  models.Transaction(**transaction_in.dict(), user_id= user.id)
   db.add(transaction)
   db.commit()
   db.refresh(transaction)
   return transaction

@router.get("/", response_model=list[schemas.Transaction])
def read_transactions(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.Transaction).filter(models.Transaction.user_id == user.id).all()

@router.get("/summary")
def get_summary(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    results = (
        db.query(
            models.Transaction.category,
            func.sum(models.Transaction.amount).label("Total"))
            .filter(models.Transaction.user_id == user.id, models.Transaction.timestamp >= start)
            .group_by(models.Transaction.category)
            .all()
        )

    return {cat: total for cat, total in results}