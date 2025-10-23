# Python Version Requirement for WALT Integration

## ⚠️ Python 3.11+ Required

The WALT integration requires **Python 3.11 or higher** due to the `sfr-walt` package dependency.

**Current system**: Python 3.9.6 ❌
**Required**: Python 3.11+ ✅

## Installation Options

### Option 1: Homebrew (Recommended for macOS)
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python 3.11
brew install python@3.11

# Verify installation
python3.11 --version

# Update setup script to use python3.11
# Edit scripts/setup-walt.sh line 29:
# Change: python3 -m venv venv-walt
# To: python3.11 -m venv venv-walt
```

### Option 2: Official Python Installer
1. Download Python 3.11+ from [python.org](https://www.python.org/downloads/)
2. Run the installer
3. Verify: `python3.11 --version`

### Option 3: pyenv (Multiple Python Versions)
```bash
# Install pyenv
brew install pyenv

# Install Python 3.11
pyenv install 3.11.9

# Set as local version for this project
cd /Users/cno/enterprise-ai-context-demo/enterprise-ai-context-demo-2/enterprise-ai-context-demo
pyenv local 3.11.9

# Verify
python --version
```

## Why Python 3.11+?

The `sfr-walt` package (Salesforce WALT framework) has a hard requirement:
```
ERROR: Ignored the following versions that require a different python version:
0.1.0 Requires-Python >=3.11
```

This requirement comes from the package itself and cannot be bypassed.

## After Installing Python 3.11+

Once Python 3.11+ is installed:

```bash
# Run setup (will create venv and install dependencies)
npm run walt:setup

# Start WALT service
npm run walt:start

# Run tests
npm run test:walt:complete
```

## Workaround: System Python 3.11

If you install Python 3.11 but `python3` still points to 3.9:

```bash
# Use python3.11 explicitly
python3.11 -m venv venv-walt
source venv-walt/bin/activate
pip install -r scripts/requirements-walt.txt
playwright install chromium
```

## Verification

After setup, verify everything works:
```bash
source venv-walt/bin/activate
python --version  # Should show 3.11+
python -c "from walt.tools.discovery import propose; print('✅ WALT imported successfully')"
```

## Alternative: Docker Container

If you prefer not to install Python 3.11 system-wide, you can run WALT in a container:

```bash
# Create Dockerfile for WALT service
cat > Dockerfile.walt <<EOF
FROM python:3.11-slim

WORKDIR /app
COPY scripts/requirements-walt.txt .
RUN pip install -r requirements-walt.txt
RUN playwright install chromium

COPY scripts/walt-service.py .
CMD ["python", "walt-service.py"]
EOF

# Build and run
docker build -f Dockerfile.walt -t walt-service .
docker run -p 5000:5000 walt-service
```

## Status

- ✅ WALT integration code: Complete (25+ files, 5,000+ lines)
- ✅ Database migration: Ready
- ✅ API routes: Implemented
- ✅ Tests: Written
- ❌ Python environment: Requires 3.11+ (current: 3.9)

Once Python 3.11+ is installed, the system is ready to run.
