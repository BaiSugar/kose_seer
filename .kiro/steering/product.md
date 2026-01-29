# Product Overview

KOSE Server is a TypeScript-based private server for the game "Seer" (赛尔号), a Chinese online game. This is a nostalgic/legacy server implementation that recreates the classic game experience.

## Core Purpose

Provide a fully functional game server that handles:
- Player authentication and registration
- Real-time multiplayer gameplay
- Pet/creature battle system with PVE combat
- Map navigation and player movement
- Item and inventory management
- Game data persistence

## Architecture Style

Unified server architecture:
- **GameServer**: All-in-one server handling game logic, registration, and client connections (port 9999)
- **ProxyServer**: Protocol debugging and packet inspection (optional)

All services (registration, email, game logic) are integrated into GameServer for simplified deployment.

## Key Design Philosophy

The project follows a high-performance data access pattern with:
- In-memory caching of game data
- Delayed batch saving to reduce database pressure
- Direct Data object manipulation (ORM-style)
- Manager-Data pattern for business logic organization
- One request can return multiple responses (主响应 + 额外推送)
