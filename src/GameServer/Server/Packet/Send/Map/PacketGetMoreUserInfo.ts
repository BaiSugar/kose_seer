import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetMoreUserInfoRspProto } from '../../../../../shared/proto/packets/rsp/map/GetMoreUserInfoRspProto';

/**
 * 获取详细用户信息响应包
 * CMD 1006
 */
export class PacketGetMoreUserInfo extends BaseProto {
  private _data: Buffer;

  constructor(
    userId: number,
    nick: string,
    regTime: number = 0,
    petAllNum: number = 0,
    petMaxLev: number = 0,
    bossAchievement: string = '',
    graduationCount: number = 0,
    monKingWin: number = 0,
    messWin: number = 0,
    maxStage: number = 0,
    maxArenaWins: number = 0,
    curTitle: number = 0
  ) {
    super(CommandID.GET_MORE_USERINFO);
    const proto = new GetMoreUserInfoRspProto();
    proto.userId = userId;
    proto.nick = nick;
    proto.regTime = regTime;
    proto.petAllNum = petAllNum;
    proto.petMaxLev = petMaxLev;
    proto.bossAchievement = bossAchievement;
    proto.graduationCount = graduationCount;
    proto.monKingWin = monKingWin;
    proto.messWin = messWin;
    proto.maxStage = maxStage;
    proto.maxArenaWins = maxArenaWins;
    proto.curTitle = curTitle;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
