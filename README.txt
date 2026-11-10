GOOD NOURA – WEBSITE + ADMIN (all files)
=========================================

WHAT'S INSIDE
  Frontend (the shop customers see)
    index.html                 Home page
    bundles.html               Shop page (single jars + bundles)
    product.html               Product page (gallery, sizes, reviews)
    make-your-own-bundle.html  Build-your-own bundle
    checkout.html              Checkout (cash on delivery / bank transfer)
    our-story.html, contact.html
    site.css, site.js          Shared look and shop logic (cart, delivery charges)
    catalog.js                 Starting product data (used on first run, and as a
                               fallback if pages are opened without the server)
    img/                       Logo, product photos, page photos

  Backend (server + admin)
    server.js                  The server: shop, orders, admin API, database
    admin.html, admin.css, admin.js   The admin dashboard (/admin)
    data/goodnoura.db          The database: orders, products, prices, reviews,
                               promo codes, settings, your admin password (hashed)
    start-shop.bat             Double-click to start the shop on Windows

HOW TO RUN IT
  1. Install Node.js version 22.5 or newer (nodejs.org). No other installs needed.
  2. Double-click start-shop.bat  (or run:  node server.js  in this folder)
  3. Shop:  http://localhost:5173        Admin:  http://localhost:5173/admin

  Log in to the admin with the same password you use now.
  To start fresh with no orders, delete the data folder before starting; the shop
  will rebuild it from catalog.js and ask you to create a new admin password.

KEEP THIS FILE PRIVATE
  data/goodnoura.db holds your customers' names, phone numbers and addresses.
  Don't post this zip publicly or send it to anyone you don't trust.
