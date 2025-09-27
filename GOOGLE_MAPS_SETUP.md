# Google Maps API Setup for HolyBed

## Required API Key

To use real Google Maps data for nearby hospitals, you need to set up a Google Maps API key.

### Steps to get Google Maps API Key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Directions API

4. Create credentials (API Key)
5. Restrict the API key to your domain for security

### Environment Configuration

Create a `.env.local` file in the root directory with:

```
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here

# MySQL Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=holybed
```

### Current Implementation

The emergency page (`pages/emergency.js`) already uses:
- ✅ Google Places API for real hospital data
- ✅ Real-time hospital information (ratings, addresses, business status)
- ✅ Distance calculation using Haversine formula
- ✅ Hospital filtering by operational status and opening hours
- ✅ Interactive map with markers and directions

### Features Working with Real Data:

1. **Hospital Search**: Uses Google Places `nearbySearch` to find actual hospitals
2. **Real Information**: 
   - Hospital names, addresses, phone numbers
   - Google ratings and review counts
   - Business operational status
   - Opening hours (open/closed status)
   - Exact coordinates for mapping

3. **Distance Calculation**: Real distance between user location and hospitals
4. **Map Integration**: Interactive Google Maps with:
   - User location marker
   - Hospital markers with info windows
   - Directions service for navigation

### No Mock Data

The current implementation does NOT use mock data. All hospital information comes from:
- Google Places API (real hospital database)
- Real-time business information
- Actual geographic coordinates
- Live operational status

### API Limits

- Google Places API returns up to 20 results per request
- The app uses pagination to get up to 60 results (3 pages)
- Results are filtered to show only operational and open hospitals
- Sorted by distance and rating for best recommendations

## Troubleshooting

If you see "Nearby Hospitals (9)" but want more results:
1. Check if your API key has sufficient quota
2. Verify all required APIs are enabled
3. Check browser console for API errors
4. Ensure location permissions are granted

The number in parentheses shows actual results from Google Places API, not mock data.

## Database Integration

### MySQL Setup

The application now includes MySQL database integration to track user interactions and hospital recommendations.

#### Database Tables:
- `user_submissions` - Stores user input (symptoms, mode, files, location)
- `ai_analysis` - Stores AI analysis results (category, severity, recommendations)
- `hospitals` - Stores hospital information from Google Places API
- `user_recommendations` - Links submissions to recommended hospitals

#### Setup Instructions:

1. Install MySQL on your system
2. Create a database named `holybed`
3. The application will automatically create the required tables on first run

#### Environment Variables:
Add these to your `.env.local` file:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=holybed
```

### Analytics Dashboard

Visit `/analytics` to view:
- Usage statistics (Emergency vs Normal mode)
- Severity distribution of cases
- Most recommended hospitals
- Recent user submissions

### API Endpoints:
- `POST /api/save-interaction` - Saves user interactions to database
- `GET /api/analytics` - Retrieves analytics data

## Installation & Running

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`

3. Start the development server:
```bash
npm run dev
```

4. Visit `http://localhost:3000` to use the application
5. Visit `http://localhost:3000/analytics` to view analytics dashboard

## Features Summary

✅ **Real Google Maps Integration**
- Live hospital data from Google Places API
- Real ratings, addresses, and business status
- Interactive maps with directions

✅ **Emergency Mode**
- Immediate hospital search
- Real-time location detection
- Emergency-optimized filtering

✅ **Database Tracking**
- User interaction logging
- Hospital recommendation tracking
- Analytics and reporting

✅ **No Mock Data**
- All hospital information is real
- Live Google Places API integration
- Actual geographic coordinates and business data
