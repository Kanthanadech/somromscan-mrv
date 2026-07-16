"""
One-off migration: add baseline_tco2_year / leakage_tco2_year to projects.

Base.metadata.create_all only creates tables that don't exist yet — it never
ALTERs an existing table to add new columns. Since `projects` already exists
on Neon, the new Project.baseline_tco2_year / leakage_tco2_year columns need
an explicit ALTER TABLE. Postgres-only (SQLite dev DBs get the columns for
free since they're usually recreated from scratch via create_all).

Also sets project #9 (Somrom Agroforestry — Koh Yor Songkhla, the project
the T-VER report templates were literally written about) to the baseline/
leakage values shown in the example PDD/Monitoring Report docs, so the
generated report matches the reference templates as a sanity check.

Run once against whichever DB needs it:
    DATABASE_URL=... python add_baseline_leakage_columns.py
"""
from sqlalchemy import text
from database import SessionLocal, engine, Project


def main():
    if "postgresql" in str(engine.url):
        with engine.connect() as conn:
            conn.execute(text(
                "ALTER TABLE projects ADD COLUMN IF NOT EXISTS baseline_tco2_year FLOAT DEFAULT 0"
            ))
            conn.execute(text(
                "ALTER TABLE projects ADD COLUMN IF NOT EXISTS leakage_tco2_year FLOAT DEFAULT 0"
            ))
            conn.commit()
        print("Postgres columns added (or already existed).")
    else:
        print("Non-Postgres DB — skipping ALTER TABLE (create_all handles new SQLite DBs).")

    db = SessionLocal()
    try:
        somrom_pilot = db.query(Project).filter(Project.id == 9).first()
        if somrom_pilot:
            somrom_pilot.baseline_tco2_year = 40
            somrom_pilot.leakage_tco2_year = 25
            db.commit()
            print("Set project #9 baseline_tco2_year=40, leakage_tco2_year=25 (matches example templates).")
        else:
            print("Project #9 not found — skipped example values.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
