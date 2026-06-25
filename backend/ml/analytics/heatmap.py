"""Time-spent heatmap: hour of day × day of week."""
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from ml.analytics.pipeline import load_sessions_enriched


def build_heatmap_matrix():
    df = load_sessions_enriched()
    if df.empty:
        return np.zeros((7, 24)), ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    matrix = np.zeros((7, 24))
    for _, row in df.iterrows():
        matrix[int(row["dow"])][int(row["hour"])] += 1
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return matrix, days


def plot_heatmap() -> plt.Figure:
    matrix, days = build_heatmap_matrix()
    fig, ax = plt.subplots(figsize=(14, 5))
    sns.heatmap(matrix, xticklabels=range(24), yticklabels=days,
                cmap="YlOrRd", ax=ax, linewidths=0.3, annot=False)
    ax.set_title("Reading Activity Heatmap", fontsize=14, fontweight="bold")
    ax.set_xlabel("Hour of Day (UTC)")
    ax.set_ylabel("Day of Week")
    fig.tight_layout()
    return fig


def heatmap_json():
    matrix, days = build_heatmap_matrix()
    data = []
    for di, day in enumerate(days):
        for h in range(24):
            data.append({"day": day, "hour": h, "sessions": int(matrix[di][h])})
    return data