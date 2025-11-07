import express from 'express';

const router = express.Router();

// Validate required environment variables
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!GOOGLE_MAPS_API_KEY) {
  console.error('❌ GOOGLE_MAPS_API_KEY environment variable is not set');
}

/**
 * GET /api/maps/geocode
 * Proxy for Google Maps Geocoding API
 * Query params: address (required)
 */
router.get('/geocode', async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        error: {
          message: 'Address parameter is required',
        },
      });
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({
        error: {
          message: 'Google Maps API key not configured',
        },
      });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Maps API responded with status ${response.status}`);
    }

    const data = await response.json();

    // Check for API-specific errors
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return res.status(400).json({
        error: {
          message: `Google Maps API error: ${data.status}`,
          details: data.error_message,
        },
      });
    }

    res.json(data);

  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to geocode address',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
  }
});

/**
 * GET /api/maps/static
 * Proxy for Google Maps Static API
 * Query params: center, zoom, size, markers (all required)
 */
router.get('/static', async (req, res) => {
  try {
    const { center, zoom = '15', size = '200x150', markers } = req.query;

    if (!center) {
      return res.status(400).json({
        error: {
          message: 'Center parameter is required (format: lat,lng)',
        },
      });
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({
        error: {
          message: 'Google Maps API key not configured',
        },
      });
    }

    // Build the static map URL
    let url = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(center)}&zoom=${zoom}&size=${size}`;
    
    if (markers) {
      url += `&markers=${encodeURIComponent(markers)}`;
    }
    
    url += `&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Maps API responded with status ${response.status}`);
    }

    // Check if the response is an image
    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      const errorText = await response.text();
      return res.status(400).json({
        error: {
          message: 'Invalid response from Google Maps API',
          details: errorText,
        },
      });
    }

    // Stream the image directly to the client
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    const imageBuffer = await response.arrayBuffer();
    res.send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('Static map error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to generate static map',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
  }
});

/**
 * GET /api/maps/static-data-url
 * Returns a base64 data URL for embedding in PDFs/documents
 * Query params: center, zoom, size, markers (all required)
 */
router.get('/static-data-url', async (req, res) => {
  try {
    const { center, zoom = '15', size = '200x150', markers } = req.query;

    if (!center) {
      return res.status(400).json({
        error: {
          message: 'Center parameter is required (format: lat,lng)',
        },
      });
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({
        error: {
          message: 'Google Maps API key not configured',
        },
      });
    }

    // Build the static map URL
    let url = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(center)}&zoom=${zoom}&size=${size}`;
    
    if (markers) {
      url += `&markers=${encodeURIComponent(markers)}`;
    }
    
    url += `&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Maps API responded with status ${response.status}`);
    }

    // Check if the response is an image
    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      const errorText = await response.text();
      return res.status(400).json({
        error: {
          message: 'Invalid response from Google Maps API',
          details: errorText,
        },
      });
    }

    // Convert to base64 data URL
    const imageBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    res.json({
      dataUrl,
      contentType,
      size: imageBuffer.byteLength,
    });

  } catch (error) {
    console.error('Static map data URL error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to generate static map data URL',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
  }
});

export default router;