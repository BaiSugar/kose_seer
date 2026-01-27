import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { ChangeNickNameRspProto } from '../../../../../shared/proto/packets/rsp/map/ChangeNickNameRspProto';

/**
 * 修改昵称响应包
 * CMD 1007
 */
export class PacketChangeNickName extends BaseProto {
  private _data: Buffer;

  constructor(userId: number, newNick: string) {
    super(CommandID.CHANG_NICK_NAME);
    const proto = new ChangeNickNameRspProto();
    proto.userId = userId;
    proto.newNick = newNick;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
