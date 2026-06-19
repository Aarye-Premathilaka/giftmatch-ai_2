# Giftmatch.ai Backend - Newest Gemini Version

This backend uses:
- Vercel serverless function
- CORS enabled
- Gemini newest-first strategy

Model strategy:
1. Try gemini-3.1-flash-lite
2. If unavailable, fall back to gemini-2.5-flash

Required Vercel environment variable:
GEMINI_API_KEY
