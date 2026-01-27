import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';
import { BufferWriter } from '../../../../utils';
import { FightPetInfoProto } from '../../../common/FightPetInfoProto';

/**
 * [CMD: 2504 NOTE_START_FIGHT] 开始战斗通知响应
 * 发送战斗开始信息
 */
export class NoteStartFightRspProto extends BaseProto {
  isCanAuto: number = 0;       // 是否可以自动战斗
  playerPet: FightPetInfoProto;
  enemyPet: FightPetInfoProto;

  constructor() {
    super(CommandID.NOTE_START_FIGHT);
    this.playerPet = new FightPetInfoProto();
    this.enemyPet = new FightPetInfoProto();
  }

  serialize(): Buffer {
    const writer = new BufferWriter(512);
    
    writer.WriteUInt32(this.isCanAuto);
    writer.WriteBytes(this.playerPet.serialize());
    writer.WriteBytes(this.enemyPet.serialize());
    
    return writer.ToBuffer();
  }

  // 链式调用
  setIsCanAuto(value: number): this {
    this.isCanAuto = value;
    return this;
  }

  setPlayerPet(pet: FightPetInfoProto): this {
    this.playerPet = pet;
    return this;
  }

  setEnemyPet(pet: FightPetInfoProto): this {
    this.enemyPet = pet;
    return this;
  }
}
