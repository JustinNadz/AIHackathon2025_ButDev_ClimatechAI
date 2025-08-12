# Pivot Backend

A simple FastAPI backend for the Pivot Frontend application.

## Features

- **FastAPI**: Modern, fast web framework for building APIs
- **CORS Support**: Configured for React frontend
- **Health Check**: Basic health monitoring endpoints
- **Map Analysis**: Placeholder endpoint for AI map analysis
- **Environment Configuration**: Support for environment variables

## Setup

1. **Create Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Configuration**
   - Copy `env.example` to `.env`
   - Configure your environment variables as needed

4. **Run the Server**
   ```bash
   python main.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Endpoints

### Health Check
- `GET /` - Root endpoint with health status
- `GET /health` - Health check endpoint

### Map Analysis
- `POST /api/map-analysis` - Placeholder for AI map analysis
  - Request body: `{"latitude": float, "longitude": float, "radius": float}`
  - Response: Analysis summary, risk level, and recommendations

### Environment Info
- `GET /api/env-info` - Get environment configuration status

## API Documentation

Once the server is running, you can access:
- **Interactive API docs**: http://localhost:8000/docs
- **ReDoc documentation**: http://localhost:8000/redoc

## Development

The server runs on `http://localhost:8000` by default and is configured to accept requests from the React frontend running on `http://localhost:3000`.

## Project Structure

```
PivotBackend/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── env.example         # Environment variables template
└── README.md           # This file
```

## Notes

- CORS is configured to allow requests from `http://localhost:3000`
- The map analysis endpoint is currently a placeholder
- Environment variables are loaded from `.env` file
