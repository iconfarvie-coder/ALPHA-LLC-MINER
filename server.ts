import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import brokerRoutes from './src/api/broker-routes';

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
      answer: "ALPHA Mainframe Thermals Alert: If your rig is overheating (above 85°C), the GPU core automatically throttles hash rate by 90% to protect the silicon. To resolve this, navigate to [...]
    },
    {
      keywords: ['payout', 'withdraw', 'transfer', 'paypal', 'wallet', 'money', 'cash', 'delay', 'mempool', 'unverified', 'broker', 'mt5', 'metatrader'],
      answer: "Real Withdrawal Processing: Your mined assets can now be withdrawn directly to MetaTrader 5 brokers or other supported payment methods. Withdrawals process in real-time through our integrated broker network. Track your withdrawal status via the /api/brokers/:brokerId/withdrawals endpoint. No simulations—direct fund transfers!",
    },
    {
      keywords: ['multiplier', 'streak', 'claim', 'daily', 'login', 'reward', 'booster'],
      answer: "Alpha Loyalty Boosters: Access your daily check-in inside the 'Mine Reactor' tab. Claiming rewards daily increments your check-in streak. At higher streaks, the claim reward trigger[...]
    },
    {
      keywords: ['fee', 'gas', 'cost', 'sell'],
      answer: "DEX protocol fees: Selling your mined Sovereign Coins or converting them to fiat balance inside 'DEX Trade & News' incurs standard smart contract transaction gas. Keep an eye on mar[...]
    },
    {
      keywords: ['broker', 'connect', 'metatrader', 'mt5', 'trading'],
      answer: "Broker Integration: ALPHA LLC Miner now supports real MetaTrader 5 connections! Register your broker account via POST /api/brokers/connect with your MT5 credentials. We support Exness, IC Markets, Pepperstone, and more. Connect, mine, and withdraw directly to your trading account!",
    },
    {
      keywords: ['hello', 'hi', 'how are you', 'support', 'agent', 'help'],
      answer: "Welcome to the ALPHA Mining Support terminal. I am your specialized AI Operator assistant. I can guide you on debugging thermal throttling, connecting to MetaTrader 5 brokers, processing real withdrawals, or managing your mining rigs.",
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
      return "ALPHA Support Engine: I've processed your telemetry query. For detailed broker integration or withdrawal processing, please check the /api/brokers endpoints or contact support@alphasllcminer.com";
    };

    try {
      const client = initGemini();
      if (client) {
        // Construct standard prompt with system instructions
        const systemInstruction = 
          "You are the senior AI support technician for ALPHA LLC MINER (a futuristic cloud mining platform with real MetaTrader 5 integration). " +
          "Your job is to provide crisp, high-fidelity technical answers about rig power limits, GPU cooling loops, " +
          "connecting to MetaTrader 5 brokers, processing REAL withdrawals (not simulations), daily check-in streaks, market DEX charts, and secure OAuth login triggers. " +
          "Maintain a helpful, clean, slightly cyberpunk techno-tone. Keep replies under 3 sentences. Emphasize that withdrawals are REAL and direct to brokers.";

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

  // Mount broker management routes
  app.use('/api', brokerRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      features: [
        'mining',
        'mt5-broker-integration',
        'real-withdrawals',
        'multi-broker-support',
        'ai-support',
      ],
    });
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
    console.log(`[ALPHA LLC MINER] Server active on port ${PORT}`);
    console.log(`[MT5 Integration] Broker management endpoints ready at /api/brokers`);
    console.log(`[Health Check] Available at /api/health`);
  });
}

startServer();
