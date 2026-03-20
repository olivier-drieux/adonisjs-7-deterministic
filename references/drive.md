# Drive

## Defaults

- Install with `node ace add @adonisjs/drive`.
- Use Drive for persistent file storage, signed downloads, and uploads.
- Store file keys in the database, not full provider URLs.

## Upload Rule

- Validate uploaded files with VineJS.
- For HTTP uploads, call `file.moveToDisk(key, disk?)`.
- Use `moveToDisk`, not local `move`, for persistent application storage.

## Service Rule

- For non-upload file operations, use `drive.use()` in a service.
- Prefer `put`, `get`, `exists`, and `delete` on the disk instance.

## URL Rule

- Use `getUrl` for public files.
- Use `getSignedUrl` for private files.
- Resolve file URLs in server code or transformed props instead of hardcoding provider URLs in React components.

## Local Disk Rule

- Keep local serving behavior in `config/drive.ts`.
- Configure `serveFiles`, `routeBasePath`, and visibility there.

## Testing Rule

- Use `drive.fake()` and restore it after each test.
