#!/bin/bash
# Render startup script for Terminal Pro Backend

# Start the FastAPI application with Uvicorn
uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
