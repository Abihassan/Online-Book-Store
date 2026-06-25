from celery import Celery
from celery.schedules import crontab
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "bookhaven",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        "tasks.email",
        "tasks.reports",
        "tasks.ml_train",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,

    # ── Periodic beat schedule ─────────────────────────────────────────────────
    beat_schedule={
        "retrain-recommender-weekly": {
            "task": "tasks.ml_train.retrain_recommender",
            "schedule": crontab(hour=2, minute=0, day_of_week="monday"),
        },
        "reembed-catalog-daily": {
            "task": "tasks.ml_train.reembed_catalog",
            "schedule": crontab(hour=3, minute=0),
        },
        "generate-weekly-report": {
            "task": "tasks.reports.generate_weekly_report",
            "schedule": crontab(hour=6, minute=0, day_of_week="monday"),
        },
    },
)