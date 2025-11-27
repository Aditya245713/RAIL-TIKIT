# schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str

class UserUpdate(BaseModel):
    name: str
    email: EmailStr
    phone: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: int
    name: str
    email: str
    phone: str
    role: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Station schemas
class StationResponse(BaseModel):
    station_id: int
    station_name: str
    location: str

    class Config:
        from_attributes = True

# Train search schemas
class TrainSearchRequest(BaseModel):
    from_station: str
    to_station: str
    journey_date: date
    travel_class: Optional[str] = None

class CoachInfo(BaseModel):
    coach_id: int
    coach_type: str
    available_seats: int
    fare: float

    class Config:
        from_attributes = True

class RouteStation(BaseModel):
    station: str
    arrival: str
    departure: str
    halt: str
    duration: str

class TrainSearchResponse(BaseModel):
    train_id: int
    train_name: str
    train_type: str
    departure_time: str
    arrival_time: str
    duration: str
    total_coaches: int
    available_coaches: List[CoachInfo]
    route_stations: List[RouteStation]

    class Config:
        from_attributes = True
