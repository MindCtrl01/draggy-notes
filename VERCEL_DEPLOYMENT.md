# 🚀 Vercel Deployment Guide

This guide explains how to deploy your Draggy Notes app to Vercel with proper environment variable configuration.

## 📋 **Prerequisites**

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Backend API**: Your notes API should be deployed (e.g., on Vercel, Railway, or Heroku)

## 🔧 **Environment Variables Setup**

### **Step 1: Add Environment Variables in Vercel Dashboard**

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

#### **Required Variables:**
```bash
# API Configuration
VITE_API_BASE_URL=https://draggy-note-api.duckdns.org

# Optional Configuration (with defaults)
VITE_API_TIMEOUT=10000
```

#### **Environment Targeting:**
- **Production**: Set for production deployments
- **Preview**: Set for preview deployments (PR previews)
- **Development**: Set for local development (optional)

### **Step 2: Vercel CLI Method (Alternative)**

Install Vercel CLI and set variables:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add VITE_API_BASE_URL production
# Enter: https://draggy-note-api.duckdns.org

vercel env add VITE_API_TIMEOUT production  
# Enter: 10000
```

## 🌐 **Deployment Methods**

### **Method 1: GitHub Integration (Recommended)**

1. **Connect Repository**:
   - Go to Vercel Dashboard
   - Click "New Project"
   - Import from GitHub
   - Select your `draggy-notes` repository

2. **Configure Build Settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Deploy**:
   - Click "Deploy"
   - Vercel will automatically detect the `vercel.json` configuration

### **Method 2: Vercel CLI**

```bash
# In your project directory
vercel

# Follow the prompts:
# ? Set up and deploy? Yes
# ? Which scope? (your-username)
# ? Link to existing project? No
# ? What's your project's name? draggy-notes
# ? In which directory is your code located? ./

# Deploy to production
vercel --prod
```

## 🔄 **Environment Variable Configuration**

### **Current Configuration in Code:**

```typescript
// src/lib/config/api.ts
const getApiBaseUrl = () => {
  if (import.meta.env.PROD) {
    // Production: Use Vercel environment variable
    return import.meta.env.VITE_API_BASE_URL || 'https://draggy-note-api.duckdns.org';
  }
  
  // Development: Use local HTTPS server
  return import.meta.env.VITE_API_BASE_URL || 'https://localhost:7060/api';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10),
} as const;
```

### **Vercel.json Configuration:**

```json
{
  "env": {
    "VITE_API_BASE_URL": "@vite_api_base_url",
    "VITE_API_TIMEOUT": "@vite_api_timeout"
  },
  "build": {
    "env": {
      "VITE_API_BASE_URL": "@vite_api_base_url",
    }
  }
}
```

## 🎯 **Different Environment Setups**

### **Development (.env.local)**
```bash
VITE_API_BASE_URL=https://localhost:7060/api
VITE_API_TIMEOUT=10000
```

### **Production (Vercel Dashboard)**
```bash
VITE_API_BASE_URL=https://draggy-note-api.duckdns.org
VITE_API_TIMEOUT=10000
```

### **Preview (Vercel Dashboard)**
```bash
VITE_API_BASE_URL=https://your-staging-api.vercel.app/api
VITE_API_TIMEOUT=8000
```

## 🔒 **Security Best Practices**

### **✅ Safe for Client (VITE_ prefix):**
```bash
VITE_API_BASE_URL=https://api.example.com
VITE_APP_VERSION=1.0.0
VITE_FEATURE_FLAGS=true
```

### **❌ Server-only (No VITE_ prefix):**
```bash
DATABASE_URL=postgresql://...          # Server-side only
API_SECRET_KEY=secret123               # Server-side only
PRIVATE_KEY=-----BEGIN PRIVATE KEY---- # Server-side only
```

## 📊 **Monitoring & Debugging**

### **Check Environment Variables:**

Add this to your app for debugging:

```typescript
// Only in development
if (import.meta.env.DEV) {
  console.log('Environment Variables:', {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    API_TIMEOUT: import.meta.env.VITE_API_TIMEOUT,
    IS_PRODUCTION: import.meta.env.PROD,
    IS_VERCEL: !!import.meta.env.VITE_VERCEL_URL,
  });
}
```

### **Vercel Build Logs:**

Check build logs in Vercel Dashboard:
1. Go to your project
2. Click on a deployment
3. View "Build Logs" to see environment variable loading

## 🚨 **Common Issues & Solutions**

### **Issue: API calls fail in production**
**Solution**: Check that `VITE_API_BASE_URL` is set correctly in Vercel Dashboard

### **Issue: Environment variables not loading**
**Solution**: Ensure variables have `VITE_` prefix and are set in correct environment (Production/Preview)

### **Issue: Build fails**
**Solution**: Check that all required environment variables are set in Vercel Dashboard

### **Issue: Different behavior in preview vs production**
**Solution**: Set environment variables for both "Preview" and "Production" environments

## 📝 **Deployment Checklist**

- [ ] Backend API deployed and accessible
- [ ] Environment variables set in Vercel Dashboard
- [ ] `VITE_API_BASE_URL` points to correct API endpoint
- [ ] Repository connected to Vercel
- [ ] Build settings configured (Vite, dist output)
- [ ] Test deployment with preview branch
- [ ] Verify API calls work in deployed app

## 🎉 **Success!**

After following this guide, your app will be deployed to Vercel with:

- ✅ Automatic deployments on git push
- ✅ Environment-specific configurations
- ✅ Secure API endpoint management
- ✅ Preview deployments for PRs
- ✅ Production-ready performance

Your deployed app will be available at: `https://your-project-name.vercel.app`
