"""Genre trend chart — reading volume per genre grouped by month."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from ml.analytics.pipeline import load_sessions_enriched


def genre_trends_json():
    df = load_sessions_enriched()
    if df.empty:
        return []
    grouped = df.groupby(["month", "genre"]).size().reset_index(name="sessions")
    return grouped.to_dict(orient="records")


def plot_genre_trends() -> plt.Figure:
    df = load_sessions_enriched()
    if df.empty:
        fig, ax = plt.subplots()
        ax.text(0.5, 0.5, "No data yet", ha="center")
        return fig
    grouped = df.groupby(["month", "genre"]).size().unstack(fill_value=0)
    fig, ax = plt.subplots(figsize=(12, 5))
    grouped.plot(kind="bar", ax=ax, colormap="tab10")
    ax.set_title("Reading Volume by Genre per Month", fontweight="bold")
    ax.set_xlabel("Month")
    ax.set_ylabel("Sessions")
    ax.legend(title="Genre", bbox_to_anchor=(1, 1))
    fig.tight_layout()
    return fig