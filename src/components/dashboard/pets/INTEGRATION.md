Integration Notes: Pets API
==========================

What changed
- The frontend pet client (`src/lib/pets.ts`) now prefers the real API under `/api/pets` for list/get/create/update/delete and still falls back to the localStorage mock if the API is unreachable.
- A simple avatar upload endpoint was added: `POST /api/pets/:id/avatar`. It accepts a JSON body `{ dataUrl: string }` where `dataUrl` is a base64 data URL (e.g., `data:image/png;base64,...`). The server writes the decoded image to `public/uploads` and returns `{ url: '/uploads/filename.ext' }`.

How the flow works
- Create pet: frontend calls `POST /api/pets` with pet data. Server returns the created pet including `id`.
- Upload avatar (optional): frontend calls `POST /api/pets/:id/avatar` with `{ dataUrl }`. Server returns hosted URL. Frontend saves that URL back to the pet via `PUT /api/pets/:id`.

Notes & Caveats
- The avatar upload endpoint writes files to the project's `public/uploads` folder. This works in local development. In production (serverless hosts) the filesystem may be ephemeral; for production you should replace this endpoint to upload to cloud storage (S3/Cloudinary) and store the resulting URL in the DB.
- Server-side validation in the API routes is lightweight. Consider adding stricter validation (e.g., Zod) and size limits for uploads.

Commands
- Run the dev server:
```
npm run dev
```
- Apply DB migration (example using psql):
```
psql "postgres://user:pass@host:5432/dbname" -f database_migration_pets.sql
```
