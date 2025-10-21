#!/usr/bin/env python3
"""
Script to start the backend server with proper environment configuration
"""
import os
import sys
from pathlib import Path

# Set environment variables before importing the server
ROOT_DIR = Path(__file__).parent

# Set environment variables for local development
os.environ.setdefault('MONGO_URL', 'mongodb://localhost:27017')
os.environ.setdefault('DB_NAME', 'fixgsm')
os.environ.setdefault('JWT_SECRET_KEY', 'fixgsm-secret-key-change-in-production-2024')
os.environ.setdefault('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000')

# Import and run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
