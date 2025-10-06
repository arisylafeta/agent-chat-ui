import { initApiPassthrough } from "langgraph-nextjs-api-passthrough";

// This file acts as a proxy for requests to your LangGraph server.
// Phase 1: Authentication - JWT tokens are passed through this proxy to LangGraph
// The langgraph-nextjs-api-passthrough automatically forwards all headers including Authorization

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS, runtime } =
  initApiPassthrough({
    apiUrl: process.env.LANGGRAPH_API_URL ?? "http://localhost:2024",
    // Note: apiKey set to undefined - using custom JWT auth instead of LANGSMITH_API_KEY
    apiKey: undefined,
    runtime: "edge",
  });
