# GM Server 模块化架构

## 架构设计

```
GMServer/
├── GMServer.ts              # 服务器主类
├── controllers/             # 控制器层（处理 HTTP 请求）
│   ├── ConfigController.ts  # 配置管理
│   ├── PlayerController.ts  # 玩家管理
│   ├── ItemController.ts    # 物品管理
│   ├── PetController.ts     # 精灵管理
│   ├── CurrencyController.ts # 货币管理
│   ├── ServerController.ts  # 服务器管理
│   └── LogController.ts     # 日志管理
├── services/                # 服务层（业务逻辑）
│   ├── ConfigService.ts
│   ├── PlayerService.ts
│   ├── ItemService.ts
│   ├── PetService.ts
│   ├── CurrencyService.ts
│   ├── ServerService.ts
│   └── LogService.ts
└── routes/                  # 路由层（API 定义）
    ├── index.ts             # 路由汇总
    ├── config.ts
    ├── player.ts
    ├── item.ts
    ├── pet.ts
    ├── currency.ts
    ├── server.ts
    ├── log.ts
    └── reload.ts
```

## API 模块分类

### 1. 玩家管理 (`/api/players`)

```
GET    /api/players              # 获取玩家列表
GET    /api/players/:uid         # 获取玩家详情
PATCH  /api/players/:uid         # 修改玩家数据
POST   /api/players/:uid/ban     # 封禁/解封玩家
POST   /api/players/:uid/kick    # 踢出玩家
```

### 2. 物品管理 (`/api/items`)

```
GET    /api/items/:uid           # 获取玩家物品列表
POST   /api/items/:uid           # 发送物品
POST   /api/items/:uid/batch     # 批量发送物品
DELETE /api/items/:uid           # 删除物品
```

### 3. 精灵管理 (`/api/pets`)

```
GET    /api/pets/:uid            # 获取玩家精灵列表
POST   /api/pets/:uid            # 发送精灵
PATCH  /api/pets/:uid            # 修改精灵属性
DELETE /api/pets/:uid            # 删除精灵
```

### 4. 货币管理 (`/api/currency`)

```
GET    /api/currency/:uid        # 获取玩家货币信息
PATCH  /api/currency/:uid/coins  # 修改金币（增减）
PUT    /api/currency/:uid/coins  # 设置金币（直接设置）
```

### 5. 服务器管理 (`/api/server`)

```
GET    /api/server/status        # 获取服务器状态
POST   /api/server/announcement  # 全服公告
GET    /api/server/online        # 获取在线玩家
POST   /api/server/maintenance   # 维护模式
```

### 6. 日志管理 (`/api/logs`)

```
GET    /api/logs                 # 获取操作日志
POST   /api/logs                 # 记录操作日志
```

### 7. 配置管理 (`/api/config`)

```
GET    /api/config/metadata      # 获取配置元数据
GET    /api/config/:type         # 获取配置数据
POST   /api/config/:type         # 保存配置
POST   /api/config/:type/reload  # 重载配置
GET    /api/config/options/:type # 获取下拉选项
```

### 8. 配置重载 (`/api/reload`)

```
POST   /api/reload/:type         # 重载指定配置
POST   /api/reload               # 重载所有配置
GET    /api/reload/status        # 配置状态
```

## 设计原则

### 1. 三层架构

- **Controller**: 处理 HTTP 请求和响应，参数验证
- **Service**: 业务逻辑实现，数据处理
- **Route**: API 路由定义，HTTP 方法映射

### 2. 单一职责

每个模块只负责一个功能领域：
- PlayerController 只处理玩家相关请求
- ItemService 只处理物品相关业务逻辑

### 3. RESTful 设计

- `GET` - 查询数据
- `POST` - 创建数据
- `PATCH` - 部分更新
- `PUT` - 完整更新
- `DELETE` - 删除数据

### 4. 统一响应格式

```typescript
// 成功响应
{
  success: true,
  data: any,
  message?: string
}

// 错误响应
{
  success: false,
  error: string
}
```

## 使用示例

### 发送物品

```typescript
// Controller
public giveItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = req.params;
    const { itemId, count } = req.body;
    await this.itemService.giveItem(Number(uid), itemId, count);
    res.json({ success: true, message: '物品发送成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// Service
public async giveItem(uid: number, itemId: number, count: number): Promise<void> {
  const itemData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_ItemData(uid);
  itemData.AddItem(itemId, count, 0);
  Logger.Info(`[ItemService] 发送物品: uid=${uid}, itemId=${itemId}, count=${count}`);
}

// Route
itemRouter.post('/:uid', itemController.giveItem);
```

## 扩展指南

### 添加新的 API 模块

1. **创建 Controller**

```typescript
// controllers/NewController.ts
export class NewController {
  private newService: NewService;
  
  constructor() {
    this.newService = new NewService();
  }
  
  public someAction = async (req: Request, res: Response): Promise<void> => {
    // 实现逻辑
  };
}
```

2. **创建 Service**

```typescript
// services/NewService.ts
export class NewService {
  public async someMethod(): Promise<void> {
    // 业务逻辑
  }
}
```

3. **创建 Route**

```typescript
// routes/new.ts
import { Router } from 'express';
import { NewController } from '../controllers/NewController';

export const newRouter = Router();
const newController = new NewController();

newRouter.get('/', newController.someAction);
```

4. **注册路由**

```typescript
// routes/index.ts
import { newRouter } from './new';

apiRouter.use('/new', newRouter);
```

## 最佳实践

### 1. 错误处理

```typescript
try {
  // 业务逻辑
  res.json({ success: true, data: result });
} catch (error) {
  Logger.Error('[Module] 操作失败', error as Error);
  res.status(500).json({ success: false, error: (error as Error).message });
}
```

### 2. 参数验证

```typescript
const { uid } = req.params;
const { itemId, count } = req.body;

if (!itemId || !count) {
  return res.status(400).json({ success: false, error: '参数缺失' });
}
```

### 3. 日志记录

```typescript
Logger.Info(`[Service] 操作成功: uid=${uid}, action=${action}`);
Logger.Error(`[Service] 操作失败: uid=${uid}`, error);
```

### 4. 异步处理

所有数据库操作使用 async/await：

```typescript
public async someMethod(): Promise<void> {
  const data = await DatabaseHelper.Instance.GetInstance_PlayerData(uid);
  // 处理数据
}
```

## 测试

### 使用 curl 测试

```bash
# 获取玩家列表
curl http://localhost:3002/api/players?page=1&limit=20

# 发送物品
curl -X POST http://localhost:3002/api/items/1 \
  -H "Content-Type: application/json" \
  -d '{"itemId": 300001, "count": 10}'

# 修改金币
curl -X PATCH http://localhost:3002/api/currency/1/coins \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000}'
```

## 相关文档

- [GM Server 开发指南](../../docs/gm-server-guide.md)
- [API 文档](http://localhost:3002/api/docs)
