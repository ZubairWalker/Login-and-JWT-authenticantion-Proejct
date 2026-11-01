# Advanced RBAC + Ownership API

Express, MongoDB, and TypeScript API demonstrating access/refresh token authentication, email verification, role-based access control (RBAC), and Todo ownership checks.

## Setup

Create a `.env` file:

```env
MongoDB_URL=mongodb://127.0.0.1:27017/rbac-api
JWT_SECRET=use-a-long-random-secret
PORT=3000
APP_URL=http://localhost:3000
```

Run `npm install`, then `npm run dev`. During development, verification links are printed to the server console.

### Bootstrap the first admin

Registration always creates a `user` account; clients must never be allowed to self-register as an admin. After registering and verifying an initial account, promote it once in MongoDB:

```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { roles: ["admin"] } }
)
```

That admin can then update other users' roles through the admin endpoint.

## Roles and security rules

- `user` accounts can read `/api/me`, update `/api/me` (once verified), and manage only their own Todos.
- `admin` accounts can manage users, view any user's Todos, and view statistics.
- **Deactivation**: Admins can activate or deactivate accounts. Deactivated users cannot log in, refresh tokens, or call authenticated endpoints (returns 403 `ACCOUNT_DEACTIVATED`).
- **Self-protection rules**: An admin cannot change their own roles (returns 403 `FORBIDDEN`) and cannot deactivate themselves (returns 403 `FORBIDDEN`).
- **Email Verification Gating**: Unverified users can log in and view `/api/me`. Write actions (`PATCH /api/me`, `POST /api/todos`, `PATCH /api/todos/:id`, `DELETE /api/todos/:id`) are gated and return 403 `EMAIL_NOT_VERIFIED`.
- **IDOR Protection**: A Todo lookup for a non-owner intentionally returns **404**, rather than 403. This prevents an attacker from learning whether another user's Todo exists.
- **Consistent Response Format**:
  - Success responses return `{ "success": true, ... }`
  - Error responses return `{ "success": false, "error": "CODE", "message": "..." }`
- **Security Middlewares**: Equipped with `helmet` for secure HTTP headers, `cors` for cross-origin requests, and `express-rate-limit` for DDoS / brute-force protection.

## Endpoints

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an unverified account and print a verification link |
| GET | `/api/auth/verify-email?token=...` | Verify an account |
| POST | `/api/auth/resend-verification` | Resend a verification link for an email |
| POST | `/api/auth/login` | Get access and refresh tokens (succeeds even if unverified) |
| POST | `/api/auth/refresh` | Rotate a refresh token |
| POST | `/api/auth/logout` | Revoke a refresh token |

Registration body:

```json
{
  "email": "jane@example.com",
  "username": "jane",
  "password": "strong-password",
  "profile": { "firstName": "Jane", "lastName": "Doe" }
}
```

### Profiles

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/users/:id` | Public profile view |
| GET | `/api/me` | Authenticated owner |
| PATCH | `/api/me` | Verified owner only (gated with `EMAIL_NOT_VERIFIED`) |

### Todos

All Todo routes require `Authorization: Bearer ACCESS_TOKEN`. Mutating actions require email verification.

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/todos` | Verified owner (gated with `EMAIL_NOT_VERIFIED`) |
| GET | `/api/todos` | List own Todos (`?page=1&limit=10`) |
| GET | `/api/todos/:id` | Owner, or admin (returns 404 for non-owners) |
| PATCH | `/api/todos/:id` | Verified owner, or admin (gated with `EMAIL_NOT_VERIFIED`) |
| DELETE | `/api/todos/:id` | Verified owner, or admin (gated with `EMAIL_NOT_VERIFIED`) |

### Admin

Every endpoint below requires an authenticated, verified `admin` role.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/admin/stats` | User and Todo statistics |
| GET | `/api/admin/users` | List users (`?page=1&limit=10`) |
| GET | `/api/admin/users/:id` | Get any user |
| PATCH | `/api/admin/users/:id` | Update a user's profile, roles, or status (403 on self-role change or self-deactivation) |
| PATCH | `/api/admin/users/:id/status` | Activate or deactivate a user with `{ "isActive": false }` (403 on self-deactivation) |
| GET | `/api/admin/users/:id/todos` | View any user's Todos |
