import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import { initializeProviders, getProvider } from "./providers/index.js";
import { workflowEngine } from "./workflow-engine.js";
import { runAgent } from "./agent-runtime.js";
import fs from "fs/promises";
import path from "path";

const app = express();

app.use(cors());
app.use(express.json());

/*
====================================================
INIT PROVIDERS
====================================================
*/

async function startProviders(){

  console.log("[Providers] Initializing providers...");

  try{

    await initializeProviders();

    console.log("[Providers] Providers ready");

  }catch(err){

    console.error("[Providers] Initialization failed:",err.message);

  }

}

startProviders();

/*
====================================================
WORKFLOW ENGINE
====================================================
*/

try{

  console.log("[WorkflowEngine] Starting autonomous workflows");

  workflowEngine.start();

  console.log("[WorkflowEngine] Scheduled: AI Agents Research");

}catch(err){

  console.warn("[WorkflowEngine] Failed:",err.message);

}

/*
====================================================
SSE UTILITY
====================================================
*/

function createSSE(res){

  res.writeHead(200,{
    "Content-Type":"text/event-stream",
    "Cache-Control":"no-cache",
    "Connection":"keep-alive",
    "Access-Control-Allow-Origin":"*"
  });

}

function sendEvent(res,data){

  res.write(`data: ${JSON.stringify(data)}\n\n`);

}

/*
====================================================
CHAT ENDPOINT
====================================================
*/

app.get("/chat",async(req,res)=>{

  const prompt=req.query.prompt||"";
  const providerName = req.query.provider || "claude";
  const model = req.query.model || "";

  createSSE(res);

  try{

    // Use provider query directly for better agent interaction
    const provider = getProvider(providerName, { model });
    
    if (!provider) {
      throw new Error("Provider not initialized");
    }

    console.log(`[CHAT] Request (${providerName}/${provider.model || model}):`, prompt);
    console.log("[DEBUG] Calling provider with model:", provider.model);
    
    for await (const event of provider.query({ prompt })) {
      
      // Pass events directly to renderer
      sendEvent(res, event);

    }

  }catch(err){

    console.error("[CHAT ERROR]",err);

    sendEvent(res,{
      type:"error",
      message:err.message
    });

    sendEvent(res,{type:"done"});

  } finally {

    res.end();

  }

});

/*
====================================================
HEALTH
====================================================
*/

app.get("/health",(req,res)=>{

  res.json({
    status:"ok",
    service:"open-claude-cowork"
  });

});

/*
====================================================
START SERVER
====================================================
*/

const PORT=3001;

app.listen(PORT,()=>{

  console.log(`✓ Server running http://localhost:${PORT}`);

});
