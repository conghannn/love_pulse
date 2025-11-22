# Deployment Guide - Love Pulse 💕

This guide will help you deploy your Love Pulse web app so you and your girlfriend can use it in any browser!

## Quick Deploy Options

### Option 1: Deploy with Vercel CLI (Recommended - Fastest)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy your app**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? Choose your account
   - Link to existing project? **No**
   - Project name? (Press Enter for default or type a custom name)
   - Directory? (Press Enter for current directory)
   - Override settings? **No**

4. **Your app will be live!** Vercel will give you a URL like: `https://your-app-name.vercel.app`

5. **Share the URL** with your girlfriend so you both can access it!

### Option 2: Deploy via Vercel Website (No CLI needed)

1. **Go to [vercel.com](https://vercel.com)** and sign up/login (free account)

2. **Click "Add New Project"**

3. **Import your Git repository**:
   - If your code is on GitHub/GitLab/Bitbucket, connect it
   - Or drag and drop your project folder

4. **Configure the project**:
   - Framework Preset: **Other**
   - Root Directory: `./` (current directory)
   - Build Command: Leave empty (or `npm run build` if you add one)
   - Output Directory: Leave empty

5. **Click "Deploy"**

6. **Your app will be live in minutes!**

### Option 3: Deploy via GitHub Pages (Free)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to your GitHub repository**

3. **Settings → Pages**

4. **Source**: Deploy from branch `main` / `root`

5. **Your app will be at**: `https://yourusername.github.io/repository-name`

## Important Notes

- **Data Storage**: This app uses `localStorage` in the browser, so each person's data is stored on their own device
- **No Backend**: Since it's a static site, no server is needed - perfect for free hosting!
- **Custom Domain**: You can add a custom domain in Vercel settings if you want

## After Deployment

1. **Test the app** on your phone and computer
2. **Share the URL** with your girlfriend
3. **Bookmark it** for easy access
4. **Install as PWA**: On mobile, you can "Add to Home Screen" for an app-like experience

## Troubleshooting

- If the app doesn't load, check the browser console for errors
- Make sure all files are included in the deployment
- For Vercel: Check the deployment logs in the Vercel dashboard

---

**Need help?** The app is ready to deploy - just choose one of the options above!

