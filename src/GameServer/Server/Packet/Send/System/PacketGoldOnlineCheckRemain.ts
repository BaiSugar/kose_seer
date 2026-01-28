import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GoldOnlineCheckRemainRspProto } from '../../../../../shared/proto/packets/rsp/system/GoldOnlineCheckRemainRspProto';

/**
 * [CMD: 1106 GOLD_ONLINE_CHECK_REMAIN] 检查金币余额响应包
 */
export class PacketGoldOnlineCheckRemain extends BaseProto {
  private _data: Buffer;

  constructor(gold: number) {
    super(CommandID.GOLD_ONLINE_CHECK_REMAIN);
    
    const proto = new GoldOnlineCheckRemainRspProto();
    proto.setGold(gold);
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
