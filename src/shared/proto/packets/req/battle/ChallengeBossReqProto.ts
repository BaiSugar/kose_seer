import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2411 CHALLENGE_BOSS] 挑战BOSS请求
 * 
 * 注意：虽然go-server使用param2，但实际客户端发送的是bossId
 * 我们的实现使用bossId作为BOSS配置的唯一标识
 */
export class ChallengeBossReqProto extends BaseProto {
  public bossId: number = 0;

  constructor() {
    super(CommandID.CHALLENGE_BOSS);
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    
    // 读取 bossId (uint32)
    this.bossId = buffer.readUInt32BE(offset);
    offset += 4;
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(4);
    let offset = 0;
    
    // 写入 bossId (uint32)
    buffer.writeUInt32BE(this.bossId, offset);
    offset += 4;
    
    return buffer;
  }
}
