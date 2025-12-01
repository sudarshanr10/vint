from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .database import engine, Base
from .routes import users, transactions, auth, plaid
load_dotenv()

##Base.metadata.create_all(bind=engine)

app = FastAPI(title = "Vint: Budget Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(users.router)
app.include_router(transactions.router)
app.include_router(auth.router)
app.include_router(plaid.router)

@app.get("/")
def health():
    return {"status": "ok"}