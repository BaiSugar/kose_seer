import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetMoreUserInfoReqProto } from '../../../../../shared/proto/packets/req/user/GetMoreUserInfoReqProto';
import { PacketGetMoreUserInfo } from '../../Send/User/PacketGetMoreUserInfo';
import { DatabaseHelper } from '../../../../../DataBase/DatabaseHelper';
import { Logger } from '../../../../../shared/utils/Logger';

/**
 * [CMD: 2052] 获取更多用户信息
 */
@Opcode(CommandID.GET_MORE_USERINFO, InjectType.NONE)
export class GetMoreUserInfoHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = GetMoreUserInfoReqProto.fromBuffer(body);
    
    Logger.Info(`[GetMoreUserInfoHandler] 查询用户信息: RequesterId=${player.Data.userID}, TargetUserId=${req.userId}`);

    try {
      // 获取目标用户的数据
      let targetPlayerData;
      
      if (req.userId === player.Data.userID) {
        // 查询自己的信息，直接使用当前玩家数据
        targetPlayerData = player.Data;
      } else {
        // 查询其他玩家的信息，从数据库加载
        targetPlayerData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PlayerData(req.userId);
      }

      // 实时更新精灵统计信息（从数据库加载）
      const petData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PetData(req.userId);
      if (petData) {
        targetPlayerData.petAllNum = petData.PetList.length;
        if (petData.PetList.length > 0) {
          targetPlayerData.petMaxLev = Math.max(...petData.PetList.map(p => p.level));
        } else {
          targetPlayerData.petMaxLev = 0;
        }
        Logger.Debug(`[GetMoreUserInfoHandler] 更新精灵统计: UserId=${req.userId}, petAllNum=${targetPlayerData.petAllNum}, petMaxLev=${targetPlayerData.petMaxLev}`);
      }

      // 发送响应
      await player.SendPacket(new PacketGetMoreUserInfo(targetPlayerData));
      
      Logger.Info(`[GetMoreUserInfoHandler] 发送用户信息: TargetUserId=${req.userId}, Nick=${targetPlayerData.nick}, Pets=${targetPlayerData.petAllNum}`);
      
    } catch (error) {
      Logger.Error(`[GetMoreUserInfoHandler] 查询用户信息失败: TargetUserId=${req.userId}`, error as Error);
    }
  }
}
