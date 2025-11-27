# database.py
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from urllib.parse import quote_plus

# Database configuration
# Update with your actual PostgreSQL password
DATABASE_URL = "postgresql://postgres:B3#uLA72@localhost:5432/BD-Railway"

# If you have different credentials, update them here:
# DATABASE_URL = "postgresql://your_username:your_password@localhost:5432/BD-Railway"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
