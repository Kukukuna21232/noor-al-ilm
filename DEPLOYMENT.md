# 🚀 Noor Al-Ilm Deployment Guide

## Phase 1: Frontend Demo (Vercel)

### Prerequisites
- GitHub account
- Vercel account
- Node.js 20+ installed locally

### Step 1: GitHub Repository
1. Create new repository on GitHub: `noor-al-ilm`
2. Add remote origin:
```bash
git remote add origin https://github.com/YOUR_USERNAME/noor-al-ilm.git
git push -u origin main
```

### Step 2: Vercel Deployment
1. Sign up at [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### Step 3: Environment Variables
Add these in Vercel dashboard:
```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_API_URL=https://your-api-url.com
NEXT_PUBLIC_WS_URL=wss://your-api-url.com
```

### Step 4: Deploy
- Vercel will automatically deploy on push
- Visit: `https://your-app.vercel.app`

## Demo Features Ready
✅ Bilingual Arabic/Russian/English UI  
✅ Luxury Islamic design  
✅ Responsive mobile/desktop  
✅ Quran reader interface  
✅ Course catalog  
✅ Forum layout  
✅ AI Imam chat interface  
✅ Authentication flows  
✅ Payment UI  
✅ PWA features  

## Next Steps
- Phase 2: Backend deployment (Railway)
- Phase 3: Database integration
- Phase 4: Full production setup
