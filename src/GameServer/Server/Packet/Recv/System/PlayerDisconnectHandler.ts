import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PlayerManager } from '../../../../Game/Player/PlayerManager';
import { Logger } from '../../../../../shared/utils';

/**
 * [CMD: 10004 PLAYER_DISCONNECT] 玩家断开连接处理器（内部命令）
 * 由 Gateway 在检测到客户端断开连接时调用
 */
@Opcode(CommandID.PLAYER_DISCONNECT, InjectType.NONE)
export class PlayerDisconnectHandler implements IHandler {
  public async Handle(_session: IClientSession, head: HeadInfo, _body: Buffer): Promise<void> {
    const userID = head.UserID;
    
    Logger.Info(`[PlayerDisconnectHandler] 收到玩家断线通知: UserID=${userID}`);
    
    // 调用 PlayerManager 移除玩家（会触发 OnLogout）
    await PlayerManager.GetInstance().RemovePlayer(userID);
    
    Logger.Info(`[PlayerDisconnectHandler] 玩家 ${userID} 已下线`);
  }
}
