from fastapi import APIRouter, Depends, HTTPException, Response, status, Query
from sqlalchemy.orm import Session
from app import models, schemas
from app.routes.deps import get_db, get_current_user
from datetime import datetime, timedelta
from sqlalchemy import func, not_


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
def get_summary(days: int | None = Query(None, ge=1), db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    if days is not None:
        start = datetime.today() - timedelta(days=days)
    else:
        start = datetime.today().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Manual
    manual_results = (
        db.query(
            models.Transaction.category,
            func.sum(models.Transaction.amount).label("Total"))
        .filter(
            models.Transaction.user_id == user.id,
            models.Transaction.timestamp >= start,
            models.Transaction.amount > 0 
        )
        .group_by(models.Transaction.category)
        .all()
    )
    deleted_ids = db.query(models.DeletedPlaidTransaction.transaction_id).filter(
        models.DeletedPlaidTransaction.user_id == user.id
    ).all()
    deleted_ids = [row[0] for row in deleted_ids] or ["__none__"]


    plaid_results = (
        db.query(
            models.PlaidTransaction.category,
            func.sum(models.PlaidTransaction.amount).label("Total"))
        .filter(
            models.PlaidTransaction.user_id == user.id,
            models.PlaidTransaction.date >= start,
            models.PlaidTransaction.amount > 0, 
            not_(models.PlaidTransaction.transaction_id.in_(deleted_ids))
        )
        .group_by(models.PlaidTransaction.category)
        .all()
    )
    print("Manual:", manual_results)
    print("Plaid:", plaid_results)
    print("Deleted IDs:", deleted_ids)


    # Merge
    summary = {}
    for cat, total in manual_results:
        summary[cat] = float(total)
    for cat, total in plaid_results:
        summary[cat] = summary.get(cat, 0) + float(total)

    return summary


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
