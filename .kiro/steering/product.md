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

Microservices architecture with independent, deployable services:
- **Gateway**: Client connection entry point and request routing
- **GameServer**: Core game logic and state management
- **RegistServer**: Account registration and authentication
- **EmailServer**: Email verification (reserved interface)
- **ProxyServer**: Protocol debugging and packet inspection

## Key Design Philosophy

The project follows  - a high-performance data access pattern with:
- In-memory caching of game data
- Delayed batch saving to reduce database pressure
- Direct Data object manipulation (ORM-style)
- Manager-Data pattern for business logic organization
