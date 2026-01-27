# Proto 结构化协议系统

## 概述

本项目使用类似 Protobuf 的结构化方式定义和处理网络协议，使代码更清晰、易维护。

## 目录结构

```
proto/
├── base/                    # 基础类
│   └── BaseProto.ts        # Proto基类，所有协议继承此类
├── common/                  # 通用数据结构（可复用）
│   ├── PlayerInfoProto.ts  # 玩家信息
│   ├── ClothInfoProto.ts   # 服装信息
│   └── PetInfoProto.ts     # 精灵信息
└── packets/                 # 协议包定义（按功能模块分类）
    ├── req/                # 请求Proto
    │   ├── login/          # 登录相关请求
    │   │   ├── MainLoginReqProto.ts
    │   │   ├── LoginReqProto.ts
    │   │   └── CreateRoleReqProto.ts
    │   ├── pet/            # 精灵相关请求
    │   ├── map/            # 地图相关请求
    │   └── battle/         # 战斗相关请求
    └── rsp/                # 响应Proto
        ├── login/          # 登录相关响应
        │   ├── MainLoginRspProto.ts
        │   ├── LoginRspProto.ts
        │   └── CreateRoleRspProto.ts
        ├── pet/            # 精灵相关响应
        ├── map/            # 地图相关响应
        └── battle/         # 战斗相关响应
```

## 使用方法

### 1. 定义请求Proto（Req）

```typescript
// src/shared/proto/packets/req/login/LoginReqProto.ts
import { BaseProto } from '../../../base/BaseProto';

export class LoginReqProto extends BaseProto {
  session: Buffer = Buffer.alloc(16);

  serialize(): Buffer {
    return this.session;
  }

  // 快速解析方法
  static fromBuffer(buffer: Buffer): LoginReqProto {
    const proto = new LoginReqProto();
    if (buffer.length >= 16) {
      proto.session = buffer.subarray(0, 16);
    }
    return proto;
  }
}
```

### 2. 定义响应Proto（Rsp）

```typescript
// src/shared/proto/packets/rsp/login/LoginRspProto.ts
import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';

export class LoginRspProto extends BaseProto {
  userId: number = 0;
  nickname: string = '';
  coins: number = 0;

  serialize(): Buffer {
    const writer = new BufferWriter(100);
    writer.WriteUInt32(this.userId);
    writer.WriteBytes(this.buildString(this.nickname, 20));
    writer.WriteUInt32(this.coins);
    return writer.ToBuffer();
  }

  // 链式调用辅助方法
  setNickname(nickname: string): this {
    this.nickname = nickname;
    return this;
  }
}
```

### 3. 在Handler中使用（解析请求）

```typescript
import { LoginReqProto } from '../../../../shared/proto';

export class GameLoginHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    // 使用Proto解析请求
    const req = LoginReqProto.fromBuffer(body);
    
    // 访问请求数据
    console.log('Session:', req.getSessionKey());
    
    // 处理业务逻辑...
  }
}
```

### 4. 在Packet中使用（构建响应）

```typescript
import { LoginRspProto } from '../../../../shared/proto';

export class LoginPacket {
  public GameLogin(userID: number, player: IPlayerInfo): Buffer {
    // 构建Proto对象
    const proto = new LoginRspProto();
    proto.userId = userID;
    proto.setNickname(player.nick);
    proto.coins = player.coins;

    // 序列化并构建响应包
    return this._packetBuilder.Build(
      CommandID.LOGIN_IN,
      userID,
      0,
      proto.serialize()
    );
  }
}
```

## 优势

### 对比传统写法

**传统写法（混乱）：**
```typescript
const writer = new BufferWriter(300);
writer.WriteUInt32(userID);
const session = Buffer.alloc(8);
if (sessionKey) {
  Buffer.from(sessionKey, 'utf8').copy(session, 0, 0, Math.min(sessionKey.length, 8));
}
writer.WriteBytes(session);
// ... 长长一条，难以维护
```

**Proto写法（清晰）：**
```typescript
const proto = new LoginRspProto();
proto.userId = userID;
proto.setSession(sessionKey);
proto.coins = player.coins;
return proto.serialize();
```

### 主要优势

1. **结构清晰**：所有字段定义在一个类中，一目了然
2. **类型安全**：TypeScript类型检查，减少错误
3. **易于维护**：修改协议只需修改Proto类
4. **可复用**：通用数据结构（如PlayerInfo）可在多个协议中复用
5. **易于测试**：可以单独测试Proto的序列化/反序列化
6. **文档化**：Proto类本身就是协议文档

## 添加新协议的步骤

### 示例：添加宠物信息协议

1. **创建请求Proto**（如果需要）

```typescript
// src/shared/proto/packets/req/pet/GetPetInfoReqProto.ts
export class GetPetInfoReqProto extends BaseProto {
  petId: number = 0;

  serialize(): Buffer {
    const writer = new BufferWriter(4);
    writer.WriteUInt32(this.petId);
    return writer.ToBuffer();
  }

  static fromBuffer(buffer: Buffer): GetPetInfoReqProto {
    const proto = new GetPetInfoReqProto();
    if (buffer.length >= 4) {
      proto.petId = buffer.readUInt32BE(0);
    }
    return proto;
  }
}
```

2. **创建响应Proto**

```typescript
// src/shared/proto/packets/rsp/pet/GetPetInfoRspProto.ts
export class GetPetInfoRspProto extends BaseProto {
  petId: number = 0;
  petName: string = '';
  level: number = 1;
  hp: number = 0;

  serialize(): Buffer {
    const writer = new BufferWriter(100);
    writer.WriteUInt32(this.petId);
    writer.WriteBytes(this.buildString(this.petName, 20));
    writer.WriteUInt32(this.level);
    writer.WriteUInt32(this.hp);
    return writer.ToBuffer();
  }
}
```

3. **在index.ts中导出**

```typescript
// src/shared/proto/index.ts
export * from './packets/req/pet/GetPetInfoReqProto';
export * from './packets/rsp/pet/GetPetInfoRspProto';
```

4. **在Handler中使用**

```typescript
import { GetPetInfoReqProto } from '../../../../shared/proto';

export class GetPetInfoHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const req = GetPetInfoReqProto.fromBuffer(body);
    // 处理逻辑...
  }
}
```

5. **在Packet中使用**

```typescript
import { GetPetInfoRspProto } from '../../../../shared/proto';

export class PetPacket {
  public GetPetInfo(petId: number, petData: IPetData): Buffer {
    const proto = new GetPetInfoRspProto();
    proto.petId = petId;
    proto.petName = petData.name;
    proto.level = petData.level;
    proto.hp = petData.hp;

    return this._packetBuilder.Build(
      CommandID.GET_PET_INFO,
      session.UserID,
      0,
      proto.serialize()
    );
  }
}
```

## 最佳实践

1. **命名规范**
   - 请求：`XxxReqProto` (放在 `packets/req/` 目录)
   - 响应：`XxxRspProto` (放在 `packets/rsp/` 目录)
   - 通用数据：`XxxInfoProto` (放在 `common/` 目录)

2. **文件组织**
   - 按功能模块分类（login、pet、map等）
   - 请求和响应分开存放
   - 通用数据结构放在 `common/` 目录

3. **链式调用**
   - 提供 `setXxx()` 方法返回 `this`，支持链式调用

4. **辅助方法**
   - 提供 `fromBuffer()` 静态方法快速解析请求
   - 使用 `buildString()` 等基类方法处理固定长度字段

5. **注释**
   - 在Proto类顶部注明对应的命令ID
   - 为每个字段添加注释说明

## 迁移指南

如果要将现有代码迁移到Proto结构：

1. 找到现有的协议处理代码
2. 创建对应的Proto类
3. 将序列化逻辑移到 `serialize()` 方法
4. 将反序列化逻辑移到 `deserialize()` 方法
5. 更新Handler和Packet使用新的Proto类
6. 删除旧的手动序列化代码

## 总结

Proto结构化系统让协议定义更清晰、代码更易维护。遵循本文档的规范，可以快速添加新协议并保持代码质量。
