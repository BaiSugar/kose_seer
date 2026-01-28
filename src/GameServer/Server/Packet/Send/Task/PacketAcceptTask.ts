import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { AcceptTaskRspProto } from '../../../../../shared/proto/packets/rsp/task/AcceptTaskRspProto';

/**
 * 接受任务响应包
 * CMD 2201: ACCEPT_TASK
 */
export class PacketAcceptTask extends BaseProto {
  private _data: Buffer;

  constructor(taskId: number, result: number = 0) {
    super(CommandID.ACCEPT_TASK);

    const proto = new AcceptTaskRspProto();
    proto.taskId = taskId;

    if (result !== 0) {
      proto.setResult(result);
    }

    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
