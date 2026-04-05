# Quick cPanel Deployment Setup

## For fagierrand.fagitone.com

### Quick Start (Windows)

1. **Double-click** `build-for-cpanel.bat` or run `build-for-cpanel.ps1`
2. **Wait** for the build to complete
3. **Upload** all contents from the opened `build` folder to your cPanel
4. **Done!** Visit https://fagierrand.fagitone.com

### Manual Steps

```bash
# 1. Install dependencies
npm install

# 2. Build for production
npm run build

# 3. Upload contents of 'build' folder to cPanel
```

### cPanel Upload Location

Upload to: `public_html/fagierrand/` (or your domain's document root)

### Important Files

- ✅ `.htaccess` - **Must be uploaded** (handles routing)
- ✅ `index.html` - Main app file
- ✅ `static/` folder - All CSS, JS, and assets
- ✅ `manifest.json` - PWA configuration

### File Permissions

- **Folders**: 755
- **Files**: 644

### Troubleshooting

| Problem | Solution |
|---------|----------|
| 404 on page refresh | Upload `.htaccess` file |
| Blank page | Check browser console, verify all files uploaded |
| CSS not loading | Check file permissions and paths |
| API not working | Verify backend server is running |

### Need Help?

See detailed guide: `CPANEL_DEPLOYMENT_GUIDE.md`