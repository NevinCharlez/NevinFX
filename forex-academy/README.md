# PipForge Academy – Forex signals, results, PDFs & mentorship
Stack: **MySQL + PHP (API) + React (frontend, no build step)**. No external APIs.

## Folders
- `database.sql`  – import this in phpMyAdmin
- `api/`          – PHP backend (edit `api/config.php`)
- `uploads/`      – screenshots and PDFs are saved here
- `frontend/`     – the website (edit `frontend/config.js`)

## Run on your computer (easiest: XAMPP)
1. Install XAMPP, start **Apache** and **MySQL**.
2. Copy this whole folder to `C:\xampp\htdocs\forex-academy`.
3. Open http://localhost/phpmyadmin → Import → choose `database.sql`.
4. Open http://localhost/forex-academy/frontend/ and register an account.
5. Make yourself admin: in phpMyAdmin run
   `UPDATE users SET role='admin' WHERE email='your@email.com';`
6. Log out and in again. An **Admin** tab appears: post signals, results, PDFs, mentorships, approve payments.

## How payments work (no API)
User pays you by USDT, mobile money or Deriv transfer (details in `frontend/config.js`), pastes the reference, you check it in Admin > Payments and click **Approve**. Premium turns on for 30 days (change in `api/config.php`). TP and SL are never sent by the server to non-premium users, so they cannot be unlocked by inspecting the page.

## Hosting
GitHub Pages only serves static files, so it can host `frontend/` only. PHP + MySQL need a PHP host.
1. Backend (free): InfinityFree or similar. Upload `api/` and `uploads/`, create a MySQL database, import `database.sql`, edit `api/config.php`.
2. In `api/config.php` set `ALLOWED_ORIGIN` to `https://YOURNAME.github.io`.
3. In `frontend/config.js` set `API` and `UPLOADS` to your PHP host URLs.
4. Push the contents of `frontend/` to a GitHub repo → Settings → Pages → deploy from main branch.
(Or upload everything to the PHP host and skip GitHub.)
