"""One-off script: generate sample .docx/.pdf for all 3 report types (Phase 2 review)."""
import os
from database import SessionLocal
from report_data import report_data
from report_docx import generate_docx
from report_pdf import generate_pdf

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "sample_reports")


def main(project_id: int):
    db = SessionLocal()
    try:
        for report_type in ["pdd", "validation", "monitoring"]:
            data = report_data(project_id, report_type, db)
            docx_path = os.path.join(OUT_DIR, f"{report_type}_project{project_id}.docx")
            pdf_path = os.path.join(OUT_DIR, f"{report_type}_project{project_id}.pdf")

            generate_docx(data).save(docx_path)
            generate_pdf(data).output(pdf_path)

            print(f"{report_type}: wrote {docx_path} and {pdf_path}")
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    pid = int(sys.argv[1]) if len(sys.argv) > 1 else 9
    main(pid)
