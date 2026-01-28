import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetTaskBufRspProto } from '../../../../../shared/proto/packets/rsp/task/GetTaskBufRspProto';

export class PacketGetTaskBuf extends BaseProto {
  private _data: Buffer;

  constructor(taskId: number, buffers: number[]) {
    super(CommandID.GET_TASK_BUF);

    const proto = new GetTaskBufRspProto();
    proto.taskId = taskId;
    proto.buffers = buffers;

    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
