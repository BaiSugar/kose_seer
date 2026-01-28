import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetDailyTaskBufRspProto } from '../../../../../shared/proto/packets/rsp/task/GetDailyTaskBufRspProto';

export class PacketGetDailyTaskBuf extends BaseProto {
  private _data: Buffer;

  constructor() {
    super(CommandID.GET_DAILY_TASK_BUF);

    const proto = new GetDailyTaskBufRspProto();
    proto.value1 = 0;
    proto.value2 = 0;

    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
