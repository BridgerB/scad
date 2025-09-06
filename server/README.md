# OpenSCAD Conversion API Server

Express.js API server that converts OpenSCAD code to GLB format using the
openscad-playground utilities.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Make sure OpenSCAD is installed and available in PATH:

```bash
openscad --version
```

3. Ensure openscad-playground project is available at
   `/home/ubuntu/git/openscad-playground/`

4. Configure environment variables:

```bash
cp .env.example .env
# Edit .env and set your API_KEY
```

## Running

```bash
# Development (with auto-restart)
npm run dev

# Production (TypeScript with tsx)
npm start

# Alternative (if you have server.js built)
npm run start:js
```

Server runs on port 3001 by default (or PORT environment variable).

## API Usage

### Health Check

```bash
curl http://localhost:3001/health
```

### Convert SCAD to GLB

```bash
curl -X POST http://localhost:3001/api/convert-scad \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -d '{"scadContent": "sphere(r = 1);"}'
```

### Response Format

```json
{
  "success": true,
  "glbData": "base64-encoded-glb-data",
  "metadata": {
    "vertices": 15,
    "faces": 26,
    "colors": 1,
    "glbSize": 1708,
    "scadLength": 14
  }
}
```

## Security

- API requires `x-api-key` header (set via environment variable)
- CORS enabled for cross-origin requests
- 10MB request size limit
- 30 second timeout for OpenSCAD compilation

## Error Handling

- 400: Missing or invalid scadContent
- 401: Missing API key
- 403: Invalid API key
- 500: Conversion or server errors

All errors include timestamp and descriptive error messages.
