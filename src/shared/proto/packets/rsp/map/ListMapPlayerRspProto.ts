import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';
import { SeerMapUserInfoProto } from '../../../common/SeerMapUserInfoProto';

/**
 * [CMD: 2003 LIST_MAP_PLAYER] 地图玩家列表响应
 */
export class ListMapPlayerRspProto extends BaseProto {
  players: SeerMapUserInfoProto[] = [];  // 玩家列表

  constructor() {
    super(CommandID.LIST_MAP_PLAYER);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(4096);
    
    // 写入玩家数量
    writer.WriteUInt32(this.players.length);
    
    // 写入每个玩家的信息
    for (const player of this.players) {
      writer.WriteBytes(player.serialize());
    }
    
    return writer.ToBuffer();
  }

  // 链式调用辅助方法
  setPlayers(players: SeerMapUserInfoProto[]): this {
    this.players = players;
    return this;
  }

  addPlayer(player: SeerMapUserInfoProto): this {
    this.players.push(player);
    return this;
  }
}
