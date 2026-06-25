"""
Full recommender training pipeline.
Run directly:  python -m ml.recommender.train
Or called by Celery:  tasks.ml_train.retrain_recommender
"""
import joblib
import os
from pathlib import Path
from datetime import datetime

MODEL_DIR = Path(os.getenv("ML_MODEL_DIR", "./ml/models"))
MODEL_DIR.mkdir(parents=True, exist_ok=True)


def run_training(output_path: str = None) -> dict:
    from ml.data.db_connect import get_books_df
    from ml.data.interactions import build_interactions
    from ml.recommender.content import build_content_model
    from ml.recommender.collab import build_collab_model

    print(f"[{datetime.utcnow().isoformat()}] Starting recommender training…")

    books_df       = get_books_df()
    interactions   = build_interactions()

    print(f"  Books: {len(books_df)}  |  Interactions: {len(interactions)}")

    content_model  = build_content_model(books_df)
    collab_model   = build_collab_model(interactions)

    model_data = {
        "content": content_model,
        "collab":  collab_model,
        "book_ids": books_df["id"].tolist(),
        "trained_at": datetime.utcnow().isoformat(),
        "n_books": len(books_df),
        "n_interactions": len(interactions),
    }

    path = output_path or str(MODEL_DIR / "recommender.pkl")
    joblib.dump(model_data, path, compress=3)
    print(f"  Model saved → {path}")

    metrics = {
        "n_books": len(books_df),
        "n_interactions": len(interactions),
        "collab_rmse": collab_model.get("rmse"),
        "collab_trained": collab_model.get("trained"),
    }
    print(f"  Metrics: {metrics}")
    return metrics


if __name__ == "__main__":
    run_training()