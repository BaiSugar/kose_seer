# Project Structure

## Root Organization

The repository contains multiple sub-projects:
- `seer_server/` - Main TypeScript server (primary focus)
- `kose_client/` - Electron-based game client
- `luvit/` - Legacy Lua server implementation
- `src/` - ActionScript source files (Flash client assets)

## Main Server Structure (`seer_server/`)

### Entry Points
```
src/
├── index.ts              # Main entry (starts all services)
├── game-entry.ts         # GameServer standalone entry
└── proxy-entry.ts        # ProxyServer standalone entry
```

### Service Modules
```
src/
├── GameServer/           # Unified game server (includes registration and email)
│   ├── GameServer.ts
│   ├── Game/             # Business logic layer
│   │   ├── Battle/       # Combat system
│   │   ├── Map/          # Map and movement
│   │   ├── Pet/          # Pet/creature system
│   │   ├── Item/         # Inventory and items
│   │   ├── Task/         # Quest system
│   │   ├── Player/       # Player instance
│   │   ├── Login/        # Login and registration
│   │   └── System/       # System tasks (auto-save)
│   └── Server/
│       └── Packet/       # Protocol handlers
│           ├── Recv/     # Request handlers
│           └── Send/     # Response packets
│
└── ProxyServer/          # Debug proxy service
```

### Data Layer
```
src/DataBase/
├── DatabaseManager.ts    # Low-level DB connection layer
├── DatabaseHelper.ts     # High-level ORM layer (DanhengServer style)
├── models/               # Data classes (map to DB tables)
│   ├── PlayerData.ts
│   ├── FriendData.ts
│   ├── PetData.ts
│   └── ItemData.ts
├── repositories/         # Data access (minimal, mostly replaced by Data classes)
└── migrations/           # Database schema migrations
    └── scripts/
```

### Shared Modules
```
src/shared/
├── config/               # Configuration system
├── protocol/             # Protocol definitions (CommandID, etc.)
├── proto/                # Protocol classes
│   ├── base/             # BaseProto
│   └── packets/
│       ├── req/          # Request protocol classes
│       └── rsp/          # Response protocol classes
├── models/               # Shared interfaces
└── utils/                # Utility functions
```

### Configuration
```
config/
├── server.json                # Main server configuration (ports, database, logging)
├── server.json.default        # Configuration template
├── README.md                  # Configuration documentation
└── data/                      # Game data (extracted from client)
    ├── xml/                   # XML game data (from Flash client)
    │   ├── pets.xml           # Pet/monster definitions
    │   ├── skills.xml         # Skill/move definitions
    │   ├── items.xml          # Item definitions
    │   ├── skill_effects.xml  # Skill effect definitions
    │   └── spt.xml            # SPT data
    └── json/                  # JSON game data (server-side)
        ├── map-ogres.json     # Map monster spawn configuration
        ├── tasks.json         # Task/quest definitions
        ├── natures.json       # Pet nature definitions
        ├── elements.json      # Element/type definitions
        └── unique-items.json  # Unique item definitions
```

### Configuration System Architecture

**三层架构：**

1. **ConfigDefinitions** (`src/shared/config/ConfigDefinitions.ts`)
   - 定义所有配置的键名常量 (ConfigKeys)
   - 定义配置文件路径映射 (ConfigPaths)
   - 定义配置类型 (JSON/XML)
   - 提供配置注册信息

2. **ConfigRegistry** (`src/shared/config/ConfigRegistry.ts`)
   - 配置注册和加载管理
   - 配置缓存和热重载
   - 统一的配置访问接口
   - 支持批量注册和初始化

3. **GameConfig** (`src/shared/config/game/GameConfig.ts`)
   - 类型安全的配置访问层
   - 提供便捷的查询方法
   - 封装配置逻辑（如地图刷怪、进化链）
   - 统一的配置重载接口

**配置加载流程：**
```typescript
// 1. 服务启动时注册所有配置
ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());

// 2. 初始化加载所有配置
await ConfigRegistry.Instance.Initialize();

// 3. 通过GameConfig访问配置
const pet = GameConfig.GetPetById(petId);
const skill = GameConfig.GetSkillById(skillId);
const ogres = GameConfig.GetMapOgres(mapId, playerCount);
```

**配置类型：**
- **ServerConfig** - 服务器配置（端口、数据库、日志）
- **XML配置** - 游戏数据（精灵、技能、物品）
- **JSON配置** - 服务器逻辑配置（刷怪、任务、性格）

### Documentation
```
docs/
├── ARCHITECTURE_SUMMARY.md           # Architecture overview
├── database-architecture.md          # DatabaseHelper vs DatabaseManager
├── player-instance-usage.md          # Player instance patterns
├── migration-to-danheng-architecture.md
└── skill-effect-development-guide.md
```

### Tools
```
tools/                    # Development utilities
├── proto-to-meta.ts      # Protocol conversion
├── meta-to-proto.ts
├── validate-proto.ts     # Protocol validation
└── generate-proto-docs.ts
```

## Key Architectural Patterns

### Manager-Data Pattern
Each game feature has:
- **Manager** (business logic) - e.g., `FriendManager`, `PetManager`
- **Data** (database model) - e.g., `FriendData`, `PetData`
- Manager holds Data object and operates on it directly

### Protocol Pattern
Each client request/response has:
- **ReqProto** - Request deserialization (`src/shared/proto/packets/req/`)
- **RspProto** - Response serialization (`src/shared/proto/packets/rsp/`)
- **Packet** - Response wrapper (`src/GameServer/Server/Packet/Send/`)
- **Handler** - Request handler (`src/GameServer/Server/Packet/Recv/`)

### File Naming Conventions
- Data models: `XxxData.ts` (e.g., `PlayerData.ts`)
- Managers: `XxxManager.ts` (e.g., `FriendManager.ts`)
- Handlers: `XxxHandler.ts` (e.g., `LoginHandler.ts`)
- Packets: `PacketXxx.ts` (e.g., `PacketLogin.ts`)
- Request protos: `XxxReqProto.ts` (e.g., `LoginReqProto.ts`)
- Response protos: `XxxRspProto.ts` (e.g., `LoginRspProto.ts`)
