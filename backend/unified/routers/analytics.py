"""
routers/analytics.py — Analytics endpoints (/analytics/...)
"""
import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text

from ..database import get_db
from ..models import ReadingSession, Book

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/reading-stats")
async def reading_stats(db: AsyncSession = Depends(get_db)):
    try:
        # Heatmap: hour + day of week
        heatmap = await db.execute(text("""
            SELECT EXTRACT(hour FROM started_at)::int AS hour,
                   EXTRACT(dow  FROM started_at)::int AS dow,
                   COUNT(*) AS sessions
            FROM reading_sessions
            WHERE started_at IS NOT NULL
            GROUP BY hour, dow
        """))

        # Genre trends (last 6 months)
        genre_trends = await db.execute(text("""
            SELECT b.genre,
                   TO_CHAR(rs.started_at, 'Mon YY') AS month,
                   COUNT(*) AS sessions
            FROM reading_sessions rs
            JOIN books b ON b.id = rs.book_id
            WHERE rs.started_at > NOW() - INTERVAL '6 months'
            GROUP BY b.genre, month
            ORDER BY month, sessions DESC
        """))

        # Peak hours
        peak = await db.execute(text("""
            SELECT EXTRACT(hour FROM started_at)::int AS hour, COUNT(*) AS sessions
            FROM reading_sessions
            GROUP BY hour ORDER BY hour
        """))

        # Top engaging books
        engaging = await db.execute(text("""
            SELECT b.title, AVG(rs.duration_seconds)::int AS avg_seconds
            FROM reading_sessions rs
            JOIN books b ON b.id = rs.book_id
            WHERE rs.duration_seconds IS NOT NULL
            GROUP BY b.title
            ORDER BY avg_seconds DESC LIMIT 10
        """))

        return {
            "heatmap":     [dict(r._mapping) for r in heatmap],
            "genreTrends": [dict(r._mapping) for r in genre_trends],
            "peakHours":   [dict(r._mapping) for r in peak],
            "topEngaging": [dict(r._mapping) for r in engaging],
        }
    except Exception as e:
        logger.exception("Failed to compute reading-stats analytics")
        raise HTTPException(500, "Internal server error")


@router.get("/heatmap-image")
async def heatmap_image(db: AsyncSession = Depends(get_db)):
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import seaborn as sns
        import numpy as np
        import base64, io

        rows = await db.execute(text("""
            SELECT EXTRACT(hour FROM started_at)::int AS hour,
                   EXTRACT(dow  FROM started_at)::int AS dow,
                   COUNT(*) AS sessions
            FROM reading_sessions GROUP BY hour, dow
        """))

        matrix = np.zeros((7, 24))
        for r in rows:
            matrix[int(r.dow)][int(r.hour)] += int(r.sessions)

        days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        fig, ax = plt.subplots(figsize=(14, 5))
        sns.heatmap(matrix, xticklabels=range(24), yticklabels=days,
                    cmap="YlOrRd", ax=ax, linewidths=0.3)
        ax.set_title("Reading Activity Heatmap", fontsize=14)

        buf = io.BytesIO()
        fig.savefig(buf, format="png", bbox_inches="tight", dpi=120)
        buf.seek(0)
        encoded = base64.b64encode(buf.read()).decode()
        plt.close(fig)
        return {"image": encoded, "format": "png"}
    except Exception as e:
        logger.exception("Failed to generate heatmap image")
        raise HTTPException(500, "Internal server error")