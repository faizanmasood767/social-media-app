# fieldnotes — Mini Social Media Platform

Built for CodeAlpha Full Stack Development Internship — Task 2.

**Stack:** Express.js (backend) + Supabase/Postgres (database) + plain HTML/CSS/JS (frontend), with JWT authentication.

## Features
- User accounts: register / log in (JWT-based)
- Profiles: username, bio, avatar (auto-generated color monogram), edit your own bio
- Posts: create, delete (owner only), feed of all posts
- Comments: add / view comments on any post
- Likes: like / unlike posts
- Follow system: follow / unfollow users, "Following" feed tab, follower/following counts

## Project structure
```
social-app/
  server/            Express API
    src/
      config/        Supabase client
      middleware/     JWT auth middleware
      controllers/    Route logic (auth, users, posts, comments)
      routes/         Express routers
      index.js        App entry point
    sql/schema.sql    Run this in Supabase to create your tables
    .env.example      Copy to .env and fill in your keys
  client/            Plain HTML/CSS/JS frontend
    index.html        Feed page (requires login)
    login.html / register.html
    profile.html       User profile + their posts
    css/style.css
    js/                api.js, ui.js, postcard.js, auth.js, feed.js, profile.js
```

## Setup

### 1. Create a Supabase project
1. Go to https://supabase.com, create a free account and a new project.
2. Once it's ready, open **SQL Editor → New query**, paste the contents of
   `server/sql/schema.sql`, and run it. This creates the `users`, `posts`,
   `comments`, `likes`, and `follows` tables.
3. Go to **Project Settings → API**. You'll need:
   - **Project URL** (`SUPABASE_URL`)
   - **service_role key** (`SUPABASE_SERVICE_ROLE_KEY`) — NOT the anon key.
     This key has full database access, so it's only used on the server,
     never in the browser.

### 2. Configure and run the backend
```bash
cd server
cp .env.example .env
# edit .env and paste in your SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and a JWT_SECRET
npm install
npm run dev        # or: npm start
```
The API will run at `http://localhost:5000`.

### 3. Run the frontend
The frontend is plain static files — no build step needed. Easiest option:
```bash
cd client
npx serve .
# or just open index.html directly in your browser
```
If your API runs on a different port/host, update `API_BASE` in `client/js/config.js`.

### 4. Try it out
1. Open the frontend, click **Sign up**, create an account.
2. Post something on the feed.
3. Create a second account (use an incognito window), follow the first user,
   like their post, and leave a comment.
4. Check the **Following** tab and each user's **profile** page.

## API overview

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | – | Create account |
| POST | /api/auth/login | – | Log in |
| GET | /api/users/:id | optional | Get a profile + counts |
| PUT | /api/users/:id | required (owner) | Update your bio |
| POST/DELETE | /api/users/:id/follow | required | Follow / unfollow |
| GET | /api/users/:id/followers | – | List followers |
| GET | /api/users/:id/following | – | List who they follow |
| GET | /api/users/:id/posts | optional | A user's posts |
| GET | /api/posts?scope=all\|following | optional | Feed |
| POST | /api/posts | required | Create post |
| DELETE | /api/posts/:id | required (owner) | Delete post |
| POST/DELETE | /api/posts/:id/like | required | Like / unlike |
| GET | /api/posts/:postId/comments | – | List comments |
| POST | /api/posts/:postId/comments | required | Add comment |
| DELETE | /api/comments/:id | required (owner) | Delete comment |

## Notes on design decisions
- **Auth**: custom JWT (bcrypt-hashed passwords, 7-day tokens) rather than
  Supabase Auth, so you have full visibility into how the auth flow works —
  useful for explaining it in a viva or interview.
- **Access control**: Supabase's Row Level Security is left off; the Express
  server (using the service_role key) enforces every permission check itself
  (e.g. "only the post's owner can delete it").
- **Frontend**: no framework, per the task spec — vanilla JS with a small
  `fetch` wrapper (`js/api.js`) and DOM templating.
