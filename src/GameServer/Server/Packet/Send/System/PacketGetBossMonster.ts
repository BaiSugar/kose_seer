import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetBossMonsterRspProto } from '../../../../../shared/proto/packets/rsp/system/GetBossMonsterRspProto';

/**
 * GET_BOSS_MONSTER 响应包
 * CMD 8004
 * 
 * 用于服务器主动推送精灵给玩家
 */
export class PacketGetBossMonster extends BaseProto {
  private _data: Buffer;

  constructor(
    petID: number,
    captureTm: number,
    bonusID: number = 0,
    items: Array<{ itemID: number; itemCnt: number }> = []
  ) {
    super(CommandID.GET_BOSS_MONSTER);
    const proto = new GetBossMonsterRspProto();
    proto.bonusID = bonusID;
    proto.petID = petID;
    proto.captureTm = captureTm;
    proto.items = items;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
