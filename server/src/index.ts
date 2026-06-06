
import './lib/preload.js';

import express from "express";
import { auth } from "./lib/auth.js";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

import { ChatService } from "./services/chat-service.js";
import { AIService } from "./services/ai-service.js";
import { generateApplication } from "./config/agent.config.js";
import { getEnabledTools, enableTools, resetTools } from "./config/tool.config.js";

const chatService = new ChatService();
const aiService = new AIService();

app.use(cookieParser());
const port = 3005;

app.use(
  cors({
    origin: process.env.FRONTEND_URL, 
    methods: ["GET", "POST", "PUT", "DELETE"], 
    credentials: true, 
  })
);

app.all("/api/auth/*splat", toNodeHandler(auth)); 

app.use(express.json());

// Fixed: This endpoint now properly handles Bearer token authentication
app.get("/api/me", async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    
    if (!session) {
      return res.status(401).json({ error: "No active session" });
    }
    
    return res.json(session);
  } catch (error) {
    console.error("Session error:", error);
    return res.status(500).json({ error: "Failed to get session", details: (error as Error).message });
  }
});

// You can remove this endpoint if you're using the Bearer token approach above
app.get("/api/me/:access_token", async (req, res) => {
  const { access_token } = req.params;
  console.log(access_token);
  
  try {
    const session = await auth.api.getSession({
      headers: {
        authorization: `Bearer ${access_token}`
      }
    });
    
    if (!session) {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    return res.json(session);
  } catch (error) {
    console.error("Token validation error:", error);
    return res.status(401).json({ error: "Unauthorized", details: (error as Error).message });
  }
});

app.get("/device", async (req, res) => {
  const { user_code } = req.query; // Fixed: should be req.query, not req.params
  res.redirect(`${process.env.FRONTEND_URL}/device?user_code=${user_code}`);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
// API Routes for Chat and Agent

app.post("/api/conversations", async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    
    if (!session) {
      return res.status(401).json({ error: "No active session" });
    }

    const { mode, conversationId } = req.body;
    const conversation = await chatService.getOrCreateConversation(
      session.user.id,
      conversationId,
      mode
    );

    return res.json(conversation);
  } catch (error) {
    console.error("Conversation error:", error);
    return res.status(500).json({ error: "Failed to create conversation" });
  }
});

app.post("/api/conversations/:id/messages", async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    
    if (!session) {
      return res.status(401).json({ error: "No active session" });
    }

    const { id } = req.params;
    const { message, toolsEnabled } = req.body;

    await chatService.addMessage(id, "user", message);

    const dbMessages = await chatService.getMessages(id);
    const aiMessages = chatService.formatMessagesForAI(dbMessages);
    
    let tools = undefined;
    if (toolsEnabled && Array.isArray(toolsEnabled) && toolsEnabled.length > 0) {
      enableTools(toolsEnabled);
      tools = getEnabledTools();
    } else {
      resetTools();
    }

    // Set headers for chunked response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const onChunk = (chunk: string) => {
      res.write(chunk);
    };

    let toolCallsDetected: any[] = [];
    let toolResultsDetected: any[] = [];
    const fullResponse: any = await aiService.sendMessage(
      aiMessages,
      onChunk,
      tools,
      (toolCall: any) => { toolCallsDetected.push(toolCall); }
    );

    await chatService.addMessage(id, "assistant", fullResponse.content);
    
    // We send a final structured delimiter to let the client know of tools
    if (toolCallsDetected.length > 0 || (fullResponse.toolResults && fullResponse.toolResults.length > 0)) {
      const meta = {
        toolCalls: toolCallsDetected,
        toolResults: fullResponse.toolResults || []
      };
      res.write("\n\n___METADATA___\n" + JSON.stringify(meta));
    }
    
    res.end();
  } catch (error) {
    console.error("Message error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to send message" });
    } else {
      res.end();
    }
  }
});

app.post("/api/agent", async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    
    if (!session) {
      return res.status(401).json({ error: "No active session" });
    }

    const { description } = req.body;
    const result = await generateApplication(description, aiService);

    return res.json(result);
  } catch (error) {
    console.error("Agent error:", error);
    return res.status(500).json({ error: "Failed to generate application" });
  }
});
