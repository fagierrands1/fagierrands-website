# Deployment Guide for fagierrand.fagitone.com

This guide explains how to deploy the Fagi Errands frontend to your custom domain `fagierrand.fagitone.com`.

**Note:** This guide is for Vercel deployment. For cPanel hosting, see `CPANEL_DEPLOYMENT_GUIDE.md`.

## Prerequisites

1. A Vercel account
2. Domain ownership of `fagitone.com`
3. Access to DNS settings for your domain

## Deployment Steps

### 1. Deploy to Vercel

1. **Connect Repository to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `fagierrands/fagi-errands` folder as the root directory

2. **Configure Build Settings:**
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

3. **Set Environment Variables:**
   - Add all variables from `.env.production` to Vercel's environment variables
   - Go to Project Settings → Environment Variables
   - Add each variable with the production values

### 2. Configure Custom Domain

1. **Add Domain in Vercel:**
   - Go to Project Settings → Domains
   - Add `fagierrand.fagitone.com`
   - Vercel will provide DNS configuration instructions

2. **Update DNS Records:**
   Add the following DNS records to your domain provider:
   ```
   Type: CNAME
   Name: fagierrand
   Value: cname.vercel-dns.com
   ```

   Or if you prefer A records:
   ```
   Type: A
   Name: fagierrand
   Value: 76.76.19.61
   ```

### 3. SSL Certificate

Vercel automatically provisions SSL certificates for custom domains. This may take a few minutes to complete.

### 4. Verify Deployment

1. Visit `https://fagierrand.fagitone.com`
2. Check that the application loads correctly
3. Verify API calls are working (check browser network tab)
4. Test authentication and core functionality

## Configuration Files Created/Modified

- `vercel.json` - Vercel deployment configuration
- `.env.production` - Production environment variables
- `src/utils/environment.js` - Updated to use new domain
- `public/index.html` - Updated title and meta description
- `public/manifest.json` - Updated PWA manifest
- `package.json` - Added vercel-build script

## Environment Variables

The following environment variables are configured for production:

- `REACT_APP_SUPABASE_URL` - Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Supabase anonymous key
- `REACT_APP_VAPID_PUBLIC_KEY` - Push notification VAPID key
- `REACT_APP_FRONTEND_URL` - Frontend URL (https://fagierrand.fagitone.com)
- `REACT_APP_API_BASE_URL` - Backend API URL

## Troubleshooting

### Domain Not Working
- Check DNS propagation using tools like `dig` or online DNS checkers
- Ensure DNS records are correctly configured
- Wait up to 48 hours for full DNS propagation

### SSL Certificate Issues
- Verify domain ownership
- Check that DNS records point to Vercel
- Contact Vercel support if SSL provisioning fails

### API Connection Issues
- Verify backend server is running at `https://fagierrands-server.vercel.app`
- Check CORS settings on the backend
- Ensure environment variables are correctly set

### Build Failures
- Check build logs in Vercel dashboard
- Verify all dependencies are listed in package.json
- Ensure Node.js version compatibility

## Monitoring and Maintenance

1. **Monitor Performance:**
   - Use Vercel Analytics
   - Monitor Core Web Vitals
   - Set up error tracking (Sentry, etc.)

2. **Regular Updates:**
   - Keep dependencies updated
   - Monitor security advisories
   - Test deployments in staging environment

3. **Backup Strategy:**
   - Ensure code is backed up in version control
   - Document environment variables securely
   - Maintain deployment configuration files

## Support

For deployment issues:
1. Check Vercel documentation
2. Review build logs
3. Test locally first
4. Contact Vercel support for platform-specific issues