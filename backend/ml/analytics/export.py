"""
Export all analytics charts as base64 PNG strings for API responses.
Each function returns a dict ready to be serialised as JSON.
"""
import io
import base64
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


def _fig_to_b64(fig: plt.Figure) -> str:
    """Convert a matplotlib Figure to a base64-encoded PNG string."""
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", dpi=120)
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode("utf-8")
    plt.close(fig)
    return encoded


def export_heatmap() -> dict:
    from ml.analytics.heatmap import plot_heatmap, heatmap_json
    fig = plot_heatmap()
    return {"type": "heatmap", "image": _fig_to_b64(fig), "data": heatmap_json()}


def export_genre_trends() -> dict:
    from ml.analytics.trends import plot_genre_trends, genre_trends_json
    fig = plot_genre_trends()
    return {"type": "genre_trends", "image": _fig_to_b64(fig), "data": genre_trends_json()}


def export_peak_hours() -> dict:
    from ml.analytics.peak import plot_peak_hours, peak_hours_json
    fig = plot_peak_hours()
    return {"type": "peak_hours", "image": _fig_to_b64(fig), "data": peak_hours_json()}


def export_engagement() -> dict:
    from ml.analytics.engagement import engagement_json
    return {"type": "engagement", "image": None, "data": engagement_json()}


def export_all() -> dict:
    """Export every chart in one call. Returns dict of chart_name → {image, data}."""
    results = {}
    for name, fn in [
        ("heatmap",      export_heatmap),
        ("genreTrends",  export_genre_trends),
        ("peakHours",    export_peak_hours),
        ("engagement",   export_engagement),
    ]:
        try:
            results[name] = fn()
        except Exception as e:
            results[name] = {"type": name, "image": None, "data": [], "error": str(e)}
    return results