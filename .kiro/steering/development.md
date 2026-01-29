# Development Guide

## Configuration Loading

### Server Configuration

```typescript
import { ServerConfig } from '../shared/config/ServerConfig';

const dbConfig = ServerConfig.Instance.Database;
const gamePort = ServerConfig.Instance.Game.rpcPort;
```

### Game Data Configuration

**三层架构：**

1. **ConfigDefinitions** - 定义配置键和路径
2. **ConfigRegistry** - 注册和加载配置
3. **GameConfig** - 类型安全访问

```typescript
// 使用GameConfig访问游戏数据
const item = GameConfig.GetItemById(itemId);
const pet = GameConfig.GetPetById(petId);
const skill = GameConfig.GetSkillById(skillId);
const ogres = GameConfig.GetMapOgres(mapId);
```

**最佳实践：**
- 使用ConfigDefinitions定义配置键和路径
- 使用GameConfig访问常用游戏数据
- 仅在特殊情况下创建自定义配置类

## Protocol Development

### 5步开发流程

1. **ReqProto** (`src/shared/proto/packets/req/`) - 请求反序列化
2. **RspProto** (`src/shared/proto/packets/rsp/`) - 响应序列化
3. **Packet** (`src/GameServer/Server/Packet/Send/`) - 响应包装器
4. **Handler** (`src/GameServer/Server/Packet/Recv/`) - 请求处理器
5. **Manager Method** (`src/GameServer/Game/`) - 业务逻辑（可选）

### Handler模式选择

- **简单逻辑** - 直接在Handler中处理（系统查询、简单状态变更）
- **复杂逻辑** - 委托给Manager处理（数据验证、数据库操作、跨Manager交互）

### 示例

```typescript
// Handler
@Opcode(CommandID.ITEM_BUY, InjectType.NONE)
export class ItemBuyHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;
    
    const req = new ItemBuyReqProto();
    req.deserialize(body);
    
    await player.ItemManager.HandleItemBuy(req.itemId, req.count);
  }
}

// Manager
public async HandleItemBuy(itemId: number, count: number): Promise<void> {
  // 1. 验证
  // 2. 计算成本
  // 3. 检查资源
  // 4. 修改数据（自动保存）
  // 5. 发送响应
}
```

## Database Usage (DanhengServer Style)

### Data Classes with Auto-Save

**所有Data类必须继承BaseData，自动获得深度Proxy自动保存功能。**

Location: `src/DataBase/models/XxxData.ts`

#### 核心要求

1. **继承BaseData** - 所有Data类继承BaseData基类
2. **配置字段** - 在constructor中指定黑名单字段和数组字段
3. **实现save()** - 实现抽象方法save()用于数据库保存
4. **返回Proxy** - Constructor最后返回createProxy(this)

#### 使用BaseData模板

```typescript
import { BaseData } from './BaseData';
import { DatabaseHelper } from '../DatabaseHelper';
import { Logger } from '../../shared/utils/Logger';

export interface IXxxInfo {
  id: number;
  name: string;
  value: number;
}

export class XxxData extends BaseData {
  public Uid: number;
  public XxxList: IXxxInfo[] = [];
  
  constructor(uid: number) {
    // 调用父类构造函数
    super(
      uid,
      ['extraField'],  // 额外的黑名单字段（可选，默认已包含 Uid, _saveTimer 等）
      ['XxxList']      // 需要深度Proxy的数组字段（必需）
    );
    
    this.Uid = uid;
    return this.createProxy(this);
  }

  // 实现save方法（必需）
  public async save(): Promise<void> {
    try {
      await DatabaseHelper.Instance.SaveXxxData(this);
      Logger.Debug(`[XxxData] 自动保存成功: uid=${this.Uid}`);
    } catch (error) {
      Logger.Error(`[XxxData] 自动保存失败: uid=${this.Uid}`, error as Error);
    }
  }

  // 数据库映射方法
  public static FromRow(row: any): XxxData {
    const data = new XxxData(row.owner_id);
    data.XxxList = row.xxx_list ? JSON.parse(row.xxx_list) : [];
    return data;
  }

  public ToRow(): any {
    return {
      owner_id: this.Uid,
      xxx_list: JSON.stringify(this.XxxList)
    };
  }

  // 业务方法 - 无需手动调用save
  public AddXxx(xxx: IXxxInfo): void {
    this.XxxList.push(xxx);
    // 自动触发保存！无需调用 this.scheduleSave()
  }

  public UpdateXxx(id: number, value: number): boolean {
    const item = this.XxxList.find(x => x.id === id);
    if (!item) return false;
    
    item.value = value;  // 自动触发保存！
    return true;
  }

  public RemoveXxx(id: number): boolean {
    const index = this.XxxList.findIndex(x => x.id === id);
    if (index === -1) return false;
    
    this.XxxList.splice(index, 1);  // 自动触发保存！
    return true;
  }
}
```

#### BaseData功能详解

**自动保存触发场景：**
```typescript
// ✅ 顶层属性修改
data.field = value;

// ✅ 数组操作
data.XxxList.push(item);
data.XxxList.splice(0, 1);
data.XxxList.pop();
data.XxxList.shift();
data.XxxList.unshift(item);

// ✅ 数组索引赋值
data.XxxList[0] = newItem;

// ✅ 数组对象属性修改（深度监听）
data.XxxList[0].field = value;
data.XxxList[0].count += 10;

// ✅ 嵌套对象属性修改
data.obj.field = value;
```

**防抖机制：**
- 100ms内多次修改只保存一次
- 自动合并连续修改，减少数据库压力
- 例如：连续修改10个精灵的经验值，只触发1次数据库保存

**黑名单字段（默认不触发保存）：**
- `Uid` / `userID` - 主键，不可修改
- `_saveTimer` / `_pendingSave` - 内部状态
- `_noSaveFields` / `_arrayFields` - 配置字段
- 可在constructor中添加额外黑名单字段

**配置数组字段的重要性：**
```typescript
// ❌ 错误：未配置数组字段
super(uid, [], []);  // 数组对象属性修改不会触发保存

// ✅ 正确：配置数组字段
super(uid, [], ['XxxList']);  // 数组对象属性修改自动触发保存
```

#### 现有Data类参考

已迁移到BaseData的类（可作为模板参考）：
- **PetData** - 精灵数据，包含精灵列表
- **ItemData** - 物品数据，包含物品列表
- **FriendData** - 好友数据，包含好友列表、黑名单等
- **MailData** - 邮件数据，包含邮件列表
- **TaskData** - 任务数据，包含任务列表

#### 迁移现有Data类到BaseData

如果有旧的Data类需要迁移：

1. **添加继承**：`export class XxxData extends BaseData`
2. **修改constructor**：
   ```typescript
   constructor(uid: number) {
     super(uid, [], ['ArrayField']);  // 添加这行
     this.Uid = uid;
     return this.createProxy(this);   // 修改这行
   }
   ```
3. **删除重复代码**：
   - 删除 `_saveTimer`, `_pendingSave` 字段
   - 删除 `createProxy()` 方法
   - 删除 `scheduleSave()` 方法
   - 保留 `save()` 方法
4. **移除手动调用**：
   - 删除所有 `this.scheduleSave()` 调用
   - 删除所有 `await this.save()` 调用（除非特殊需求）

#### 常见问题

**Q: 为什么修改数组对象属性需要配置数组字段？**
A: JavaScript的Proxy只能拦截直接属性访问，不能自动拦截嵌套对象。BaseData通过递归Proxy包装数组中的每个对象来实现深度监听。

**Q: 如何手动触发保存？**
A: 调用 `await data.save()` 即可立即保存，但通常不需要，自动保存会在100ms后触发。

**Q: 如何禁用某个字段的自动保存？**
A: 在constructor的第二个参数中添加字段名：`super(uid, ['fieldName'], ['ArrayField'])`

**Q: 性能影响如何？**
A: 
- Proxy包装开销极小（纳秒级）
- 防抖机制避免频繁数据库操作
- 实际测试中性能提升（减少手动save调用的遗漏）

### Manager Pattern

Managers持有Data对象并直接操作。**自动保存已启用，无需手动调用save方法。**

```typescript
export class ItemManager extends BaseManager {
  public ItemData!: ItemData;

  public async Initialize(): Promise<void> {
    this.ItemData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_ItemData(this.UserID);
  }

  public async HandleItemBuy(itemId: number, count: number): Promise<void> {
    // 1. 验证
    if (this.ItemData.HasItem(itemId)) return;

    // 2. 扣除金币（自动保存）
    this.Player.Data.coins -= cost;

    // 3. 添加物品（自动保存）
    this.ItemData.AddItem(itemId, count, 0);
    
    // 无需手动保存！
  }
}
```

### DatabaseHelper Usage

```typescript
// 加载数据
const data = await DatabaseHelper.Instance.GetInstanceOrCreateNew_ItemData(uid);

// 获取已加载数据
const data = DatabaseHelper.Instance.GetInstance_ItemData(uid);

// 手动保存（极少需要）
await DatabaseHelper.Instance.SavePlayerData(playerData);

// 登出时保存所有数据
await DatabaseHelper.Instance.SaveUser(uid);

// 移除缓存
DatabaseHelper.Instance.RemoveCache(uid);
```

### 核心原则

1. **Manager持有Data** - 每个Manager有Data属性
2. **直接操作** - 同步修改Data属性
3. **自动保存** - BaseData深度Proxy自动保存，100ms防抖
4. **无需手动save** - 所有修改（包括数组对象属性）自动触发保存

## Manager Development

### BaseManager

所有Manager继承BaseManager，提供Player和UserID访问。

### 创建Manager

```typescript
export class ItemManager extends BaseManager {
  public ItemData!: ItemData;

  public async Initialize(): Promise<void> {
    this.ItemData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_ItemData(this.UserID);
  }

  public async HandleItemBuy(itemId: number, count: number): Promise<void> {
    // 业务逻辑
  }
}
```

### 访问其他Manager

```typescript
// 访问其他Manager
await this.Player.PetManager.GivePet(petId, level, captureTm, skillId);

// 访问玩家数据
const coins = this.Player.Data.coins;
this.Player.Data.coins -= 100;

// 发送数据包
await this.Player.SendPacket(new PacketItemBuy(coins, itemId, count, 0));
```

## Error Handling

### 标准模式

```typescript
public async HandleItemBuy(itemId: number, count: number): Promise<void> {
  try {
    // 1. 验证
    if (!ItemSystem.Exists(itemId)) {
      await this.Player.SendPacket(new PacketItemBuy(0, itemId, count, 0).setResult(5001));
      return;
    }

    // 2. 业务逻辑
    const cost = this.getItemPrice(itemId) * count;
    if (this.Player.Data.coins < cost) {
      await this.Player.SendPacket(new PacketItemBuy(0, itemId, count, 0).setResult(10016));
      return;
    }

    // 3. 修改数据（自动保存）
    this.Player.Data.coins -= cost;
    this.ItemData.AddItem(itemId, count, 0);

    // 4. 成功响应
    await this.Player.SendPacket(new PacketItemBuy(this.Player.Data.coins, itemId, count, 0));
  } catch (error) {
    Logger.Error(`[ItemManager] HandleItemBuy failed`, error as Error);
    await this.Player.SendPacket(new PacketItemBuy(0, itemId, count, 0).setResult(5000));
  }
}
```

### 错误码

- `5000`: 通用错误
- `5001`: 参数无效/未找到
- `5002`: 已存在/重复
- `5003`: 权限不足
- `5004`: 资源不足

## Logging

```typescript
import { Logger } from '../shared/utils/Logger';

Logger.Debug('[Module] Debug信息');
Logger.Info('[Module] 重要事件');
Logger.Warn('[Module] 警告信息');
Logger.Error('[Module] 错误发生', error as Error);
```

**规范：**
- 使用`[ModuleName]`前缀
- 记录重要状态变更
- 错误日志包含完整上下文
- 包含用户ID：`User ${this.UserID}`

## Common Patterns

### Singleton

```typescript
export class SomeConfig {
  private static _instance: SomeConfig;
  private constructor() {}
  
  public static get Instance(): SomeConfig {
    if (!SomeConfig._instance) {
      SomeConfig._instance = new SomeConfig();
    }
    return SomeConfig._instance;
  }
}
```

### Decorator

```typescript
@Opcode(CommandID.SOME_COMMAND, InjectType.NONE)
export class SomeHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    // Implementation
  }
}
```

### Early Return

```typescript
// 推荐：扁平结构
if (!player) return;
if (!valid) {
  await player.SendPacket(new PacketError(5001));
  return;
}
// 主逻辑

// 避免：深层嵌套
if (player) {
  if (valid) {
    // 主逻辑
  }
}
```
