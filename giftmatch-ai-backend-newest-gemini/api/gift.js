export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    return response.status(200).end();
  }

  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return response.status(500).json({
        error: "Missing GEMINI_API_KEY",
        details: "Add GEMINI_API_KEY in Vercel Environment Variables and redeploy."
      });
    }

    const {
      description = "",
      receiver = "",
      age = "",
      gender = "",
      budget = "",
      country = "",
      store = "",
      interests = []
    } = request.body || {};

    const prompt = `
You are Giftmatch.ai, a smart and safe gift recommendation assistant.

Create 5 very specific gift ideas.

User details:
- Gift for: ${receiver}
- Age group: ${age}
- Gender: ${gender}
- Budget: ${budget}
- Country: ${country}
- Preferred online store: ${store}
- Interests: ${Array.isArray(interests) ? interests.join(", ") : ""}
- Description: ${description}

Rules:
- Give specific real gift objects, not vague categories.
- Match the selected interests strongly.
- If the user likes hiking, suggest compact useful hiking gadgets or tools.
- If the user likes animals, suggest animal-related gifts.
- Avoid unsafe, suspicious, illegal, adult, gambling, alcohol, nicotine, weapon, or fake-shop suggestions.
- Use realistic CHF price estimates.
- Suggest trusted stores for the selected country.
- Return ONLY valid JSON. No markdown, no explanation outside JSON.

JSON format:
{
  "ideas": [
    {
      "name": "specific gift object name",
      "why": "short reason why it matches",
      "price": "estimated CHF price",
      "match": 95,
      "googleSearchQuery": "specific Google search query",
      "googleShoppingQuery": "specific Google Shopping query",
      "stores": ["store 1", "store 2", "store 3"]
    }
  ]
}
`;

    async function callGemini(modelName) {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              temperature: 0.35,
              maxOutputTokens: 1600
            }
          })
        }
      );

      const data = await geminiResponse.json();

      if (!geminiResponse.ok) {
        throw new Error(JSON.stringify({
          model: modelName,
          details: data
        }));
      }

      return data;
    }

    // Newest-first strategy:
    // 1. Try Gemini 3.1 Flash-Lite
    // 2. If unavailable for this account/project, fall back to stable Gemini 2.5 Flash
    let data;
    let usedModel;

    try {
      data = await callGemini("gemini-3.1-flash-lite");
      usedModel = "gemini-3.1-flash-lite";
    } catch (firstError) {
      data = await callGemini("gemini-2.5-flash");
      usedModel = "gemini-2.5-flash";
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{"ideas":[]}';

    const cleanText = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(cleanText);
    } catch (jsonError) {
      return response.status(500).json({
        error: "Gemini returned invalid JSON",
        raw: cleanText,
        usedModel
      });
    }

    parsed.usedModel = usedModel;

    return response.status(200).json(parsed);
  } catch (error) {
    return response.status(500).json({
      error: "AI request failed",
      details: error.message
    });
  }
}
