import express from 'express';

const router = express.Router();

// Validate required environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is not set');
}

/**
 * POST /api/ai/chat
 * Proxy for Gemini AI API
 * Body: { message: string, image?: string, functionCalls?: any[] }
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, image, functionCalls } = req.body;

    if (!message && !functionCalls) {
      return res.status(400).json({
        error: {
          message: 'Message or functionCalls parameter is required',
        },
      });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error: {
          message: 'Gemini API key not configured',
        },
      });
    }

    // TODO: Implement Gemini AI proxy logic here
    // This is a placeholder for the actual implementation
    // You'll need to use the @google/genai library to interact with Gemini
    
    res.status(501).json({
      error: {
        message: 'AI chat endpoint not yet implemented',
        details: 'This endpoint needs to be implemented with proper Gemini AI integration',
      },
    });

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to process AI chat request',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
  }
});

/**
 * GET /api/ai/health
 * Check if AI service is configured and ready
 */
router.get('/health', (req, res) => {
  res.json({
    status: GEMINI_API_KEY ? 'configured' : 'not_configured',
    message: GEMINI_API_KEY ? 'AI service is ready' : 'Gemini API key not configured',
  });
});

export default router;