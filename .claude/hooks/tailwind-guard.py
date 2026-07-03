#!/usr/bin/env python3
# Warns when a Write/Edit introduces hardcoded px/rem arbitrary values in Tailwind classes.
# Convention: use the standard spacing scale (52px = size-13, 16px = p-4/gap-4) and text sizes (text-xs...),
# never bracket values like w-[52px] / text-[10px] / pt-[4.125rem].
import json
import re
import sys

data = json.load(sys.stdin)
tool_input = data.get("tool_input", {})
path = tool_input.get("file_path", "")

# Web frontends only — core-app (React Native / NativeWind) has its own rules
if not path.endswith((".tsx", ".jsx")) or "/core-app/" in path or "/node_modules/" in path:
    sys.exit(0)

# Only the content this edit introduces (Write: content, Edit: new_string) — no nagging about pre-existing lines
added = tool_input.get("content") or tool_input.get("new_string") or ""

warnings = []
hardcoded = sorted(set(re.findall(r"[a-z][a-z-]*-\[[0-9.]+(?:px|rem)\]", added)))
if hardcoded:
    warnings.append(
        f"Hardcoded Tailwind values introduced: {', '.join(hardcoded)}. "
        "Use standard scale classes instead (e.g. 52px = size-13, 8px = gap-2, 10px text = text-xs) "
        "per the CLAUDE.md spacing/sizing rules."
    )

deprecated = sorted(set(re.findall(r"flex-(?:shrink|grow)(?:-[0-9]+)?", added)))
if deprecated:
    warnings.append(
        f"Deprecated Tailwind classes introduced: {', '.join(deprecated)}. "
        "Use the v3+ spellings: flex-shrink-* -> shrink-*, flex-grow-* -> grow-*."
    )

if warnings:
    print(" ".join(warnings), file=sys.stderr)
    sys.exit(2)

sys.exit(0)
