# ProxyServer - 协议代理服务器

## 概述

ProxyServer 是一个网络代理服务器，用于拦截和分析客户端与游戏服务器之间的通信。它可以：

- 捕获所有网络数据包
- 使用 CommandMetaRegistry 自动解析协议内容
- 提供 Web 界面实时查看数据包
- 将数据包记录到日志文件

## 架构

```
客户端 <---> ProxyServer <---> 游戏服务器
                 |
                 +---> WebServer (实时查看)
                 |
                 +---> PacketLogger (日志记录)
                 |
                 +---> CommandMetaRegistry (协议解析)
```

## 主要组件

### 1. ProxyServer.ts

核心代理服务器，负责：
- 监听客户端连接
- 转发数据包到游戏服务器
- 捕获和解析数据包
- 修改服务器列表响应（将远程服务器IP替换为代理IP）

### 2. WebServer.ts

Web 界面服务器，提供：
- 实时数据包查看
- WebSocket 推送新数据包
- HTTP API 查询历史数据包

### 3. PacketLogger.ts

日志记录器，负责：
- 将数据包写入日志文件
- 记录会话开始/结束
- 格式化输出

### 4. CommandMetaRegistry (来自 shared/protocol/meta)

协议元数据注册表，提供：
- 协议结构定义
- 自动解析字段
- 格式化输出
- 支持动态数组、AMF 等复杂类型

## 使用方法

### 启动代理服务器

```typescript
import { ProxyServer } from './ProxyServer';

const proxy = new ProxyServer();
proxy.Start();
```

### 配置

在 `ProxyServer.ts` 中修改 `ProxyServerConfig`：

```typescript
export const ProxyServerConfig = {
  // 代理监听配置
  ListenHost: '127.0.0.1',
  ListenPort: 9000,
  
  // 登录服务器配置
  LoginHost: '115.238.192.7',
  LoginPort: 9999,
  
  // 游戏服务器配置
  GameHost: '115.238.192.7',
  GamePort: 27777,
  
  // Web GUI 配置
  WebPort: 8080,
};
```

### 客户端配置

修改客户端连接地址为代理服务器：
- 服务器地址: `127.0.0.1`
- 端口: `9000`

## 协议解析

ProxyServer 使用 `CommandMetaRegistry` 进行协议解析，支持：

### 基础类型
- `uint8`, `uint16`, `uint32`, `int32` - 整数类型
- `string` - 定长字符串
- `varstring` - 变长字符串（2字节长度 + 内容）
- `bytes`, `hex` - 原始字节

### 高级类型
- `amf` - AMF3 序列化数据（自动解析）
- `array` - 动态数组（根据前面的计数字段）

### 示例输出

```
[Proxy] >>> LOGIN_IN(1001) 游戏登录 | UserID=0 | BodyLen=16
[Proxy]     字段: session=a1b2c3d4e5f6g7h8
[Proxy]     格式: session(16)

[Proxy] <<< LOGIN_IN(1001) 游戏登录 | UserID=12345 | BodyLen=1234
[Proxy]     字段: userID=12345, nick="测试玩家", coins=1000, clothCount=3, clothes[0].id=100, clothes[1].id=101, clothes[2].id=102
[Proxy]     格式: userID(4) + nick(16) + coins(4) + clothCount(4) + clothes[clothCount]
```

## 添加新协议

要添加新协议的解析，只需在 `shared/protocol/meta/` 目录下添加元数据定义：

```typescript
// shared/protocol/meta/your-module.meta.ts
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
      { name: 'result', type: 'uint32', desc: '结果' },
      { name: 'data', type: 'string', length: 32, desc: '数据' }
    ]
  }
];
```

然后在 `shared/protocol/meta/index.ts` 中注册：

```typescript
import { YourModuleMetadata } from './your-module.meta';
CmdMeta.RegisterBatch(YourModuleMetadata);
```

ProxyServer 会自动使用新的元数据进行解析！

## Web 界面

访问 `http://localhost:8080` 查看实时数据包。

功能：
- 实时显示新数据包
- 过滤特定命令
- 查看详细字段
- 导出日志

## 日志文件

日志文件保存在 `logs/proxy/` 目录：
- 文件名格式: `proxy_YYYY-MM-DD_HH-MM-SS.log`
- 包含完整的数据包信息
- 包含会话开始/结束标记

## 注意事项

1. **性能**: 代理会增加一定延迟，仅用于开发调试
2. **安全**: 不要在生产环境使用
3. **日志大小**: 日志文件可能很大，定期清理
4. **内存**: 内存中最多保存 10000 个数据包

## 优势

### 相比手动解析

**之前**:
```typescript
// 手动解析，容易出错
const field1 = body.readUInt32BE(0);
const field2 = body.subarray(4, 20).toString('utf8');
// ...
```

**现在**:
```typescript
// 自动解析，清晰明了
const bodyStr = CmdMeta.ParseBody(cmdID, body, isRequest);
// 输出: field1=123, field2="abc", ...
```

### 主要优势

1. **自动化**: 无需手动编写解析代码
2. **可维护**: 协议定义集中管理
3. **可扩展**: 轻松添加新协议
4. **类型安全**: 支持多种数据类型
5. **调试友好**: 格式化输出，易于阅读

## 故障排除

### 连接失败

检查：
- 代理服务器是否启动
- 端口是否被占用
- 防火墙设置

### 解析错误

检查：
- 协议元数据是否正确
- 字段类型是否匹配
- 字段长度是否正确

### 日志文件过大

定期清理 `logs/proxy/` 目录，或修改 `PacketLogger` 实现日志轮转。

## 未来改进

- [ ] 支持数据包重放
- [ ] 支持数据包修改
- [ ] 支持多客户端连接
- [ ] 支持协议加密/解密
- [ ] 更强大的 Web 界面
- [ ] 数据包统计分析

## 相关文档

- [CommandMetaRegistry 文档](../shared/protocol/meta/README.md)
- [协议定义](../shared/protocol/CommandID.ts)
- [元数据示例](../shared/protocol/meta/login.meta.ts)
