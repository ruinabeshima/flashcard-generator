# File Uploader

- Background image taken from: https://www.freepik.com/free-vector/gradient-trendy-background_44132199.htm#fromView=keyword&page=1&position=2&uuid=bf4dfc34-abda-4fd2-a4ca-2c2d252d8812&query=Gradient+background
- svg icon taken from: https://www.svgrepo.com/svg/532786/file-pencil-alt

## Authentication

- Used Supabase Auth to manage login and register.
- Google OAuth + Email accounts.
- Added loading states and error message handling for all buttons / form submits.
- Handled redirects when the user is logged in or logged out.
Added logout button to clear session.

- TODO: Client side validation

## File Upload

- Created a supabase Documents bucket to handle storage of file uploads
- Working file upload function in dashboard page
- Files are stored in codes to prevent duplicates
