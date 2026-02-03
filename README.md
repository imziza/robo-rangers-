# 🏺 Aletheon: AI-Powered Archaeological Analysis Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com/)
[![Electron](https://img.shields.io/badge/Electron-Desktop-blue?logo=electron)](https://www.electronjs.org/)
[![MapLibre](https://img.shields.io/badge/MapLibre-GIS-orange?logo=maplibre)](https://maplibre.org/)

**Aletheon** (ArchaeoAI) is a sophisticated, high-fidelity platform engineered for the modern archaeologist. It bridges the gap between traditional field work and advanced computational analysis, providing a comprehensive suite for artifact digitization, AI-driven spectrographic analysis, and global GIS mapping.

---

## 🚀 Key Modules & Features

### 📦 Preservation Vault
The core repository for all digital specimens.
- **Detailed Specimen Reports**: Tracks technical data including material composition, PH levels, and molecular signatures.
- **Integrity Monitoring**: Real-time status tracking (Stable, Critical, Pending) for sensitive artifacts.
- **Sync Protocol**: Secure, institutional-grade synchronization across global nodes.

### 🔬 Artifact Laboratory (AI Analysis)
Leverage cutting-edge AI models for high-fidelity specimen analysis.
- **AI Engine**: Powered by **OpenRouter (DeepSeek R1 Chimera)** for advanced reasoning and scholarly hypothesis generation.
- **Multi-Phase Scanning**: Spectrographic Signature Mapping, Material Composition Identification, and Global Antiquity Database Cross-Referencing.

### 🗺 Arch-Atlas (Cinematic GIS)
**Newly Redesigned Cinematic HUD** experience for maximum map immersion.
- **Cinematic HUD**: Floating glassmorphism controls with entrance animations.
- **Universal Search**: Geocoding search to fly anywhere on the globe instantly.
- **Ancient Site Plans**: 2D ruins overlays (Giza, Rome) on satellite imagery.
- **Discovery Timeline**: Granular timeline with discovery dots marking pinpoint artifact finds.
- **Temporal Mapping**: Visualize civilizations and events from 3300 BCE to 1600 CE.

### 👥 Collaboration & Discovery
- **Discovery Engine**: Intelligent search and exploration integrated with **Smithsonian Open Access API**.
- **Citation Log**: Automated academic source generation for research integrity.

---

## 🛠 Technology Stack

- **Frontend**: [Next.js](https://nextjs.org/) 15 (App Router), [React](https://react.dev/) 19, [Framer Motion](https://www.framer.com/motion/)
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Real-time RLS)
- **Mapping**: [MapLibre GL](https://maplibre.org/)
- **Desktop**: [Electron](https://www.electronjs.org/)

---

## 🏁 Getting Started

### Prerequisites
- Node.js (Latest LTS)
- NPM or Bun

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/imziza/robo-rangers-.git
   cd robo-rangers-
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

---

## 🚀 Deployment & Running

### Development Mode
Runs the app with hot-reloading for development.
```bash
npm run dev
```

### Production Mode (OPTIMIZED)
For maximum performance and deployment, follow these steps:

1. **Build the application**:
   ```bash
   npm run build
   ```
   *This compiles the TypeScript code and optimizes images/assets for production.*

2. **Start the production server**:
   ```bash
   npm start
   ```
   *The app will be served on [http://localhost:3000](http://localhost:3000).*

### Desktop (EXE) Build & Install
To run Aletheon as a standalone desktop application:

1. **Install Electron dependencies**:
   ```bash
   npm install --save-dev electron electron-builder
   ```

2. **Run in development**:
   ```bash
   npm run electron:dev
   ```

3. **Build for production (Windows .exe)**:
   ```bash
   npm run electron:build
   ```
   *The generated installer will be located in the `/dist` directory.*

---

## 📊 Database Architecture
Aletheon utilizes a robust PostgreSQL schema managed via Supabase:
- `profiles`: User metadata and institutional affiliations.
- `artifacts`: Core specimen data and AI reports.
- `groups`: Research team management.
- `messages`: Real-time collaborative communication.

---

## 📸 Interface Preview

<div align="center">
  <p><i>The Cinematic Atlas Redesign</i></p>
  <img src="https://raw.githubusercontent.com/imziza/robo-rangers-/main/public/screenshots/atlas_cinematic.png" width="90%" alt="Cinematic Atlas View" />
</div>

---

## 📄 License
MIT License.

---
© 2025 Aletheon | Securing the Past for the Future.
