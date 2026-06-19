# Giftmatch.ai Backend - Free Gemini Version

This backend is for the Giftmatch.ai student project.

It uses:
- Vercel free Hobby hosting
- Gemini API free tier, within limits
- Gemini 2.5 Flash-Lite
- Google Search grounding

Important:
Do not put your Gemini API key inside index.html.
Add it in Vercel as an environment variable:

GEMINI_API_KEY=your_key_here

Endpoint after deployment:
https://your-vercel-project.vercel.app/api/gift
