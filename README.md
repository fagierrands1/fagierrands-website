# Fagi Errands Website

This is the frontend web application for Fagi Errands - an on-demand service platform.

## Features

- **Pickup & Delivery**: Order pickup and delivery services
- **Shopping**: Request shopping assistance
- **Cargo Delivery**: Heavy cargo transportation
- **Banking Services**: Banking errands and transactions
- **Handyman Services**: Home maintenance and repairs
- **Real-time Tracking**: Track your orders in real-time
- **Push Notifications**: Stay updated with order status
- **User Dashboard**: Manage orders, profile, and referrals

## Tech Stack

- React.js
- OpenLayers / Mapbox for maps
- Tailwind CSS
- Axios for API calls
- Service Workers for PWA functionality

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fagierrands-website
```

2. Install dependencies:
```bash
npm install
```

3. Create your environment file:
```bash
cp .env.example .env.production
```

4. Update `.env.production` with your actual credentials:
   - Supabase URL and API key
   - VAPID public key for push notifications
   - Frontend and backend URLs

## Available Scripts

### `npm start`

Runs the app in development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.
The build is optimized for best performance.

## Environment Variables

Create a `.env.production` file with the following variables:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_VAPID_PUBLIC_KEY=your_vapid_public_key
REACT_APP_FRONTEND_URL=your_frontend_url
REACT_APP_API_BASE_URL=your_backend_api_url
```

**Important**: Never commit `.env.production` or any file containing actual credentials to version control.

## Deployment

### cPanel Deployment

See [CPANEL_DEPLOYMENT_GUIDE.md](CPANEL_DEPLOYMENT_GUIDE.md) for detailed instructions.

### Build for Production

```bash
npm run build
```

The `build` folder will contain the production-ready files.

## Project Structure

```
src/
├── components/     # Reusable React components
├── pages/          # Page components
├── services/       # API and service integrations
├── contexts/       # React context providers
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
├── assets/         # Images and static assets
└── styles/         # CSS files
```

## Backend Integration

This frontend connects to the Fagi Errands backend API. Make sure the backend is running and accessible at the URL specified in `REACT_APP_API_BASE_URL`.

Backend repository: [Link to backend repo if available]

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Security

- Never commit sensitive credentials
- Use environment variables for all secrets
- Keep dependencies updated
- Follow security best practices

## License

[Your License Here]

## Support

For support, email support@fagitone.com or open an issue in the repository.
