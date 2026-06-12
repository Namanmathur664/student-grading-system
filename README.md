# Student Grading System

A full-stack student grading system using an SQL database and a responsive HTML/CSS/JavaScript frontend.

## Features

- SQL-backed data storage with SQLite
- Student management (add, edit, delete)
- Grade entry for multiple subjects
- Computed total, percentage, and letter grade
- Clean responsive interface with Bootstrap and custom styling

## Run locally

1. Open a terminal in the project folder.
2. Install dependencies:

```bash
npm install
```

3. Start the app:

```bash
npm start
```

4. Open your browser at `http://localhost:3000`.

> Important: Do not open `public/index.html` directly from the file system. The app must be served from the Express server so the SQL API can save and retrieve data.

## Project structure

- `server.js` - Express backend and SQLite database initialization
- `public/` - frontend files
- `db/` - SQLite database file
