# KOSE Server - 某童年游戏的怀旧服服务端TS实现版

> 基于 TypeScript 的某童年游戏的怀旧服服务端赛尔号私服服务端，采用统一架构，所有功能集成在 GameServer 中

## 友情链接
[空影的Go端](https://github.com/qq555565/Seer-golang)

## 🎮 Web 管理后台

本项目提供了功能强大的 Web 管理后台，支持实时管理游戏服务器和玩家数据。

### 主要功能

#### 1. 玩家管理

- 查看在线/离线玩家列表
- 实时搜索和筛选玩家
- 查看玩家详细信息（等级、金币、精灵等）
- 编辑玩家属性（金币、经验、VIP等）
- 踢出在线玩家
- 封禁/解封玩家账号

![玩家管理](image/玩家管理.png)
![玩家管理详情](image/玩家管理1.png)

#### 2. 精灵管理

- 查看玩家的所有精灵
- 添加精灵到玩家背包/仓库
- 编辑精灵属性（等级、DV、EV、性格等）
- 修改精灵技能
- 治疗精灵
- 删除精灵

![添加精灵](image/添加精灵.png)
![编辑精灵](image/编辑精灵.png)

#### 3. 地图配置

- 配置地图怪物刷新
- 设置怪物等级范围
- 调整捕捉率和经验倍率
- 配置 BOSS 刷新
- 实时热重载配置

![地图配置](image/地图配置.png)
![地图配置详情](image/地图配置1.png)
![地图配置编辑](image/地图配置2.png)

#### 4. 服务器管理

- 查看服务器状态
- 重启服务器
- 查看在线人数
- 系统日志查看

![服务器管理](image/服务器管理.png)

### 启动 Web 管理后台

#### 开发模式

```bash
# 启动 GM 服务器（后端 API）
npm run dev:gm

# 启动 Web 前端（另一个终端）
cd web
npm install
npm run dev
```

访问：`http://localhost:5173`

#### 生产模式

```bash
# 构建 Web 前端
cd web
npm run build

# 启动 GM 服务器（会自动提供静态文件）
npm run start:gm
```

访问：`http://localhost:3001`

### 技术栈

**后端（GM Server）**

- Express.js - Web 框架
- TypeScript - 类型安全
- 与 GameServer 共享数据库

**前端（Web UI）**

- Vue 3 - 渐进式框架
- Element Plus - UI 组件库
- TypeScript - 类型安全
- Vite - 构建工具

### API 端点

- `GET /api/players` - 获取玩家列表
- `GET /api/players/:uid` - 获取玩家详情
- `POST /api/players/:uid/kick` - 踢出玩家
- `POST /api/players/:uid/ban` - 封禁玩家
- `GET /api/pets` - 获取精灵列表
- `POST /api/pets/give` - 赠送精灵
- `PUT /api/pets/:uid/:catchTime` - 编辑精灵
- `GET /api/config/:type` - 获取配置
- `POST /api/config/:type` - 保存配置

完整 API 文档请参考：`docs/gm-server-guide.md`

## 🏗️ 架构特点

本项目架构设计：

- ✅ **Data 类直接映射数据库** - ORM 风格
- ✅ **DatabaseHelper 统一管理** - 缓存 + 批量保存
- ✅ **Manager 持有 Data 对象** - 直接操作，无需 await
- ✅ **延迟批量保存** - 性能优化，减少数据库压力
- ✅ **静态方法便捷访问** - `PlayerData.GetPlayerByUid(uid)`
- ✅ **统一服务器架构** - 所有功能集成在 GameServer 中
- ✅ **多响应支持** - 一个请求可返回多个响应（主响应 + 额外推送）

## 📋 目录

- [项目概述](#项目概述)
- [已完成功能](#已完成功能)
- [目录结构](#启动流程)
- [框架优点](#框架优点)

## 项目概述

KOSE Server 是一个基于 TypeScript 开发的某童年游戏的怀旧服服务端赛尔号私服服务端，采用统一架构设计。

**技术栈**:

- TypeScript 5.x
- Node.js 18+
- SQLite / MySQL 8.0
- TCP Socket 通信

**架构特点**:

- 统一服务器架构，所有功能集成在 GameServer
- 统一配置管理
- 自动化协议处理
- 类型安全的代码
- 支持多响应（一个请求返回多个响应包）

## 已完成功能

### 核心系统

#### 1. 统一服务架构

- ✅ GameServer 游戏服务（包含登录、注册、游戏逻辑，监听 9999 端口）
- ✅ ProxyServer 代理服务（调试抓包，监听 9999 端口，**不能与 GameServer 同时运行**）

#### 2. 账号系统

- ✅ 邮箱注册（验证码验证）
- ✅ 账号登录（密码加密）
- ✅ 角色创建
- ✅ 会话管理

#### 3. 玩家系统

- ✅ 玩家数据加载
- ✅ 玩家信息管理
- ✅ 在线状态追踪
- ✅ Player-Manager 架构模式

#### 4. 地图系统

- ✅ 地图进入/离开
- ✅ 地图玩家列表
- ✅ 玩家移动同步
- ✅ 地图怪物配置

#### 5. 精灵系统

- ✅ 精灵背包管理
- ✅ 精灵属性计算
- ✅ 精灵升级系统
- ✅ 精灵技能学习
- ✅ 精灵出战/收回

#### 6. 战斗系统

- ✅ 野外战斗（PVE）
- ✅ 伤害计算（属性克制、等级差、暴击）
- ✅ 技能效果系统（25个效果类型）
- ✅ 战斗结算（经验、捕捉）
- ✅ 战斗逃跑

#### 7. 物品系统

- ✅ 背包管理
- ✅ 物品使用
- ✅ 物品购买
- ✅ 物品配置加载

#### 8. 配置系统

- ✅ 统一配置文件（server.json）
- ✅ 游戏数据配置（XML/JSON）
- ✅ 配置热加载
- ✅ 类型安全的配置接口

#### 9. 数据库系统

- ✅ SQLite 支持
- ✅ MySQL 支持
- ✅ Repository 模式
- ✅ 数据库迁移系统
- ✅ 事务支持

#### 10. 协议系统

- ✅ Proto 结构化协议
- ✅ 自动序列化/反序列化
- ✅ 命令元数据系统
- ✅ 协议调试工具

#### 11. 日志系统

- ✅ 彩色日志输出
- ✅ 日志级别控制
- ✅ 调用栈追踪
- ✅ 协议日志解析

#### 12. 开发工具

- ✅ Proto 生成工具
- ✅ 元数据转换工具
- ✅ 协议验证工具
- ✅ 文档生成工具

### 技术功能

#### 1. 性能优化

- ⏳ Redis 缓存
- ⏳ 连接池优化
- ⏳ 数据库索引优化
- ⏳ 协议压缩

#### 2. 运维功能

- ⏳ 健康检查接口
- ⏳ 性能监控
- ⏳ 日志聚合
- ⏳ 自动重启

## 目录结构

```
seer_server/
├── config/                      # 配置文件
│   ├── server.json             # 统一服务配置
│   ├── server.json.default     # 默认配置模板
│   ├── data/                   # 游戏数据配置（XML）
│   │   └── xml/                # 精灵、技能、物品配置
│   └── game/                   # 游戏逻辑配置（JSON）
│       └── map-ogres.json      # 地图怪物配置
│
├── src/                         # 源代码
│   ├── index.ts                # 主入口（启动所有服务）
│   ├── gateway-entry.ts        # Gateway 独立入口
│   ├── game-entry.ts           # GameServer 独立入口
│   ├── regist-entry.ts         # RegistServer 独立入口
│   ├── email-entry.ts          # EmailServer 独立入口
│   ├── proxy-entry.ts          # ProxyServer 独立入口
│   │
│   ├── Gateway/                # 网关服务
│   │   ├── GatewayServer.ts   # 网关主服务
│   │   ├── Router.ts          # 请求路由器
│   │   ├── ServiceRegistry.ts # 服务注册中心
│   │   └── SessionManager.ts  # 会话管理器
│   │
│   ├── GameServer/             # 游戏服务
│   │   ├── GameServer.ts      # 游戏主服务
│   │   ├── Game/              # 游戏逻辑
│   │   │   ├── Battle/        # 战斗系统
│   │   │   ├── Map/           # 地图系统
│   │   │   ├── Pet/           # 精灵系统
│   │   │   └── Item/          # 物品系统
│   │   └── Server/            # 服务器层
│   │       └── Packet/        # 协议处理
│   │
│   ├── RegistServer/           # 注册服务
│   │   └── RegistServer.ts    # 注册主服务
│   │
│   ├── EmailServer/            # 邮件服务
│   │   └── EmailServer.ts     # 邮件主服务
│   │
│   ├── ProxyServer/            # 代理服务
│   │   └── ProxyServer.ts     # 代理主服务
│   │
│   ├── DataBase/               # 数据库层
│   │   ├── DatabaseManager.ts # 数据库管理器
│   │   ├── drivers/           # 数据库驱动
│   │   ├── repositories/      # 数据仓库
│   │   └── migrations/        # 数据库迁移
│   │
│   └── shared/                 # 共享模块
│       ├── config/            # 配置系统
│       ├── protocol/          # 协议系统
│       ├── proto/             # Proto 定义
│       ├── models/            # 数据模型
│       ├── utils/             # 工具类
│       └── gateway/           # Gateway 客户端
│
├── docs/                       # 文档
│   ├── architecture.md        # 架构文档
│   ├── implementation-plan.md # 实施计划
│   └── skill-effect-development-guide.md  # 开发指南
│
├── tools/                      # 开发工具
│   ├── proto-to-meta.ts       # Proto 转元数据
│   ├── meta-to-proto.ts       # 元数据转 Proto
│   └── generate-proto-docs.ts # 生成协议文档
│
├── scripts/                    # 构建脚本
│   └── build-services.js      # 独立服务打包
│
├── data/                       # 运行时数据
│   └── seer.db                # SQLite 数据库
│
├── logs/                       # 日志文件
│
├── package.json               # 项目配置
└── tsconfig.json              # TypeScript 配置
```

---

## 启动流程

### 开发环境

#### 1. 安装依赖

```bash
npm install
```

#### 2. 配置数据库

```bash
# 复制默认配置
cp config/server.json.default config/server.json

# 编辑配置文件，设置数据库类型和路径
# 默认使用 SQLite，无需额外配置
```

#### 3. 初始化数据库

```bash
npm run db:migrate
```

#### 4. 启动服务

**方式一：启动游戏服务**

```bash
npm start
# 或
npm run start:game
```

**方式二：启动调试代理（不能与游戏服务同时运行）**

```bash
npm run start:proxy
```

**方式三：开发模式（自动重启）**

```bash
npm run dev          # 启动 GameServer
npm run dev:game     # 启动 GameServer
npm run dev:proxy    # 启动 ProxyServer（调试用）
```

### 生产环境

#### 1. 编译项目

```bash
npm run build
```

#### 2. 打包独立服务

```bash
npm run build:services
```

#### 3. 部署服务

```bash
cd release/services

# 启动游戏服务
./game-server.exe

# 或使用启动脚本
start-game.bat        # Windows
./start-game.sh       # Linux/Mac
```

### 服务架构

```
GameServer (端口 9999)
  ├─ 登录系统
  ├─ 注册系统
  ├─ 游戏逻辑
  └─ 数据库管理

ProxyServer (端口 9999，调试用)
  ├─ 协议抓包
  ├─ 数据包分析
  ├─ Web GUI (端口 9000)
  └─ 不能与 GameServer 同时运行
```

### 客户端连接流程

```
客户端
  ↓ 连接 9999 端口
GameServer
  ├─ 处理登录请求
  ├─ 处理注册请求
  └─ 处理游戏逻辑
```

### 调试模式

```
客户端
  ↓ 连接 9999 端口
ProxyServer
  ├─ 抓包分析
  ├─ Web GUI 查看 (localhost:9000)
  └─ 转发到内部 GameServer
  ↓ 处理注册/登录
↓ 返回响应
Gateway
↓ 转发响应
客户端
↓ 登录成功，连接 Gateway:27777（游戏）
Gateway
↓ 路由到 GameServer
GameServer
↓ 处理游戏逻辑
↓ 返回响应
Gateway
↓ 转发响应
客户端
```

## 框架优点

### 1. 微服务架构

**服务解耦**

- 每个服务职责单一，代码清晰
- 服务间通过 Gateway 通信，降低耦合
- 便于团队并行开发

**独立部署**

- 服务可以独立启动、停止、重启
- 不影响其他服务运行
- 支持灰度发布

**弹性扩展**

- 可以根据负载独立扩展某个服务
- 支持水平扩展（启动多个实例）
- 资源利用更高效

**故障隔离**

- 某个服务崩溃不会导致整个系统瘫痪
- 易于定位和修复问题
- 提高系统可用性

### 2. 统一配置管理

**集中配置**

- 所有服务使用同一个配置文件
- 配置修改一处生效
- 易于版本控制

**类型安全**

- TypeScript 接口定义配置结构
- 编译时检查配置错误
- IDE 自动补全

**环境隔离**

- 支持多环境配置（开发/测试/生产）
- 配置文件不提交到版本控制
- 敏感信息保护

### 3. 现代化开发体验

**TypeScript**

- 类型安全，减少运行时错误
- 强大的 IDE 支持
- 易于重构和维护

**装饰器模式**

- 自动注册 Handler 和 Effect
- 减少样板代码
- 代码更简洁

**Proto 系统**

- 结构化协议定义
- 自动序列化/反序列化
- 类型安全的数据传输

**开发工具**

- 自动化代码生成
- 协议验证工具
- 文档自动生成

### 4. 高可维护性

**清晰的代码组织**

- 按功能模块划分目录
- 统一的命名规范
- 完善的注释文档

**Player-Manager 模式**

- 数据自动隔离
- 跨模块协作简单
- 生命周期管理清晰

**Repository 模式**

- 数据访问层抽象
- 易于切换数据库
- 便于单元测试

### 5. 易于调试

**ProxyServer**

- 拦截和分析协议
- Web 界面查看数据包
- 协议调试利器

**日志系统**

- 彩色日志输出
- 调用栈追踪
- 协议自动解析

**元数据系统**

- 协议字段自动解析
- 日志可读性强
- 便于问题定位

### 6. 灵活部署

**多种部署方式**

- 单机部署（所有服务一起）
- 分布式部署（服务分散到不同机器）
- 容器化部署（Docker/Kubernetes）

**独立打包**

- 每个服务独立可执行文件
- 无需安装 Node.js 环境
- 部署简单快捷

**配置灵活**

- 支持不同的数据库（SQLite/MySQL）
- 支持不同的端口配置
- 支持不同的日志级别

## 许可证

GNU AGPLv3MIT License


## 贡献

欢迎提交 Issue 和 Pull Request！

**最后更新**: 2026-01-31
