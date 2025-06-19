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
from app.models import PlaidTransaction, User
from datetime import date, timedelta
import json


router = APIRouter(prefix="/plaid", tags=["plaid"])

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
        ##time.sleep(5)
        plaid_response = client.transactions_get(request)
        transactions = plaid_response['transactions']
    
        saved_ids = {
            row.transaction_id
            for row in db.query(PlaidTransaction.transaction_id)
            .filter(PlaidTransaction.user_id == user.id)
            .all()
        }

        new_transactions = []
        for t in transactions:
            if t["transaction_id"] in saved_ids:
                continue
            new_txn = PlaidTransaction(
                transaction_id=t["transaction_id"],
                user_id=user.id,
                category=" > ".join(t.get("category", [])) if t.get("category") else "Uncategorized",
                description=t.get("name"),
                amount=t.get("amount"),
                date=t.get("date")
            )
            db.add(new_txn)
            new_transactions.append(new_txn)

        db.commit()
        saved = db.query(PlaidTransaction).filter(PlaidTransaction.user_id == user.id).all()
        return {"transactions": [{"transaction_id": t.transaction_id, "name": t.description, "amount": t.amount, "date": t.date.isoformat(), "category": t.category,} for t in saved]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plaid fetch failed: {str(e)}"
        )


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
    transaction = db.query(PlaidTransaction).filter_by(user_id=user.id, transaction_id=transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Plaid transaction not found")
    
    db.delete(transaction)
    db.commit()

    all_transactions = db.query(PlaidTransaction).filter_by(user_id=user.id).all()
    return {"transactions": all_transactions}