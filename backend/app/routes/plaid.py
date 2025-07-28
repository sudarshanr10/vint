from fastapi import APIRouter, Depends, HTTPException, status
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.country_code import CountryCode
from plaid.model.products import Products
from plaid.exceptions import ApiException
from app.utils.plaid_client import client
from app.routes.deps import get_current_user
from sqlalchemy.orm import Session
from app.routes.deps import get_db
from app.models import PlaidTransaction, User, DeletedPlaidTransaction
from datetime import date, timedelta
import json


router = APIRouter(prefix="/plaid", tags=["plaid"])
category_map = {
    "INCOME": "Income",
    "TRANSFER_IN": "Income",
    "TRANSFER_OUT": "Transfers",
    "BANK_FEES": "Fees",
    "ENTERTAINMENT": "Entertainment",
    "FOOD_AND_DRINK": "Food",
    "TRAVEL": "Transportation",
    "RENT_AND_UTILITIES": "Bills",
    "LOAN_PAYMENTS": "Debt Payments",
    "GENERAL_MERCHANDISE": "Shopping",
    "HOME_IMPROVEMENT": "Home",
    "MEDICAL": "Health",
    "PERSONAL_CARE": "Shopping",
    "GENERAL_SERVICES": "Bills",
    "GOVERNMENT_AND_NON_PROFIT": "Government",
    "TRANSPORTATION": "Transportation", 
    "OTHER": "Other"
}

@router.get("/transactions")
def get_plaid_transactions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    access_token = user.plaid_access_token
    if not access_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plaid access token not found")

    end_date = date.today()
    start_date = end_date - timedelta(days=30)

    try:
        request = TransactionsGetRequest(
            access_token=access_token,
            start_date=start_date,
            end_date=end_date
        )
        plaid_response = client.transactions_get(request)
        transactions = plaid_response['transactions']    
        saved_ids = {
            row.transaction_id
            for row in db.query(PlaidTransaction.transaction_id)
            .filter(PlaidTransaction.user_id == user.id)
            .all()
        }
        
        deleted_ids = {
            row.transaction_id
            for row in db.query(DeletedPlaidTransaction.transaction_id)
            .filter(DeletedPlaidTransaction.user_id == user.id)
            .all()
        }

        new_transactions = []
        for t in transactions:
            if t["transaction_id"] in saved_ids or t["transaction_id"] in deleted_ids:
                continue
                
            pf_category = t.get("personal_finance_category")
            primary_category = pf_category.get("primary") if pf_category else None
            mapped_category = category_map.get(primary_category, "Uncategorized")

            new_txn = PlaidTransaction(
                transaction_id=t["transaction_id"],
                user_id=user.id,
                category=mapped_category,
                description=t.get("name"),
                amount=t.get("amount"),
                date=t.get("date")
            )
            db.add(new_txn)
            new_transactions.append(new_txn)

        db.commit()
        
        saved = db.query(PlaidTransaction).filter(
            PlaidTransaction.user_id == user.id
        ).all()
        
        non_deleted_transactions = [
            t for t in saved 
            if t.transaction_id not in deleted_ids
        ]
        
        return {"transactions": [
            {
                "transaction_id": t.transaction_id, 
                "name": t.description, 
                "amount": t.amount, 
                "date": t.date.isoformat(), 
                "category": t.category,
                "is_deleted": False
            } for t in non_deleted_transactions
        ]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plaid fetch failed: {str(e)}")


@router.post("/link_token")
def generate_link_token(user=Depends(get_current_user)):
    try:
        request = LinkTokenCreateRequest(
            user=LinkTokenCreateRequestUser(client_user_id=str(user.id)),
            client_name="Vint Budget Tracker",
            products=[Products("transactions")],
            country_codes=[CountryCode("US")],
            language="en"
        )
        response = client.link_token_create(request)
        return response.to_dict()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Plaid link token creation failed")
        


@router.post("/set_access_token")
def exchange_public_token(payload: dict, db: Session = Depends(get_db), user=Depends(get_current_user)):
    public_token = payload.get("public_token")
    if not public_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing public_token")

    try:
        request = ItemPublicTokenExchangeRequest(public_token=public_token)
        response = client.item_public_token_exchange(request)
        access_token = response['access_token']

        print("✅ Got access_token from Plaid:", access_token)
        print("✅ Saving access_token to user_id:", user.id)

        user.plaid_access_token = access_token
        db.add(user)
        db.commit()
        db.refresh(user)

        return {"message": "Plaid access token saved successfully"}
    except Exception as e:
        print("Plaid token exchange error:", str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Plaid token exchange failed")
    

@router.delete("/delete_transaction/{transaction_id}")
def delete_plaid_transaction(transaction_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    transaction = db.query(PlaidTransaction).filter_by(
        user_id=user.id, 
        transaction_id=transaction_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Plaid transaction not found")
    
    existing_deletion = db.query(DeletedPlaidTransaction).filter_by(
        user_id=user.id,
        transaction_id=transaction_id
    ).first()
    
    if existing_deletion:
        raise HTTPException(status_code=400, detail="Transaction already deleted")
    
    deleted_txn = DeletedPlaidTransaction(
        user_id=user.id,
        transaction_id=transaction_id
    )
    db.add(deleted_txn)
    db.commit()

    saved = db.query(PlaidTransaction).filter(
        PlaidTransaction.user_id == user.id
    ).all()
    
    deleted_ids = {
        row.transaction_id
        for row in db.query(DeletedPlaidTransaction.transaction_id)
        .filter(DeletedPlaidTransaction.user_id == user.id)
        .all()
    }
    
    return {"transactions": [
        {
            "transaction_id": t.transaction_id, 
            "name": t.description, 
            "amount": t.amount, 
            "date": t.date.isoformat(), 
            "category": t.category,
            "is_deleted": t.transaction_id in deleted_ids
        } for t in saved
    ]}

@router.get("/all_transactions")
def get_all_plaid_transactions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    access_token = user.plaid_access_token
    if not access_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plaid access token not found")

    end_date = date.today()
    start_date = end_date - timedelta(days=30)

    try:
        request = TransactionsGetRequest(
            access_token=access_token,
            start_date=start_date,
            end_date=end_date
        )
        plaid_response = client.transactions_get(request)
        transactions = plaid_response['transactions']
    
        saved_ids = {
            row.transaction_id
            for row in db.query(PlaidTransaction.transaction_id)
            .filter(PlaidTransaction.user_id == user.id)
            .all()
        }
        
        deleted_ids = {
            row.transaction_id
            for row in db.query(DeletedPlaidTransaction.transaction_id)
            .filter(DeletedPlaidTransaction.user_id == user.id)
            .all()
        }

        new_transactions = []
        for t in transactions:
            if t["transaction_id"] in saved_ids:
                continue
                
            pf_category = t.get("personal_finance_category")
            primary_category = pf_category.get("primary") if pf_category else None
            mapped_category = category_map.get(primary_category, "Uncategorized")

            new_txn = PlaidTransaction(
                transaction_id=t["transaction_id"],
                user_id=user.id,
                category=mapped_category,
                description=t.get("name"),
                amount=t.get("amount"),
                date=t.get("date")
            )
            db.add(new_txn)
            new_transactions.append(new_txn)

        db.commit()
        
        saved = db.query(PlaidTransaction).filter(
            PlaidTransaction.user_id == user.id
        ).all()
        
        return {"transactions": [
            {
                "transaction_id": t.transaction_id, 
                "name": t.description, 
                "amount": t.amount, 
                "date": t.date.isoformat(), 
                "category": t.category,
                "is_deleted": t.transaction_id in deleted_ids
            } for t in saved
        ]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plaid fetch failed: {str(e)}")

@router.post("/restore_transaction/{transaction_id}")
def restore_plaid_transaction(transaction_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    transaction = db.query(PlaidTransaction).filter_by(
        user_id=user.id, 
        transaction_id=transaction_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Plaid transaction not found")
    
    deleted_record = db.query(DeletedPlaidTransaction).filter_by(
        user_id=user.id,
        transaction_id=transaction_id
    ).first()
    
    if not deleted_record:
        raise HTTPException(status_code=400, detail="Transaction is not deleted")
    
    db.delete(deleted_record)
    db.commit()
    saved = db.query(PlaidTransaction).filter(
        PlaidTransaction.user_id == user.id
    ).all()
    
    deleted_ids = {
        row.transaction_id
        for row in db.query(DeletedPlaidTransaction.transaction_id)
        .filter(DeletedPlaidTransaction.user_id == user.id)
        .all()
    }
    
    return {"transactions": [
        {
            "transaction_id": t.transaction_id, 
            "name": t.description, 
            "amount": t.amount, 
            "date": t.date.isoformat(), 
            "category": t.category,
            "is_deleted": t.transaction_id in deleted_ids
        } for t in saved
    ]}

@router.post("/restore_all_transactions")
def restore_all_plaid_transactions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    deleted_count = db.query(DeletedPlaidTransaction).filter_by(
        user_id=user.id
    ).delete()
    
    db.commit()

    saved = db.query(PlaidTransaction).filter(
        PlaidTransaction.user_id == user.id
    ).all()
    
    return {
        "message": f"Restored {deleted_count} transactions",
        "transactions": [
            {
                "transaction_id": t.transaction_id, 
                "name": t.description, 
                "amount": t.amount, 
                "date": t.date.isoformat(), 
                "category": t.category,
                "is_deleted": False
            } for t in saved
        ]
    }