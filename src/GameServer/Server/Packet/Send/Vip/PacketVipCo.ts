import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { VipCoRspProto } from '../../../../../shared/proto/packets/rsp/vip/VipCoRspProto';

/**
 * VIP状态变更响应包
 * CMD 8006
 * 
 * 用于通知客户端VIP状态变化（开通超级NoNo、VIP到期等）
 */
export class PacketVipCo extends BaseProto {
  private _data: Buffer;

  constructor(
    userId: number,
    vipType: number,
    autoCharge: number = 0,
    vipEndTime: number = 0,
    superLevel: number = 0,
    superEnergy: number = 0,
    superStage: number = 0
  ) {
    super(CommandID.VIP_CO);
    
    const proto = new VipCoRspProto();
    proto.userId = userId;
    proto.vipType = vipType;
    proto.autoCharge = autoCharge;
    proto.vipEndTime = vipEndTime;
    proto.superLevel = superLevel;
    proto.superEnergy = superEnergy;
    proto.superStage = superStage;
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
