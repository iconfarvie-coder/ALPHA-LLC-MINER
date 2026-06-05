import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Initialize Gemini client lazily to avoid crashing on launch if variables are missing
  let ai: GoogleGenAI | null = null;
  const initGemini = () => {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
        ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      }
    }
    return ai;
  };

  // Support Knowledge Base and custom fallback answers
  const KNOWLEDGE_BASE = [
    {
      keywords: ['overheat', 'hot', 'temperature', 'cool', 'thermal', 'throttling', 'limit'],
      answer: "ALPHA Mainframe Thermals Alert: If your rig is overheating (above 85°C), the GPU core automatically throttles hash rate by 90% to protect the silicon. To resolve this, navigate to the 'Hardware Shop' tab and upgrade your 'Cryogenic Fluid Loops' or 'Decoupled Superconducting fans'. You can also utilize temporary local 'Cryo Boosters' from your inventory (available for purchase in the shop) to trigger an immediate -40°C cooling burst."
    },
    {
      keywords: ['payout', 'withdraw', 'transfer', 'paypal', 'wallet', 'money', 'cash', 'delay', 'mempool', 'unverified'],
      answer: "Sovereign Settlement Gateway: Payout requests dispatch directly to the chosen network coordinator (e.g., Bitcoin mempool or PayPal endpoint). If status is flagged as 'UNVERIFIED', you must activate and approve the AML compliance signature, either by connecting via 'Google Sync', 'Apple Sync', or 'Phone Sync' or initiating the verification audit right from the table row expansion in the Payout Console tab. Once done, the ZK proofs will pass instantly and trigger status shift from 'Hashing' to 'Confirmed'."
    },
    {
      keywords: ['multiplier', 'streak', 'claim', 'daily', 'login', 'reward', 'booster'],
      answer: "Alpha Loyalty Boosters: Access your daily check-in inside the 'Mine Reactor' tab. Claiming rewards daily increments your check-in streak. At higher streaks, the claim reward triggers permanent mining rate multipliers or grants advanced booster components like 'Overclock chips' and 'Cryo tanks' directly into your local inventory."
    },
    {
      keywords: ['fee', 'gas', 'cost', 'sell'],
      answer: "DEX protocol fees: Selling your mined Sovereign Coins or converting them to fiat balance inside 'DEX Trade & News' incurs standard smart contract transaction gas. Keep an eye on market headlines: bullish events temporarily spike coins valuation, allowing you to maximize conversions. Ensure you make adjustments in settings to favor faster RPC network relays for optimal execution price."
    },
    {
      keywords: ['hello', 'hi', 'how are you', 'support', 'agent', 'help'],
      answer: "Welcome to the ALPHA Mining Support terminal. I am your specialized AI Operator assistant. I can guide you on debugging thermal throttling, speeding up pending validations, or managing system service adjustments. Ask me anything about upgrades, payouts, or block statistics!"
    }
  ];

  // AI customer support chat endpoint
  app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    const latestMessage = messages[messages.length - 1];
    const userPrompt = latestMessage?.content || '';

    // Standard fallback matching logic
    const getFallbackAnswer = (prompt: string) => {
      const lower = prompt.toLowerCase();
      for (const item of KNOWLEDGE_BASE) {
        if (item.keywords.some(k => lower.includes(k))) {
          return item.answer;
        }
      }
      return "ALPHA Support Engine: I've processed your telemetry query regarding cryptocurrency nodes. If this is highly specific to your payment gateway or hardware assembly, please utilize the 'Settings & Preferences' panel to adjust RPC mesh settings, or establish a direct communication tunnel to our live specialized human coordinator using the 'Connect to Live Agent' option.";
    };

    try {
      const client = initGemini();
      if (client) {
        // Construct standard prompt with system instructions
        const systemInstruction = 
          "You are the senior AI support technician for ALPHA LLC MINER (a futuristic cloud mining simulator). " +
          "Your job is to provide crisp, high-fidelity technical answers about rig power limits, GPU cooling loops, " +
          "withdrawing cash balance, daily check-in streaks, market DEX charts, and secure OAuth login triggers. " +
          "Maintain a helpful, clean, slightly cyberpunk techno-tone. Keep replies under 3 sentences.";

        const promptWithContext = `User message: "${userPrompt}"\n\nProvide a technical yet clear assistant support reply. Ensure no directories or code files are referenced.`;

        const response = await client.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: promptWithContext,
          config: {
            systemInstruction,
            temperature: 0.7,
          }
        });

        const replyText = response.text || getFallbackAnswer(userPrompt);
        return res.json({ role: 'assistant', content: replyText });
      } else {
        // No client (missing/invalid key) -> provide high quality Simulated Response
        setTimeout(() => {
          return res.json({ role: 'assistant', content: getFallbackAnswer(userPrompt) });
        }, 800);
      }
    } catch (err: any) {
      console.warn('Gemini chat request failed, fallback initiated:', err.message);
      return res.json({ role: 'assistant', content: getFallbackAnswer(userPrompt) });
    }
  });

  // Vite dev server middleware or prod static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
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
    console.log(`Server successfully active on port ${PORT}`);
  });
}

startServer();
