from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TransactionCreate(BaseModel):
    amount: float
    category: str
    description: Optional[str] = None

class Transaction(TransactionCreate):
    id: int
    timestamp: datetime

    class Config: 
        orm_mode = True

class UserBase(BaseModel):
    email: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    monthly_budget: Optional[float] = 0.0

class User(UserBase):
    id: int
    monthly_budget: float

    class Config: 
        orm_mode = True

