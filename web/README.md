# KOSE 配置管理系统 - 前端

基于 Vue 3 + Vite + Element Plus 的配置管理界面。

## 功能特性

### 配置管理
- **地图怪物配置** - Excel 风格表格编辑，支持下拉选择精灵
- **任务配置** - 任务奖励、条件配置
- **特殊物品配置** - 物品效果配置

### GM 管理
- **玩家管理** - 查看、修改、封禁玩家
- **服务器管理** - 服务器状态、全服公告、在线玩家
- **操作日志** - 查看所有 GM 操作记录

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全
- **Vite** - 快速构建工具
- **Element Plus** - UI 组件库
- **Pinia** - 状态管理
- **Vue Router** - 路由管理
- **Axios** - HTTP 客户端

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3001

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 项目结构

```
config_manager_web/
├── src/
│   ├── api/              # API 接口
│   │   ├── config.ts     # 配置管理 API
│   │   └── gm.ts         # GM 管理 API
│   ├── components/       # 公共组件
│   │   └── ConfigTable.vue  # Excel 风格配置表格
│   ├── layouts/          # 布局组件
│   │   └── MainLayout.vue   # 主布局
│   ├── router/           # 路由配置
│   │   └── index.ts
│   ├── stores/           # Pinia 状态管理
│   │   └── config.ts
│   ├── types/            # TypeScript 类型定义
│   │   └── config.ts
│   ├── utils/            # 工具函数
│   │   └── request.ts    # Axios 封装
│   ├── views/            # 页面组件
│   │   ├── config/       # 配置管理页面
│   │   │   ├── MapOgres.vue
│   │   │   ├── Tasks.vue
│   │   │   └── UniqueItems.vue
│   │   └── gm/           # GM 管理页面
│   │       ├── Players.vue
│   │       ├── Server.vue
│   │       └── Logs.vue
│   ├── App.vue           # 根组件
│   └── main.ts           # 入口文件
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 配置说明

### API 代理

在 `vite.config.ts` 中配置了 API 代理：

```typescript
server: {
  port: 3001,
  proxy: {
    '/api': {
      target: 'http://localhost:3002',  // GM Server 地址
      changeOrigin: true
    }
  }
}
```

### 环境变量

创建 `.env.local` 文件：

```env
VITE_API_BASE_URL=http://localhost:3002
```

## 使用说明

### 配置管理

1. 选择左侧菜单的配置项（如"地图怪物"）
2. 在表格中编辑配置数据
3. 点击"添加行"可以新增配置
4. 点击"保存配置"保存到文件
5. 点击"重载配置"立即应用到游戏服务器

### GM 管理

#### 玩家管理
- 搜索玩家
- 查看玩家详情
- 发送物品/精灵
- 踢出/封禁玩家

#### 服务器管理
- 查看服务器状态
- 发送全服公告
- 查看在线玩家

#### 操作日志
- 查看所有 GM 操作记录
- 按类型/玩家筛选

## 注意事项

1. **权限控制** - 生产环境需要添加登录认证
2. **数据备份** - 修改配置前会自动备份
3. **热重载** - 重载配置会立即应用，无需重启服务器
4. **下拉选项** - 精灵/技能/物品选项从 XML 配置自动加载

## 开发指南

### 添加新的配置类型

1. 在 `seer_server/src/GMServer/services/ConfigService.ts` 中添加元数据定义
2. 创建对应的 Vue 页面组件
3. 在路由中注册新页面
4. 在左侧菜单中添加入口

### 自定义表格字段

支持的字段类型：
- `text` - 文本输入
- `number` - 数字输入
- `select` - 下拉选择
- `boolean` - 开关
- `textarea` - 多行文本

## 常见问题

### Q: 无法连接到服务器？
A: 确保 GM Server 已启动（端口 3002）

### Q: 配置保存后不生效？
A: 需要点击"重载配置"按钮

### Q: 下拉选项为空？
A: 检查 XML 配置文件是否存在且格式正确

## License

MIT
