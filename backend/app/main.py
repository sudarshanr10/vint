from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routes import users, transactions

Base.metadata.create_all(bind=engine)

app = FastAPI(title = "Vint: Budget Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(users.router)
app.include_router(transactions.router)

@app.get("/")
def health():
    return {"status": "ok"}