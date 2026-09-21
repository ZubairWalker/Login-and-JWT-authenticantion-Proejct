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

- `user` accounts can read and update only `/api/me` and manage only their own Todos.
- `admin` accounts can manage users, view any user's Todos, and view statistics.
- Protected endpoints require an access token and a verified email address.
- A Todo lookup for a non-owner intentionally returns **404**, rather than 403. This prevents an attacker from learning whether another user's Todo exists (IDOR protection).

## Endpoints

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an unverified account and print a verification link |
| GET | `/api/auth/verify-email?token=...` | Verify an account |
| POST | `/api/auth/resend-verification` | Resend a verification link for an email |
| POST | `/api/auth/login` | Get access and refresh tokens |
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
| GET | `/api/me` | Verified owner only |
| PATCH | `/api/me` | Verified owner only |

### Todos

All Todo routes require `Authorization: Bearer ACCESS_TOKEN` and a verified email.

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/todos` | Create own Todo |
| GET | `/api/todos` | List own Todos (`?page=1&limit=10`) |
| GET | `/api/todos/:id` | Owner, or admin |
| PATCH | `/api/todos/:id` | Owner, or admin |
| DELETE | `/api/todos/:id` | Owner, or admin |

### Admin

Every endpoint below requires an authenticated, verified `admin` role.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/admin/stats` | User and Todo statistics |
| GET | `/api/admin/users` | List users (`?page=1&limit=10`) |
| GET | `/api/admin/users/:id` | Get any user |
| PATCH | `/api/admin/users/:id` | Update a user's profile and/or roles |
| PATCH | `/api/admin/users/:id/status` | Activate or deactivate a user with `{ "isActive": false }` |
| GET | `/api/admin/users/:id/todos` | View any user's Todos |
