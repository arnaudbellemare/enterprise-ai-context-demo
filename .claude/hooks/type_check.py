#!/usr/bin/env python3
"""
TypeScript Type Checking Hook for Claude Code

Automatically runs TypeScript type checking after Edit, MultiEdit, or Write operations
on TypeScript files (.ts, .tsx).
"""

import json
import sys
import subprocess
import re

try:
    input_data = json.loads(sys.stdin.read())
except json.JSONDecodeError as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)

tool_input = input_data.get("tool_input", {})
file_path = tool_input.get("file_path", "")

# Only run type checking on TypeScript files
if re.search(r"\.(ts|tsx)$", file_path):
    print(f"🔍 Running TypeScript type check on {file_path}...", file=sys.stderr)

    try:
        result = subprocess.run([
            "npx",
            "tsc",
            "--noEmit",
            "--skipLibCheck",
            file_path
        ], capture_output=True, text=True, check=True)

        print(f"✅ TypeScript type check passed for {file_path}", file=sys.stderr)

    except subprocess.CalledProcessError as e:
        print("⚠️  TypeScript errors detected - please review", file=sys.stderr)
        if e.stdout:
            print(e.stdout, file=sys.stderr)
        if e.stderr:
            print(e.stderr, file=sys.stderr)
        # Exit with code 2 to indicate type errors (non-fatal)
        sys.exit(2)
else:
    # Not a TypeScript file, skip type checking
    pass
