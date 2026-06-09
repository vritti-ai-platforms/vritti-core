#!/usr/bin/env python3
"""PostToolUse hook for apps/core-app (React Native).

After a Write/Edit lands on disk: (1) format the file with Biome, then
(2) typecheck core-app with tsc. If typecheck fails, the errors are written to
stderr and the hook exits 2 so they are fed back to Claude to fix. A clean run
exits 0 silently.

Scoped to apps/core-app. core-app has no nx typecheck target, so we run tsc
directly against apps/core-app/tsconfig.json instead of `pnpm typecheck` (which
would build every project in the monorepo).
"""
import json
import os
import subprocess
import sys

PROJECT_DIR = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(
        cmd,
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
    )


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0

    tool_input = data.get("tool_input", {}) or {}
    file_path = tool_input.get("file_path", "") or ""

    if "apps/core-app/" not in file_path:
        return 0

    # 1. Format JS/TS files with Biome (scoped to the single edited file).
    if file_path.endswith((".ts", ".tsx", ".js", ".jsx")):
        run(["pnpm", "exec", "biome", "check", "--write", file_path])

    # 2. Typecheck core-app for .ts/.tsx edits.
    #    The tsconfig pins ignoreDeprecations "6.0" (future TS 6), but the installed
    #    compiler is TS 5.x which only accepts "5.0" — override at the CLI so tsc can
    #    actually run instead of aborting with TS5103. CLI value wins over tsconfig.
    if file_path.endswith((".ts", ".tsx")):
        tc = run(
            ["npx", "tsc", "--noEmit", "-p", "apps/core-app/tsconfig.json", "--ignoreDeprecations", "5.0"]
        )
        if tc.returncode != 0:
            out = (tc.stdout + tc.stderr).strip().splitlines()
            sys.stderr.write(
                "Typecheck failed after editing "
                + file_path
                + " (first 40 lines):\n"
                + "\n".join(out[:40])
                + "\n"
            )
            return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
