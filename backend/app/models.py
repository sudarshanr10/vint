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

    transactions = relationship("Transaction", back_populates="user")

class Transaction(Base):
    __tablename__ = "transactions"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable = False)
    category = Column(String, nullable = False)
    description = Column(String, nullable = True)
    timestamp = Column(DateTime, default=datetime.now, nullable=False)

    user = relationship("User", back_populates= "transactions")

