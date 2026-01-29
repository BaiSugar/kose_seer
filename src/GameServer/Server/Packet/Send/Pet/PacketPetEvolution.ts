import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetEvolutionRspProto } from '../../../../../shared/proto/packets/rsp/pet/PetEvolutionRspProto';

/**
 * [CMD: 2314 PET_EVOLVTION] 精灵进化响应包
 */
export class PacketPetEvolution extends BaseProto {
  private _data: Buffer;

  constructor(status: number = 0) {
    super(CommandID.PET_EVOLVTION);
    const proto = new PetEvolutionRspProto(status);
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
