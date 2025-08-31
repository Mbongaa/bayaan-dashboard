# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` - Starts the Next.js development server
- **Build**: `npm run build` - Builds the production application  
- **Production server**: `npm start` - Starts the production server
- **Linting**: `npm run lint` - Runs ESLint to check code quality

## Environment Setup

- Copy `.env.sample` to `.env` and add your `OPENAI_API_KEY`
- Alternatively, add `OPENAI_API_KEY` to your shell profile
- Application runs on `http://localhost:3000` by default

## Architecture Overview

This is a Next.js TypeScript application demonstrating advanced voice agent patterns using the OpenAI Realtime API and OpenAI Agents SDK.

### Core Architecture Patterns

**1. Chat-Supervisor Pattern** (`src/app/agentConfigs/chatSupervisor/`)
- Realtime chat agent handles basic interactions
- Intelligent supervisor model (gpt-4.1) handles complex tasks and tool calls
- Provides immediate response with escalation to supervisor when needed

**2. Sequential Handoff Pattern** (`src/app/agentConfigs/customerServiceRetail/`, `simpleHandoff.ts`)
- Specialized agents handle specific user intents
- Handoffs coordinated via tool calls in an agent graph
- Each agent has focused instructions and tools

### Key Directories

- `src/app/agentConfigs/` - Agent configurations and scenarios
  - Each subdirectory represents an agent scenario with instructions, tools, and handoff logic
  - `index.ts` exports all available agent sets mapped by scenario key
- `src/app/api/` - Next.js API routes for session management and guardrails
- `src/app/components/` - React components for UI (transcript, events, toolbar)
- `src/app/contexts/` - React contexts for transcript and event management  
- `src/app/hooks/` - Custom React hooks for realtime session management
- `src/app/lib/` - Utility functions for audio, codecs, and environment setup

### Agent Configuration Structure

Agents are defined using the OpenAI Agents SDK:

```typescript
export const agent = new RealtimeAgent({
  name: 'agentName',
  handoffDescription: 'Description for agent transfer tool',
  instructions: 'Agent behavior instructions',
  tools: [], // Tool definitions
  handoffs: [otherAgent], // Agents this can hand off to
});
```

Agent scenarios are collections of agents registered in `src/app/agentConfigs/index.ts`.

### WebRTC Session Management

- `useRealtimeSession` hook manages connection to OpenAI Realtime API
- Sessions use ephemeral tokens from `/api/session` endpoint
- WebRTC data channel "oai-events" handles real-time communication
- Audio codec selection supports Opus (48kHz) and PCMU/PCMA (8kHz)

### Tool Logic and Function Calls

- Agent tools are defined with JSON schema parameters
- Tool execution logic implemented in `toolLogic` property of agent configs
- Function calls can trigger agent handoffs via `transferAgents` tool
- Escalation pattern: complex decisions can call external models (e.g., o4-mini for validation)

### Guardrails and Moderation

- Output guardrails check assistant messages for safety/compliance
- Moderation categories: "OFFENSIVE", "OFF_BRAND", "VIOLENCE", "NONE"
- Guardrail status tracked in transcript items (IN_PROGRESS → PASS/FAIL)
- Implementation in `src/app/agentConfigs/guardrails.ts`

### State Management

- **TranscriptContext**: Manages conversation history and breadcrumbs
- **EventContext**: Logs client/server events for debugging
- Session status: "DISCONNECTED" → "CONNECTING" → "CONNECTED"
- Transcript items track status, timestamps, and guardrail results

## Adding New Agent Scenarios

1. Create new directory in `src/app/agentConfigs/`
2. Define agents using `RealtimeAgent` class with instructions, tools, handoffs
3. Export agent array as scenario
4. Add to `allAgentSets` in `src/app/agentConfigs/index.ts`
5. Scenario appears in UI dropdown automatically

## Testing Agent Flows

- Use "Scenario" dropdown to select agent configurations
- Use "Agent" dropdown to switch to specific agents within scenario
- Monitor transcript (left panel) and event log (right panel)
- Test handoffs by triggering agent transfer conditions
- Validate tool calls and responses in transcript breadcrumbs