# 🚀 Vercel Deployment Guide - Orbital Guard AI

## Quick Start (5 Minutes)

### Option 1: Vercel CLI (Recommended)

```bash
# 1. Install Vercel CLI globally
npm install -g vercel

# 2. Navigate to frontend directory
cd C:\Users\Varun\.gemini\antigravity\scratch\space-debris-ai\frontend

# 3. Login to Vercel (opens browser)
vercel login

# 4. Deploy preview
vercel

# 5. Deploy to production
vercel --prod
```

**Your site will be live at**: `https://your-project-name.vercel.app`

---

### Option 2: Vercel Dashboard (No CLI)

1. **Create GitHub Repository** (if not already done):
   ```bash
   cd C:\Users\Varun\.gemini\antigravity\scratch\space-debris-ai
   git init
   git add .
   git commit -m "Initial commit - Orbital Guard AI"
   ```

2. **Push to GitHub**:
   - Create new repository on GitHub
   - Follow GitHub instructions to push

3. **Deploy on Vercel**:
   - Go to https://vercel.com/new
   - Click "Import Project"
   - Select your GitHub repository
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Click "Deploy"

---

## 📋 Configuration Files Created

✅ `vercel.json` - Vercel configuration  
✅ `.env.production` - Production environment variables  
✅ `.vercelignore` - Files to exclude from deployment  

---

## 🎯 What Will Be Deployed

### ✅ Working Features:
- Modern glassmorphic UI
- 3D satellite visualization
- Voice control interface
- Capture method selector
- Modern dashboard
- All animations and effects
- Responsive design

### ⚠️ Note:
Backend features (API calls, ML predictions, database) will need the backend running separately. The frontend will work beautifully for demonstration purposes.

---

## 🔧 Environment Variables (Optional)

If deploying backend separately, update in Vercel Dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add:
   - `VITE_API_URL` = `https://your-backend-url.com`

---

## 📊 Expected Build Output

```
✓ Building for production...
✓ 1250 modules transformed
✓ Rendering chunks...
✓ dist/index.html                   0.65 kB
✓ dist/assets/index-abc123.js      450.23 kB
✓ dist/assets/index-def456.css      85.12 kB
✓ Build completed in 45s
```

---

## 🎉 After Deployment

Your site will be available at:
- **Preview**: `https://your-project-git-main.vercel.app`
- **Production**: `https://your-project.vercel.app`

### Custom Domain (Optional):
1. Go to project settings
2. Click "Domains"
3. Add your custom domain

---

## 🐛 Troubleshooting

### Build Fails?
```bash
# Clear cache and rebuild locally first
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

### Routes Not Working?
- Check `vercel.json` has the rewrite rule
- Vercel should handle SPA routing automatically

### Assets Not Loading?
- Verify `dist` folder is set as output directory
- Check build command is `npm run build`

---

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all config files are in `frontend/` directory
3. Ensure `package.json` has correct build scripts

---

## ✅ Ready to Deploy!

Run this command now:

```bash
cd C:\Users\Varun\.gemini\antigravity\scratch\space-debris-ai\frontend
vercel
```

Follow the prompts and your site will be live in minutes! 🚀
