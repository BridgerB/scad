# OpenSCAD Files - 3D Model Sharing Platform

## Project Overview

This is a modern web application for creating, sharing, and viewing OpenSCAD 3D models with real-time preview capabilities. The platform allows users to write OpenSCAD code in a professional code editor and see real-time 3D previews of their models using Google Model Viewer.

### Key Features

- **Create OpenSCAD Models**: Professional code editor using CodeMirror with syntax highlighting
- **Real-time 3D Preview**: Instant GLB generation and 3D model viewing
- **Model Sharing**: Share OpenSCAD creations with the community
- **Search & Browse**: Find models by title, description, tags, or author
- **Download Models**: Export models as `.scad` or `.glb` files

### Tech Stack

- **Frontend**: SvelteKit 2, TypeScript, CodeMirror 6
- **Backend**: Node.js, SvelteKit API routes
- **Database**: PostgreSQL with Drizzle ORM
- **3D Processing**: OpenSCAD CLI integration via external API
- **3D Viewer**: Google Model Viewer
- **File Storage**: Firebase Storage
- **Styling**: Custom CSS with responsive design
- **Deployment**: Firebase App Hosting

## Project Structure

```
src/
├── routes/                 # SvelteKit routes
│   ├── +page.svelte       # Home page - browse models
│   ├── create/            # Create new SCAD file
│   ├── [scad]/            # View/edit individual SCAD file
│   └── api/               # API endpoints
│       ├── preview-glb/   # Generate GLB preview from SCAD
│       └── glb/[id]/      # Serve GLB files from Firebase
├── lib/
│   └── server/
│       ├── db/            # Database schema and connections
│       └── firebase-admin.ts # Firebase Admin SDK setup
└── app.html               # Main HTML template
```

## Database Schema

The application uses PostgreSQL with Drizzle ORM for data persistence:

### Users Table
- `id`: UUID (Primary Key)
- `username`: Text (Unique)
- `email`: Text (Unique)
- `createdAt`: Timestamp

### SCADS Table
- `id`: UUID (Primary Key)
- `title`: Text
- `description`: Text
- `content`: Text (OpenSCAD source code)
- `userId`: UUID (Foreign Key to Users)
- `tags`: Text
- `downloadCount`: Integer
- `fileSize`: Integer
- `glbUrl`: Text (Firebase Storage URL for GLB file)
- `isPublic`: Boolean
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### SCAD Photos Table
- `id`: UUID (Primary Key)
- `scadId`: UUID (Foreign Key to SCADS)
- `url`: Text
- `description`: Text
- `order`: Integer
- `createdAt`: Timestamp

### SCAD Ratings Table
- `id`: UUID (Primary Key)
- `scadId`: UUID (Foreign Key to SCADS)
- `userId`: UUID (Foreign Key to Users)
- `rating`: Integer (1 for like, -1 for dislike)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

## Key Routes

### Home Page (`/`)
- Browse all public models in a grid view
- Search functionality across titles, descriptions, and tags
- Pagination support
- 3D model previews using Google Model Viewer

### Create Page (`/create`)
- Professional code editor with CodeMirror
- Real-time 3D preview generation
- Default example code showing common OpenSCAD shapes
- Form for model metadata (title, description, tags)

### Model View/Edit Page (`/[scad]`)
- Edit existing models with live preview updates
- Save changes to database and Firebase Storage
- Download models as `.scad` or `.glb` files
- Responsive split-panel design (editor on left, viewer on right)
- Model statistics and metadata display

## 3D Model Processing

The application converts OpenSCAD code to GLB format using an external OpenSCAD API service:

1. **Preview Generation**: When users type in the code editor, the application sends the SCAD content to `/api/preview-glb`
2. **External API**: The API route forwards the request to an external OpenSCAD service that converts SCAD to GLB
3. **In-Memory Processing**: Preview GLBs are processed in-memory and converted to Blob URLs for immediate viewing
4. **Firebase Storage**: Final GLB files are stored in Firebase Storage when models are saved
5. **Proxy Serving**: GLB files are served through a proxy endpoint (`/api/glb/[id]`) that fetches from Firebase Storage

## Environment Configuration

The application requires several environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Base64-encoded Firebase service account JSON
- `OPENSCAD_API_URL`: External OpenSCAD API service URL
- `OPENSCAD_API_KEY`: API key for the OpenSCAD service

See `.env.example` for the required variables.

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Docker (for PostgreSQL via docker-compose)
- Firebase project (for GLB storage)
- Access to OpenSCAD API service

### Installation
1. Install dependencies: `npm install`
2. Start PostgreSQL: `npm run db:start`
3. Set up database schema: `npm run db:push`
4. Copy and configure environment: `cp .env.example .env`
5. Start development server: `npm run dev`

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Create production build
- `npm run preview`: Preview production build
- `npm run check`: Type check the project
- `npm run db:start`: Start PostgreSQL with Docker Compose
- `npm run db:push`: Push schema changes to database
- `npm run db:generate`: Generate migration files
- `npm run db:migrate`: Run database migrations
- `npm run db:studio`: Open Drizzle Studio for database management

## Deployment

The application is configured for deployment to Firebase App Hosting with the following configuration:
- Backend runs on Cloud Run
- Environment variables are managed through Firebase Secrets
- Database connection and Firebase credentials are securely stored
- Static assets and API routes are served through the same deployment

## Development Conventions

- **Code Style**: TypeScript with strict typing
- **Component Structure**: Svelte components with scoped CSS
- **Routing**: File-based routing using SvelteKit conventions
- **Database**: Drizzle ORM with PostgreSQL
- **API Routes**: SvelteKit server routes for backend functionality
- **State Management**: Svelte reactivity for client-side state
- **Error Handling**: Proper error responses and user feedback

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test thoroughly
4. Commit changes with descriptive messages
5. Push to your branch
6. Open a Pull Request