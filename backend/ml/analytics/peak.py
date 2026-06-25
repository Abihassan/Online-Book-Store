"""Peak usage hours bar chart."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from ml.analytics.pipeline import load_sessions_enriched


def peak_hours_json():
    df = load_sessions_enriched()
    if df.empty:
        return [{"hour": h, "sessions": 0} for h in range(24)]
    counts = df.groupby("hour").size().reindex(range(24), fill_value=0)
    return [{"hour": int(h), "sessions": int(c)} for h, c in counts.items()]


def plot_peak_hours() -> plt.Figure:
    data = peak_hours_json()
    hours    = [d["hour"]    for d in data]
    sessions = [d["sessions"] for d in data]
    fig, ax = plt.subplots(figsize=(12, 4))
    colors = ["#f97316" if s == max(sessions) else "#fed7aa" for s in sessions]
    ax.bar(hours, sessions, color=colors, edgecolor="white")
    ax.set_title("Peak Reading Hours", fontweight="bold")
    ax.set_xlabel("Hour of Day (UTC)")
    ax.set_ylabel("Sessions")
    ax.set_xticks(range(24))
    fig.tight_layout()
    return fig