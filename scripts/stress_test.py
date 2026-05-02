#!/usr/bin/env python3
"""
Stress test for the Vritti commerce gateway.

Logs in once with email + password, then hammers a rotating list of 50+
GET endpoints with configurable concurrency. Reports overall throughput,
latency percentiles, status code distribution, and per-endpoint stats.

Usage:
  python3 scripts/stress_test.py \
      --base-url https://pharmacy-store.local.vrittiai.com:3013 \
      --email owner@pharmacy-store.vritti.test \
      --password 'Password@0322' \
      --bu-id 1d19e5e7-9737-4994-a4b6-f86fff4ce5fc \
      --requests 1000 --concurrency 50

Optional flags:
  --warmup N         Pre-flight requests to spin up the pool (default 10)
  --no-rotate        Hit only the first endpoint instead of rotating
  --endpoint /path   Override the rotating list with a single path
"""

from __future__ import annotations

import argparse
import asyncio
import json
import statistics
import sys
import time
from collections import Counter, defaultdict
from typing import Any

try:
    import httpx
except ImportError:
    print("Missing dependency: pip3 install httpx", file=sys.stderr)
    sys.exit(1)


# 50 GET endpoints across the commerce gateway. All return 200 against a
# freshly seeded BU. Curated to exercise a broad RLS surface (every domain
# touched, multiple shapes per domain: list / select / tree / count / table).
DEFAULT_ENDPOINTS: list[str] = [
    # 1-2: meta
    "/api/csrf/token",
    # 3-5: uom + dimensions
    "/api/commerce-api/uom-dimensions",
    "/api/commerce-api/uom-dimensions/select",
    "/api/commerce-api/uom/select",
    # 6-8: categories
    "/api/commerce-api/categories/tree",
    "/api/commerce-api/categories/count",
    "/api/commerce-api/categories/select",
    # 9-10: tax + modifiers
    "/api/commerce-api/tax-groups",
    "/api/commerce-api/modifier-groups",
    # 11-12: storage
    "/api/commerce-api/storage-locations/tree",
    "/api/commerce-api/storage-locations/select",
    # 13-14: bom
    "/api/commerce-api/bom/table",
    "/api/commerce-api/bom/select",
    # 15-16: inventory items
    "/api/commerce-api/inventory-items/table",
    "/api/commerce-api/inventory-items/select",
    # 17-19: purchase orders
    "/api/commerce-api/purchase-orders/table",
    "/api/commerce-api/purchase-orders/select",
    "/api/commerce-api/purchase-orders/select?valueKey=id&labelKey=poNumber",
    # 20-22: suppliers
    "/api/commerce-api/suppliers/table",
    "/api/commerce-api/suppliers/select",
    "/api/commerce-api/suppliers/items/price?inventoryItemId=00000000-0000-0000-0000-000000000000",
    # 23-25: price lists
    "/api/commerce-api/price-lists/table",
    "/api/commerce-api/price-lists/select",
    "/api/commerce-api/price-lists/item-variants/select",
    # 26: invoices
    "/api/commerce-api/invoices/table",
    # 27: conversions
    "/api/commerce-api/conversions/table",
    # 28-29: customers
    "/api/commerce-api/customers/table",
    "/api/commerce-api/customers/select",
    # 30: stock adjustments
    "/api/commerce-api/stock-adjustments/table",
    # 31: goods receipts
    "/api/commerce-api/goods-receipts/table",
    # 32: stock transfers
    "/api/commerce-api/stock-transfers/table",
    # 33: orders
    "/api/commerce-api/orders/table",
    # 34: items
    "/api/commerce-api/items/table",
    # 35-36: pos terminals
    "/api/commerce-api/pos-terminals/table",
    "/api/commerce-api/pos-terminals/select",
    # 37: credit notes — note: no /select, /:id only
    # 38-50: query-param variants of select endpoints (different cache keys)
    "/api/commerce-api/uom-dimensions/select?valueKey=id&labelKey=name",
    "/api/commerce-api/uom-dimensions/select?valueKey=id&labelKey=code",
    "/api/commerce-api/uom/select?valueKey=id&labelKey=symbol",
    "/api/commerce-api/categories/select?valueKey=id&labelKey=name",
    "/api/commerce-api/storage-locations/select?valueKey=id&labelKey=name",
    "/api/commerce-api/bom/select?valueKey=id&labelKey=code",
    "/api/commerce-api/inventory-items/select?valueKey=id&labelKey=name",
    "/api/commerce-api/suppliers/select?valueKey=id&labelKey=name",
    "/api/commerce-api/price-lists/select?valueKey=id&labelKey=name",
    "/api/commerce-api/customers/select?valueKey=id&labelKey=name",
    "/api/commerce-api/pos-terminals/select?valueKey=id&labelKey=name",
    "/api/commerce-api/uom-dimensions?search=x",
    "/api/commerce-api/uom-dimensions?search=mass",
    "/api/commerce-api/categories/tree?onlyActive=true",
    "/api/commerce-api/uom/select?search=k",
]


async def login(client: httpx.AsyncClient, base_url: str, email: str, password: str) -> str:
    """Fetches CSRF token, logs in, returns access token. Cookies stay on `client`."""
    print(f"→ fetching CSRF token from {base_url}/api/csrf/token")
    csrf_resp = await client.get(f"{base_url}/api/csrf/token")
    csrf_resp.raise_for_status()
    csrf_token = csrf_resp.json()["csrfToken"]

    print(f"→ logging in as {email}")
    login_resp = await client.post(
        f"{base_url}/api/auth/login",
        headers={
            "Content-Type": "application/json",
            "x-csrf-token": csrf_token,
            "Origin": base_url,
        },
        content=json.dumps({"email": email, "password": password}),
    )
    if login_resp.status_code != 201 and login_resp.status_code != 200:
        print(f"login failed: {login_resp.status_code} {login_resp.text}", file=sys.stderr)
        sys.exit(2)

    body = login_resp.json()
    token = body.get("accessToken")
    if not token:
        print(f"login response missing accessToken: {body}", file=sys.stderr)
        sys.exit(2)
    print(f"→ logged in (token len={len(token)}, expiresIn={body.get('expiresIn')}s)")
    return token


async def fire_one(
    client: httpx.AsyncClient,
    base_url: str,
    path: str,
    headers: dict[str, str],
    sem: asyncio.Semaphore,
    overall: list[float],
    statuses: Counter,
    errors: list[str],
    per_endpoint: dict[str, list[float]],
) -> None:
    async with sem:
        t0 = time.perf_counter()
        try:
            r = await client.get(f"{base_url}{path}", headers=headers, timeout=30.0)
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            overall.append(elapsed_ms)
            statuses[r.status_code] += 1
            per_endpoint[path].append(elapsed_ms)
            if r.status_code >= 400:
                errors.append(f"{r.status_code} {path}: {r.text[:120]}")
        except Exception as e:
            errors.append(f"{type(e).__name__} {path}: {e}")


def percentile(xs: list[float], p: float) -> float:
    if not xs:
        return 0.0
    s = sorted(xs)
    i = max(0, min(len(s) - 1, int(round(p / 100.0 * (len(s) - 1)))))
    return s[i]


async def run(args: argparse.Namespace) -> int:
    timeout = httpx.Timeout(connect=10.0, read=30.0, write=10.0, pool=10.0)
    limits = httpx.Limits(
        max_connections=max(args.concurrency * 2, 100),
        max_keepalive_connections=max(args.concurrency, 50),
    )

    async with httpx.AsyncClient(verify=False, timeout=timeout, limits=limits) as client:
        access_token = await login(client, args.base_url, args.email, args.password)

        endpoints = (
            [args.endpoint]
            if args.endpoint
            else (DEFAULT_ENDPOINTS[: 1] if args.no_rotate else DEFAULT_ENDPOINTS)
        )
        print(f"→ rotating across {len(endpoints)} endpoint(s)")

        headers = {"Authorization": f"Bearer {access_token}"}
        if args.bu_id:
            headers["x-bu-id"] = args.bu_id

        # Warmup
        if args.warmup > 0:
            print(f"→ warming up with {args.warmup} sequential requests")
            for i in range(args.warmup):
                path = endpoints[i % len(endpoints)]
                try:
                    await client.get(f"{args.base_url}{path}", headers=headers, timeout=15.0)
                except Exception:
                    pass

        sem = asyncio.Semaphore(args.concurrency)
        overall: list[float] = []
        statuses: Counter[int] = Counter()
        errors: list[str] = []
        per_endpoint: dict[str, list[float]] = defaultdict(list)

        print(f"→ firing {args.requests} requests @ concurrency={args.concurrency}")
        wall_t0 = time.perf_counter()
        await asyncio.gather(
            *(
                fire_one(
                    client,
                    args.base_url,
                    endpoints[i % len(endpoints)],
                    headers,
                    sem,
                    overall,
                    statuses,
                    errors,
                    per_endpoint,
                )
                for i in range(args.requests)
            )
        )
        wall_elapsed = time.perf_counter() - wall_t0

    print()
    print("=" * 72)
    print("Overall")
    print("=" * 72)
    print(f"wall time:     {wall_elapsed:.2f}s")
    print(f"throughput:    {len(overall) / wall_elapsed:.1f} req/sec")
    print(f"completed:     {len(overall)} / {args.requests}")
    print(f"errors:        {len(errors)}")
    if overall:
        print(f"latency mean:  {statistics.mean(overall):.1f}ms")
        print(f"latency p50:   {percentile(overall, 50):.1f}ms")
        print(f"latency p95:   {percentile(overall, 95):.1f}ms")
        print(f"latency p99:   {percentile(overall, 99):.1f}ms")
        print(f"latency max:   {max(overall):.1f}ms")
    print(f"status codes:  {dict(statuses)}")

    if per_endpoint and not args.no_per_endpoint:
        print()
        print("=" * 72)
        print(f"Per endpoint (sorted by p95 desc, top {args.top})")
        print("=" * 72)
        rows = [
            (path, len(xs), statistics.mean(xs), percentile(xs, 50), percentile(xs, 95), max(xs))
            for path, xs in per_endpoint.items()
        ]
        rows.sort(key=lambda r: r[4], reverse=True)
        print(f"{'endpoint':<55} {'n':>4} {'mean':>7} {'p50':>7} {'p95':>7} {'max':>7}")
        print("-" * 92)
        for path, n, mean, p50, p95, mx in rows[: args.top]:
            display = path if len(path) <= 54 else "…" + path[-53:]
            print(f"{display:<55} {n:>4} {mean:>6.0f}ms {p50:>5.0f}ms {p95:>5.0f}ms {mx:>5.0f}ms")

    if errors:
        print()
        print("=" * 72)
        print(f"First 10 errors ({len(errors)} total)")
        print("=" * 72)
        for e in errors[:10]:
            print(f"  - {e}")

    if errors:
        return 1
    if any(s >= 500 for s in statuses):
        return 2
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description="Stress test commerce gateway")
    p.add_argument("--base-url", default="https://pharmacy-store.local.vrittiai.com:3013")
    p.add_argument("--email", required=True)
    p.add_argument("--password", required=True)
    p.add_argument("--bu-id", help="x-bu-id header value (required for BU-scoped endpoints)")
    p.add_argument("--requests", "-n", type=int, default=500)
    p.add_argument("--concurrency", "-c", type=int, default=20)
    p.add_argument("--warmup", type=int, default=10)
    p.add_argument("--endpoint", help="Hit a single specific path instead of rotating")
    p.add_argument("--no-rotate", action="store_true", help="Use only the first default endpoint")
    p.add_argument("--no-per-endpoint", action="store_true", help="Skip per-endpoint table")
    p.add_argument("--top", type=int, default=20, help="Show top N endpoints in per-endpoint table")
    args = p.parse_args()
    return asyncio.run(run(args))


if __name__ == "__main__":
    sys.exit(main())
