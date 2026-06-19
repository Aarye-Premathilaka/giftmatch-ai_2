export default async function handler(request, response) {
  // Allow only POST requests
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      description,
      receiver,
      age,
      gender,
      budget,
      country,
      store,
      interests
    } = request.body || {};

    const prompt = `
You are Giftmatch.ai, a smart and safe gift recommendation assistant.

The user wants gift ideas.

User details:
- Gift for: ${receiver}
- Age group: ${age}
- Gender: ${gender}
- Budget: ${budget}
- Country: ${country}
- Preferred online store: ${store}
- Interests: ${Array.isArray(interests) ? interests.join(", ") : ""}
- Description: ${description}

Important rules:
1. Give only specific gift objects, not vague ideas.
2. Match the selected interests strongly.
3. If the user says animals, suggest animal-related gifts.
4. If the user says outdoor, suggest outdoor-related gifts.
5. Avoid unsafe, suspicious, illegal, adult, gambling, alcohol, nicotine, weapon, or fake-shop suggestions.
6. Prefer trusted stores suitable for the selected country.
7. Give realistic price estimates in CHF.
8. Give search queries that can be opened in Google Shopping or normal Google Search.
9. Return only valid JSON. No markdown.

Return this JSON format exactly:
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

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" +
        process.env.GEMINI_API_KEY,
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
          tools: [
            {
              google_search: {}
            }
          ],
          generationConfig: {
            temperature: 0.4,
            response_mime_type: "application/json"
          }
        })
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return response.status(500).json({
        error: "Gemini API error",
        details: data
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      '{"ideas":[]}';

    const parsed = JSON.parse(text);

    return response.status(200).json(parsed);
  } catch (error) {
    return response.status(500).json({
      error: "AI request failed",
      details: error.message
    });
  }
}
