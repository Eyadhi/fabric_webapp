# Fabric Management System - Frontend

A comprehensive React-based frontend application for managing fabric production operations, including multi-machine product management, worker shift assignments, piece tracking with analytics, and performance monitoring.

## Application Overview

The Fabric Management System is a complete production management solution designed for fabric manufacturing operations. It provides:

- **Multi-Machine Product Management**: Create products that can run on multiple machines simultaneously with individual completion tracking
- **Simplified Shift Assignment**: Streamlined morning/evening shift assignments integrated directly into machine management
- **Comprehensive Piece Tracking**: Excel upload/download capabilities with date-wise analytics and downloadable charts
- **Performance Analytics**: Weekly (Saturday-Friday) and monthly analytics with navigation controls
- **Worker Cost Calculation**: Automated cost calculations based on production meters and worker assignments

## Key Features

### Product Management
- **Multi-Machine Support**: Assign products to multiple machines with checkbox selection
- **Individual Machine Completion**: Track completion status per machine with smart overall product status
- **Product Detail Pages**: Consolidated view with edit, completion, and piece management actions
- **Normalized Database Structure**: Efficient `product_machines` junction table design

### Shift Management
- **Simplified Assignment**: Morning (7 days) and Evening (6 days) shift types
- **Machine-Integrated**: Shift assignments managed directly in machine detail pages
- **Saturday-Friday Weeks**: Proper work week calculation and display
- **Multi-Machine Workers**: Workers can work same shift on multiple machines

### Piece Analytics
- **Excel Integration**: Upload pieces via Excel with validation and error reporting
- **Date-wise Analytics**: Interactive charts showing daily production metrics
- **Downloadable Reports**: PNG chart downloads with comprehensive piece details
- **Template Downloads**: Pre-formatted Excel templates for data entry

### Performance Tracking
- **Weekly Navigation**: Previous/Next week controls with current week indicator
- **Monthly Analytics**: Month/year dropdown selectors for historical data
- **Cost Calculations**: Automated worker cost calculations based on production and rates

## Tech Stack

- **React 18** with modern hooks and context
- **React Router DOM** for navigation
- **Chart.js** for analytics visualization
- **Axios** for API communication
- **React Hook Form** for form handling
- **React Hot Toast** for notifications
- **Lucide React** for icons

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Spring Boot backend running on `http://localhost:8080`

## Installation & Setup

1. **Navigate to frontend directory:**
   ```bash
   cd fabric-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

4. **Access application:**
   Open `http://localhost:3000` in your browser

## Configuration

### Development
The app proxies API requests to `http://localhost:8080`. Update `package.json` proxy field if your backend uses a different port.

### Production
Set environment variable for production builds:
```bash
REACT_APP_API_URL=http://your-backend-url:port
```

## Project Structure

```
src/
├── components/
│   ├── Navbar.js           # Main navigation
│   ├── ProtectedRoute.js   # Route authentication
│   └── AuthDebug.js        # Authentication debugging
├── contexts/
│   └── AuthContext.js      # Authentication state management
├── pages/
│   ├── Dashboard.js        # System overview
│   ├── Login.js           # User authentication
│   ├── Products.js        # Product listing with actions
│   ├── ProductDetail.js   # Comprehensive product management
│   ├── MachineDetail.js   # Machine management with shift assignments
│   ├── WorkerDetail.js    # Worker analytics and performance
│   ├── Pieces.js          # Piece management
│   ├── Meters.js          # Production meter recording
│   ├── Roles.js           # User role management
│   └── StoredFiles.js     # File management
├── services/
│   └── api.js             # API configuration and endpoints
└── App.js                 # Main application component
```

## Key API Integrations

### Authentication & Users
- `POST /users/login` - User authentication
- `GET /admin/getWorker` - Worker management

### Product Management
- `GET /admin/getProductsWithMachines` - Products with machine assignments
- `POST /admin/addMultiMachineProduct` - Create multi-machine products
- `PUT /admin/updateProductMachineCompletion` - Update completion status

### Shift Management
- `POST /admin/simplified-shifts/assign` - Assign worker shifts
- `GET /admin/simplified-shifts/worker/{id}/week/{date}` - Get weekly assignments

### Piece Analytics
- `POST /admin/uploadPieceExcel` - Upload pieces via Excel
- `GET /admin/downloadPieceExcel` - Download piece data
- `GET /admin/getPieceStatistics` - Get analytics data

### Performance Analytics
- `GET /admin/getWorkerAnalytics` - Worker performance data
- `GET /admin/gettotalcost` - Cost calculations

## Usage Guide

### 1. Product Management
- Create products with multiple machine assignments using checkboxes
- Use "View Product" button to access comprehensive product detail page
- Track individual machine completion status
- Manage pieces directly from product detail page

### 2. Shift Assignment
- Navigate to machine detail pages
- Assign workers to morning (7 days) or evening (6 days) shifts
- View weekly assignment lists with proper Saturday-Friday weeks
- Workers can be assigned to same shift on multiple machines

### 3. Piece Analytics
- Upload pieces via Excel (Product Code | Export Date | Meters format)
- View date-wise analytics with interactive charts
- Download detailed reports as PNG images
- Export data back to Excel format

### 4. Performance Monitoring
- Access worker detail pages for comprehensive analytics
- Navigate through weeks using Previous/Next controls
- Select specific months/years for historical analysis
- View automated cost calculations

## Available Scripts

- `npm start` - Development server with hot reload
- `npm build` - Production build optimization
- `npm test` - Run test suite
- `npm eject` - Eject from Create React App (not recommended)

## Features in Detail

### Multi-Machine Product System
- **Checkbox Selection**: Easy machine selection with Select All/Deselect All
- **Normalized Structure**: Efficient database design with `product_machines` table
- **Smart Completion**: Product marked complete only when all machines finish
- **Individual Tracking**: Each machine-product combination tracked separately

### Simplified Shift Assignment
- **Integrated Management**: Shifts managed within machine detail pages
- **Proper Week Calculation**: Saturday-Friday work weeks
- **Flexible Assignment**: Workers can work multiple machines same shift
- **Streamlined Interface**: Reduced complexity from previous 26-column system

### Advanced Analytics
- **Interactive Charts**: Chart.js powered visualizations
- **Date Range Selection**: Flexible date-wise analysis
- **Export Capabilities**: PNG downloads with comprehensive details
- **Excel Integration**: Seamless upload/download workflows

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure backend CORS configuration includes `http://localhost:3000`
2. **API Connection**: Verify backend is running on correct port
3. **Authentication**: Check JWT token format and expiration
4. **File Uploads**: Ensure proper Excel format (Product Code | Export Date | Meters)

### Debug Features
- Authentication debug component for token inspection
- Console logging for API requests and responses
- Error boundaries for graceful error handling

## Development Guidelines

### Code Organization
- Components are organized by functionality
- Shared logic extracted to custom hooks
- API calls centralized in services layer
- Consistent error handling patterns

### State Management
- React Context for authentication state
- Local state for component-specific data
- Form state managed with React Hook Form
- API state handled with loading/error patterns

### Styling Approach
- Utility-first CSS with consistent design system
- Responsive design for mobile compatibility
- Accessible color schemes and contrast ratios
- Loading states and error feedback

This frontend application provides a complete solution for fabric production management with modern React patterns and comprehensive feature set.