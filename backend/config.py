# config.py
# Database setup instructions

"""
STEP-BY-STEP SETUP:

1. Find your PostgreSQL password:
   - Open pgAdmin or connect to PostgreSQL
   - Use the password you set when installing PostgreSQL

2. Update database.py:
   - Replace 'your_actual_password' with your real PostgreSQL password
   - Example: "postgresql://postgres:mypassword123@localhost:5432/BD-Railway"

3. Make sure PostgreSQL is running:
   - Windows: Check Windows Services for PostgreSQL
   - Or run: net start postgresql-x64-13 (adjust version number)

4. Test the connection:
   - Run: python test_connection.py

5. Start the backend:
   - Run: python -m uvicorn main:app --reload

COMMON ISSUES:
- Password authentication failed: Wrong password in database.py
- Connection refused: PostgreSQL service not running
- Database does not exist: Create BD-Railway database first
"""

# Your database credentials should be:
DATABASE_CONFIG = {
    "host": "localhost",
    "port": "5432", 
    "username": "postgres",
    "password": "YOUR_ACTUAL_PASSWORD_HERE",  # Replace this!
    "database": "BD-Railway"
}

print("Please update the password in database.py file!")
print(f"Connection string should be: postgresql://{DATABASE_CONFIG['username']}:YOUR_PASSWORD@{DATABASE_CONFIG['host']}:{DATABASE_CONFIG['port']}/{DATABASE_CONFIG['database']}")
