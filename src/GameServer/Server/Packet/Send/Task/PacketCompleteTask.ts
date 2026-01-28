import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { CompleteTaskRspProto } from '../../../../../shared/proto/packets/rsp/task/CompleteTaskRspProto';
import { ITaskRewardItem } from '../../../../Game/Task/TaskConfig';

export class PacketCompleteTask extends BaseProto {
  private _data: Buffer;

  constructor(taskId: number, petId: number, captureTm: number, items: ITaskRewardItem[], result: number = 0) {
    super(CommandID.COMPLETE_TASK);

    const proto = new CompleteTaskRspProto();
    proto.taskId = taskId;
    proto.petId = petId;
    proto.captureTm = captureTm;
    proto.items = items;

    if (result !== 0) {
      proto.setResult(result);
    }

    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
