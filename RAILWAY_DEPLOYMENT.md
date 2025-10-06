# Railway Deployment Guide

## Prerequisites
1. Railway account
2. MongoDB Atlas account (or Railway MongoDB addon)
3. Git repository with your code

## Step 1: Connect Repository
1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

## Step 2: Set Environment Variables
In Railway dashboard, go to your project → Variables tab and add:

```bash
MONGODB_URI=mongodb+srv://murewa:Ilobu%4007@prometheus.w2jz3ck.mongodb.net/?retryWrites=true&w=majority&appName=prometheus
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=24h
PYTHON_API_URL=http://localhost:5000
NODE_ENV=production
MOCK_MODEL=true
PORT=8080
```

## Step 3: Configure Build Settings
Railway should auto-detect Node.js, but if not:
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Node Version**: 18.x (or latest)

## Step 4: Deploy
Railway will automatically deploy when you push to your main branch.

## Step 5: Get Your API URL
After deployment, Railway will give you a URL like:
`https://your-app-name.railway.app`

Test your API:
```bash
curl https://your-app-name.railway.app/api
```

## Environment Variables Explained

### Required Variables:
- **MONGODB_URI**: Your MongoDB connection string
- **JWT_SECRET**: Secret key for JWT tokens (use a strong random string in production)

### Optional Variables:
- **JWT_EXPIRE**: Token expiration time (default: 24h)
- **PYTHON_API_URL**: URL to your Python AI model (if separate)
- **NODE_ENV**: Environment (production/development)
- **MOCK_MODEL**: Set to `true` to use mock responses instead of Python API
- **PORT**: Railway sets this automatically (usually 8080)

## Troubleshooting

### MongoDB Connection Issues:
1. Check MongoDB Atlas IP whitelist (add 0.0.0.0/0 for Railway)
2. Verify connection string format
3. Check Railway logs for detailed error messages

### Environment Variable Issues:
1. Ensure all required variables are set in Railway dashboard
2. Check variable names match exactly (case-sensitive)
3. No spaces around the `=` sign

### Build Issues:
1. Check `package.json` has correct start script
2. Ensure all dependencies are in `dependencies` not `devDependencies`
3. Check Node.js version compatibility

## Security Notes:
- Use a strong, random JWT_SECRET in production
- Consider using Railway's built-in MongoDB addon instead of external Atlas
- Enable MongoDB Atlas network security features
- Set up proper CORS origins for your frontend domain

## Testing Deployment:
```bash
# Test registration
curl -X POST https://your-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "acceptedTermsAndConditions": true
  }'

# Test login
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```
