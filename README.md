
# Cosmo Dumplings POS

A modern, slick Point of Sale system built with React, Tailwind CSS, and Google Gemini AI.

## 🚨 CRITICAL SETUP STEP: DATABASE

**You must create the database tables for the app to work.**

1.  **Copy SQL**: Open `db/setup.sql` in this project and copy all the code.
2.  **Open Supabase**: Go to the [Supabase SQL Editor](https://supabase.com/dashboard/project/wzndruiqqylcjcnlonqi/sql).
3.  **Run Script**: Paste the code and click **Run**.
4.  **Restart App**: Refresh the application page.

If you see errors like `Could not find the table`, it means this step was skipped or the table name is incorrect. The `db/setup.sql` file contains the authoritative schema.

---

## 🚀 Getting Started

### 1. Initialize Git Repository
To connect this project to GitHub, open your terminal in the project directory and run:

```bash
# 1. Initialize git in your project folder
git init

# 2. Add all files
git add .

# 3. Commit changes
git commit -m "Initial commit: Cosmo POS App"

# 4. Rename branch to main
git branch -M main

# 5. Add your GitHub repository (Create one at https://github.com/new first)
# Replace 'YOUR_USERNAME' and 'cosmo-pos' with your actual details
git remote add origin https://github.com/YOUR_USERNAME/cosmo-pos.git

# 6. Push to GitHub
git push -u origin main
```

### 2. Features
- **POS**: Responsive grid, cart management, cash/card checkout.
- **Admin**: Product management with image upload, user management.
- **AI Assistant**: Powered by Google Gemini.
- **Security**: PIN protection for staff access with visual feedback.
- **Kitchen Display**: Dedicated KDS view for back-of-house (synced via DB).
- **Supabase Integration**: Real-time database for products, users, customers, orders, and screens.

## ☁️ Deploy to Vercel

To publish this app to the internet using Vercel:

1.  **Push to GitHub**: Ensure you have pushed your code to GitHub (see step 1 above).
2.  **Login to Vercel**: Go to [vercel.com](https://vercel.com) and sign up/login with GitHub.
3.  **Import Project**:
    *   Click "Add New..." -> "Project".
    *   Select your `cosmo-pos` repository.
4.  **Configure Project**:
    *   **Framework Preset**: Vercel should auto-detect "Create React App".
    *   **Build Command**: `npm run build` (default).
    *   **Output Directory**: `build` (default).
5.  **Deploy**: Click "Deploy".
6.  **Done**: Your app is now live!
