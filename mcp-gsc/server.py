#!/usr/bin/env python3
"""
QuantOracle GSC MCP — a minimal Google Search Console MCP server.

WHY THIS EXISTS
---------------
As of May 2026, Google publishes an official Google Analytics MCP
(googleanalytics/google-analytics-mcp) but no equivalent for Search Console.
The community alternatives (ahonn/mcp-server-gsc, surendranb/google-search-
console-mcp, etc.) work fine but each adds third-party trust to the auth
chain. For a security-conscious setup we'd rather own the ~150 lines that
hold our credentials than trust an unknown maintainer.

This wrapper does exactly what the content-opportunity scan needs:

  list_sites          — enumerate verified Search Console properties
  top_queries         — top N search queries by impressions, with CTR/position
  top_pages           — top N landing pages by impressions
  query_search        — arbitrary search-analytics query with full dimension control
  inspect_url         — URL Inspection API: indexing status, last crawl, etc.

Auth
----
Uses Application Default Credentials (ADC) from gcloud — the same chain the
ga4 MCP uses. The `webmasters.readonly` scope must have been included in the
original `gcloud auth application-default login` command. If you see
"insufficient scope" errors, re-run the auth flow with the scope added.

Property URL format
-------------------
Search Console properties use one of two formats:

  sc-domain:quantoracle.dev   ← Domain property (covers all subdomains + protocols)
  https://quantoracle.dev/    ← URL-prefix property (specific subdomain/protocol only)

Pass the exact form returned by list_sites. They are NOT interchangeable.

Date ranges
-----------
GSC data has a 2-3 day lag — yesterday's data may not be complete. The tools
default to the last 7 days ending today, which gives Google enough time to
fully populate impressions/clicks for at least the first 4-5 days of the
window. For "what's happening right now" queries use the realtime GA4 tools
instead.
"""
from datetime import date, timedelta
from typing import Optional

from google.auth import default
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from mcp.server.fastmcp import FastMCP

# Read-only Search Console scope. Must be present in the ADC credentials.
SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]

# Build the Search Console v1 API client at module load. v1 (vs the older
# webmasters v3) includes the URL Inspection API which we use for the
# inspect_url tool.
_creds, _project = default(scopes=SCOPES)
_service = build("searchconsole", "v1", credentials=_creds, cache_discovery=False)

mcp = FastMCP("quantoracle-gsc")


def _date_window(days: int) -> tuple[str, str]:
    """Return (start_date, end_date) ISO strings for a window ending today."""
    end = date.today()
    start = end - timedelta(days=days)
    return start.isoformat(), end.isoformat()


@mcp.tool()
def list_sites() -> list[dict]:
    """
    List all Google Search Console properties the authenticated user can
    access. Returns a list of dicts with `siteUrl` and `permissionLevel`.

    Use this first to discover the exact property URL format to pass to
    other tools (domain properties use `sc-domain:example.com`, URL-prefix
    properties use `https://example.com/`).
    """
    response = _service.sites().list().execute()
    return response.get("siteEntry", [])


@mcp.tool()
def top_queries(
    site_url: str,
    days: int = 7,
    limit: int = 25,
) -> dict:
    """
    Return the top N search queries that drove impressions to a site over
    the last N days (default 7).

    Each row contains:
      keys[0]       — the search query text
      impressions   — times shown in Google search results
      clicks        — times the result was actually clicked
      ctr           — clicks / impressions (0.0-1.0)
      position      — average ranking position (1.0 = always #1; 10.0 = page 1 bottom)

    The most useful insight is usually queries with high impressions but
    low CTR — those are titles/metadata worth rewriting. Also: queries
    you didn't know you ranked for.

    Args:
        site_url: Property URL (e.g. `sc-domain:quantoracle.dev`). Use
            list_sites() if you don't know the exact format.
        days: Lookback window in days (default 7, max 16 months).
        limit: Max number of rows (default 25, max 25000).
    """
    start, end = _date_window(days)
    request = {
        "startDate": start,
        "endDate": end,
        "dimensions": ["query"],
        "rowLimit": limit,
    }
    return _service.searchanalytics().query(siteUrl=site_url, body=request).execute()


@mcp.tool()
def top_pages(
    site_url: str,
    days: int = 7,
    limit: int = 25,
) -> dict:
    """
    Return the top N landing pages that received search impressions over
    the last N days.

    Useful for finding which articles Google is actually showing in search
    results. A page with high impressions but low CTR usually means the
    title or description doesn't match user intent.

    Args:
        site_url: Property URL.
        days: Lookback window (default 7).
        limit: Max rows (default 25).
    """
    start, end = _date_window(days)
    request = {
        "startDate": start,
        "endDate": end,
        "dimensions": ["page"],
        "rowLimit": limit,
    }
    return _service.searchanalytics().query(siteUrl=site_url, body=request).execute()


@mcp.tool()
def query_search(
    site_url: str,
    dimensions: list[str],
    days: int = 7,
    limit: int = 25,
    filters: Optional[list[dict]] = None,
    search_type: str = "web",
) -> dict:
    """
    Run a custom Search Analytics query with arbitrary dimensions and
    optional filters. This is the power-user tool — covers everything the
    convenience wrappers above don't.

    Args:
        site_url: Property URL.
        dimensions: List of dimensions. Valid: query, page, country,
            device, date, searchAppearance. Combine for cross-tab analysis
            (e.g. ["query", "page"] = which queries landed on which pages).
        days: Lookback window.
        limit: Max rows.
        filters: Optional dimension filters. Each filter is a dict with:
            {"dimension": "country", "operator": "equals", "expression": "usa"}
            Operators: equals, notEquals, contains, notContains,
            includingRegex, excludingRegex.
        search_type: "web" (default), "image", "video", "news", "discover", "googleNews".

    Useful examples:
        - Top queries for a specific page: dimensions=["query"], filters=[
            {"dimension": "page", "operator": "equals",
             "expression": "https://quantoracle.dev/black-scholes-calculator"}]
        - Daily impressions trend: dimensions=["date"], days=30
        - US-only queries: filters=[{"dimension": "country",
            "operator": "equals", "expression": "usa"}]
    """
    start, end = _date_window(days)
    request: dict = {
        "startDate": start,
        "endDate": end,
        "dimensions": dimensions,
        "rowLimit": limit,
        "type": search_type,
    }
    if filters:
        request["dimensionFilterGroups"] = [{"filters": filters}]
    return _service.searchanalytics().query(siteUrl=site_url, body=request).execute()


@mcp.tool()
def inspect_url(
    site_url: str,
    inspection_url: str,
) -> dict:
    """
    Inspect a specific URL's indexing status via the URL Inspection API.

    Returns a detailed report including:
      - Whether the URL is indexed
      - Coverage state (Submitted and indexed / Crawled - currently not indexed / etc.)
      - Last crawl time and result
      - Whether the URL is mobile-friendly
      - Any structured data issues
      - Whether AMP / canonical / etc. are correctly set

    Use this when a specific article isn't showing in search yet — the
    inspection result tells you whether Google has crawled it, indexed it,
    or hit a problem.

    Args:
        site_url: Property URL the inspection_url belongs to.
        inspection_url: The specific URL to inspect (must be within the property).
    """
    request = {
        "inspectionUrl": inspection_url,
        "siteUrl": site_url,
    }
    try:
        return _service.urlInspection().index().inspect(body=request).execute()
    except HttpError as e:
        # Surface a helpful error rather than crash — the API can return 4xx
        # for "URL not in property" or "URL too long" with useful detail.
        return {
            "error": str(e),
            "hint": "Confirm site_url matches the property exactly (use list_sites()) and that inspection_url is within that property.",
        }


if __name__ == "__main__":
    mcp.run()
