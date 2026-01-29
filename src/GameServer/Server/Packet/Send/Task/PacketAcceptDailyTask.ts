import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { AcceptDailyTaskRspProto } from '../../../../../shared/proto/packets/rsp/task/AcceptDailyTaskRspProto';

/**
 * 接受每日任务响应包
 * CMD 2231
 * 
 * 基于Lua端实现：emptyResponse(2231, 4)
 * 返回4字节的0
 */
export class PacketAcceptDailyTask extends BaseProto {
  private _data: Buffer;

  constructor(result: number = 0) {
    super(CommandID.ACCEPT_DAILY_TASK);
    this.setResult(result);
    
    const proto = new AcceptDailyTaskRspProto();
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
