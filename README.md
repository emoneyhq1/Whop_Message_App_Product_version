# Whop Dashboard - Node.js Server

A Node.js web application for managing Whop products and sending messages to members.

## Features

- **Products Listing**: View all products from Whop API v2
- **Membership Management**: See active memberships per product
- **Message Sending**: Send direct messages to all members of a product
- **Real-time Logging**: Detailed console logs for debugging

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

The API keys are already configured in `config.js`:
- `whopApiKey`: For sending messages
- `v2ProductsToken`: For fetching products and memberships

### 3. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 4. Access the Application

- **Main URL**: http://localhost:3000
- **Products**: http://localhost:3000/products
- **Product Detail**: http://localhost:3000/products/{product_id}

## API Endpoints

### GET /products
- Lists all products with active membership counts
- Fetches data from Whop API v2

### GET /products/:productId
- Shows product details and memberships
- Displays message sending form

### POST /products/:productId
- Sends messages to all members of the product
- Uses Whop API v2 messages endpoint

## File Structure

```
server/
├── server.js          # Main Express server
├── config.js          # Configuration and environment variables
├── whopClient.js      # Whop API client
├── package.json       # Dependencies and scripts
├── templates/         # EJS templates
│   ├── base.ejs
│   ├── products.ejs
│   ├── product_detail.ejs
│   └── error.ejs
└── public/           # Static assets (if needed)
```

## Dependencies

- **express**: Web framework
- **axios**: HTTP client for API calls
- **ejs**: Template engine
- **dotenv**: Environment variable management

## Console Logging

The application provides detailed logging:

- **API Calls**: Shows request/response details
- **Message Sending**: Tracks success/failure for each message
- **Error Handling**: Detailed error messages

## Migration from Python

This Node.js version includes all features from the Python version:

✅ Products listing with v2 API  
✅ Membership counting per product  
✅ Product detail pages  
✅ Message sending to all members  
✅ Detailed console logging  
✅ Error handling and user feedback  

## Development

To modify the application:

1. Edit `server.js` for route changes
2. Update `whopClient.js` for API modifications
3. Modify templates in `templates/` for UI changes
4. Use `npm run dev` for development with auto-restart
