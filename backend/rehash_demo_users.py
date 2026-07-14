"""
One-off migration: the 5 demo users were originally seeded with sha256
password hashes (seed.py bug, fixed in the same commit as this script).
auth.py verifies passwords with bcrypt, so those old hashes no longer
match. Re-hash the known demo accounts to bcrypt("password123") in place.

Run once against whichever DB needs fixing:
    DATABASE_URL=... python rehash_demo_users.py
"""
from database import SessionLocal, User
from auth import get_password_hash

DEMO_EMAILS = [
    "farmer@somromscan.th",
    "leader@somromscan.th",
    "tgo@tgo.or.th",
    "buyer@ptt.co.th",
    "vvb@psu.ac.th",
]


def main():
    db = SessionLocal()
    try:
        new_hash = get_password_hash("password123")
        updated = 0
        for email in DEMO_EMAILS:
            user = db.query(User).filter(User.email == email).first()
            if user:
                user.hashed_password = new_hash
                updated += 1
        db.commit()
        print(f"Re-hashed {updated}/{len(DEMO_EMAILS)} demo users to bcrypt.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
