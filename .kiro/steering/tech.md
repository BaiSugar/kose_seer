# Technology Stack

## Core Technologies

- **Language**: TypeScript 5.x
- **Runtime**: Node.js 18+
- **Build Tool**: TypeScript Compiler (tsc)
- **Package Manager**: npm

## Key Dependencies

### Communication
- `ws` - WebSocket server for real-time client connections
- `amf-js` - AMF (Action Message Format) protocol support for Flash client

### Database
- `better-sqlite3` - SQLite database driver (default)
- `mysql2` - MySQL 8.0 driver (optional)
- Custom ORM layer (DatabaseHelper) inspired by DanhengServer

### Data Processing
- `fast-xml-parser` - XML parsing for game configuration files
- `xml2js` - Alternative XML parser

### Development
- `ts-node` - TypeScript execution for development
- `ts-node-dev` - Auto-restart development server
- `@yao-pkg/pkg` - Package Node.js apps into executables

## Common Commands

### Development
```bash
npm run dev                 # Start all services with auto-restart
npm run dev:game            # Start only GameServer
npm run dev:proxy           # Start only ProxyServer
```

### Database Management
```bash
npm run db:migrate          # Run database migrations
npm run db:rollback         # Rollback last migration
npm run db:status           # Check migration status
```

### Building
```bash
npm run build               # Compile TypeScript to JavaScript
npm run build:services      # Build independent service executables
```

### Production
```bash
npm start                   # Start all services (production)
npm run start:game          # Start GameServer only
```

### Release Packaging
```bash
npm run release:win         # Package for Windows
npm run release:linux       # Package for Linux
npm run release:macos       # Package for macOS
npm run release:all         # Package for all platforms
```

### Development Tools
```bash
npm run tools:proto-to-meta    # Convert Proto to metadata
npm run tools:meta-to-proto    # Convert metadata to Proto
npm run tools:validate-proto   # Validate protocol definitions
npm run tools:generate-docs    # Generate protocol documentation
```

## Configuration Files

- `tsconfig.json` - TypeScript compiler configuration
- `config/server.json` - Unified service configuration (ports, database, logging)
- `config/data/xml/` - Game data (pets, skills, items) extracted from client
- `config/game/` - Server-side game logic configuration

## Database Support

The project supports both SQLite (default) and MySQL:
- **SQLite**: Lightweight, file-based, no setup required
- **MySQL**: Production-ready, better for distributed deployments

Database type is configured in `config/server.json`.
