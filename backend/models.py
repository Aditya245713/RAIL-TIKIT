# models.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, DECIMAL, Time
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    password = Column(String(255), nullable=False)  # This will store hashed password
    role = Column(String(20), default='customer')  # customer, admin

    # Relationships
    bookings = relationship("Booking", back_populates="user")

class Train(Base):
    __tablename__ = "trains"

    train_id = Column(Integer, primary_key=True, index=True)
    train_name = Column(String(100))
    train_type = Column(String(20))  # express, local, intercity
    total_coaches = Column(Integer)

    # Relationships
    coaches = relationship("Coach", back_populates="train")
    routes = relationship("Route", back_populates="train")
    schedules = relationship("Schedule", back_populates="train")

class Coach(Base):
    __tablename__ = "coaches"

    coach_id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.train_id"))
    coach_number = Column(String(10))
    coach_type = Column(String(20))
    total_seats = Column(Integer)

    # Relationships
    train = relationship("Train", back_populates="coaches")
    seats = relationship("Seat", back_populates="coach")

class Seat(Base):
    __tablename__ = "seats"

    seat_id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("coaches.coach_id"))
    seat_number = Column(String(10))
    seat_class = Column(String(20))

    # Relationships
    coach = relationship("Coach", back_populates="seats")
    booking_seats = relationship("BookingSeat", back_populates="seat")

class Station(Base):
    __tablename__ = "stations"

    station_id = Column(Integer, primary_key=True, index=True)
    station_name = Column(String(100), unique=True)
    location = Column(String(255))

class RouteStation(Base):
    __tablename__ = "route_stations"

    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.train_id"))
    station_id = Column(Integer, ForeignKey("stations.station_id"))
    sequence_number = Column(Integer)  # Order/sequence of stations in the route
    arrival_offset_minutes = Column(String(10))
    departure_offset_minutes = Column(String(10))
    halt_minutes = Column(Integer)  # Halt time in minutes

    # Relationships
    train = relationship("Train")
    station = relationship("Station")

class Route(Base):
    __tablename__ = "routes"

    route_id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.train_id"))
    source_station_id = Column(Integer, ForeignKey("stations.station_id"))
    destination_station_id = Column(Integer, ForeignKey("stations.station_id"))
    distance_km = Column(DECIMAL(6,2))

    # Relationships
    train = relationship("Train", back_populates="routes")
    source_station = relationship("Station", foreign_keys=[source_station_id])
    destination_station = relationship("Station", foreign_keys=[destination_station_id])
    schedules = relationship("Schedule", back_populates="route")

class Schedule(Base):
    __tablename__ = "schedules"

    schedule_id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.train_id"))
    route_id = Column(Integer, ForeignKey("routes.route_id"))
    departure_time = Column(DateTime)
    arrival_time = Column(DateTime)

    # Relationships
    train = relationship("Train", back_populates="schedules")
    route = relationship("Route", back_populates="schedules")
    bookings = relationship("Booking", back_populates="schedule")

class Booking(Base):
    __tablename__ = "bookings"

    booking_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    schedule_id = Column(Integer, ForeignKey("schedules.schedule_id"))
    booking_date = Column(DateTime, default=func.current_timestamp())
    status = Column(String(20), default='confirmed')  # confirmed, cancelled

    # Relationships
    user = relationship("User", back_populates="bookings")
    schedule = relationship("Schedule", back_populates="bookings")
    booking_seats = relationship("BookingSeat", back_populates="booking")
    payments = relationship("Payment", back_populates="booking")

class BookingSeat(Base):
    __tablename__ = "booking_seats"

    booking_seat_id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.booking_id"))
    seat_id = Column(Integer, ForeignKey("seats.seat_id"))
    fare = Column(DECIMAL(8,2))

    # Relationships
    booking = relationship("Booking", back_populates="booking_seats")
    seat = relationship("Seat", back_populates="booking_seats")

class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.booking_id"))
    amount = Column(DECIMAL(8,2))
    payment_date = Column(DateTime, default=func.current_timestamp())
    status = Column(String(20))  # paid, unpaid

    # Relationships
    booking = relationship("Booking", back_populates="payments")
