# Agent News API (SDK & Tools)

[![Powered by Gemini](https://img.shields.io/badge/AI-Gemini%20Pro-blue)](https://deepmind.google/technologies/gemini/)
[![Solana Powered](https://img.shields.io/badge/Payments-Solana-black)](https://solana.com/)

The **Agent News API** is a specialized real-time global intelligence stream designed specifically for **autonomous AI agents**. By leveraging thousands of sources and an advanced reasoning pipeline provide high-signal, structured news payloads tailored for LLM consumption.

This repository contains the official SDKs and tools for integrating Agent News into your autonomous workflows.

---

## 🚀 Key Features

- **Agent-Ready JSON**: Tokens-efficient payloads designed for LLM parsing (entities, sentiment, significance).
- **Zero-HITL Auth**: Autonomously negotiate API keys using Solana wallet signatures—no human signup required.
- **Real-Time Firehose**: Sub-second delivery of global events via WebSocket.
- **Multi-Language Support**: Official SDKs for **Node.js** and **Python**.
- **OpenClaw Integration**: A native skill for the OpenClaw agent framework.

---

## 📦 What's Inside?

### 1. [Node.js SDK](./sdk/node/)
The primary client for JavaScript/TypeScript environments.
- Support for REST and WebSocket (Socket.IO).
- Automatic credit balance monitoring.
- Built-in Solana signature authentication.

### 2. [Python SDK](./sdk/python/)
A lightweight, clean implementation for Python-based agents and data science pipelines.
- Synchronous and Asynchronous support.
- Easy integration with LangChain and AutoGPT.

### 3. [OpenClaw Skill](./openclaw-skill/)
A plug-and-play skill for the OpenClaw ecosystem.
- Allows agents to "search news" or "listen to firehose" autonomously.
- Includes a standalone CLI for manual testing.

---

## 🛠 Quick Start

### For Node.js Agents:
```bash
cd sdk/node
npm install
```

```javascript
const AgentNews = require('./index');

const client = new AgentNews({
  privateKey: 'YOUR_SOLANA_PRIVATE_KEY', // Base58 encoded
  endpoint: 'https://agentnewsapi.com'
});

async function main() {
  // Connect to the real-time firehose
  await client.connect();
  
  client.on('signal', (story) => {
    console.log(`[${story.sentiment.label}] ${story.title}`);
    console.log(`Relevance: ${story.significance}/10`);
  });
}

main();
```

### For Python Agents:
```bash
cd sdk/python
pip install -r requirements.txt
```

---

## 🌐 API Tiers

| Tier | Latency | Cost | Auth Required |
| :--- | :--- | :--- | :--- |
| **Free** | 20m Delay | $0.00 | No |
| **Premium** | Real-Time | $0.0001 / story | Yes (Solana) |

**Free Endpoint**: `https://agentnewsapi.com/api/news/free`  
**Premium Endpoint**: `https://agentnewsapi.com/api/news/latest`

---

## 🔗 Resources

- **Main Website**: [agentnewsapi.com](https://agentnewsapi.com)
- **Technical Docs**: [llms.txt](https://agentnewsapi.com/llms.txt) (Machine-readable)
- **Protocol Hot Wallet**: `6rSLPtj9Ef7aifNHHFzEPkY5hWECJXryivWx1YhPuXSa`

---

## ⚖️ License

MIT © 2026 Agent News API. 
"Empowering the next generation of autonomous intelligence."
