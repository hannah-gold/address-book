from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, Session


# -------------------------
# Database
# -------------------------

# Connect to SQLite (Use a SQLite database stored in the file address_book.db)
DATABASE_URL = "sqlite:///./address_book.db"

# SQLAlchemy's connection interface to the database
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Working convo between Python code and the database
# ie. db.add(contact), db.commit(), db.query(Contact)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


# -------------------------
# Database model
# -------------------------

# Tells SQLAlchemy what the SQLite table should look like
# SQLAlchemy model defines how the data is stored in the database
class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    street = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    zip = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)


# -------------------------
# Pydantic models
# -------------------------

# Pydantic model defines what data the API accepts or returns
class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=1, max_length=30)
    street: str = Field(min_length=1, max_length=200)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    zip: str = Field(min_length=1, max_length=20)


class ContactResponse(ContactCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# -------------------------
# Database dependency
# -------------------------

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# -------------------------
# FastAPI
# -------------------------

app = FastAPI(title="Address Book API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------
# GET all contacts
# -------------------------

@app.get("/contacts", response_model=list[ContactResponse])
def get_contacts(
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Contact)

    if search:
        search_term = f"%{search}%"

        query = query.filter(
            Contact.name.ilike(search_term)
            | Contact.email.ilike(search_term)
            | Contact.phone.ilike(search_term)
            | Contact.city.ilike(search_term)
        )

    return query.order_by(Contact.name).all()


# -------------------------
# GET one contact
# -------------------------

@app.get("/contacts/{contact_id}", response_model=ContactResponse)
def get_contact(
    contact_id: int,
    db: Session = Depends(get_db)
):
    contact = db.query(Contact).filter(
        Contact.id == contact_id
    ).first()

    if not contact:
        raise HTTPException(
            status_code=404,
            detail="Contact not found"
        )

    return contact


# -------------------------
# CREATE contact
# -------------------------

@app.post(
    "/contacts",
    response_model=ContactResponse,
    status_code=201
)
def create_contact(
    contact: ContactCreate,
    db: Session = Depends(get_db)
):
    new_contact = Contact(**contact.model_dump())

    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)

    return new_contact


# -------------------------
# UPDATE contact
# -------------------------

@app.put(
    "/contacts/{contact_id}",
    response_model=ContactResponse
)
def update_contact(
    contact_id: int,
    updated_contact: ContactCreate,
    db: Session = Depends(get_db)
):
    contact = db.query(Contact).filter(
        Contact.id == contact_id
    ).first()

    if not contact:
        raise HTTPException(
            status_code=404,
            detail="Contact not found"
        )

    for key, value in updated_contact.model_dump().items():
        setattr(contact, key, value)

    db.commit()
    db.refresh(contact)

    return contact


# -------------------------
# DELETE contact
# -------------------------

@app.delete("/contacts/{contact_id}")
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db)
):
    contact = db.query(Contact).filter(
        Contact.id == contact_id
    ).first()

    if not contact:
        raise HTTPException(
            status_code=404,
            detail="Contact not found"
        )

    db.delete(contact)
    db.commit()

    return {"message": "Contact deleted"}