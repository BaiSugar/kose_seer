# 配置文件说明

## 配置文件结构

```
config/
├── server.json              # 统一服务配置（使用中）
├── server.json.default      # 默认配置模板
├── data/                    # 游戏数据配置（XML）
│   ├── xml/
│   │   ├── pets.xml         # 精灵配置
│   │   ├── skills.xml       # 技能配置
│   │   ├── items.xml        # 物品配置
│   │   ├── skill_effects.xml # 技能效果配置
│   │   └── spt.xml          # SPT配置
│   └── json/
│       ├── natures.json     # 性格配置
│       ├── elements.json    # 属性配置
│       └── unique-items.json # 特殊物品配置
└── game/                    # 游戏逻辑配置（JSON）
    ├── map-ogres.json       # 地图怪物配置
    ├── battle-config.json   # 战斗配置（预留）
    ├── task-config.json     # 任务配置（预留）
    └── shop-config.json     # 商店配置（预留）
```

## 配置文件说明

### server.json - 统一服务配置

所有服务的配置都在这个文件中，包括：

#### services - 服务配置

**gateway** - 网关服务
- `enabled`: 是否启用
- `loginPort`: 登录服务器端口（客户端连接）
- `gamePort`: 游戏服务器端口（客户端连接）
- `rpcPort`: RPC服务器端口（后端服务连接）
- `host`: 监听地址

**regist** - 注册服务
- `enabled`: 是否启用
- `rpcPort`: RPC端口
- `host`: 监听地址

**game** - 游戏服务
- `enabled`: 是否启用
- `rpcPort`: RPC端口
- `host`: 监听地址

**email** - 邮件服务
- `enabled`: 是否启用
- `rpcPort`: RPC端口
- `host`: 监听地址

**gm** - GM管理服务
- `enabled`: 是否启用
- `port`: HTTP服务端口
- `host`: 监听地址
- `localMode`: 本地模式开关
  - `true`: 本地模式，无需登录认证，所有功能直接可用
  - `false`: 远程模式，需要使用游戏账号登录，并且需要在白名单中才能使用功能

**proxy** - 代理服务（调试用）
- `enabled`: 是否启用
- `listenPort`: 代理监听端口
- `listenHost`: 代理监听地址
- `webPort`: Web界面端口
- `loginServer`: 目标登录服务器
- `gameServer`: 目标游戏服务器

#### database - 数据库配置

- `type`: 数据库类型（sqlite/mysql/postgresql）
- `path`: SQLite数据库文件路径（type为sqlite时使用）
- `host`: 数据库服务器地址（type为mysql时使用）
- `port`: 数据库端口（type为mysql时使用）
- `username`: 数据库用户名（type为mysql时使用）
- `password`: 数据库密码（type为mysql时使用）
- `database`: 数据库名称（type为mysql时使用）
- `options`: 数据库选项

#### redis - Redis配置（可选）

- `enabled`: 是否启用
- `host`: Redis服务器地址
- `port`: Redis端口
- `password`: Redis密码
- `db`: 数据库编号

#### logging - 日志配置

- `level`: 日志级别（debug/info/warn/error）
- `directory`: 日志目录（预留，当前未使用）
- `maxFiles`: 最大日志文件数（预留，当前未使用）

**注意**: 当前只使用 `level` 配置来控制控制台日志输出级别，文件日志功能预留。

#### security - 安全配置

- `sessionTimeout`: 会话超时时间（秒）
- `maxLoginAttempts`: 最大登录尝试次数
- `lockoutDuration`: 锁定时长（秒）

## 使用方法

### 首次使用

1. 复制默认配置：
```bash
cp server.json.default server.json
```

2. 根据需要修改 `server.json`

3. 启动服务：
```bash
npm start
```

### 独立部署

如果要将服务部署到不同的机器：

**机器1 - Gateway**
```json
{
  "services": {
    "gateway": {
      "enabled": true,
      "host": "0.0.0.0",
      "rpcPort": 50000
    }
  }
}
```

**机器2 - GameServer**
```json
{
  "services": {
    "gateway": {
      "enabled": true,
      "host": "192.168.1.100",  // Gateway的IP
      "rpcPort": 50000
    },
    "game": {
      "enabled": true,
      "host": "localhost",
      "rpcPort": 50002
    }
  }
}
```

## 配置优先级

1. `server.json` - 当前使用的配置
2. `server.json.default` - 默认配置模板（不会被读取）

## 注意事项

1. **不要提交 server.json 到版本控制**
   - 添加到 `.gitignore`
   - 每个环境使用自己的配置

2. **端口冲突**
   - 确保配置的端口没有被其他程序占用
   - 默认端口：9999（登录）、27777（游戏）、50000-50003（RPC）

3. **安全性**
   - 生产环境建议修改默认端口
   - 使用强密码
   - 限制访问IP

4. **性能优化**
   - 根据服务器性能调整数据库连接池大小
   - 调整日志级别（生产环境建议使用 warn 或 error）

## 游戏数据配置

游戏数据配置文件位于 `data/` 和 `game/` 目录：

- **data/xml/** - 从客户端提取的XML配置（精灵、技能、物品等）
- **data/json/** - 服务端JSON配置（性格、属性等）
- **game/** - 游戏逻辑配置（地图怪物、战斗、任务等）

这些配置在服务启动时自动加载，无需手动配置。
