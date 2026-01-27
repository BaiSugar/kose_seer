# Send Packet 架构说明

## 目录结构

```
Send/
├── Login/          # 登录相关Packet
├── Map/            # 地图相关Packet
├── Pet/            # 精灵相关Packet
├── Item/           # 物品相关Packet
│   ├── PacketItemBuy.ts
│   ├── PacketChangeCloth.ts
│   ├── PacketItemList.ts
│   └── index.ts
├── System/         # 系统相关Packet
├── LoginPacket.ts  # 旧的登录Packet（待重构）
├── ServerPacket.ts # 旧的服务器Packet（待重构）
└── index.ts
```

## 设计模式

参考 DanhengServer 的架构，每个Packet类：

1. **继承 BaseProto**
2. **构造函数接收业务参数**
3. **内部创建对应的RspProto并序列化**
4. **提供serialize()方法返回序列化后的Buffer**

### 示例

```typescript
// PacketItemBuy.ts
export class PacketItemBuy extends BaseProto {
  private _data: Buffer;

  constructor(cash: number, itemId: number, itemNum: number, itemLevel: number = 0) {
    super(CommandID.ITEM_BUY);
    const proto = new ItemBuyRspProto(cash, itemId, itemNum, itemLevel);
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
```

### Manager中的使用

```typescript
// ItemManager.ts
await player.SendPacket(new PacketItemBuy(remainCoins, itemId, count, 0));
```

## 优势

1. **职责分离**: Packet类负责封装Proto的创建和序列化
2. **简化Manager**: Manager只需传递业务参数，不需要关心Proto的细节
3. **类型安全**: 构造函数参数提供完整的类型检查
4. **易于维护**: 每个Packet类独立文件，按模块分类
5. **符合参考项目**: 与DanhengServer架构一致

## TODO

- [ ] 重构 LoginPacket.ts 为模块化结构
- [ ] 重构 ServerPacket.ts 为模块化结构
- [ ] 为其他模块（Map, Pet, System）创建Packet类
