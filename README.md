# Rail Tikit

A full-stack train booking demo application with a Python/FastAPI backend and a React + Vite frontend.

**Project overview**
- **Backend**: `railway-backend/` — FastAPI, SQLAlchemy, PostgreSQL, JWT auth, booking and ticket verification endpoints.
- **Frontend**: `railway-project/` — React (Vite), pages for search, booking, profile and ticket verification.

**Key Features**
- **User accounts**: signup, login (JWT), profile update, delete account.
- **Search & details**: search trains by stations, view train route and coach availability.
- **Booking flow**: create bookings, allocate seats, mock payment processing.
- **Ticket verification**: verify tickets by booking ID.

**Tech stack**
- Backend: Python, FastAPI, SQLAlchemy, PostgreSQL, Uvicorn, python-jose (JWT), bcrypt/passlib.
- Frontend: React 19, Vite, React Router.

**Repository structure**
- `railway-backend/` — backend source
  - `main.py` – FastAPI app and endpoints
  - `models.py`, `schemas.py`, `database.py` – DB layer and Pydantic schemas
  - `requirements.txt` – Python dependencies
- `railway-project/` — React front-end powered by Vite
  - `src/` – React components and pages
  - `package.json` – scripts and deps

**Getting started (local)**

Prerequisites
- Python 3.10+ (recommended)
- Node.js 18+ and npm
- PostgreSQL (or a compatible DB); update `DATABASE_URL` accordingly

Run the backend (PowerShell)

```powershell
# move into backend folder
cd railway-backend

# create and activate a venv
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# install dependencies
pip install -r requirements.txt

# set environment variables (example)
$env:SECRET_KEY = 'change_me_to_a_secret'
$env:DATABASE_URL = 'postgresql://user:password@localhost/railway_db'

# create DB tables (run from inside `railway-backend/` directory)
python -c "from database import Base, engine; Base.metadata.create_all(bind=engine)"

# run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Notes:
- The backend expects a SQLAlchemy-compatible `DATABASE_URL`. If you use PostgreSQL locally, create a database and point `DATABASE_URL` to it.

Run the frontend

```powershell
cd railway-project
npm install
npm run dev
```

Open the frontend at the URL printed by Vite (usually `http://localhost:5173`). The frontend communicates with the backend at `http://localhost:8000` by default (CORS already configured in `main.py`).

**Environment variables**
- `SECRET_KEY` — used for signing JWTs; change in production.
- `DATABASE_URL` — SQLAlchemy database URL (e.g. `postgresql://user:pass@host:port/dbname`).
- `ACCESS_TOKEN_EXPIRE_MINUTES` — token expiry (optional override).

**Important endpoints**
- `POST /signup` — create new user
- `POST /login` — returns JWT token
- `GET /stations` — list stations
- `POST /search-trains` — search available trains
- `GET /train-info?train_name=...` — get train route & details
- `POST /create-booking` — create a booking (requires auth)
- `POST /create-payment` — create payment record
- `POST /verify-ticket` — verify booking/ticket

Refer to `railway-backend/main.py` for full endpoint behavior and request/response models (`schemas.py`).

**Database / migrations**
- This repository uses SQLAlchemy models in `railway-backend/models.py`. There is no migration setup in this repo — for production use, add Alembic or another migration tool.

**Contributing**
- Feel free to open issues or PRs. Suggested improvements:
  - Add database migrations (Alembic)
  - Improve auth flows (password reset, email verification)
  - Integrate real payment provider
  - Add tests and CI (GitHub Actions)

**License**
- Add a license file (e.g. `LICENSE`) or change this section to the chosen license.

**Contact**
- If you want help or want to collaborate, open an issue or contact the repo owner.

---
