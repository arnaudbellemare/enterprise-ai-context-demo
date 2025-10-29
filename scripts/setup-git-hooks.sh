#!/bin/bash
# Setup Git Hooks for Code Quality and Security
# Prevents commits with API keys, type errors, and logging violations

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Setting up Git Hooks ===${NC}"

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# 1. Pre-commit hook for API key detection
cat > .git/hooks/pre-commit << 'PRECOMMIT'
#!/bin/bash
# Pre-commit hook: Prevent committing API keys and secrets

# API key patterns to detect
PATTERNS=(
    "sk-[a-zA-Z0-9]{20,}"                    # OpenAI keys
    "pplx-[a-zA-Z0-9]{20,}"                  # Perplexity keys
    "sk-ant-[a-zA-Z0-9]{20,}"                # Anthropic keys
    "AKIA[0-9A-Z]{16}"                       # AWS access keys
    "ghp_[a-zA-Z0-9]{36}"                    # GitHub personal access tokens
    "gho_[a-zA-Z0-9]{36}"                    # GitHub OAuth tokens
    "AIza[0-9A-Za-z\\-_]{35}"                # Google API keys
    "xox[baprs]-[0-9]{10,13}-[0-9a-zA-Z]{24,}" # Slack tokens
)

RED='\033[0;31m'
NC='\033[0m'

# Check staged files for API keys
for pattern in "${PATTERNS[@]}"; do
    if git diff --cached --diff-filter=ACM | grep -E "$pattern"; then
        echo -e "${RED}⛔ COMMIT BLOCKED: Potential API key detected!${NC}"
        echo ""
        echo "Pattern matched: $pattern"
        echo ""
        echo "Please remove the API key and use environment variables instead."
        echo "See frontend/lib/env-validation.ts for proper key management."
        echo ""
        echo "To bypass this check (NOT RECOMMENDED):"
        echo "  git commit --no-verify"
        exit 1
    fi
done

# Check for direct process.env access (should use env-validation.ts)
if git diff --cached --diff-filter=ACM | grep -E "process\.env\.[A-Z_]+" | grep -v "env-validation.ts" | grep -v "logger.ts"; then
    echo -e "${YELLOW}⚠️  WARNING: Direct process.env access detected${NC}"
    echo ""
    echo "Consider using @/lib/env-validation helpers:"
    echo "  import { getEnvOrThrow } from '@/lib/env-validation';"
    echo "  const key = getEnvOrThrow('API_KEY');"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Pre-commit security checks passed"
exit 0
PRECOMMIT

chmod +x .git/hooks/pre-commit
echo "  ✓ Created pre-commit hook (API key detection)"

# 2. Pre-push hook for type checking and linting
cat > .git/hooks/pre-push << 'PREPUSH'
#!/bin/bash
# Pre-push hook: Run type checking and linting before push

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Running pre-push checks...${NC}"

# Change to frontend directory
cd frontend 2>/dev/null || cd .

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found, skipping checks${NC}"
    exit 0
fi

# Run TypeScript type checking
echo "🔍 Checking TypeScript types..."
if ! npx tsc --noEmit; then
    echo -e "${RED}❌ TypeScript type checking failed${NC}"
    echo ""
    echo "Fix type errors before pushing:"
    echo "  cd frontend && npx tsc --noEmit"
    echo ""
    read -p "Push anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Run ESLint
echo "🔍 Running ESLint..."
if ! npm run lint 2>/dev/null; then
    echo -e "${YELLOW}⚠️  ESLint warnings detected${NC}"
    echo ""
    echo "Consider fixing linting issues:"
    echo "  cd frontend && npm run lint --fix"
    echo ""
    read -p "Push anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}✅ Pre-push checks passed${NC}"
exit 0
PREPUSH

chmod +x .git/hooks/pre-push
echo "  ✓ Created pre-push hook (type checking + linting)"

# 3. Commit message hook for conventional commits (optional)
cat > .git/hooks/commit-msg << 'COMMITMSG'
#!/bin/bash
# Commit message hook: Enforce conventional commit format (optional)

commit_msg_file=$1
commit_msg=$(cat "$commit_msg_file")

# Conventional commit pattern: type(scope): message
# Examples: feat(auth): add login, fix(api): handle errors
pattern="^(feat|fix|docs|style|refactor|perf|test|chore|ci|build)(\(.+\))?: .{1,}"

if ! echo "$commit_msg" | grep -Eq "$pattern"; then
    echo "⚠️  Commit message doesn't follow conventional commit format"
    echo ""
    echo "Expected format: type(scope): message"
    echo "Types: feat, fix, docs, style, refactor, perf, test, chore, ci, build"
    echo ""
    echo "Examples:"
    echo "  feat(auth): add OAuth login"
    echo "  fix(api): handle null responses"
    echo "  docs(readme): update installation steps"
    echo ""
    echo "Your message: $commit_msg"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

exit 0
COMMITMSG

chmod +x .git/hooks/commit-msg
echo "  ✓ Created commit-msg hook (conventional commits)"

echo ""
echo -e "${GREEN}✅ Git hooks installed successfully!${NC}"
echo ""
echo "Hooks active:"
echo "  1. pre-commit: Prevents API key commits, warns on process.env"
echo "  2. pre-push: Runs TypeScript + ESLint checks"
echo "  3. commit-msg: Suggests conventional commit format"
echo ""
echo "To bypass hooks (not recommended):"
echo "  git commit --no-verify"
echo "  git push --no-verify"
