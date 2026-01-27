import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';
import { BufferWriter } from '../../../../utils';
import { SimplePetInfoProto } from '../../../common/SimplePetInfoProto';

/**
 * [CMD: 2503 NOTE_READY_TO_FIGHT] 准备战斗通知响应
 * 发送双方的精灵信息
 */
export class NoteReadyToFightRspProto extends BaseProto {
  // 玩家信息
  playerUserId: number = 0;
  playerNick: string = '';
  playerPets: SimplePetInfoProto[] = [];

  // 敌人信息
  enemyUserId: number = 0;
  enemyNick: string = '';
  enemyPets: SimplePetInfoProto[] = [];

  constructor() {
    super(CommandID.NOTE_READY_TO_FIGHT);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(2048);
    
    // 用户数量 (固定2个：玩家和敌人)
    writer.WriteUInt32(2);
    
    // 玩家信息
    writer.WriteUInt32(this.playerUserId);
    writer.WriteBytes(this.buildString(this.playerNick, 16));
    writer.WriteUInt32(this.playerPets.length);
    for (const pet of this.playerPets) {
      writer.WriteBytes(pet.serialize());
    }
    
    // 敌人信息
    writer.WriteUInt32(this.enemyUserId);
    writer.WriteBytes(this.buildString(this.enemyNick, 16));
    writer.WriteUInt32(this.enemyPets.length);
    for (const pet of this.enemyPets) {
      writer.WriteBytes(pet.serialize());
    }
    
    return writer.ToBuffer();
  }

  // 链式调用
  setPlayerInfo(userId: number, nick: string, pets: SimplePetInfoProto[]): this {
    this.playerUserId = userId;
    this.playerNick = nick;
    this.playerPets = pets;
    return this;
  }

  setEnemyInfo(userId: number, nick: string, pets: SimplePetInfoProto[]): this {
    this.enemyUserId = userId;
    this.enemyNick = nick;
    this.enemyPets = pets;
    return this;
  }
}
