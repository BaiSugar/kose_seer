import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * GET_BOSS_MONSTER 响应协议
 * CMD 8004
 * 
 * 用于服务器主动推送精灵给玩家（BOSS精灵、GM发送等）
 * 
 * 响应格式:
 * - bonusID: uint32 (奖励ID，通常为0)
 * - petID: uint32 (精灵ID)
 * - captureTm: uint32 (捕获时间/catchTime)
 * - itemCount: uint32 (物品数量)
 * - items: Array<{itemID: uint32, itemCnt: uint32}> (物品列表)
 */
export class GetBossMonsterRspProto extends BaseProto {
  public bonusID: number = 0;
  public petID: number = 0;
  public captureTm: number = 0;
  public items: Array<{ itemID: number; itemCnt: number }> = [];

  constructor() {
    super(CommandID.GET_BOSS_MONSTER);
  }

  public serialize(): Buffer {
    const buffers: Buffer[] = [];
    
    // bonusID (4 bytes)
    const bonusIDBuf = Buffer.allocUnsafe(4);
    bonusIDBuf.writeUInt32BE(this.bonusID, 0);
    buffers.push(bonusIDBuf);
    
    // petID (4 bytes)
    const petIDBuf = Buffer.allocUnsafe(4);
    petIDBuf.writeUInt32BE(this.petID, 0);
    buffers.push(petIDBuf);
    
    // captureTm (4 bytes)
    const captureTmBuf = Buffer.allocUnsafe(4);
    captureTmBuf.writeUInt32BE(this.captureTm, 0);
    buffers.push(captureTmBuf);
    
    // itemCount (4 bytes)
    const countBuf = Buffer.allocUnsafe(4);
    countBuf.writeUInt32BE(this.items.length, 0);
    buffers.push(countBuf);
    
    // items
    for (const item of this.items) {
      // itemID (4 bytes)
      const itemIDBuf = Buffer.allocUnsafe(4);
      itemIDBuf.writeUInt32BE(item.itemID, 0);
      buffers.push(itemIDBuf);
      
      // itemCnt (4 bytes)
      const itemCntBuf = Buffer.allocUnsafe(4);
      itemCntBuf.writeUInt32BE(item.itemCnt, 0);
      buffers.push(itemCntBuf);
    }
    
    return Buffer.concat(buffers);
  }

  public deserialize(buffer: Buffer): void {
    // 不需要实现，这是响应协议
    throw new Error('GetBossMonsterRspProto.deserialize() not implemented');
  }
}
