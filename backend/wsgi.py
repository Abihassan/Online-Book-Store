"""
wsgi.py — Entry point for the Flask application.

Run with:
    flask --app wsgi:app run --port 5000
  or:
    python wsgi.py
"""
from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)