import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { AddTaskBufRspProto } from '../../../../../shared/proto/packets/rsp/task/AddTaskBufRspProto';

export class PacketAddTaskBuf extends BaseProto {
  private _data: Buffer;

  constructor(result: number = 0) {
    super(CommandID.ADD_TASK_BUF);

    const proto = new AddTaskBufRspProto();

    if (result !== 0) {
      proto.setResult(result);
    }

    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
