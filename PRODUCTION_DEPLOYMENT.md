# Production Deployment Guide

## Problem Fixed
This fix resolves the "Failed to load module script: index.tsx" MIME type error that caused a black screen on GitHub Pages deployment.

## Solution
The application is now properly configured for production deployment:

### 1. Build Configuration (vite.config.ts)
- `base: './'` - Ensures all paths are relative (required for GitHub Pages)
- `build.outDir: 'dist'` - Outputs to dist directory
- `build.emptyOutDir: true` - Cleans dist before each build
- Filenames include content hashes for cache busting

### 2. Production Build
Run the following command to build for production:
```bash
npm run build
```

This generates:
- `dist/index.html` - Production HTML with correct asset references
- `dist/assets/index-[hash].js` - Compiled JavaScript bundle
- `dist/assets/index-[hash].css` - Compiled CSS

**Latest Build Assets:**
- JS: `index-CvOSCbj9.js` (271.23 kB, gzipped: 83.72 kB)
- CSS: `index-C1XfJfxe.css` (1.28 kB, gzipped: 0.68 kB)

### 3. GitHub Pages Deployment

#### Option A: Deploy dist directory (Recommended)
Configure GitHub Pages to serve from the `dist` folder:

1. Go to Repository Settings → Pages
2. Set Source to "Deploy from a branch"
3. Select branch: `main` (or your deployment branch)
4. Select folder: `/dist`
5. Save

#### Option B: Copy dist contents to root
If you need to serve from root:
```bash
# After building
cp -r dist/* .
git add index.html assets/
git commit -m "Deploy: Update production assets"
git push
```

### 4. Local Testing
To preview the production build locally:
```bash
npm run preview
```

This serves the dist directory at http://localhost:4173

## File Structure
```
/
├── index.html          # Development HTML (points to index.tsx)
├── index.tsx           # Development entry point
├── dist/               # Production build output (committed to git)
│   ├── index.html      # Production HTML (points to compiled assets)
│   └── assets/
│       ├── index-[hash].js
│       └── index-[hash].css
```

## Development vs Production

**Development** (`npm run dev`):
- Uses root `index.html`
- Points to `index.tsx` source
- Hot module reloading enabled
- Serves at http://localhost:3000

**Production** (`npm run build`):
- Generates `dist/` directory
- Compiles TypeScript to JavaScript
- Minifies and optimizes code
- Adds content hashes to filenames
- Deploy the `dist/` folder to GitHub Pages

## Troubleshooting

### Black screen on GitHub Pages
- Ensure GitHub Pages is configured to serve from `/dist` directory
- Check that `base: './'` is set in vite.config.ts
- Verify dist directory is committed to git (removed from .gitignore)

### MIME type errors
- The dist/index.html automatically has correct references
- Never manually edit dist/index.html (it's regenerated on each build)
- Always use `npm run build` before deploying

### Hash mismatches
- Run `npm run build` to regenerate assets with new hashes
- Commit the entire dist directory after building
