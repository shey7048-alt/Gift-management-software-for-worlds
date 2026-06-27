import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Set maximum request size to support receipt base64 uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiApiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Gemini client:", error);
  }
} else {
  console.warn("GEMINI_API_KEY environment variable is not defined. Receipt scanning features will be unavailable.");
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), geminiAvailable: !!ai });
});

// Scan Receipt Endpoint
app.post('/api/scan-receipt', async (req, res) => {
  if (!ai) {
    return res.status(503).json({ 
      error: "Gemini receipt scanning service is currently unavailable. Please verify the API keys." 
    });
  }

  try {
    const { fileBase64, mimeType } = req.body;

    if (!fileBase64 || !mimeType) {
      return res.status(400).json({ error: "Missing fileBase64 or mimeType in request body." });
    }

    // Clean base64 data (remove data:image/jpeg;base64, prefix if present)
    const base64Data = fileBase64.replace(/^data:([^;]+);base64,/, "");

    const promptText = `
Analyze this receipt image or document and extract the following expense details into a clean JSON object. 
If details are unclear, make your best guess based on the receipt context.

Choose the best fit category from this exact list:
- Office Supplies
- Travel & Transportation
- Operational Cost
- Events & Activities
- Salaries & Benefits
- Marketing & PR
- Food & Catering
- Maintenance & Repairs
- Other

The output MUST be a valid JSON block and nothing else. No markdown wrappers like \`\`\`json. Just the raw JSON object.
Format:
{
  "date": "YYYY-MM-DD",
  "description": "Merchant Name or brief description of items purchased",
  "category": "Office Supplies | Travel & Transportation | Operational Cost | Events & Activities | Salaries & Benefits | Marketing & PR | Food & Catering | Maintenance & Repairs | Other",
  "costPerItem": 12.34,
  "quantity": 1,
  "totalCost": 12.34
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        },
        promptText
      ],
    });

    const text = response.text || "";
    console.log("Gemini Scan Receipt Response text:", text);

    // Extract JSON block from markdown if present
    let jsonStr = text.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    try {
      const parsedData = JSON.parse(jsonStr);
      return res.json({ success: true, data: parsedData });
    } catch (parseError) {
      console.error("Failed to parse JSON from Gemini response:", text, parseError);
      return res.status(500).json({ 
        error: "Failed to parse receipt scanning results. Please verify the uploaded file or enter details manually.",
        rawResponse: text
      });
    }

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    return res.status(500).json({ 
      error: "Error processing receipt image: " + (error.message || String(error)) 
    });
  }
});

// Vite Middleware for development mode or static folder for production
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

setupServer().catch(err => {
  console.error("Failed to bootstrap full-stack server:", err);
});
