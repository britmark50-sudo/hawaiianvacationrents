#!/usr/bin/env python3
"""Regenerates prisma/d1-seed.sql from the local SQLite DB.
DateTime columns are emitted as ISO-8601 TEXT — the canonical format written
by Prisma's D1 driver adapter — so seeded and runtime rows stay consistent.
Usage: npm run db:push && npm run db:seed && python3 scripts/gen-d1-seed.py"""
import sqlite3
from datetime import datetime, timezone

ORDER = ["User", "Property", "Photo", "Payment", "Report", "BlogPost", "Page", "ContactMessage", "UsedTxHash", "TxVerifyAttempt"]

def iso(ms):
    dt = datetime.fromtimestamp(ms / 1000, tz=timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{int(dt.microsecond/1000):03d}" + "+00:00"

def lit(v, is_dt):
    if v is None:
        return "NULL"
    if is_dt and isinstance(v, (int, float)):
        return "'" + iso(v) + "'"
    if isinstance(v, (int, float)):
        return repr(v)
    if isinstance(v, bytes):
        return "X'" + v.hex() + "'"
    return "'" + str(v).replace("'", "''") + "'"

con = sqlite3.connect("prisma/dev.db")
cur = con.cursor()
out = ["-- Demo data for Cloudflare D1 (dependency-ordered, ISO-8601 datetimes)", "PRAGMA defer_foreign_keys = true;"]
n = 0
for table in ORDER:
    info = list(cur.execute(f'PRAGMA table_info("{table}")'))
    if not info:
        continue
    cols = [r[1] for r in info]
    dt_flags = [(r[2] or "").upper() == "DATETIME" for r in info]
    col_list = ", ".join(f'"{c}"' for c in cols)
    for row in cur.execute(f'SELECT {col_list} FROM "{table}"'):
        values = ", ".join(lit(v, dt_flags[i]) for i, v in enumerate(row))
        out.append(f'INSERT INTO "{table}" ({col_list}) VALUES ({values});')
        n += 1
with open("prisma/d1-seed.sql", "w") as f:
    f.write("\n".join(out) + "\n")
print(f"prisma/d1-seed.sql written ({n} rows, ISO datetimes)")
