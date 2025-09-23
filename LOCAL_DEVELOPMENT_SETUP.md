# 🛠️ Local Development Setup

This guide explains how to set up the Draggy Notes application for local development with the backend API running on `https://localhost:7060/`.

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn** package manager
3. **Backend API** running on `https://localhost:7060/`
4. **HTTPS Certificate** for local development (if using HTTPS)

## 🔧 Environment Configuration

### **Step 1: Create Local Environment File**

Create a `.env.local` file in the project root with the following configuration:

```bash
# Local Development Environment Configuration
# API Configuration
VITE_API_BASE_URL=https://localhost:7060/api
VITE_API_TIMEOUT=10000

# App Configuration
VITE_APP_TITLE=Draggy Notes
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_DEBUG_MODE=true
VITE_ENABLE_ANALYTICS=false

# Development Settings
VITE_NODE_ENV=development
```

### **Step 2: Install Dependencies**

```bash
# Install project dependencies
npm install

# Or using yarn
yarn install
```

### **Step 3: Start Development Server**

```bash
# Start the Vite development server
npm run dev

# Or using yarn
yarn dev
```

The application will be available at `http://localhost:5173` (or the port shown in your terminal).

## 🌐 API Configuration

The application is configured to connect to your backend API at `https://localhost:7060/api`. The configuration is handled in:

- **Main Config**: `src/services/config/api.ts`
- **Environment Example**: `src/services/config/environment-example.ts`

### **API Endpoints Expected:**

Based on the OpenAPI specification, the following endpoints should be available:

#### **Authentication Endpoints:**
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/google`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/refresh-token`

#### **User Management Endpoints:**
- `GET /api/users`
- `POST /api/users`
- `GET /api/users/{id}`
- `PUT /api/users/{id}`
- `DELETE /api/users/{id}`

#### **Notes Endpoints:**
- `GET /api/notes`
- `POST /api/notes`
- `GET /api/notes/{id}`
- `PUT /api/notes/{id}`
- `DELETE /api/notes/{id}`
- `POST /api/notes/{id}/duplicate`
- `GET /api/notes/color/{color}`
- `GET /api/notes/search`
- `DELETE /api/notes/bulk-delete`

#### **Health Check:**
- `GET /health`

## 🔒 HTTPS Configuration

If your backend API is running on HTTPS (as indicated by `https://localhost:7060/`), you may need to:

### **1. Trust Self-Signed Certificates**

If using self-signed certificates, you may need to:

- **Chrome/Edge**: Visit `https://localhost:7060` and click "Advanced" → "Proceed to localhost (unsafe)"
- **Firefox**: Visit `https://localhost:7060` and click "Advanced" → "Accept the Risk and Continue"

### **2. Add Certificate to System Trust Store**

For a better development experience, add your certificate to your system's trust store:

**Windows:**
```bash
# Import certificate to Windows Certificate Store
certlm.msc
```

**macOS:**
```bash
# Add certificate to Keychain
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain your-cert.crt
```

**Linux:**
```bash
# Add certificate to system trust store
sudo cp your-cert.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

## 🚀 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check
```

## 🐛 Troubleshooting

### **Common Issues:**

#### **1. API Connection Errors**
```bash
# Check if backend is running
curl -k https://localhost:7060/health

# Or using browser
https://localhost:7060/health
```

#### **2. CORS Issues**
Make sure your backend API has CORS configured to allow requests from your frontend development server (typically `http://localhost:5173`).

#### **3. Certificate Issues**
If you're getting SSL certificate errors:
- Ensure your backend certificate is valid
- Add the certificate to your browser's trust store
- Use the `-k` flag with curl for testing: `curl -k https://localhost:7060/api/health`

#### **4. Environment Variables Not Loading**
- Ensure `.env.local` is in the project root
- Restart the development server after changing environment variables
- Check that variable names start with `VITE_`

### **5. Port Conflicts**
If port 5173 is already in use:
```bash
# Specify a different port
npm run dev -- --port 3000
```

## 📁 Project Structure

```
draggy-notes/
├── src/
│   ├── services/
│   │   ├── api/                 # API integration
│   │   │   ├── auth-api.ts     # Authentication API
│   │   │   ├── notes-api.ts    # Notes API
│   │   │   ├── base-api.ts     # Base API utilities
│   │   │   └── models/         # TypeScript models
│   │   └── config/
│   │       └── api.ts          # API configuration
│   ├── components/             # React components
│   ├── contexts/              # React contexts
│   ├── hooks/                 # Custom hooks
│   └── ...
├── .env.local                 # Local environment variables
├── package.json              # Dependencies and scripts
└── vite.config.ts           # Vite configuration
```

## 🔄 Development Workflow

1. **Start Backend API** on `https://localhost:7060/`
2. **Create/Update** `.env.local` with correct API URL
3. **Install Dependencies** with `npm install`
4. **Start Frontend** with `npm run dev`
5. **Develop** with hot reload enabled
6. **Test API Integration** using the browser's developer tools

## 📝 Notes

- The application uses Vite for fast development and building
- Hot Module Replacement (HMR) is enabled for rapid development
- TypeScript is configured for type safety
- ESLint and Prettier are configured for code quality
- The API integration follows the OpenAPI specification provided

For production deployment, see `VERCEL_DEPLOYMENT.md`.
