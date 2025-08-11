# Flood Data API Documentation

This API provides endpoints to retrieve flood data for integration with Google Maps and other frontend applications.

## Base URL
```
http://localhost:5000
```

## Endpoints

### 1. Get All Flood Data
**GET** `/api/flood-data`

Returns all flood data in GeoJSON format for Google Maps integration.

#### Query Parameters
- `min_risk` (optional): Minimum risk level (1-3 scale)
- `max_risk` (optional): Maximum risk level (1-3 scale)
- `limit` (optional): Maximum number of features to return (default: 1000)

#### Example Request
```
GET /api/flood-data?min_risk=2.0&max_risk=3.0&limit=500
```

#### Example Response
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[[122.33343, 10.66792], [122.33353, 10.66792], ...]]]
      },
      "properties": {
        "id": 1,
        "risk_level": 2.0,
        "risk_category": "medium"
      }
    }
  ],
  "total": 1
}
```

### 2. Get Flood Data Within Bounds
**GET** `/api/flood-data/bounds`

Returns flood data within specified geographic bounds.

#### Query Parameters
- `bounds` (required): Geographic bounds in format "lat1,lng1,lat2,lng2"

#### Example Request
```
GET /api/flood-data/bounds?bounds=10.6,122.3,10.7,122.4
```

#### Example Response
```json
{
  "type": "FeatureCollection",
  "features": [...],
  "total": 5
}
```

### 3. Get Flood Data Statistics
**GET** `/api/flood-data/stats`

Returns statistical information about flood data.

#### Example Request
```
GET /api/flood-data/stats
```

#### Example Response
```json
{
  "total_flood_areas": 150,
  "risk_statistics": {
    "min_risk": 1.0,
    "max_risk": 3.0,
    "avg_risk": 2.1
  },
  "risk_distribution": [
    {"risk_level": 1.0, "count": 45},
    {"risk_level": 2.0, "count": 60},
    {"risk_level": 3.0, "count": 45}
  ]
}
```

## Risk Categories

The API automatically categorizes risk levels:
- **Low**: 1.0 - 1.5
- **Medium**: 1.5 - 2.5
- **High**: 2.5 - 3.0

## Google Maps Integration

### 1. Load the API
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY"></script>
```

### 2. Fetch and Display Data
```javascript
async function loadFloodData() {
    const response = await fetch('/api/flood-data');
    const data = await response.json();
    
    // Add to Google Maps
    const floodLayer = new google.maps.Data();
    floodLayer.setMap(map);
    floodLayer.addGeoJson(data);
    
    // Style based on risk
    floodLayer.setStyle({
        property: 'risk_category',
        value: 'high',
        style: { fillColor: '#FF6B6B', fillOpacity: 0.7 }
    });
}
```

### 3. Interactive Example
Visit `http://localhost:5000` to see a working example with Google Maps integration.

## Error Responses

All endpoints return error responses in this format:
```json
{
  "error": "Error description"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad request (missing parameters, invalid format)
- `500`: Server error

## CORS Support

The API supports CORS for cross-origin requests from frontend applications.
