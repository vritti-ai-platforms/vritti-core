#!/usr/bin/env python3
"""PreToolUse guard for apps/core-app (React Native).

Reads the Claude Code hook payload from stdin, inspects the INCOMING content of a
Write/Edit (not the on-disk file, which is still pre-edit), and blocks the call
(exit 2) when it violates a quantum-ui-native convention.

Scoped to apps/core-app/**/*.{ts,tsx}. See .claude/rules/native-conventions.md.
"""
import json
import re
import sys


def candidate_text(tool_input: dict) -> str:
    # Write -> full file content; Edit -> the snippet being inserted.
    parts = []
    if tool_input.get("content"):
        parts.append(tool_input["content"])
    if tool_input.get("new_string"):
        parts.append(tool_input["new_string"])
    return "\n".join(parts)


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0  # never block on a parse error

    tool_input = data.get("tool_input", {}) or {}
    file_path = tool_input.get("file_path", "") or ""

    # Only guard core-app TypeScript/TSX files.
    if "apps/core-app/" not in file_path:
        return 0
    if not (file_path.endswith(".ts") or file_path.endswith(".tsx")):
        return 0

    text = candidate_text(tool_input)
    if not text:
        return 0

    violations = []

    # 1. Barrel import from the UI package (subpath imports only).
    if re.search(r"""from\s+['"]@vritti/quantum-ui-native['"]""", text):
        violations.append(
            "Barrel import from '@vritti/quantum-ui-native'. Use subpath imports "
            "like @vritti/quantum-ui-native/Button (enables tree-shaking)."
        )

    # 2. Hardcoded color in a style object ('transparent' is allowed and won't match).
    if re.search(
        r"""(backgroundColor|color|borderColor)\s*:\s*['"](#[0-9a-fA-F]|rgb|hsl)""",
        text,
    ):
        violations.append(
            "Hardcoded color in a style object. Use a className semantic token "
            "(bg-card, text-muted-foreground) or getTheme()."
        )

    # 3. Banned react-native component imports.
    if re.search(
        r"""import\s*\{[^}]*\b(Text|FlatList|ActivityIndicator)\b[^}]*\}\s*from\s*['"]react-native['"]""",
        text,
    ):
        violations.append(
            "Importing a banned react-native component. Use the quantum-ui-native "
            "equivalent: Text -> @vritti/quantum-ui-native/Text, FlatList -> "
            "/FlashList, ActivityIndicator -> /Spinner."
        )

    if violations:
        sys.stderr.write(
            "BLOCKED ("
            + file_path
            + "):\n- "
            + "\n- ".join(violations)
            + "\n"
        )
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
