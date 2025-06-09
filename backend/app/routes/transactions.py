from fastapi import APIRouter, Depends, HTTPException, Response, status
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

@router.put("/{transaction_id}", response_model=schemas.Transaction, status_code=status.HTTP_200_OK)
def update_transaction(transaction_id: int, transaction_in: schemas.TransactionCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id, models.Transaction.user_id == user.id).first()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    
    transaction.amount = transaction_in.amount
    transaction.category = transaction_in.category
    transaction.description = transaction_in.description

    db.commit()
    db.refresh(transaction)
    return transaction

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id, db: Session= Depends(get_db), user: models.User = Depends(get_current_user)):
    transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id, models.Transaction.user_id == user.id).first()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    db.delete(transaction)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
