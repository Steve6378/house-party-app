"""
Database Migration: Update event_attendance table structure

This script migrates the event_attendance table to support inviting unregistered users.

Changes:
- Adds 'id' column as new primary key
- Makes 'user_id' nullable
- Drops old composite primary key
- Adds unique index for (event_id, user_id) combinations

Run this script once after deploying the new code:
    python backend/migrate_attendance.py
"""

from utils.database import engine
from sqlalchemy import text
import uuid


def migrate():
    print("Starting event_attendance table migration...")
    print("=" * 60)

    with engine.connect() as conn:
        trans = conn.begin()
        try:
            # Step 1: Add id column
            print("Step 1: Adding id column...")
            conn.execute(text("""
                ALTER TABLE event_attendance
                ADD COLUMN IF NOT EXISTS id VARCHAR(255)
            """))

            # Step 2: Populate existing rows with unique IDs
            print("Step 2: Populating existing rows with IDs...")
            existing_rows = conn.execute(text("""
                SELECT event_id, user_id FROM event_attendance WHERE id IS NULL
            """)).fetchall()

            for row in existing_rows:
                new_id = f'attendance-{uuid.uuid4()}'
                conn.execute(text("""
                    UPDATE event_attendance
                    SET id = :id
                    WHERE event_id = :event_id AND user_id = :user_id AND id IS NULL
                """), {'id': new_id, 'event_id': row[0], 'user_id': row[1]})

            print(f"   Updated {len(existing_rows)} existing records")

            # Step 3: Drop old primary key constraint
            print("Step 3: Dropping old primary key...")
            conn.execute(text("""
                ALTER TABLE event_attendance
                DROP CONSTRAINT IF EXISTS event_attendance_pkey
            """))

            # Step 4: Make id NOT NULL and set as primary key
            print("Step 4: Setting id as primary key...")
            conn.execute(text("""
                ALTER TABLE event_attendance
                ALTER COLUMN id SET NOT NULL
            """))

            conn.execute(text("""
                ALTER TABLE event_attendance
                ADD PRIMARY KEY (id)
            """))

            # Step 5: Make user_id nullable
            print("Step 5: Making user_id nullable...")
            conn.execute(text("""
                ALTER TABLE event_attendance
                ALTER COLUMN user_id DROP NOT NULL
            """))

            # Step 6: Add unique constraint to prevent duplicate invitations
            print("Step 6: Adding unique constraint...")
            conn.execute(text("""
                CREATE UNIQUE INDEX IF NOT EXISTS event_attendance_unique_idx
                ON event_attendance (event_id, user_id)
                WHERE user_id IS NOT NULL
            """))

            trans.commit()
            print("\n" + "=" * 60)
            print("[OK] Migration completed successfully!")
            print("=" * 60)
            print("\nChanges:")
            print("  - Added 'id' column as primary key")
            print("  - Made 'user_id' nullable")
            print("  - Added unique constraint for (event_id, user_id)")
            print("\nThe system can now invite unregistered users!")

        except Exception as e:
            trans.rollback()
            print("\n" + "=" * 60)
            print("✗ Migration failed!")
            print("=" * 60)
            print(f"Error: {e}")
            print("\nThe database was rolled back to its previous state.")
            raise


if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\nFailed to complete migration: {e}")
        exit(1)
