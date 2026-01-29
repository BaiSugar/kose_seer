# KOSE Server - 某童年游戏的怀旧服服务端TS实现版

> 基于 TypeScript 的某童年游戏的怀旧服服务端赛尔号私服服务端，采用统一架构，所有功能集成在 GameServer 中

## 🏗️ 架构特点

本项目架构设计：

- ✅ **Data 类直接映射数据库** - ORM 风格
- ✅ **DatabaseHelper 统一管理** - 缓存 + 批量保存
- ✅ **Manager 持有 Data 对象** - 直接操作，无需 await
- ✅ **延迟批量保存** - 性能优化，减少数据库压力
- ✅ **静态方法便捷访问** - `PlayerData.GetPlayerByUid(uid)`
- ✅ **统一服务器架构** - 所有功能集成在 GameServer 中
- ✅ **多响应支持** - 一个请求可返回多个响应（主响应 + 额外推送）

---

## 📋 目录

- [项目概述](#项目概述)
- [已完成功能](#已完成功能)
- [未完成/未移植功能](#未完成未移植功能)
- [后续推出功能](#后续推出功能)
- [目录结构](#目录结构)
- [启动流程](#启动流程)
- [框架优点](#框架优点)
- [开发规范](#开发规范)
- [配置说明](#配置说明)
- [快速开始](#快速开始)

---

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

---

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

---

## 未完成/未移植功能

### 游戏功能

#### 1. 社交系统

- ⏳ 好友系统
- ⏳ 组队系统
- ⏳ 聊天系统
- ⏳ 公会系统

#### 2. 任务系统

- ⏳ 主线任务
- ⏳ 支线任务
- ⏳ 每日任务
- ⏳ 成就系统

#### 3. 商城系统

- ⏳ 商城购买
- ⏳ VIP 系统
- ⏳ 充值系统
- ⏳ 礼包系统

#### 4. PVP 系统

- ⏳ 玩家对战
- ⏳ 排位赛
- ⏳ 竞技场
- ⏳ 天梯系统

#### 5. 高级功能

- ⏳ NoNo 系统
- ⏳ 基地系统
- ⏳ 精灵融合
- ⏳ 精灵刻印
- ⏳ 超进化系统

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

---

## 后续推出功能

### 短期计划（1-2周）

#### 1. 独立打包测试

- 测试各服务独立运行
- 优化打包配置
- 编写部署文档

#### 2. 健康检查

- 添加服务健康检查接口
- Gateway 监控后端服务状态
- 自动重连机制

#### 3. 完善文档

- 部署文档
- 运维文档
- 故障排查文档

### 中期计划

#### 1. 负载均衡

- 支持多个 GameServer 实例
- Gateway 实现负载均衡策略
- 会话粘性支持

#### 2. 监控系统

- 集成 Prometheus
- 创建 Grafana 仪表板
- 性能指标收集

#### 3. 配置热重载

- 监听配置文件变化
- 动态更新配置
- 无需重启服务

### 长期计划

#### 1. GM 后台系统

- Web 管理界面
- 玩家数据查询
- 游戏数据修改
- 权限管理

#### 2. 服务发现

- 引入 Consul/Etcd
- 动态服务注册
- 健康检查

#### 3. 消息队列

- 引入 RabbitMQ/Kafka
- 异步处理
- 削峰填谷

---

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
```

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

---

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

---

## 开发规范

### 命名规范

- **私有字段**: `_fieldName` (下划线前缀 + camelCase)
- **公共属性**: `PropertyName` (PascalCase)
- **方法**: `MethodName()` (PascalCase)
- **局部变量**: `localVariable` (camelCase)
- **类名**: `UserService` (PascalCase)
- **接口**: `IUserConfig` (PascalCase + I前缀)
- **常量**: `MAX_CONNECTIONS` (UPPER_SNAKE_CASE)

### 代码组织

**Handler 职责**

- 接收客户端请求并解析协议
- **必须使用 ReqProto 类解析请求，不能直接读取 Buffer**
- 简单逻辑直接在 Handler 中完成
- 复杂逻辑调用对应的 Manager 处理
- 使用 `@Opcode` 装饰器自动注册

**Packet 职责**

- 封装响应数据并发送给客户端
- **必须使用 RspProto 类序列化响应，不能直接操作 Buffer**
- 在构造函数中创建 RspProto 实例并序列化
- 提供简洁的构造函数接口

**协议解析规范**

```typescript
// ✅ 正确：使用 ReqProto 解析请求
@Opcode(CommandID.ITEM_BUY, InjectType.NONE)
export class ItemBuyHandler implements IHandler {
  public async Handle(
    session: IClientSession,
    head: HeadInfo,
    body: Buffer,
  ): Promise<void> {
    const player = session.Player;
    if (!player) return;

    // 使用 ReqProto 解析
    const req = new ItemBuyReqProto();
    req.deserialize(body);

    await player.ItemManager.HandleItemBuy(req.itemId, req.count);
  }
}

// ❌ 错误：直接读取 Buffer
@Opcode(CommandID.ITEM_BUY, InjectType.NONE)
export class ItemBuyHandler implements IHandler {
  public async Handle(
    session: IClientSession,
    head: HeadInfo,
    body: Buffer,
  ): Promise<void> {
    const player = session.Player;
    if (!player) return;

    // ❌ 不要这样做！
    const itemId = body.readUInt32BE(0);
    const count = buffer.readUInt32BE(4);

    await player.ItemManager.HandleItemBuy(itemId, count);
  }
}
```

**ReqProto 创建规范**

- 所有请求必须先创建对应的 ReqProto 类
- ReqProto 类放在 `src/shared/proto/packets/req/模块名/` 目录
- 继承 `BaseProto` 并实现 `deserialize()` 方法
- 提供类型安全的字段定义

**ReqProto 示例**

```typescript
// src/shared/proto/packets/req/item/ItemBuyReqProto.ts
import { BaseProto } from "../../../base/BaseProto";
import { CommandID } from "../../../../protocol/CommandID";

export class ItemBuyReqProto extends BaseProto {
  public itemId: number = 0;
  public count: number = 1;

  constructor() {
    super(CommandID.ITEM_BUY);
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    if (buffer.length >= 4) {
      this.itemId = buffer.readUInt32BE(offset);
      offset += 4;
    }
    if (buffer.length >= 8) {
      this.count = buffer.readUInt32BE(offset);
      offset += 4;
    }
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }
}
```

**RspProto 创建规范**

- 所有响应必须先创建对应的 RspProto 类
- RspProto 类放在 `src/shared/proto/packets/rsp/模块名/` 目录
- 继承 `BaseProto` 并实现 `serialize()` 和 `deserialize()` 方法
- 提供类型安全的字段定义和链式调用方法

**RspProto 示例**

```typescript
// src/shared/proto/packets/rsp/item/ItemBuyRspProto.ts
import { BaseProto } from "../../../base/BaseProto";
import { CommandID } from "../../../../protocol/CommandID";

export class ItemBuyRspProto extends BaseProto {
  public coins: number = 0;
  public itemId: number = 0;
  public count: number = 0;

  constructor() {
    super(CommandID.ITEM_BUY);
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(12);
    buffer.writeUInt32BE(this.coins, 0);
    buffer.writeUInt32BE(this.itemId, 4);
    buffer.writeUInt32BE(this.count, 8);
    return buffer;
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    if (buffer.length >= 4) {
      this.coins = buffer.readUInt32BE(offset);
      offset += 4;
    }
    if (buffer.length >= 8) {
      this.itemId = buffer.readUInt32BE(offset);
      offset += 4;
    }
    if (buffer.length >= 12) {
      this.count = buffer.readUInt32BE(offset);
      offset += 4;
    }
  }

  // 链式调用辅助方法
  public setCoins(coins: number): this {
    this.coins = coins;
    return this;
  }
}
```

**Packet 创建规范**

- Packet 类使用 RspProto 来序列化数据
- Packet 类放在 `src/GameServer/Server/Packet/Send/模块名/` 目录
- 继承 `BaseProto` 并在构造函数中创建 RspProto 实例
- **不要在 Packet 中直接操作 Buffer，所有序列化逻辑在 RspProto 中完成**

**Packet 示例**

```typescript
// ✅ 正确：使用 RspProto 序列化
// src/GameServer/Server/Packet/Send/Item/PacketItemBuy.ts
import { BaseProto } from "../../../../../shared/proto/base/BaseProto";
import { CommandID } from "../../../../../shared/protocol/CommandID";
import { ItemBuyRspProto } from "../../../../../shared/proto/packets/rsp/item/ItemBuyRspProto";

export class PacketItemBuy extends BaseProto {
  private _data: Buffer;

  constructor(
    coins: number,
    itemId: number,
    count: number,
    result: number = 0,
  ) {
    super(CommandID.ITEM_BUY);

    // 使用 RspProto 序列化
    const proto = new ItemBuyRspProto();
    proto.coins = coins;
    proto.itemId = itemId;
    proto.count = count;

    if (result !== 0) {
      proto.setResult(result);
    }

    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}

// ❌ 错误：直接操作 Buffer
export class PacketItemBuy extends BaseProto {
  private _data: Buffer;

  constructor(coins: number, itemId: number, count: number) {
    super(CommandID.ITEM_BUY);

    // ❌ 不要这样做！
    const buffer = Buffer.alloc(12);
    buffer.writeUInt32BE(coins, 0);
    buffer.writeUInt32BE(itemId, 4);
    buffer.writeUInt32BE(count, 8);
    this._data = buffer;
  }

  public serialize(): Buffer {
    return this._data;
  }
}
```

**完整的协议开发流程**

1. **创建 ReqProto** (如果有请求参数)

   - 路径: `src/shared/proto/packets/req/模块名/XxxReqProto.ts`
   - 实现 `deserialize()` 方法解析请求
2. **创建 RspProto** (如果有响应数据)

   - 路径: `src/shared/proto/packets/rsp/模块名/XxxRspProto.ts`
   - 实现 `serialize()` 和 `deserialize()` 方法
   - 提供链式调用辅助方法
3. **创建 Packet**

   - 路径: `src/GameServer/Server/Packet/Send/模块名/PacketXxx.ts`
   - 使用 RspProto 序列化数据
4. **创建 Handler**

   - 路径: `src/GameServer/Server/Packet/Recv/模块名/XxxHandler.ts`
   - 使用 ReqProto 解析请求
   - 调用 Manager 处理业务逻辑
5. **创建 Manager** (如果逻辑复杂)

   - 路径: `src/GameServer/Game/模块名/XxxManager.ts`
   - 实现业务逻辑
   - 使用 Packet 发送响应

**示例：完整的好友添加功能**

```typescript
// 1. ReqProto
// src/shared/proto/packets/req/friend/FriendAddReqProto.ts
export class FriendAddReqProto extends BaseProto {
  public targetId: number = 0;

  public deserialize(buffer: Buffer): void {
    if (buffer.length >= 4) {
      this.targetId = buffer.readUInt32BE(0);
    }
  }
}

// 2. RspProto
// src/shared/proto/packets/rsp/friend/FriendAddRspProto.ts
export class FriendAddRspProto extends BaseProto {
  public targetId: number = 0;

  public serialize(): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(this.targetId, 0);
    return buffer;
  }

  public setTargetId(targetId: number): this {
    this.targetId = targetId;
    return this;
  }
}

// 3. Packet
// src/GameServer/Server/Packet/Send/Friend/PacketFriendAdd.ts
export class PacketFriendAdd extends BaseProto {
  private _data: Buffer;

  constructor(targetId: number, result: number = 0) {
    super(CommandID.FRIEND_ADD);

    const proto = new FriendAddRspProto();
    proto.targetId = targetId;

    if (result !== 0) {
      proto.setResult(result);
    }

    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}

// 4. Handler
// src/GameServer/Server/Packet/Recv/Friend/FriendAddHandler.ts
@Opcode(CommandID.FRIEND_ADD, InjectType.NONE)
export class FriendAddHandler implements IHandler {
  public async Handle(
    session: IClientSession,
    _head: HeadInfo,
    body: Buffer,
  ): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new FriendAddReqProto();
    req.deserialize(body);

    await player.FriendManager.HandleFriendAdd(req.targetId);
  }
}

// 5. Manager
// src/GameServer/Game/Friend/FriendManager.ts
export class FriendManager extends BaseManager {
  public async HandleFriendAdd(targetId: number): Promise<void> {
    // 业务逻辑...
    await this.Player.SendPacket(new PacketFriendAdd(targetId));
  }
}
```

**Handler 示例**

```typescript
// 简单逻辑：直接在 Handler 中完成
@Opcode(CommandID.SYSTEM_TIME, InjectType.NONE)
export class SystemTimeHandler implements IHandler {
  public async Handle(
    session: IClientSession,
    _head: HeadInfo,
    _body: Buffer,
  ): Promise<void> {
    const player = session.Player;
    if (!player) return;

    // 简单逻辑直接处理
    const now = Math.floor(Date.now() / 1000);
    await player.SendPacket(new SystemTimeRspProto().setTime(now));
  }
}

// 复杂逻辑：调用 Manager 处理
@Opcode(CommandID.LIST_MAP_PLAYER, InjectType.NONE)
export class ListMapPlayerHandler implements IHandler {
  public async Handle(
    session: IClientSession,
    head: HeadInfo,
    body: Buffer,
  ): Promise<void> {
    const player = session.Player;
    if (!player) return;

    // 复杂逻辑交给 Manager
    await player.MapManager.HandleListMapPlayer();
  }
}
```

**Manager 职责**

- 处理复杂的业务逻辑
- 通过 `this.Player.SendPacket()` 发送响应
- 继承 `BaseManager` 获得 `Player` 和 `UserID` 属性

**Repository 职责**

- 封装数据库操作
- 提供 CRUD 接口
- 不包含业务逻辑

### 数据访问原则⭐

**核心原则：Manager 持有 Data，直接操作，标记保存**

本项目数据访问遵循以下原则：

#### 1. Data 类直接映射数据库

每个 Manager 持有对应的 Data 对象：

- `FriendManager.FriendData` - 好友数据
- `PetManager.PetData` - 精灵数据
- `ItemManager.ItemData` - 物品数据
- `MailManager.MailData` - 邮件数据
- `PlayerInstance.Data` - 玩家数据

```typescript
// ✅ 正确：直接访问 Data 对象
export class FriendManager {
  public FriendData!: FriendData; // Manager 持有 Data

  public async AddFriend(targetUid: number): Promise<void> {
    // 直接操作数组（同步操作）
    this.FriendData.FriendList.push(targetUid);

    // 标记需要实时保存
  }
}

// ❌ 错误：使用 Repository 包装器
export class FriendManager {
  public async AddFriend(targetUid: number): Promise<void> {
    // ❌ 不要这样做！Repository 已被移除
    await this._friendRepo.AddFriend(targetUid);
  }
}
```

#### 2. 通过 DatabaseHelper 加载数据

Manager 在初始化时通过 DatabaseHelper 加载 Data：

```typescript
export class PetManager extends BaseManager {
  public PetData!: PetData;

  public async Initialize(): Promise<void> {
    // 通过 DatabaseHelper 加载或创建数据
    this.PetData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PetData(
      this.UserID,
    );
  }
}
```

#### 3. 直接操作 Data 对象（同步）

Data 对象提供便捷的操作方法，**无需 await**：

````typescript
// ✅ 正确：直接操作数组
this.FriendData.FriendList.push(targetUid);
this.FriendData.BlackList.splice(index, 1);

// ✅ 正确：使用 Data 提供的方法
const pet = this.PetData.GetPet(petId);
this.PetData.AddPet(newPet);
t

### 异步处理

**Handler 必须是 async**
```typescript
@Opcode(CommandID.XXX, InjectType.NONE)
export class XxxHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    // 异步处理
  }
}
````

**使用 await 等待异步操作**

```typescript
const data = await this._repository.FindById(id);
await player.SendPacket(new XxxRspProto());
```

### 错误处理

**使用 try-catch**

```typescript
try {
  // 业务逻辑
} catch (error) {
  Logger.Error("处理失败", error as Error);
  await player.SendPacket(new XxxRspProto().setResult(5001));
}
```

**提前返回**

```typescript
// ✅ 推荐：扁平结构
if (!player) return;
if (!item) {
  await player.SendPacket(new XxxRspProto().setResult(5001));
  return;
}
// 主逻辑

// ❌ 不推荐：深层嵌套
if (player) {
  if (item) {
    // 主逻辑
  }
}
```

### 日志规范

**使用 Logger 工具类**

```typescript
Logger.Info("信息日志");
Logger.Debug("调试日志");
Logger.Warn("警告日志");
Logger.Error("错误日志", error);
```

**关键操作添加日志**

- 玩家登录/登出
- 数据库操作
- 错误和异常
- 重要的业务逻辑

### 注释规范

**类和方法注释**

```typescript
/**
 * 玩家管理器
 * 负责玩家数据的加载、保存和管理
 */
export class PlayerManager {
  /**
   * 加载玩家数据
   * @param userId 用户ID
   * @returns 玩家信息
   */
  public async LoadPlayer(userId: number): Promise<IPlayerInfo> {
    // ...
  }
}
```

**字段注释**

```typescript
export class LoginRspProto extends BaseProto {
  userId: number = 0; // 用户ID
  nickname: string = ""; // 昵称
  level: number = 1; // 等级
}
```

---

## 配置说明

### 服务配置

**config/server.json**

```json
{
  "services": {
    "gateway": {
      "enabled": true,
      "loginPort": 9999, // 登录端口
      "gamePort": 27777, // 游戏端口
      "rpcPort": 50000, // RPC端口
      "host": "0.0.0.0" // 监听地址
    },
    "game": {
      "enabled": true,
      "rpcPort": 50002, // RPC端口
      "host": "localhost" // Gateway地址
    }
  },
  "database": {
    "type": "sqlite", // 数据库类型
    "path": "data/seer.db" // SQLite路径
  },
  "logging": {
    "level": "info" // 日志级别
  }
}
```

### 游戏数据配置

**config/data/xml/** - 从客户端提取的配置

- `pets.xml` - 精灵配置
- `skills.xml` - 技能配置
- `items.xml` - 物品配置
- `skill_effects.xml` - 技能效果配置

**config/game/** - 服务端配置

- `map-ogres.json` - 地图怪物配置

---

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd seer_server
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置服务

```bash
cp config/server.json.default config/server.json
# 根据需要修改配置
```

### 4. 初始化数据库

```bash
npm run db:migrate
```

### 5. 启动服务

```bash
npm start
```

### 6. 测试连接

使用客户端连接到 `localhost:9999`（登录）或 `localhost:27777`（游戏）

---

## 许可证

GNU AGPLv3MIT License

---

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**最后更新**: 2026-01-27
