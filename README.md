# File Uploader

Deployed: https://file-uploader-3o1nbnpg0-rui-nabeshimas-projects.vercel.app/

## Authentication

Used Supabase Auth to manage login and register.
Google OAuth + Email accounts.
Added loading states and error message handling for all buttons / form submits.
Handled redirects when the user is logged in or logged out.
Added logout button to clear session.

TODO: Client side validation

### Localhost Redirect Setup

If OAuth or email login redirects to the deployed Vercel domain while running `npm run dev`, update your Supabase project settings:

- In Supabase Dashboard → Authentication → URL Configuration:
  - Site URL: keep your production domain for prod.
  - Additional Redirect URLs: add these for local dev:
    - `http://localhost:3000`
    - `http://localhost:3000/auth/callback`
    - `http://localhost:3000/confirm-email`
- The app passes `redirectTo: ${window.location.origin}/auth/callback?next=/dashboard` for Google OAuth and `emailRedirectTo: ${location.origin}/auth/callback?next=/confirm-email` for email. These will use `http://localhost:3000` when running locally, as long as localhost is allowed in Supabase.
- After updating, restart the dev server and try logging in again. You should be redirected to `http://localhost:3000/auth/callback` and then to `/dashboard`.

## File Upload

Created a supabase Documents bucket to handle storage of file uploads
Working file upload function in dashboard page
Files are stored in codes to prevent duplicates
