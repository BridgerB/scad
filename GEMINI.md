# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Project Overview

This is **OpenSCAD Files** - a full-stack 3D model sharing platform built with SvelteKit that allows users to create, share, and view OpenSCAD 3D models with real-time preview capabilities.

The frontend is built with SvelteKit and TypeScript, using CodeMirror 6 for the code editor and Google Model Viewer for the 3D previews. The backend is a combination of SvelteKit API routes and a separate Express server for handling the OpenSCAD to GLB conversion. The database is PostgreSQL with Drizzle ORM, and Firebase Storage is used for file storage.

## Building and Running

### Prerequisites

*   Node.js 18+ or Deno
*   PostgreSQL database
*   OpenSCAD installed and available in PATH
*   Firebase project (for GLB storage)

### Installation

1.  **Clone the Repository**

    ```bash
    git clone <repository-url>
    cd scad
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    ```

3.  **Database Setup**

    Start PostgreSQL using Docker Compose:

    ```bash
    npm run db:start
    ```

    Set up your database schema:

    ```bash
    npm run db:push
    ```

4.  **Environment Configuration**

    Copy the example environment file:

    ```bash
    cp .env.example .env
    ```

    Edit `.env` with your configuration:

    ```env
    DATABASE_URL="postgres://root:mysecretpassword@localhost:5432/local"
    # Add Firebase credentials and other required variables
    ```

5.  **Development Server**

    ```bash
    npm run dev
    ```

    Visit `http://localhost:5173` to see the application.

### Available Scripts

*   `npm run dev`: Start development server
*   `npm run build`: Create production build
*   `npm run preview`: Preview production build
*   `npm run check`: Type check the project
*   `npm run db:start`: Start PostgreSQL with Docker Compose
*   `npm run db:push`: Push schema changes to database
*   `npm run db:generate`: Generate migration files
*   `npm run db:migrate`: Run database migrations
*   `npm run db:studio`: Open Drizzle Studio for database management

## Development Conventions

*   **Coding Style**: The project uses TypeScript and follows standard SvelteKit coding conventions.
*   **Testing**: There are no tests in the project.
*   **Commits**: Commit messages should be clear and concise.

## OpenSCAD Reference

You MUST visit and read the [OpenSCAD Cheatsheet](https://raw.githubusercontent.com/openscad/openscad.github.com/refs/heads/main/cheatsheet/index.html) to understand the complete OpenSCAD syntax. This comprehensive reference contains all OpenSCAD commands, functions, and syntax patterns that users will be writing in the CodeMirror editor.
