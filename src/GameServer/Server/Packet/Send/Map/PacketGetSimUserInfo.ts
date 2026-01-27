import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetSimUserInfoRspProto } from '../../../../../shared/proto/packets/rsp/map/GetSimUserInfoRspProto';

/**
 * 获取简单用户信息响应包
 * CMD 1005
 */
export class PacketGetSimUserInfo extends BaseProto {
  private _data: Buffer;

  constructor(userId: number, nick: string, color: number) {
    super(CommandID.GET_SIM_USERINFO);
    const proto = new GetSimUserInfoRspProto();
    proto.userId = userId;
    proto.nick = nick;
    proto.color = color;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
