# 🦞 The Beginner's Guide to OpenClaw

This document is a high-level guide to help you understand how OpenClaw works, how it is structured, and how its different parts communicate.

---

## 1. The Big Picture: What is OpenClaw?
Think of OpenClaw as a **Central Hub** for AI.
Instead of going to a website to talk to an AI, OpenClaw brings the AI to **you**, wherever you already are (WhatsApp, Telegram, Slack, etc.).

It has three main parts:
1.  **The Channels**: These are the "ears and mouth." They listen for your messages on Telegram or WhatsApp and send back the AI's replies.
2.  **The Gateway**: This is the "switchboard." It connects all the different channels to the AI and manages your sessions, settings, and security.
3.  **The Agent (Pi)**: This is the "brain." It reads your message, thinks about it, and uses tools (like a web browser, a terminal, or a camera) to get you an answer.

---

## 2. The Project Structure (Where is what?)
The project is a **Monorepo** (one big box containing smaller boxes). Here is the map:

*   **`src/`**: This is the **heart** of the project. It contains all the core logic.
    *   `src/gateway/`: The central hub server that coordinates everything.
    *   `src/agents/`: The AI "brain" logic, tool definitions, and LLM communication.
    *   `src/channels/`: Shared logic for all chat apps.
    *   `src/telegram/`, `src/whatsapp/`, `src/slack/`, etc.: Specific code for each app.
    *   `src/auto-reply/`: The logic that decides *how* and *when* to reply to a message.
*   **`ui/`**: The web dashboard code (built with Vite and React).
*   **`apps/`**: The "native" apps for your phone (iPhone/Android) or Mac.
*   **`packages/`**: Reusable code libraries.
*   **`extensions/`**: Plugins that add new capabilities (like Microsoft Teams support).
*   **`scripts/`**: Development tools for building, testing, and releasing.

---

## 3. How things talk to each other (The "Life of a Message")
Here is what happens when you send a message:

1.  **Reception**: You send "Hello" on Telegram. The code in `src/telegram/` hears this via a Webhook or long-polling.
2.  **Normalization**: It turns your Telegram message into a standard "OpenClaw Message" (called a `MsgContext`).
3.  **Routing**: The **Gateway** looks at your message and routes it to the correct **Session**.
4.  **Thinking**: The **Agent** starts an execution loop. It reads your history and the new message.
5.  **Streaming**: As the AI thinks, it sends "Events" (updates) over a **WebSocket** (a fast data pipe). This is how the Mac app or Web dashboard shows the AI "typing" in real-time.
6.  **Reply**: Once the AI generates a final answer, the Gateway sends it back to the channel (Telegram) for delivery.

---

## 4. How it was Built
*   **Language**: **TypeScript**. It's modern JavaScript with "types" to make the code safer and easier to read.
*   **Runtime**: **Node.js** (version 22+). This runs the server-side code.
*   **Build Tool**: **pnpm** (for managing packages) and **tsdown** (for compiling TypeScript).
*   **Cross-Platform Sync**: Uses a **Protocol Generator** (`scripts/protocol-gen.ts`) to ensure the Mac and Mobile apps always understand the Gateway's language.

---

## 5. Key Concepts for Beginners
*   **Gateway**: The central server that must be running for everything else to work.
*   **Node**: Any device (like your iPhone or a remote Mac) that connects to the Gateway to provide extra features (like taking a photo).
*   **Skill**: A specific capability you can give the AI (e.g., "Search the Web" or "Check my Email").
*   **Session**: A specific conversation history. Each chat with the AI is isolated into its own session.

---

---

## 6. Deep Dive: How the AI "Thinks" (The Agent Loop)
When the AI receives a message, it doesn't just guess an answer. it enters a cycle called the **Agent Loop**.

1.  **Context Preparation**: The Agent looks at your history and "Bootstrap" files (information you've given it about your project or yourself).
2.  **The Turn**: It sends everything to the LLM (like Claude or GPT-4).
3.  **Tool Use**: If the AI realizes it needs to "Search the web" or "Read a file," it doesn't just hallucinate the answer. It stops and says: *"I need to use the `browser` tool."*
4.  **Execution**: OpenClaw runs that tool locally (e.g., opens a real Chrome window) and sends the results back to the AI.
5.  **Refinement**: The AI looks at the tool's output and either finishes its answer or decides it needs *another* tool.
6.  **Streaming**: While this is happening, OpenClaw "streams" the progress to you so you can see what it's doing (e.g., "Searching Google...").

---

## 7. Deep Dive: How Mobile Apps Connect (Nodes)
OpenClaw can use your iPhone or Android as a **Node**. This means the AI can "see" through your phone's camera or "hear" through its microphone.

1.  **Discovery**: The Gateway uses a technology called **Bonjour** (mDNS). It broadcasts a signal on your WiFi saying, *"Hey, I'm an OpenClaw Gateway!"*
2.  **Pairing**: When you open the OpenClaw app on your phone, it looks for that signal. Once found, you "pair" them.
3.  **Capabilities**: Your phone tells the Gateway: *"I have a camera and I can record audio."*
4.  **Inversion of Control**: Now, when the AI (the "brain") decides it needs a photo, it sends a command to the Gateway, which forwards it to your phone. Your phone takes the photo and sends it back up to the AI.

---

## 8. Code Tour: Explaining the "Magic" Files

### The Switchboard (`src/gateway/server.impl.ts`)
This file is the "Main" function for the Gateway. It:
- Loads your `openclaw.json` configuration.
- Starts the **WebSocket Server** (the pipe that talks to apps).
- Sets up **Cron Jobs** (tasks that run on a schedule).
- Manages **Plugins** (extra features).

### The Engine (`src/agents/pi-embedded-runner/run.ts`)
This is where the "Thinking" happens. It:
- Handles **Failover**: If one AI model is down, it tries another.
- Manages **Auth Profiles**: It chooses which API key to use.
- Executes **Attempts**: It manages the actual conversation turns with the AI.

### The Ear (`src/telegram/bot.ts`)
This is how Telegram is integrated. It:
- Uses the `grammy` library to talk to Telegram's servers.
- **Sequentializes**: Ensures messages from the same person are handled in the right order.
- **Deduplicates**: Makes sure the same message isn't processed twice.
- Handles **Reactions**: Even when you add an emoji to a message, this file hears it and tells the AI.

---

*This document is your roadmap to the OpenClaw universe. Happy Hacking!* 🦞
