from database.create_schema import setup_database, DATABASE_URL
engine, created = setup_database(DATABASE_URL)