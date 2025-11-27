from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List
import bcrypt
import random
import string

from database import engine, get_db, Base
from models import User, Train, Station, Coach, Route, Schedule, Seat, RouteStation, Booking, BookingSeat, Payment
from schemas import (
    UserCreate, UserUpdate, UserLogin, UserResponse, Token, TokenData,
    StationResponse, TrainSearchRequest, TrainSearchResponse, CoachInfo
)

# Helper functions for time parsing
def parse_time_to_minutes(time_str):
    """Convert time string (HH:MM format) to minutes"""
    if not time_str or time_str == "N/A":
        return None
    try:
        hours, minutes = map(int, time_str.split(':'))
        return hours * 60 + minutes
    except (ValueError, AttributeError):
        return None

def minutes_to_time_string(minutes, base_hour=8):
    """Convert minutes to time string format"""
    if minutes is None:
        return "N/A"
    try:
        # If it's already a string (time format), just return it
        if isinstance(minutes, str):
            return minutes
        total_minutes = base_hour * 60 + int(minutes)
        hours = total_minutes // 60
        mins = total_minutes % 60
        return f"{hours:02d}:{mins:02d}"
    except (ValueError, TypeError):
        return "N/A"

# Don't create tables automatically since they already exist
# Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
SECRET_KEY = "your-secret-key-here"  # Change this in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

@app.get("/")
def root():
    return {"message": "Rail Tikit Backend is running 🚀"}

@app.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        name=user.name,
        email=user.email,
        phone=user.phone,
        password=hashed_password  # Changed from hashed_password to password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, email=user.email)
    if not db_user or not verify_password(user.password, db_user.password):  # Changed from hashed_password to password
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.put("/update-profile", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Update user profile information"""
    # Check if email is being changed to one that already exists (for another user)
    if user_update.email != current_user.email:
        existing_user = get_user_by_email(db, email=user_update.email)
        if existing_user and existing_user.user_id != current_user.user_id:
            raise HTTPException(
                status_code=400,
                detail="Email already registered to another account"
            )
    
    # Update user fields
    current_user.name = user_update.name
    current_user.email = user_update.email
    current_user.phone = user_update.phone
    
    # If password is provided, update it (though for profile update, we might not want to allow password change)
    # For now, we'll skip password updates in profile update
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@app.delete("/delete-account")
async def delete_account(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Delete user account and all associated data"""
    try:
        # Delete all associated bookings and booking seats first (due to foreign key constraints)
        bookings = db.query(Booking).filter(Booking.user_id == current_user.user_id).all()
        for booking in bookings:
            # Delete booking seats for this booking
            db.query(BookingSeat).filter(BookingSeat.booking_id == booking.booking_id).delete()
            # Delete payments for this booking
            db.query(Payment).filter(Payment.booking_id == booking.booking_id).delete()
        
        # Delete all bookings
        db.query(Booking).filter(Booking.user_id == current_user.user_id).delete()
        
        # Finally, delete the user
        db.delete(current_user)
        db.commit()
        
        return {"message": "Account deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete account: {str(e)}"
        )

@app.get("/protected")
async def protected_route(current_user: User = Depends(get_current_user)):
    return {"message": f"Hello {current_user.name}, this is a protected route!"}

# Station endpoints
@app.get("/stations", response_model=List[StationResponse])
def get_stations(db: Session = Depends(get_db)):
    """Get all available stations"""
    stations = db.query(Station).all()
    return stations

@app.post("/search-trains")
def search_trains(search_request: TrainSearchRequest, db: Session = Depends(get_db)):
    """Search for available trains between stations"""
    # Get station IDs
    from_station = db.query(Station).filter(Station.station_name == search_request.from_station).first()
    to_station = db.query(Station).filter(Station.station_name == search_request.to_station).first()
    
    if not from_station or not to_station:
        raise HTTPException(status_code=404, detail="Station not found")
    
    # Get all trains (in real implementation, you would filter by route)
    trains = db.query(Train).all()
    
    result = []
    for train in trains:
        # Get coaches for this train
        coaches = db.query(Coach).filter(Coach.train_id == train.train_id).all()
        
        # Convert coaches to the required format
        available_coaches = []
        for coach in coaches:
            # Filter by travel class if specified
            if search_request.travel_class and coach.coach_type != search_request.travel_class:
                continue
            
            # Calculate fare based on coach type (mock pricing)
            fare_map = {
                "AC First Class": 1500,
                "AC Business": 1200,
                "First Class": 800,
                "Second Class": 500,
                "Sleeper Class": 600
            }
            
            coach_info = {
                "coach_id": coach.coach_id,
                "coach_type": coach.coach_type,
                "available_seats": coach.total_seats - 10,  # Mock: assume 10 seats booked
                "fare": fare_map.get(coach.coach_type, 500)
            }
            available_coaches.append(coach_info)
        
        # Skip train if no matching coaches
        if search_request.travel_class and not available_coaches:
            continue
        
        # Mock route stations (in real implementation, query from routes table)
        route_stations = [
            {"station": search_request.from_station, "arrival": "08:00", "departure": "08:00", "halt": "0m", "duration": "0h 0m"},
            {"station": "Comilla", "arrival": "10:15", "departure": "10:20", "halt": "5m", "duration": "2h 15m"},
            {"station": search_request.to_station, "arrival": "14:30", "departure": "14:30", "halt": "0m", "duration": "6h 30m"}
        ]
        
        train_data = {
            "train_id": train.train_id,
            "train_name": train.train_name,
            "train_type": train.train_type,
            "departure_time": "08:00",  # Mock times
            "arrival_time": "14:30",
            "duration": "6h 30m",
            "total_coaches": train.total_coaches,
            "available_coaches": available_coaches,
            "route_stations": route_stations
        }
        result.append(train_data)
    
    return result

@app.get("/train-info")
def get_train_info(train_name: str, db: Session = Depends(get_db)):
    """Get detailed information about a specific train"""
    print(f"=== TRAIN INFO REQUEST FOR: {train_name} ===")
    
    # Get train by name
    train = db.query(Train).filter(Train.train_name == train_name).first()
    
    if not train:
        print(f"Train '{train_name}' not found in database")
        raise HTTPException(status_code=404, detail="Train not found")
    
    print(f"Found train: {train.train_name} (ID: {train.train_id})")
    
    # Get distance from routes table using train_id
    route = db.query(Route).filter(Route.train_id == train.train_id).first()
    
    if route and route.distance_km:
        # Convert decimal to float and format as string
        total_distance = f"{float(route.distance_km)} km"
        print(f"Found route distance: {total_distance}")
    else:
        # Fallback distance if no route found
        total_distance = "264 km"
        print(f"No route distance found, using fallback: {total_distance}")
    
    # Get route stations for this train ordered by sequence_number
    print("Querying route stations...")
    route_stations_query = db.query(RouteStation, Station).join(
        Station, RouteStation.station_id == Station.station_id
    ).filter(RouteStation.train_id == train.train_id).order_by(RouteStation.sequence_number.asc().nulls_last()).all()
    
    print(f"Raw query result for train {train.train_id}:")
    for rs, st in route_stations_query:
        print(f"  Station: {st.station_name}, Sequence: {rs.sequence_number}, Arrival: {rs.arrival_offset_minutes}, Departure: {rs.departure_offset_minutes}")
    
    # If no results or sequence_number is NULL, try different approach
    if not route_stations_query or all(rs.sequence_number is None for rs, st in route_stations_query):
        print("Trying fallback ordering by station_id...")
        route_stations_query = db.query(RouteStation, Station).join(
            Station, RouteStation.station_id == Station.station_id
        ).filter(RouteStation.train_id == train.train_id).order_by(RouteStation.station_id.asc()).all()
    
    # If no route stations found in database, return mock data based on train name
    if not route_stations_query:
        print(f"No route stations found for train {train.train_id}")
        # Create different mock routes for different train names
        mock_routes_by_name = {
            "Padma Express": [
                {"station": "Dhaka", "arrival": "08:00", "departure": "08:00", "halt": "0m"},
                {"station": "Comilla", "arrival": "10:15", "departure": "10:20", "halt": "5m"},
                {"station": "Chittagong", "arrival": "14:30", "departure": "14:30", "halt": "0m"}
            ],
            "Parabat Express": [
                {"station": "Dhaka", "arrival": "09:00", "departure": "09:00", "halt": "0m"},
                {"station": "Kishoreganj", "arrival": "11:20", "departure": "11:25", "halt": "5m"},
                {"station": "Sylhet", "arrival": "15:30", "departure": "15:30", "halt": "0m"}
            ],
            "Sirajganj Express": [
                {"station": "Dhaka", "arrival": "07:30", "departure": "07:30", "halt": "0m"},
                {"station": "Tangail", "arrival": "09:45", "departure": "09:50", "halt": "5m"},
                {"station": "Sirajganj", "arrival": "11:15", "departure": "11:15", "halt": "0m"}
            ],
            "Sonar Bangla Express": [
                {"station": "Dhaka", "arrival": "07:00", "departure": "07:00", "halt": "0m"},
                {"station": "Mymensingh", "arrival": "09:30", "departure": "09:35", "halt": "5m"},
                {"station": "Chittagong", "arrival": "13:45", "departure": "13:45", "halt": "0m"}
            ],
            "Sundarban Express": [
                {"station": "Dhaka", "arrival": "06:30", "departure": "06:30", "halt": "0m"},
                {"station": "Faridpur", "arrival": "09:15", "departure": "09:20", "halt": "5m"},
                {"station": "Khulna", "arrival": "12:45", "departure": "12:45", "halt": "0m"}
            ],
            "CoxsBazar Express": [
                {"station": "Dhaka", "arrival": "15:00", "departure": "15:00", "halt": "0m"},
                {"station": "Comilla", "arrival": "17:15", "departure": "17:20", "halt": "5m"},
                {"station": "Chittagong", "arrival": "21:30", "departure": "21:35", "halt": "5m"},
                {"station": "Coxsbazar", "arrival": "01:15", "departure": "01:15", "halt": "0m"}
            ]
        }
        
        route_stations = mock_routes_by_name.get(train_name, mock_routes_by_name["Padma Express"])
    else:
        print(f"Found {len(route_stations_query)} route stations for train {train.train_id}")
        
        # Sort the results manually by sequence_number to ensure proper ordering
        route_stations_query = sorted(route_stations_query, key=lambda x: x[0].sequence_number if x[0].sequence_number is not None else 999)
        
        print("Final ordered stations:")
        route_stations = []
        for i, (route_station, station) in enumerate(route_stations_query):
            print(f"  {i+1}. {station.station_name} (seq: {route_station.sequence_number})")
            # Calculate times based on offsets
            arrival_time = minutes_to_time_string(route_station.arrival_offset_minutes) if route_station.arrival_offset_minutes else "N/A"
            departure_time = minutes_to_time_string(route_station.departure_offset_minutes) if route_station.departure_offset_minutes else "N/A"
            
            route_stations.append({
                "station": station.station_name,
                "arrival": arrival_time,
                "departure": departure_time,
                "halt": f"{route_station.halt_minutes}m" if route_station.halt_minutes else "0m"
            })
    
    # Prepare response
    train_info = {
        "train_id": train.train_id,
        "train_name": train.train_name,
        "train_type": train.train_type,
        "total_coaches": train.total_coaches,
        "route_stations": route_stations,
        "operating_days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],  # Mock data
        "departure_time": route_stations[0]["departure"] if route_stations else "08:00",
        "arrival_time": route_stations[-1]["arrival"] if route_stations else "14:30",
        "total_distance": total_distance,
        "journey_time": "6h 30m"  # Mock calculation
    }
    
    print(f"Returning response with distance: {train_info['total_distance']}")
    print(f"Route stations count: {len(route_stations)}")
    print("=== END TRAIN INFO REQUEST ===")
    
    return train_info

@app.post("/search-trains-by-route")
def search_trains_by_route(request: TrainSearchRequest, current_user: UserResponse = Depends(get_current_user), db: Session = Depends(get_db)):
    """Search trains that have routes containing both from_station and to_station"""
    
    # Get station IDs for from_station and to_station
    from_station_obj = db.query(Station).filter(Station.station_name == request.from_station).first()
    to_station_obj = db.query(Station).filter(Station.station_name == request.to_station).first()
    
    if not from_station_obj:
        raise HTTPException(status_code=404, detail=f"Station '{request.from_station}' not found")
    if not to_station_obj:
        raise HTTPException(status_code=404, detail=f"Station '{request.to_station}' not found")
    
    # Get train_ids that have routes containing both stations
    # First, get all train_ids that have from_station
    from_trains = db.query(RouteStation.train_id).filter(
        RouteStation.station_id == from_station_obj.station_id
    ).subquery()
    
    # Then, get train_ids that also have to_station
    to_trains = db.query(RouteStation.train_id).filter(
        RouteStation.station_id == to_station_obj.station_id
    ).subquery()
    
    # Find common train_ids
    common_train_ids = db.query(from_trains.c.train_id).intersect(
        db.query(to_trains.c.train_id)
    ).all()
    
    if not common_train_ids:
        return []  # No trains available
    
    # Extract train_ids from the result
    train_ids = [train_id[0] for train_id in common_train_ids]
    
    # Get train details for these train_ids
    trains = db.query(Train).filter(Train.train_id.in_(train_ids)).all()
    
    # Format response
    result = []
    for train in trains:
        result.append({
            "train_id": train.train_id,
            "train_name": train.train_name,
            "train_type": train.train_type,
            "total_coaches": train.total_coaches
        })
    
    return result

@app.post("/refresh-coach-availability")
def refresh_coach_availability(request: dict, current_user: UserResponse = Depends(get_current_user), db: Session = Depends(get_db)):
    """Refresh coach availability after booking to get updated seat counts"""
    train_id = request.get('train_id')
    
    if not train_id:
        raise HTTPException(status_code=400, detail="train_id is required")
    
    # Get train
    train = db.query(Train).filter(Train.train_id == train_id).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    
    # Get coaches for this train
    coaches = db.query(Coach).filter(Coach.train_id == train_id).all()
    
    result = []
    for coach in coaches:
        # Count total seats for this coach
        total_seats = db.query(Seat).filter(Seat.coach_id == coach.coach_id).count()
        
        # Count booked seats (seats that are in booking_seats table with confirmed bookings)
        booked_seats_count = db.query(BookingSeat).join(
            Booking, BookingSeat.booking_id == Booking.booking_id
        ).join(
            Seat, BookingSeat.seat_id == Seat.seat_id
        ).filter(
            Seat.coach_id == coach.coach_id,
            Booking.status == 'confirmed'
        ).count()
        
        available_seats = total_seats - booked_seats_count
        
        # Price mapping based on coach type
        fare_map = {
            "AC_Cabin": 2500,
            "AC_Chair": 1200,
            "Snigdha": 800,
            "Shovon": 400,
            "AC First Class": 1500,
            "AC Business": 1200,
            "First Class": 800,
            "Second Class": 500,
            "Sleeper Class": 600
        }
        
        coach_data = {
            "coach_type": coach.coach_type,
            "total_seats": total_seats,
            "booked_seats": booked_seats_count,
            "available_seats": available_seats,
            "price": fare_map.get(coach.coach_type, 500)
        }
        result.append(coach_data)
    
    return result

@app.get("/coach-availability/{train_id}")
def get_coach_availability(train_id: int, current_user: UserResponse = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get coach availability information for a specific train"""
    # Get train
    train = db.query(Train).filter(Train.train_id == train_id).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    
    # Get coaches for this train
    coaches = db.query(Coach).filter(Coach.train_id == train_id).all()
    
    result = []
    for coach in coaches:
        # Count total seats for this coach
        total_seats = db.query(Seat).filter(Seat.coach_id == coach.coach_id).count()
        
        # Count booked seats (seats that are in booking_seats table with confirmed bookings)
        booked_seats_count = db.query(BookingSeat).join(
            Booking, BookingSeat.booking_id == Booking.booking_id
        ).join(
            Seat, BookingSeat.seat_id == Seat.seat_id
        ).filter(
            Seat.coach_id == coach.coach_id,
            Booking.status == 'confirmed'
        ).count()
        
        available_seats = total_seats - booked_seats_count
        
        # Price mapping based on coach type
        fare_map = {
            "AC_Cabin": 2500,
            "AC_Chair": 1200,
            "Snigdha": 800,
            "Shovon": 400,
            "AC First Class": 1500,
            "AC Business": 1200,
            "First Class": 800,
            "Second Class": 500,
            "Sleeper Class": 600
        }
        
        coach_data = {
            "coach_type": coach.coach_type,
            "total_seats": total_seats,
            "booked_seats": booked_seats_count,
            "available_seats": available_seats,
            "price": fare_map.get(coach.coach_type, 500)
        }
        result.append(coach_data)
    
    return result

@app.post("/create-booking")
def create_booking(booking_data: dict, current_user: UserResponse = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new booking entry and allocate seats"""
    try:
        # Find coaches of the requested type for this train
        coaches = db.query(Coach).filter(
            Coach.train_id == booking_data['train_id'],
            Coach.coach_type == booking_data['coach_type']
        ).all()
        
        if not coaches:
            raise HTTPException(status_code=404, detail="No coaches of this type found for the train")
        
        # Find available seats
        available_seats = []
        for coach in coaches:
            # Get all seats for this coach
            coach_seats = db.query(Seat).filter(Seat.coach_id == coach.coach_id).all()
            
            # Get already booked seats for this coach
            booked_seat_ids = db.query(BookingSeat.seat_id).join(
                Booking, BookingSeat.booking_id == Booking.booking_id
            ).join(
                Seat, BookingSeat.seat_id == Seat.seat_id
            ).filter(
                Seat.coach_id == coach.coach_id,
                Booking.status == 'confirmed'
            ).all()
            booked_seat_ids = [seat_id[0] for seat_id in booked_seat_ids]
            
            # Find available seats in this coach
            for seat in coach_seats:
                if seat.seat_id not in booked_seat_ids:
                    available_seats.append(seat)
                    if len(available_seats) >= booking_data['ticket_count']:
                        break
            
            if len(available_seats) >= booking_data['ticket_count']:
                break
        
        if len(available_seats) < booking_data['ticket_count']:
            raise HTTPException(
                status_code=400, 
                detail=f"Only {len(available_seats)} seats available, but {booking_data['ticket_count']} requested"
            )
        
        # Create a new booking
        new_booking = Booking(
            user_id=current_user.user_id,
            schedule_id=1,  # Mock schedule ID - in real implementation, find actual schedule
            booking_date=datetime.now(),
            status='confirmed'
        )
        
        db.add(new_booking)
        db.commit()
        db.refresh(new_booking)
        
        # Create booking seats entries for the allocated seats
        fare_per_ticket = booking_data['total_amount'] / booking_data['ticket_count']
        allocated_seats = available_seats[:booking_data['ticket_count']]
        
        for seat in allocated_seats:
            booking_seat = BookingSeat(
                booking_id=new_booking.booking_id,
                seat_id=seat.seat_id,
                fare=fare_per_ticket
            )
            db.add(booking_seat)
        
        db.commit()
        
        return {
            "booking_id": new_booking.booking_id,
            "status": "confirmed",
            "allocated_seats": [{"seat_id": seat.seat_id, "seat_number": seat.seat_number} for seat in allocated_seats],
            "message": "Booking created successfully"
        }
    
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create booking: {str(e)}")

@app.post("/create-payment")
def create_payment(payment_data: dict, current_user: UserResponse = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new payment entry"""
    try:
        new_payment = Payment(
            booking_id=payment_data['booking_id'],
            amount=payment_data['amount'],
            payment_date=datetime.now(),
            status='paid'
        )
        
        db.add(new_payment)
        db.commit()
        db.refresh(new_payment)
        
        return {
            "payment_id": new_payment.payment_id,
            "status": "paid",
            "message": "Payment processed successfully"
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process payment: {str(e)}")

@app.get("/my-tickets")
def get_my_tickets(current_user: UserResponse = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user's booking history with proper train and route data"""
    try:
        # Get user's bookings with related data
        bookings = db.query(Booking).filter(Booking.user_id == current_user.user_id).all()
        
        upcoming_trips = []
        past_trips = []
        current_date = datetime.now().date()
        
        for booking in bookings:
            try:
                # Get booking seats and seat details
                booking_seats = db.query(BookingSeat).join(
                    Seat, BookingSeat.seat_id == Seat.seat_id
                ).join(
                    Coach, Seat.coach_id == Coach.coach_id
                ).join(
                    Train, Coach.train_id == Train.train_id
                ).filter(BookingSeat.booking_id == booking.booking_id).all()
                
                if not booking_seats:
                    continue
                
                # Get train, coach, and route information from booking seats
                first_seat = booking_seats[0]
                coach = db.query(Coach).filter(Coach.coach_id == first_seat.seat.coach_id).first()
                train = db.query(Train).filter(Train.train_id == coach.train_id).first() if coach else None
                
                # Get route stations for this train to determine from/to stations
                route_stations = db.query(RouteStation, Station).join(
                    Station, RouteStation.station_id == Station.station_id
                ).filter(RouteStation.train_id == train.train_id).order_by(RouteStation.sequence_number).all()
                
                from_station = "Unknown"
                to_station = "Unknown"
                
                if route_stations:
                    # Get first and last stations from route
                    from_station = route_stations[0][1].station_name if route_stations else "Unknown"
                    to_station = route_stations[-1][1].station_name if route_stations else "Unknown"
                
                # Calculate journey date (booking_date + 7 days for demo)
                journey_date = (booking.booking_date + timedelta(days=7)).date()
                
                # Calculate total amount
                total_amount = sum(float(seat.fare) for seat in booking_seats)
                
                ticket_info = {
                    "booking_id": booking.booking_id,
                    "booking_date": booking.booking_date.strftime("%Y-%m-%d %H:%M:%S"),
                    "journey_date": journey_date.strftime("%Y-%m-%d"),
                    "status": booking.status,
                    "ticket_count": len(booking_seats),
                    "total_amount": total_amount,
                    "train_name": train.train_name if train else "Unknown Train",
                    "from_station": from_station,
                    "to_station": to_station,
                    "coach_type": coach.coach_type if coach else "Unknown Coach"
                }
                
                if journey_date >= current_date:
                    upcoming_trips.append(ticket_info)
                else:
                    past_trips.append(ticket_info)
                    
            except Exception as e:
                print(f"Error processing booking {booking.booking_id}: {str(e)}")
                continue
        
        return {
            "upcoming_trips": upcoming_trips,
            "past_trips": past_trips
        }
    
    except Exception as e:
        print(f"Error in get_my_tickets: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get tickets: {str(e)}")

@app.post("/verify-ticket")
def verify_ticket(request: dict, current_user: UserResponse = Depends(get_current_user), db: Session = Depends(get_db)):
    """Verify ticket by booking ID with real route data"""
    try:
        booking_id = request.get('booking_id', '')
        
        if not booking_id:
            raise HTTPException(status_code=400, detail="Booking ID is required")
        
        try:
            booking_id = int(booking_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid booking ID format")
        
        # Find booking by ID
        booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
        
        if not booking:
            raise HTTPException(status_code=404, detail="Invalid ticket - No ticket found with this booking ID")
        
        # Check if the ticket belongs to the current user
        if booking.user_id != current_user.user_id:
            raise HTTPException(status_code=404, detail="Invalid ticket - No ticket found with this booking ID")
        
        # Get user details
        user = db.query(User).filter(User.user_id == booking.user_id).first()
        
        # Get booking seats and seat details
        booking_seats = db.query(BookingSeat).join(
            Seat, BookingSeat.seat_id == Seat.seat_id
        ).join(
            Coach, Seat.coach_id == Coach.coach_id
        ).filter(BookingSeat.booking_id == booking.booking_id).all()
        
        if not booking_seats:
            raise HTTPException(status_code=404, detail="No seat information found for this booking")
        
        # Get coach and train information from the first seat
        first_seat = booking_seats[0]
        coach = db.query(Coach).filter(Coach.coach_id == first_seat.seat.coach_id).first()
        train = db.query(Train).filter(Train.train_id == coach.train_id).first() if coach else None
        
        # Get actual route stations for this train to determine from/to stations
        from_station = "Unknown"
        to_station = "Unknown"
        
        if train:
            # Get route stations ordered by sequence number
            route_stations = db.query(RouteStation, Station).join(
                Station, RouteStation.station_id == Station.station_id
            ).filter(RouteStation.train_id == train.train_id).order_by(
                RouteStation.sequence_number.asc().nulls_last()
            ).all()
            
            if route_stations:
                # Get first and last stations from the route
                from_station = route_stations[0][1].station_name
                to_station = route_stations[-1][1].station_name
            else:
                # Fallback: try to get from Routes table
                route = db.query(Route).filter(Route.train_id == train.train_id).first()
                if route:
                    source_station = db.query(Station).filter(Station.station_id == route.source_station_id).first()
                    dest_station = db.query(Station).filter(Station.station_id == route.destination_station_id).first()
                    from_station = source_station.station_name if source_station else "Unknown"
                    to_station = dest_station.station_name if dest_station else "Unknown"
        
        # Alternative method: Try to get from schedule if available
        if from_station == "Unknown" or to_station == "Unknown":
            if booking.schedule_id:
                schedule = db.query(Schedule).filter(Schedule.schedule_id == booking.schedule_id).first()
                if schedule and schedule.route_id:
                    route = db.query(Route).filter(Route.route_id == schedule.route_id).first()
                    if route:
                        source_station = db.query(Station).filter(Station.station_id == route.source_station_id).first()
                        dest_station = db.query(Station).filter(Station.station_id == route.destination_station_id).first()
                        from_station = source_station.station_name if source_station else from_station
                        to_station = dest_station.station_name if dest_station else to_station
        
        # Get payment information
        payments = db.query(Payment).filter(Payment.booking_id == booking.booking_id).all()
        total_paid = sum(float(payment.amount) for payment in payments) if payments else 0
        
        # Calculate journey date (mock - 7 days from booking date)
        journey_date = (booking.booking_date + timedelta(days=7)).date()
        
        # Prepare seat details
        seat_details = []
        for booking_seat in booking_seats:
            seat = booking_seat.seat
            seat_coach = db.query(Coach).filter(Coach.coach_id == seat.coach_id).first()
            seat_details.append({
                "seat_number": seat.seat_number,
                "coach_number": seat_coach.coach_number if seat_coach else "Unknown",
                "coach_type": seat_coach.coach_type if seat_coach else "Unknown",
                "fare": float(booking_seat.fare)
            })
        
        # If still unknown, provide fallback based on train name
        if from_station == "Unknown" or to_station == "Unknown":
            train_name = train.train_name if train else ""
            if "Padma" in train_name or "Chittagong" in train_name.lower():
                from_station = "Dhaka" if from_station == "Unknown" else from_station
                to_station = "Chittagong" if to_station == "Unknown" else to_station
            elif "Parabat" in train_name or "Sylhet" in train_name.lower():
                from_station = "Dhaka" if from_station == "Unknown" else from_station
                to_station = "Sylhet" if to_station == "Unknown" else to_station
            elif "Sundarban" in train_name or "Khulna" in train_name.lower():
                from_station = "Dhaka" if from_station == "Unknown" else from_station
                to_station = "Khulna" if to_station == "Unknown" else to_station
        
        ticket_details = {
            "booking_id": booking.booking_id,
            "booking_date": booking.booking_date.strftime("%Y-%m-%d %H:%M:%S"),
            "journey_date": journey_date.strftime("%Y-%m-%d"),
            "status": booking.status,
            "passenger_name": user.name if user else "Unknown",
            "passenger_email": user.email if user else "Unknown",
            "train_name": train.train_name if train else "Unknown Train",
            "train_id": train.train_id if train else 0,
            "from_station": from_station,  # Now shows real data
            "to_station": to_station,      # Now shows real data
            "seat_details": seat_details,
            "total_amount": total_paid if total_paid > 0 else sum(float(seat.fare) for seat in booking_seats),
            "payment_status": "paid" if payments else "unpaid"
        }
        
        return ticket_details
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in verify_ticket: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to verify ticket: {str(e)}")

@app.get("/train-routes/{train_id}")
def get_train_routes(train_id: int, current_user: UserResponse = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get detailed route information for a specific train"""
    
    # Check if train exists
    train = db.query(Train).filter(Train.train_id == train_id).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    
    # Get routes for this train (from Routes table)
    routes = db.query(Route).filter(Route.train_id == train_id).all()
    
    result = []
    for route in routes:
        # Get stations for this route from RouteStation table
        route_stations_query = db.query(RouteStation, Station).join(
            Station, RouteStation.station_id == Station.station_id
        ).filter(RouteStation.train_id == train_id).order_by(RouteStation.sequence_number).all()
        
        stations = []
        for i, (route_station, station) in enumerate(route_stations_query):
            # Calculate arrival and departure times based on offsets
            arrival_time = minutes_to_time_string(route_station.arrival_offset_minutes) if route_station.arrival_offset_minutes else None
            departure_time = minutes_to_time_string(route_station.departure_offset_minutes) if route_station.departure_offset_minutes else None
            
            stations.append({
                "station_name": station.station_name,
                "station_order": i + 1,  # Use index as order
                "arrival_time": arrival_time,
                "departure_time": departure_time, 
                "halt_time": route_station.halt_minutes or 0
            })
        
        result.append({
            "route_id": route.route_id,
            "distance": route.distance_km,
            "stations": stations
        })
    
    # If no routes found in database, return mock data with different routes per train
    if not result:
        # Create different mock routes for different trains
        mock_train_routes = {
            1: {  # Padma Express
                "stations": [
                    {"name": "Dhaka", "arrival": "08:00", "departure": "08:00", "halt": 0, "distance": 0},
                    {"name": "Comilla", "arrival": "10:15", "departure": "10:20", "halt": 5, "distance": 97},
                    {"name": "Chittagong", "arrival": "14:30", "departure": "14:30", "halt": 0, "distance": 264}
                ]
            },
            2: {  # Sonar Bangla Express
                "stations": [
                    {"name": "Dhaka", "arrival": "07:00", "departure": "07:00", "halt": 0, "distance": 0},
                    {"name": "Mymensingh", "arrival": "09:30", "departure": "09:35", "halt": 5, "distance": 120},
                    {"name": "Chittagong", "arrival": "13:45", "departure": "13:45", "halt": 0, "distance": 264}
                ]
            },
            3: {  # Parabat Express
                "stations": [
                    {"name": "Dhaka", "arrival": "09:00", "departure": "09:00", "halt": 0, "distance": 0},
                    {"name": "Kishoreganj", "arrival": "11:20", "departure": "11:25", "halt": 5, "distance": 145},
                    {"name": "Sylhet", "arrival": "15:30", "departure": "15:30", "halt": 0, "distance": 247}
                ]
            },
            4: {  # Sundarban Express
                "stations": [
                    {"name": "Dhaka", "arrival": "06:30", "departure": "06:30", "halt": 0, "distance": 0},
                    {"name": "Faridpur", "arrival": "09:15", "departure": "09:20", "halt": 5, "distance": 132},
                    {"name": "Khulna", "arrival": "12:45", "departure": "12:45", "halt": 0, "distance": 213}
                ]
            },
            5: {  # Mohanagar Express
                "stations": [
                    {"name": "Dhaka", "arrival": "18:00", "departure": "18:00", "halt": 0, "distance": 0},
                    {"name": "Narayanganj", "arrival": "18:45", "departure": "18:50", "halt": 5, "distance": 27},
                    {"name": "Chittagong", "arrival": "23:30", "departure": "23:30", "halt": 0, "distance": 264}
                ]
            },
            6: {  # Cox's Bazar Express
                "stations": [
                    {"name": "Dhaka", "arrival": "15:00", "departure": "15:00", "halt": 0, "distance": 0},
                    {"name": "Comilla", "arrival": "17:15", "departure": "17:20", "halt": 5, "distance": 97},
                    {"name": "Chittagong", "arrival": "21:30", "departure": "21:35", "halt": 5, "distance": 264},
                    {"name": "Cox's Bazar", "arrival": "01:15", "departure": "01:15", "halt": 0, "distance": 414}
                ]
            }
        }
        
        # Get the appropriate route for this train
        train_route = mock_train_routes.get(train_id, mock_train_routes[1])  # Default to Padma Express route
        
        stations = []
        for i, station_data in enumerate(train_route["stations"]):
            stations.append({
                "station_name": station_data["name"],
                "station_order": i + 1,
                "distance_from_start": station_data["distance"],
                "arrival_time": station_data["arrival"],
                "departure_time": station_data["departure"],
                "halt_time": station_data["halt"]
            })
        
        result = [{
            "route_id": f"{train_id}_1",
            "distance": stations[-1]["distance_from_start"] if stations else 264,
            "stations": stations
        }]
    
    return result
