# 🦞 The Book of OpenClaw: A Complete Beginner's Guide

Welcome to the internal world of OpenClaw. This document is a comprehensive, deep-dive guide designed for someone who knows nothing about the project but wants to understand it at a professional level.

---

## Table of Contents
1.  **The Master Plan** (What is OpenClaw?)
2.  **The Architecture** (How do the pieces fit?)
3.  **The Core Map** (Detailed folder-by-folder walkthrough)
4.  **VIP Files** (The files that run the show)
5.  **The Nervous System** (How messages flow)
6.  **The Brain** (How the AI thinks and uses tools)
7.  **The Shield** (Security and Sandboxing)
8.  **The Eyes & Ears** (The Vision and Audio pipeline)
9.  **The Expandable World** (Plugins and Extensions)
10. **Native Apps** (Mac, iPhone, and Android)
11. **The Laboratory** (Building and Testing)

---

## 1. The Master Plan
OpenClaw is a **Personal AI Assistant**. Unlike standard AI chatbots that live on a website, OpenClaw is **Local-First** and **Multi-Channel**.
- **Local-First**: It runs on your own hardware (your computer, a server, your phone). You own the data.
- **Multi-Channel**: It talks to you on apps you already use (WhatsApp, Telegram, Slack, etc.).

---

## 2. The Architecture
OpenClaw follows a **"Gateway" Pattern**.
- **The Gateway**: A central server that stays on 24/7. It acts as a switchboard.
- **The Agent**: The AI logic. It’s "embedded" inside the gateway but acts as its own entity.
- **The Nodes**: Remote devices (like your iPhone) that connect to the Gateway to give it extra "powers" (like access to a camera).

---

## 3. The Core Map (`src/` Directory)

### `src/acp/` (Agent Client Protocol)
This folder contains the logic for a standardized protocol that allows different AI clients and servers to talk to each other using the same language.

### `src/agents/` (The AI Brain)
The most important folder for AI logic.
- `pi-embedded-runner/`: The code that actually runs the AI model turns.
- `tools/`: Definitions for every tool the AI can use (Browser, Terminal, etc.).
- `sandbox/`: Security logic to run dangerous code (like Bash scripts) safely inside Docker.
- `skills/`: Small packages of capabilities you can "give" to the AI.

### `src/auto-reply/` (The Decision Engine)
This folder decides *if* and *how* to reply to a message.
- `reply/`: Logic for generating the final text/media to send back to the user.
- `templating.ts`: Handles the "fill-in-the-blanks" logic for AI prompts.

### `src/browser/` (The Web Browser)
OpenClaw can actually open a real web browser (using Playwright) to search Google, read articles, or interact with websites for you.

### `src/canvas-host/` (The Visual Workspace)
Provides the "Canvas" feature—a side window where the AI can render charts, documents, or UI elements in real-time.

### `src/channels/` (Communication Apps)
Contains the shared logic for all messaging platforms.
- `telegram/`, `whatsapp/`, `slack/`, `discord/`, `signal/`: Specific code to talk to each platform's servers.

### `src/cli/` (The Command Line)
The code for the `openclaw` command you type in your terminal. It handles onboarding, starting the server, and debugging.

### `src/config/` (The Configuration)
A massive system that manages your `openclaw.json` settings. It includes "Migrators" that automatically update your settings if the project version changes.

### `src/gateway/` (The Switchboard)
The heart of the networking. It manages WebSockets, incoming messages, and keeps track of which "Nodes" (devices) are currently connected.

### `src/infra/` (System Plumbing)
Lower-level code for networking (TLS, DNS), OS integration (Machine names, ENV variables), and system health (Heartbeats).

### `src/media-understanding/` (AI Senses)
The logic that allows the AI to "look" at an image or "listen" to a voice message and understand what is happening.

### `src/plugins/` (The Extension System)
The "Hook" system. It allows developers to add new features to OpenClaw without touching the core code.

---

## 4. VIP Files (The "Very Important" Files)

1.  **`openclaw.mjs`**: The entry point for the entire application.
2.  **`src/gateway/server.impl.ts`**: The main file that starts the Gateway server. If this file crashes, everything stops.
3.  **`src/agents/pi-embedded-runner/run.ts`**: The file that orchestrates an AI "turn." It manages model selection, error handling, and tool execution.
4.  **`src/config/zod-schema.ts`**: The "Law." It defines exactly what settings are allowed in your configuration file.
5.  **`src/telegram/bot.ts`**: The bridge to Telegram. It’s a great example of how a channel works.
6.  **`src/agents/pi-tools.ts`**: The "Tool Belt." It registers all the basic tools (like reading files) that the AI can use.

---

## 5. The Nervous System (The Message Flow)

1.  **Inbound**: A message hits `src/telegram/bot-handlers.ts`.
2.  **Context**: It's turned into a `MsgContext` (a standard object OpenClaw understands).
3.  **Dispatch**: `src/auto-reply/dispatch.ts` looks at the message and finds the right **Session**.
4.  **Agent Run**: `src/agents/pi-embedded-runner.ts` starts a loop.
5.  **Event Stream**: As the AI thinks, it emits "Events" (e.g., `agent.lifecycle.start`). These are sent via **WebSockets** (`src/gateway/server-ws-runtime.ts`) to your Mac app so you see progress.
6.  **Outbound**: The final text is delivered back through `src/telegram/bot/delivery.js`.

---

## 6. The Brain (The Agent Loop)

The Agent doesn't just reply; it **loops**:
1.  **Prompt**: "Search for the weather in Tokyo."
2.  **Model**: Sends to Claude/GPT-4.
3.  **Tool Call**: AI returns a JSON saying "I need to run the `browser` tool."
4.  **Execution**: `src/agents/tools/browser-tool.ts` opens a browser and gets the result.
5.  **Refinement**: Result is sent back to the AI.
6.  **Final Answer**: AI says "The weather in Tokyo is 22°C."

---

## 7. The Shield (Security)

When the AI runs code (like a terminal command), it can be dangerous.
- **Sandboxing**: `src/agents/sandbox/docker.ts` can spin up a tiny "box" (a Docker container) where the AI's commands are trapped so they can't hurt your real computer.
- **Exec Approval**: `src/gateway/exec-approval-manager.ts` can pause the AI and ask YOU for permission before it runs a command.

---

## 8. The Eyes & Ears (Media Pipeline)

- **Vision**: When you send an image, `src/media-understanding/apply.ts` identifies it and prepares it for the AI model.
- **Audio**: `src/media/audio.ts` handles voice-to-text (transcription) so the AI can "read" your voice messages.

---

## 9. The Expandable World (Plugins)

The Plugin system in `src/plugins/` uses **Hooks**.
Think of a "Hook" as a doorbell. When a message arrives, the "Message Received" doorbell rings. Any plugin that is "listening" to that doorbell can wake up and do something (like save the message to a database).

---

## 10. Native Apps (`apps/` Directory)

- **`apps/macos/`**: A Swift app that lives in your Mac menu bar. It controls the Gateway.
- **`apps/ios/` & `apps/android/`**: Mobile apps that act as "Nodes." They use **Bonjour** (`src/infra/bonjour.ts`) to find your computer on the WiFi and connect automatically.

---

## 11. The Language of OpenClaw (The Gateway Protocol)

How does a Mac app written in Apple’s **Swift** talk to a Gateway written in **TypeScript**? They use a shared language called the **Gateway Protocol**.

- **Protocol Definition**: Defined in `dist/protocol.schema.json`.
- **Generator**: `scripts/protocol-gen.ts` and `scripts/protocol-gen-swift.ts` are the machines that translate the language between the two systems.
- **WebSocket RPC**: They communicate using "Remote Procedure Calls." The Mac app sends a JSON packet like `{"method": "node.invoke", ...}` and the Gateway knows exactly what to do.

---

## 12. Remembering the Past (State and Sessions)

OpenClaw doesn't just forget you when you close the app.
- **Session Storage**: All chat history and settings are stored in `~/.openclaw/sessions/`.
- **Compaction**: When a chat gets too long for the AI to remember, `src/agents/pi-embedded-runner/compact.ts` "squeezes" the history down into a summary so the AI stays fast and cheap.
- **Presence**: `src/infra/system-presence.ts` keeps track of who is "Online" (which channels and nodes are active).

---

## 13. The Laboratory (Build System)

- **pnpm**: The package manager that keeps all the monorepo pieces together.
- **tsdown**: The compiler that transforms the TypeScript files in `src/` into the runnable JavaScript files in `dist/`.
- **Vitest**: The testing engine. Every file named `*.test.ts` contains tiny experiments to make sure the code works correctly.

---

## 14. The New Horizon: "The Sentient Site" (The Archaeologist's Dream)

This is the ultimate merger of **OpenClaw** and **Aletheon**. We aren't just building a "chatbot"; we are building an intelligent layer that sits on top of an ancient site, connecting the trench, the lab, and the history books into one living system.

### 🏺 What Archaeologists *Actually* Need
Archaeologists don't need another app to open. They have mud on their hands, they are in remote deserts with poor signal, and they are drowning in manual paperwork. They need a system that **hears, sees, and protects.**

---

### The Three Pillars of "The Sentient Site"

#### 1. The Hands-Free Trench (Voice-to-Locus)
**The Problem:** Archaeologists spend hours writing "Locus Logs" (descriptions of soil and layers) by hand. 
**The Vision:** Use OpenClaw’s `Talk Mode`. An archaeologist stands in a trench and says: 
> *"OpenClaw, start a new find in Locus 104. I see a dark ash layer, likely a burn event. Found a ceramic rim shard, approx 5cm."*
**How it works:**
- **OpenClaw** captures the voice, transcribes it, and identifies the intent.
- **Aletheon** receives the data, tags it with the phone’s high-precision GPS, and creates a new entry in the **Preservation Vault** automatically.
- **Result:** Data is recorded in real-time without the archaeologist ever touching a screen.

#### 2. The Ghost Guard (Autonomous Site Integrity)
**The Problem:** Archaeological sites are often looted or damaged at night.
**The Vision:** Deploy "Sentinel Nodes"—cheap Android phones or Raspberry Pis running the OpenClaw Node software—hidden around the site.
**How it works:**
- OpenClaw’s **Cron System** (`src/gateway/server-cron.ts`) activates these nodes at sunset.
- They use the `camera.snap` tool to monitor movement. 
- If an intruder is detected, the **Aletheon Vision Engine** identifies if it's a human or an animal.
- If it's a human, OpenClaw sends an **Emergency Alert** to the project director's WhatsApp with a photo and location.
- **Result:** 24/7 autonomous security using hardware you already own.

#### 3. Augmented Stratigraphy (X-Ray Vision)
**The Problem:** It's hard to visualize where artifacts were found once they've been removed from the dirt.
**The Vision:** Point your phone at a trench wall. The screen shows you the wall, but overlaid on top are glowing 3D markers showing exactly where previous artifacts were found.
**How it works:**
- **OpenClaw** handles the live camera feed and device orientation.
- **Aletheon’s Arch-Atlas** (GIS) provides the spatial data.
- The AI "looks" at the wall, recognizes the soil patterns, and "pins" the digital artifacts to the physical dirt.
- **Result:** You can "see" through time, understanding the relationship between objects across different years of excavation.

---

### 🚀 The Technical Innovation: "The Scholarly Loop"
The real magic happens when the project is over.
- **The AI Researcher:** The OpenClaw Agent reads every chat log and look at every Aletheon report from the season. 
- **The Smithsonian Sync:** It uses its **Browser Tool** to find matching typologies in the Smithsonian API.
- **The Draft:** It writes the **First Draft** of the Preliminary Excavation Report, complete with map links and material analysis.
- **Innovation:** This turns "Data Entry" into "Scientific Discovery." The AI isn't just assisting; it's **synthesizing** the entire history of the site.

---

### 💡 Is this Realistic?
**Yes.** 
- **Signal:** OpenClaw's **Local-First** architecture means if the desert has no WiFi, the nodes queue up the data and "burst" it to the Gateway when you return to camp.
- **Hardware:** It uses the cameras and microphones already in everyone's pockets.
- **Code:** We have the **Gateway** (OpenClaw) and the **Laboratory** (Aletheon). We just need to wire the "Lab" as a "Skill" for the "Agent."

---

## 15. Technical "How-To" for the Sentient Site

If you want to start building this tomorrow, here are the exact files you would touch:

### To add "Hands-Free Voice Logs":
1.  **Create a Skill**: Add `src/agents/skills/archaeology/LOGGING.md`.
2.  **Define the Tool**: Create `src/agents/tools/archaeology-log-tool.ts`. This tool will call Aletheon’s API to save a find.
3.  **Prompt the Agent**: In `LOGGING.md`, tell the AI: *"When the user says 'record a find', ask for the Locus and description, then call the `archaeology_log_tool`."*

### To add "Ghost Guard" Security:
1.  **Set a Cron Job**: In `src/gateway/server-cron.ts`, add a task that runs every 5 minutes after 8:00 PM.
2.  **Trigger the Node**: Use `nodeRegistry.invoke(nodeId, "camera.snap")` to take a photo.
3.  **Analyze the Image**: Send the photo to Aletheon’s analysis engine. If it returns `detected: human`, use the `whatsapp_send` tool in `src/agents/tools/whatsapp-actions.ts`.

---

*This vision turns OpenClaw from a general assistant into a specialized scientific instrument. Welcome to the Sentient Site.* 🦞

---

*This guide is your map to the lobster-verse and the future of archaeology. Use it wisely!* 🦞
