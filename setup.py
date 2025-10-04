#!/usr/bin/env python3
"""
Enterprise AI Context Engine - Setup Script
Automated setup for the full-stack enterprise AI platform
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return result
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        sys.exit(1)

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 9):
        print("❌ Python 3.9+ is required")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")

def setup_backend():
    """Setup backend dependencies"""
    print("\n🚀 Setting up backend...")
    
    # Install Python dependencies
    run_command("pip install -r deployment/requirements.txt", "Installing Python dependencies")
    
    # Create necessary directories
    os.makedirs("logs", exist_ok=True)
    os.makedirs("data", exist_ok=True)
    os.makedirs("data/test", exist_ok=True)
    
    print("✅ Backend setup completed")

def setup_frontend():
    """Setup frontend dependencies"""
    print("\n🎨 Setting up frontend...")
    
    # Change to frontend directory
    os.chdir("frontend")
    
    # Install Node.js dependencies
    run_command("npm install", "Installing Node.js dependencies")
    
    # Build frontend
    run_command("npm run build", "Building frontend")
    
    # Return to root directory
    os.chdir("..")
    
    print("✅ Frontend setup completed")

def setup_environment():
    """Setup environment configuration"""
    print("\n⚙️ Setting up environment...")
    
    # Create .env file if it doesn't exist
    if not os.path.exists(".env"):
        if os.path.exists("config/.env.example"):
            shutil.copy("config/.env.example", ".env")
            print("📝 Created .env file from template")
            print("⚠️  Please update .env with your actual API keys")
        else:
            print("⚠️  No .env.example found, please create .env manually")
    
    print("✅ Environment setup completed")

def setup_database():
    """Setup database configuration"""
    print("\n🗄️ Setting up database...")
    
    # Create database migrations directory
    os.makedirs("supabase/migrations", exist_ok=True)
    
    # Create sample migration
    migration_content = """-- Enterprise AI Context Engine - Initial Schema
-- This migration sets up the core tables for the platform

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Core tables
CREATE TABLE IF NOT EXISTS graph_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id VARCHAR(255) UNIQUE NOT NULL,
    state JSONB NOT NULL,
    query TEXT,
    industry VARCHAR(100),
    processing_time FLOAT,
    confidence FLOAT,
    gepa_optimized BOOLEAN DEFAULT FALSE,
    langstruct_enhanced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS structured_extractions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id VARCHAR(255) NOT NULL,
    schema_name VARCHAR(100) NOT NULL,
    extracted_data JSONB NOT NULL,
    confidence FLOAT NOT NULL,
    gepa_metrics JSONB,
    langstruct_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gepa_optimizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_prompt TEXT NOT NULL,
    optimized_prompt TEXT NOT NULL,
    iterations INTEGER NOT NULL,
    optimization_score FLOAT NOT NULL,
    efficiency_gain VARCHAR(50),
    rollouts INTEGER NOT NULL,
    reflection_depth INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_graph_states_thread_id ON graph_states(thread_id);
CREATE INDEX IF NOT EXISTS idx_structured_extractions_thread_id ON structured_extractions(thread_id);
CREATE INDEX IF NOT EXISTS idx_gepa_optimizations_created_at ON gepa_optimizations(created_at);

-- Enable Row Level Security
ALTER TABLE graph_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE structured_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gepa_optimizations ENABLE ROW LEVEL SECURITY;
"""
    
    with open("supabase/migrations/001_initial_schema.sql", "w") as f:
        f.write(migration_content)
    
    print("✅ Database setup completed")

def run_tests():
    """Run basic tests to verify setup"""
    print("\n🧪 Running tests...")
    
    # Test Python imports
    try:
        import fastapi
        import dspy
        import langgraph
        print("✅ Python dependencies imported successfully")
    except ImportError as e:
        print(f"❌ Python import error: {e}")
        return False
    
    # Test Node.js build
    if os.path.exists("frontend/.next"):
        print("✅ Frontend build successful")
    else:
        print("⚠️  Frontend build not found, run 'npm run build' in frontend/")
    
    return True

def main():
    """Main setup function"""
    print("🚀 Enterprise AI Context Engine - Setup")
    print("=" * 50)
    
    # Check Python version
    check_python_version()
    
    # Setup components
    setup_backend()
    setup_frontend()
    setup_environment()
    setup_database()
    
    # Run tests
    if run_tests():
        print("\n🎉 Setup completed successfully!")
        print("\n📋 Next steps:")
        print("1. Update .env with your API keys")
        print("2. Run: python src/api/inventory.py")
        print("3. Run: cd frontend && npm run dev")
        print("4. Visit: http://localhost:3000")
    else:
        print("\n⚠️  Setup completed with warnings")
        print("Please check the error messages above")

if __name__ == "__main__":
    main()
