# cPanel Deployment Guide for fagierrand.fagitone.com

This guide explains how to deploy the Fagi Errands frontend to your cPanel hosting at `fagierrand.fagitone.com`.

## Prerequisites

1. cPanel hosting account with Node.js support (or ability to upload static files)
2. Domain `fagierrand.fagitone.com` configured in cPanel
3. FTP/File Manager access
4. Local development environment with Node.js

## Deployment Methods

### Method 1: Static File Upload (Recommended for most cPanel hosts)

#### Step 1: Build the Application Locally

1. **Navigate to the project directory:**
   ```bash
   cd C:\Users\a\Documents\GitHub\fagierrands\fagierrands\fagi-errands
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Verify build folder:**
   - Check that the `build` folder is created
   - It should contain `index.html`, `static` folder, and other assets

#### Step 2: Upload to cPanel

1. **Access cPanel File Manager:**
   - Login to your cPanel
   - Open File Manager
   - Navigate to the domain's document root (usually `public_html/fagierrand` or similar)

2. **Upload build files:**
   - Upload ALL contents of the `build` folder to your domain's document root
   - **Important:** Upload the contents OF the build folder, not the build folder itself
   - Your file structure should look like:
     ```
     public_html/fagierrand/
     ├── index.html
     ├── .htaccess
     ├── static/
     │   ├── css/
     │   ├── js/
     │   └── media/
     ├── manifest.json
     ├── favicon.ico
     └── other files...
     ```

3. **Set file permissions:**
   - Set folders to 755
   - Set files to 644
   - Ensure .htaccess is readable (644)

#### Step 3: Configure Domain

1. **Subdomain Setup:**
   - In cPanel, go to Subdomains
   - Create subdomain: `fagierrand`
   - Point it to the folder where you uploaded the files

2. **DNS Configuration:**
   - Ensure the subdomain DNS is properly configured
   - May take up to 24 hours to propagate

### Method 2: Node.js App (If your cPanel supports Node.js)

#### Step 1: Create Node.js App in cPanel

1. **Setup Node.js App:**
   - Go to cPanel → Node.js Apps
   - Create new app
   - Set domain: `fagierrand.fagitone.com`
   - Set Node.js version (14+ recommended)
   - Set application root and startup file

2. **Upload source code:**
   - Upload the entire project to the app directory
   - Install dependencies via cPanel terminal or SSH

3. **Configure environment variables:**
   - Set production environment variables in cPanel

## Configuration Files

### .htaccess (Already created in public folder)
The `.htaccess` file handles:
- Client-side routing for React Router
- Security headers
- Compression
- Caching
- Optional HTTPS redirect

### Environment Variables
Make sure your production environment variables are correctly set:
- API endpoints should point to your backend
- Frontend URL should be `https://fagierrand.fagitone.com`

## SSL Certificate Setup

1. **Free SSL (Let's Encrypt):**
   - Most cPanel hosts offer free SSL
   - Go to cPanel → SSL/TLS → Let's Encrypt
   - Generate certificate for `fagierrand.fagitone.com`

2. **Force HTTPS:**
   - Uncomment the HTTPS redirect lines in `.htaccess` if needed
   - Or use cPanel's Force HTTPS Redirect option

## Testing Deployment

1. **Basic functionality:**
   - Visit `https://fagierrand.fagitone.com`
   - Check that the app loads without errors
   - Test navigation between pages

2. **API connectivity:**
   - Open browser developer tools
   - Check Network tab for API calls
   - Ensure backend connectivity works

3. **Mobile responsiveness:**
   - Test on different devices
   - Check PWA functionality

## Troubleshooting

### Common Issues:

1. **404 Errors on Page Refresh:**
   - Ensure `.htaccess` is uploaded and readable
   - Check that mod_rewrite is enabled on server

2. **Blank Page:**
   - Check browser console for JavaScript errors
   - Verify all files uploaded correctly
   - Check file permissions

3. **API Connection Issues:**
   - Verify backend server is accessible
   - Check CORS settings on backend
   - Ensure environment variables are correct

4. **CSS/JS Not Loading:**
   - Check file paths in built files
   - Verify static files uploaded to correct location
   - Check server permissions

### File Structure Verification:
```
public_html/fagierrand/
├── index.html                 (Main HTML file)
├── .htaccess                  (Apache configuration)
├── manifest.json              (PWA manifest)
├── favicon.ico                (Site icon)
├── robots.txt                 (SEO file)
├── static/
│   ├── css/
│   │   └── main.[hash].css    (Compiled CSS)
│   ├── js/
│   │   ├── main.[hash].js     (Main JavaScript bundle)
│   │   └── [other].js         (Other JS chunks)
│   └── media/
│       └── [images/fonts]     (Static assets)
└── [other build files]
```

## Maintenance

1. **Updates:**
   - Run `npm run build` locally after changes
   - Upload new build files to replace old ones
   - Clear browser cache for testing

2. **Monitoring:**
   - Check cPanel error logs regularly
   - Monitor site performance
   - Keep dependencies updated

3. **Backups:**
   - Backup build files before updates
   - Keep source code in version control
   - Document any custom server configurations

## Performance Optimization

1. **Enable compression** (already in .htaccess)
2. **Set up caching headers** (already in .htaccess)
3. **Optimize images** before building
4. **Use CDN** if available through your host
5. **Monitor Core Web Vitals**

## Security Considerations

1. **Security headers** are set in .htaccess
2. **Keep dependencies updated**
3. **Use HTTPS** (SSL certificate)
4. **Regular security scans**
5. **Backup regularly**

## Support Resources

- cPanel documentation
- Your hosting provider's support
- React deployment guides
- Apache .htaccess documentation

Remember to test thoroughly after deployment and monitor for any issues!