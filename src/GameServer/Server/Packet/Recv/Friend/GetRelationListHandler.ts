import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators/Opcode';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PacketGetRelationList } from '../../../Packet/Send/Friend/PacketGetRelationList';
import { Logger } from '../../../../../shared/utils/Logger';

/**
 * [CMD: 2150 GET_RELATION_LIST] 获取好友关系列表
 * 返回好友列表和黑名单
 */
@Opcode(CommandID.GET_RELATION_LIST, InjectType.NONE)
export class GetRelationListHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    try {
      Logger.Debug(`[GetRelationListHandler] 用户 ${player.Uid} 请求好友列表`);

      const friendData = player.FriendManager.FriendData;
      
      // 发送好友列表和黑名单
      await player.SendPacket(new PacketGetRelationList(
        friendData.FriendList,
        friendData.BlackList
      ));
    } catch (error) {
      Logger.Error(`[GetRelationListHandler] 失败`, error as Error);
      await player.SendPacket(new PacketGetRelationList([], []).setResult(5000));
    }
  }
}
