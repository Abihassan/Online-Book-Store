from fastapi import APIRouter, HTTPException
import os, asyncpg, base64, io
from pathlib import Path

router = APIRouter()
DB_URL = os.getenv("DATABASE_URL", "")


async def get_conn():
    return await asyncpg.connect(DB_URL)


def _fig_to_base64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", dpi=120)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode()


# ── GET /analytics/reading-stats ─────────────────────────────────────────────
@router.get("/reading-stats")
async def reading_stats():
    conn = await get_conn()
    try:
        # Heatmap data: reading activity by hour and weekday
        heatmap_rows = await conn.fetch("""
            SELECT EXTRACT(hour FROM started_at)::int AS hour,
                   EXTRACT(dow  FROM started_at)::int AS dow,
                   COUNT(*) AS sessions
            FROM reading_sessions
            WHERE started_at IS NOT NULL
            GROUP BY hour, dow
        """)

        # Genre trends: volume by genre per month
        genre_rows = await conn.fetch("""
            SELECT b.genre,
                   TO_CHAR(rs.started_at, 'Mon YY') AS month,
                   COUNT(*) AS sessions
            FROM reading_sessions rs
            JOIN books b ON b.id = rs.book_id
            WHERE rs.started_at > NOW() - INTERVAL '6 months'
            GROUP BY b.genre, month
            ORDER BY month, sessions DESC
        """)

        # Peak hours
        peak_rows = await conn.fetch("""
            SELECT EXTRACT(hour FROM started_at)::int AS hour, COUNT(*) AS sessions
            FROM reading_sessions
            GROUP BY hour ORDER BY hour
        """)

        # Top engaging books (avg session duration)
        engagement_rows = await conn.fetch("""
            SELECT b.title, AVG(rs.duration_seconds)::int AS avg_seconds
            FROM reading_sessions rs
            JOIN books b ON b.id = rs.book_id
            WHERE rs.duration_seconds IS NOT NULL
            GROUP BY b.title
            ORDER BY avg_seconds DESC LIMIT 10
        """)

        return {
            "heatmap": [dict(r) for r in heatmap_rows],
            "genreTrends": [dict(r) for r in genre_rows],
            "peakHours": [dict(r) for r in peak_rows],
            "topEngaging": [dict(r) for r in engagement_rows],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await conn.close()


# ── GET /analytics/heatmap-image — returns base64 PNG ─────────────────────────
@router.get("/heatmap-image")
async def heatmap_image():
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import seaborn as sns
        import numpy as np

        conn = await get_conn()
        rows = await conn.fetch("""
            SELECT EXTRACT(hour FROM started_at)::int AS hour,
                   EXTRACT(dow  FROM started_at)::int AS dow,
                   COUNT(*) AS sessions
            FROM reading_sessions
            GROUP BY hour, dow
        """)
        await conn.close()

        matrix = np.zeros((7, 24))
        for r in rows:
            matrix[int(r["dow"])][int(r["hour"])] += int(r["sessions"])

        days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        fig, ax = plt.subplots(figsize=(14, 5))
        sns.heatmap(matrix, xticklabels=range(24), yticklabels=days,
                    cmap="YlOrRd", ax=ax, linewidths=0.3)
        ax.set_title("Reading Activity Heatmap", fontsize=14)
        ax.set_xlabel("Hour of Day")
        ax.set_ylabel("Day of Week")

        return {"image": _fig_to_base64(fig), "format": "png"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))