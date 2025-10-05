#!/usr/bin/env python3
"""
Start the Real AI Backend with GEPA, LangStruct, and GraphRAG
"""

import sys
import os
import subprocess
import time
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 9):
        print("❌ Python 3.9+ is required. Current version:", sys.version)
        return False
    print(f"✅ Python version: {sys.version}")
    return True

def install_dependencies():
    """Install required dependencies"""
    print("📦 Installing dependencies...")
    
    requirements = [
        "fastapi",
        "uvicorn[standard]",
        "pydantic",
        "numpy",
        "asyncio",
        "datetime",
        "json",
        "random",
        "typing",
        "dataclasses",
        "enum",
        "collections"
    ]
    
    for package in requirements:
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", package], 
                         check=True, capture_output=True)
            print(f"✅ Installed {package}")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install {package}: {e}")
            return False
    
    return True

def start_backend():
    """Start the real backend server"""
    print("🚀 Starting Real AI Backend with GEPA, LangStruct, and GraphRAG...")
    
    # Change to the backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Start the server
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "src.api.real_ai_processor:app",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload"
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start backend: {e}")
        return False
    except KeyboardInterrupt:
        print("\n🛑 Backend stopped by user")
        return True

def main():
    """Main startup function"""
    print("🏭 Enterprise AI Context Engine - Real Backend Startup")
    print("=" * 60)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Failed to install dependencies")
        sys.exit(1)
    
    # Start backend
    print("\n🚀 Starting Real AI Backend...")
    print("📍 Backend will be available at: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🔍 Health Check: http://localhost:8000/health")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 60)
    
    start_backend()

if __name__ == "__main__":
    main()
