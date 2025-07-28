from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index = True)
    email = Column(String, unique=True, index = True, nullable=False)
    phone = Column(String, unique = True, nullable = True)
    monthly_budget = Column(Float, default = 0)
    plaid_access_token = Column(String, nullable=True)

    transactions = relationship("Transaction", back_populates="user")
    plaid_transactions = relationship("PlaidTransaction", back_populates="user")
    deleted_plaid_transactions = relationship("DeletedPlaidTransaction", back_populates="user")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable = False)
    category = Column(String, nullable = False)
    description = Column(String, nullable = True)
    timestamp = Column(DateTime, default=datetime.now, nullable=False)

    user = relationship("User", back_populates= "transactions")

class PlaidTransaction(Base):
    __tablename__ = "plaid_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transaction_id = Column(String, unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, nullable=True)
    date = Column(DateTime, default=datetime.now, nullable=False)

    user = relationship("User", back_populates="plaid_transactions")

class DeletedPlaidTransaction(Base):
    __tablename__ = "deleted_plaid_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transaction_id = Column(String, nullable=False)
    deleted_at = Column(DateTime, default=datetime.now, nullable=False)

    # Create a unique constraint to prevent duplicate deletions
    __table_args__ = (
        UniqueConstraint('user_id', 'transaction_id', name='unique_user_transaction_deletion'),
    )

    user = relationship("User", back_populates="deleted_plaid_transactions")

