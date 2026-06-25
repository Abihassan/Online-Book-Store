"""Average session duration per book — most engaging books."""
from ml.analytics.pipeline import load_sessions_enriched


def engagement_json(top_n: int = 10):
    df = load_sessions_enriched()
    if df.empty or "duration_seconds" not in df.columns:
        return []
    df = df[df["duration_seconds"].notna() & (df["duration_seconds"] > 0)]
    grouped = (
        df.groupby("title")["duration_seconds"]
        .mean()
        .reset_index()
        .rename(columns={"duration_seconds": "avg_seconds"})
        .sort_values("avg_seconds", ascending=False)
        .head(top_n)
    )
    grouped["avg_minutes"] = (grouped["avg_seconds"] / 60).round(1)
    return grouped.to_dict(orient="records")