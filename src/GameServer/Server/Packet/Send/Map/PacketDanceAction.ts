import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { DanceActionRspProto } from '../../../../../shared/proto/packets/rsp/map/DanceActionRspProto';

/**
 * 舞蹈动作响应包
 * CMD 1009
 */
export class PacketDanceAction extends BaseProto {
  private _data: Buffer;

  constructor(userId: number, actionId: number, actionType: number) {
    super(CommandID.DANCE_ACTION);
    const proto = new DanceActionRspProto();
    proto.userId = userId;
    proto.actionId = actionId;
    proto.actionType = actionType;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
