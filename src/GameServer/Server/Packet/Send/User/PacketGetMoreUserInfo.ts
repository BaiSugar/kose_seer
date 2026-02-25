import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetMoreUserInfoRspProto } from '../../../../../shared/proto/packets/rsp/user/GetMoreUserInfoRspProto';
import { IPlayerInfo } from '../../../../../shared/models/PlayerModel';

/**
 * GET_MORE_USERINFO 数据包 (2052)
 * 获取更多用户信息响应
 */
export class PacketGetMoreUserInfo extends BaseProto {
  private _data: Buffer;

  constructor(playerData: IPlayerInfo) {
    super(CommandID.GET_MORE_USERINFO);
    
    const proto = new GetMoreUserInfoRspProto();
    
    // 填充真实数据
    proto.setUserID(playerData.userID);
    proto.setNick(playerData.nick || '');
    proto.setRegTime(playerData.regTime || 0);
    proto.setPetAllNum(playerData.petAllNum || 0);
    proto.setPetMaxLev(playerData.petMaxLev || 0);
    
    // BOSS成就（从数据库读取）
    proto.setBossAchievement(playerData.bossAchievement || new Array(200).fill(false));
    
    proto.setGraduationCount(playerData.graduationCount || 0);
    proto.setMonKingWin(playerData.monKingWin || 0);
    proto.setMessWin(playerData.messWin || 0);
    proto.setMaxStage(playerData.maxStage || 0);
    proto.setMaxArenaWins(playerData.maxArenaWins || 0);
    proto.setCurTitle(playerData.curTitle || 0);
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
