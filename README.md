# OpenSCAD Files - 3D Model Sharing Platform

A modern web application for creating, sharing, and viewing OpenSCAD 3D models with real-time preview capabilities.

## Features

### 🎯 Core Functionality
- **Create OpenSCAD Models**: Professional code editor using CodeMirror
- **Real-time 3D Preview**: Instant GLB generation and 3D model viewing using Google Model Viewer
- **Model Sharing**: Share your OpenSCAD creations with the community
- **Search & Browse**: Find models by title, description, tags, or author
- **Download Models**: Export models as `.scad` files for local use

### 🛠️ Technical Features
- **Interactive Code Editor**: 
  - Dark theme with Monaco/Menlo fonts
  - Real-time code validation
- **3D Model Processing**: 
  - Automatic SCAD to GLB conversion
  - Color support and material handling
  - Optimized for web viewing
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Database Integration**: PostgreSQL with Drizzle ORM for data persistence
- **File Storage**: Firebase Storage integration for GLB files

## Tech Stack

- **Frontend**: SvelteKit 2, TypeScript, CodeMirror 6
- **Backend**: Node.js, SvelteKit API routes
- **Database**: PostgreSQL with Drizzle ORM
- **3D Processing**: OpenSCAD CLI integration
- **3D Viewer**: Google Model Viewer
- **File Storage**: Firebase Admin SDK
- **Styling**: Custom CSS with responsive design
- **Development**: Vite, TypeScript, Docker Compose

## Prerequisites

- Node.js 18+ or Deno
- PostgreSQL database
- OpenSCAD installed and available in PATH
- Firebase project (for GLB storage)

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd scad
```

### 2. Install Dependencies
```bash
npm install
# or with Deno
deno install
```

### 3. Database Setup
Start PostgreSQL using Docker Compose:
```bash
npm run db:start
```

Set up your database schema:
```bash
npm run db:push
```

### 4. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgres://root:mysecretpassword@localhost:5432/local"
# Add Firebase credentials and other required variables
```

### 5. Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to see the application.

## Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run dev -- --open` - Start development server and open browser

### Database
- `npm run db:start` - Start PostgreSQL with Docker Compose
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate migration files
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio for database management

### Build & Deploy
- `npm run build` - Create production build
- `npm run preview` - Preview production build
- `npm run check` - Type check the project

## Project Structure

```
src/
├── routes/                 # SvelteKit routes
│   ├── +page.svelte       # Home page - browse models
│   ├── create/            # Create new SCAD file
│   ├── [scad]/            # View/edit individual SCAD file
│   ├── admin/             # Admin dashboard
│   ├── reports/           # Usage reports
│   └── api/               # API endpoints
├── lib/
│   └── server/
│       ├── db/            # Database schema and connections
│       └── [utilities]    # Server-side utilities
└── static/
    └── models/            # Static 3D model files
```

## Key Features Explained

### 1. Create Page (`/create`)
- Professional code editor
- Real-time 3D preview generation
- Default example code showing common OpenSCAD shapes
- Form validation and error handling

### 2. Model Viewer (`/[scad]`)
- Edit existing models with live preview updates
- Save changes to database and Firebase Storage
- Download models as `.scad` files
- Responsive split-panel design

### 3. Home Page (`/`)
- Browse all public models
- Search functionality across titles, descriptions, and tags
- Grid view with 3D previews
- Click to view/edit models

### 4. 3D Model Processing
- Converts OpenSCAD code to GLB format using OpenSCAD CLI
- Handles colors and materials
- Optimizes file size for web delivery
- Fallback handling for processing errors

## Database Schema

### Users Table
- User authentication and profile information
- Tracks creation timestamps

### SCADS Table
- Model metadata (title, description, tags)
- OpenSCAD source code storage
- File size and download tracking
- Firebase Storage GLB URLs
- Public/private visibility controls

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m "Add feature"`
5. Push to your branch: `git push origin feature-name`
6. Open a Pull Request

## License

This project is private and proprietary.

## Support

For support or questions about this OpenSCAD sharing platform, please open an issue in the repository.