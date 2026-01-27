# 命令元数据系统

## 概述

命令元数据系统用于定义和解析网络协议的结构，主要用于调试和日志输出。

## 目录结构

```
meta/
├── CommandMetaRegistry.ts  # 核心注册表类
├── login.meta.ts           # 登录相关元数据
├── server.meta.ts          # 服务器相关元数据
├── map.meta.ts             # 地图相关元数据
├── chat.meta.ts            # 聊天相关元数据
└── index.ts                # 统一导出
```

## 使用方法

### 1. 定义元数据

在对应模块的 `.meta.ts` 文件中定义命令元数据：

```typescript
import { CommandID } from '../CommandID';
import { ICommandMeta } from './CommandMetaRegistry';

export const YourModuleMetadata: ICommandMeta[] = [
  {
    cmdID: CommandID.YOUR_COMMAND,
    name: 'YOUR_COMMAND',
    desc: '命令描述',
    request: [
      { name: 'field1', type: 'uint32', desc: '字段1' },
      { name: 'field2', type: 'string', length: 16, desc: '字段2' }
    ],
    response: [
      { name: 'result', type: 'uint32', desc: '结果' }
    ]
  }
];
```

### 2. 注册元数据

在 `index.ts` 中注册：

```typescript
import { YourModuleMetadata } from './your-module.meta';

CmdMeta.RegisterBatch(YourModuleMetadata);
```

### 3. 使用元数据

元数据会自动用于日志输出：

```typescript
// PacketParser 和 PacketBuilder 会自动使用元数据解析和格式化数据包
Logger.Info(`[收包] ${cmdName}(${cmdID}) | Body: ${bodyStr}`);
```

## 字段类型

支持的字段类型：

- `uint8` - 无符号8位整数 (1字节)
- `uint16` - 无符号16位整数 (2字节)
- `uint32` - 无符号32位整数 (4字节)
- `int32` - 有符号32位整数 (4字节)
- `string` - 定长字符串 (需指定length或lengthField)
- `varstring` - 变长字符串 (2字节长度 + 内容)
- `bytes` - 原始字节 (需指定length或lengthField)
- `hex` - 十六进制显示 (需指定length或lengthField)
- `amf` - AMF3序列化数据
- `array` - 动态数组 (需指定arrayCountField和arrayFields)

## 动态长度字段

对于 `string`、`bytes`、`hex`、`amf` 类型，可以使用 `lengthField` 指定长度来源字段：

```typescript
{
  cmdID: CommandID.SYSTEM_MESSAGE,
  name: 'SYSTEM_MESSAGE',
  desc: '系统通知消息',
  response: [
    { name: 'msgLength', type: 'uint32', desc: '消息长度' },
    { name: 'message', type: 'string', lengthField: 'msgLength', desc: '消息内容' }
  ]
}
```

这样 `message` 字段的长度会从前面的 `msgLength` 字段读取。

**AMF 类型示例：**
```typescript
{
  name: 'amfLen',
  type: 'uint32',
  desc: 'AMF数据长度'
},
{
  name: 'amfData',
  type: 'amf',
  lengthField: 'amfLen',
  desc: 'AMF序列化数据'
}
```

AMF 数据会被自动解码并格式化为可读的 JSON 格式。

## 动态数组示例

```typescript
{
  name: 'clothCount',
  type: 'uint32',
  desc: '装备数量'
},
{
  name: 'clothes',
  type: 'array',
  arrayCountField: 'clothCount',  // 数组长度来源
  arrayFields: [
    { name: 'id', type: 'uint32', desc: '装备ID' },
    { name: 'level', type: 'uint32', desc: '装备等级' }
  ],
  desc: '装备列表'
}
```

## 嵌套数组示例

支持数组中包含数组的情况：

```typescript
{
  name: 'playerCount',
  type: 'uint32',
  desc: '玩家数量'
},
{
  name: 'players',
  type: 'array',
  arrayCountField: 'playerCount',
  arrayFields: [
    { name: 'userId', type: 'uint32', desc: '用户ID' },
    { name: 'nick', type: 'string', length: 16, desc: '昵称' },
    { name: 'clothCount', type: 'uint32', desc: '服装数量' },
    // 嵌套数组
    {
      name: 'clothes',
      type: 'array',
      arrayCountField: 'clothCount',  // 使用当前玩家的 clothCount
      arrayFields: [
        { name: 'clothId', type: 'uint32', desc: '服装ID' },
        { name: 'clothLevel', type: 'uint32', desc: '服装等级' }
      ],
      desc: '服装列表'
    }
  ],
  desc: '玩家列表'
}
```

**输出示例：**
```
playerCount=2, 
players[0].userId=12345, players[0].nick="玩家1", players[0].clothCount=3, 
players[0].clothes[0].clothId=100, players[0].clothes[0].clothLevel=1,
players[0].clothes[1].clothId=101, players[0].clothes[1].clothLevel=2,
players[0].clothes[2].clothId=102, players[0].clothes[2].clothLevel=3,
players[1].userId=67890, players[1].nick="玩家2", players[1].clothCount=2,
players[1].clothes[0].clothId=200, players[1].clothes[0].clothLevel=1,
players[1].clothes[1].clothId=201, players[1].clothes[1].clothLevel=2
```

## 添加新模块

1. 创建新的 `.meta.ts` 文件
2. 定义元数据数组
3. 在 `index.ts` 中导入并注册
4. 完成！

## 注意事项

- 元数据主要用于调试，不影响实际协议处理
- 如果元数据未定义，会显示为十六进制
- 元数据应与实际协议结构保持一致
- 复杂的协议可以简化元数据定义，只保留关键字段

## 优势

1. **模块化** - 按功能模块组织，易于维护
2. **可扩展** - 添加新协议只需创建新文件
3. **调试友好** - 自动解析和格式化协议内容
4. **向后兼容** - 通过 `CommandMeta.ts` 重新导出保持兼容性
