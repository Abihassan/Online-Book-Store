from celery_app.celery import celery_app
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from datetime import datetime, timedelta
import os, psycopg2


def _get_db():
    return psycopg2.connect(os.getenv("DATABASE_URL", ""))


@celery_app.task(bind=True, max_retries=2, default_retry_delay=120)
def generate_weekly_report(self):
    """Generate a PDF sales report for the past 7 days and email it to admin."""
    try:
        conn = _get_db()
        cur = conn.cursor()

        week_ago = datetime.utcnow() - timedelta(days=7)

        # Total revenue
        cur.execute("SELECT COUNT(*), COALESCE(SUM(total),0) FROM orders WHERE created_at > %s", (week_ago,))
        order_count, revenue = cur.fetchone()

        # Top books
        cur.execute("""
            SELECT b.title, SUM(oi.quantity) AS sold
            FROM order_items oi JOIN books b ON b.id=oi.book_id
            JOIN orders o ON o.id=oi.order_id
            WHERE o.created_at > %s
            GROUP BY b.title ORDER BY sold DESC LIMIT 10
        """, (week_ago,))
        top_books = cur.fetchall()

        # New users
        cur.execute("SELECT COUNT(*) FROM users WHERE created_at > %s", (week_ago,))
        new_users = cur.fetchone()[0]

        conn.close()

        # Build PDF
        filename = f"/tmp/bookhaven_report_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
        doc = SimpleDocTemplate(filename, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("BookHaven Weekly Sales Report", styles["Title"]))
        elements.append(Paragraph(
            f"Week ending {datetime.utcnow().strftime('%Y-%m-%d')}", styles["Normal"]
        ))
        elements.append(Spacer(1, 20))

        summary_data = [
            ["Metric", "Value"],
            ["Total Orders", str(order_count)],
            ["Total Revenue", f"${float(revenue):.2f}"],
            ["New Users", str(new_users)],
        ]
        table = Table(summary_data, colWidths=[250, 200])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f97316")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fff7ed")]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ("PADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("Top Selling Books", styles["Heading2"]))

        book_data = [["Book Title", "Units Sold"]] + [[t, str(s)] for t, s in top_books]
        book_table = Table(book_data, colWidths=[350, 100])
        book_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fbbf24")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ("PADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(book_table)
        doc.build(elements)

        # Email admin
        admin_email = os.getenv("ADMIN_EMAIL", os.getenv("MAIL_USERNAME"))
        if admin_email:
            from tasks.email import _send_smtp
            with open(filename, "rb") as f:
                pdf_content = f.read()
            _send_smtp(admin_email, "BookHaven Weekly Report",
                       "<p>Please find the weekly sales report attached.</p>")

        return {"status": "ok", "file": filename}
    except Exception as exc:
        raise self.retry(exc=exc)