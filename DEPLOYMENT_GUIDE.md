# Deployment Guide for Yorru

## Prerequisites
- GitHub account
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)

## Backend Deployment (Railway)

### Method 1: Via Railway Dashboard (Recommended)

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "feat: add invitation system, ground truth sync, and group broadcasting"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Railway**
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will automatically detect the `Dockerfile` and build

3. **Add PostgreSQL Database**
   - In your Railway project, click "New" → "Database" → "Add PostgreSQL"
   - Railway will automatically set `DATABASE_URL` environment variable

4. **Set Environment Variables**
   Go to your service → Variables tab and add:
   ```
   SECRET_KEY=<generate-a-random-secret-key>
   OPENAI_API_KEY=<your-openai-api-key>
   DEBUG=False
   FRONTEND_URL=<your-vercel-url-once-deployed>
   ```

5. **Generate Domain**
   - Go to Settings → Generate Domain
   - Your API will be available at: `https://your-app.up.railway.app`
   - Docs at: `https://your-app.up.railway.app/docs`

### Method 2: Via Railway CLI

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**
   ```bash
   railway login
   railway init
   railway up
   ```

3. **Add PostgreSQL**
   ```bash
   railway add
   # Select PostgreSQL
   ```

4. **Set environment variables**
   ```bash
   railway variables set SECRET_KEY=<your-secret-key>
   railway variables set OPENAI_API_KEY=<your-openai-api-key>
   ```

## Frontend Deployment (Vercel)

### Via Vercel Dashboard (Recommended)

1. **Push code to GitHub** (if not already done)

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a Vite React app

3. **Configure Build Settings**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Set Environment Variables**
   ```
   VITE_API_URL=https://your-app.up.railway.app
   VITE_GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>  # Optional: for location features
   VITE_OPENAI_API_KEY=<your-openai-api-key>  # Optional: for client-side AI features
   ```

   **Note:** `VITE_API_URL` is required. The others are optional depending on features used.

5. **Deploy**
   - Click "Deploy"
   - Your app will be live at: `https://your-app.vercel.app`

### Via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel
   ```

3. **Follow prompts**
   - Link to existing project or create new
   - Set environment variables when prompted

## Post-Deployment

### Update CORS in Backend (Production Security)

The backend currently allows all origins (`allow_origins=["*"]`). For production, restrict CORS to your frontend domain.

**Option 1: Environment Variable (Recommended)**

1. Add to Railway environment variables:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```

2. Update `backend/main.py`:
   ```python
   import os

   frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

   app.add_middleware(
       CORSMiddleware,
       allow_origins=[
           "http://localhost:5173",   # Vite dev server
           "http://localhost:5174",   # Alternate port
           frontend_url,              # Production frontend
       ],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

**Option 2: Hardcoded (Simpler)**

Update `backend/main.py` directly:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://your-app.vercel.app",  # Your Vercel domain
        "https://app.yorru.net",        # Custom domain (if configured)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then redeploy the backend.

## Database Migrations

After deployment, run migrations:

```bash
# Using Railway CLI
railway run alembic upgrade head

# Or via Railway dashboard
# Add a one-time command in the deployment settings
```

## Verify Deployment

### Backend Health Check
```bash
curl https://your-app.up.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "events": 0,
  "embeddings": "not_available"
}
```

### Frontend
- Visit `https://your-app.vercel.app`
- Try logging in and testing features

## Environment Variables Reference

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SECRET_KEY=your-secret-key-min-32-chars
OPENAI_API_KEY=sk-...
DEBUG=False
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (.env)
```
VITE_API_URL=https://your-app.up.railway.app
```

## Troubleshooting

### Railway Build Fails
- Check logs in Railway dashboard
- Ensure `Dockerfile` is in root directory
- Verify `requirements.txt` has all dependencies

### Frontend Can't Connect to Backend
- Check `VITE_API_URL` is set correctly
- Verify CORS settings in backend
- Check Railway app is running (not sleeping)

### Database Connection Issues
- Ensure PostgreSQL plugin is added in Railway
- Check `DATABASE_URL` environment variable is set
- Verify migrations have run

## CI/CD (Optional)

Both Railway and Vercel support automatic deployments:
- **Railway**: Auto-deploys on push to main branch
- **Vercel**: Auto-deploys on push to main branch

No additional configuration needed!
