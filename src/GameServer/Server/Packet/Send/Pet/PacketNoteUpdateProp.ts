import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { NoteUpdatePropRspProto, IUpdatePropInfo } from '../../../../../shared/proto/packets/rsp/pet/NoteUpdatePropRspProto';

/**
 * NOTE_UPDATE_PROP 数据包 (2508)
 * 推送精灵属性更新信息
 */
export class PacketNoteUpdateProp extends BaseProto {
  private _data: Buffer;

  constructor(addition: number, pets: IUpdatePropInfo[]) {
    super(CommandID.NOTE_UPDATE_PROP);
    const proto = new NoteUpdatePropRspProto();
    proto.addition = addition;
    proto.pets = pets;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
