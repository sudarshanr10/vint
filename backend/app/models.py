from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
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

