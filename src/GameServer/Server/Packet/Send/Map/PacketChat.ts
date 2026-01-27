import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { ChatRspProto } from '../../../../../shared/proto/packets/rsp/map/ChatRspProto';

/**
 * 聊天响应包
 * CMD 1014
 */
export class PacketChat extends BaseProto {
  private _data: Buffer;

  constructor(senderId: number, senderNick: string, toId: number, msg: string) {
    super(CommandID.CHAT);
    const proto = new ChatRspProto();
    proto.senderId = senderId;
    proto.senderNick = senderNick;
    proto.toId = toId;
    proto.msg = msg;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
