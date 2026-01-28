import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo, CommandID } from '../../../../../shared/protocol';
import { Logger } from '../../../../../shared/utils';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { ServerManager } from '../../../../Game/Server/ServerManager';

/**
 * [CMD: COMMEND_ONLINE (105)] 推荐服务器列表处理器
 * 请求:
 * 响应: maxOnlineID(4) + isVIP(4) + onlineCnt(4) + servers...
 */
@Opcode(CommandID.COMMEND_ONLINE, InjectType.SERVER_MANAGER)
export class CommendOnlineHandler implements IHandler {
  private _serverManager: ServerManager;

  constructor(serverManager: ServerManager) {
    this._serverManager = serverManager;
  }

  public async Handle(session: IClientSession, head: HeadInfo, _body: Buffer): Promise<void> {
    Logger.Info(`[CommendOnlineHandler] 请求服务器列表: UserID=${head.UserID}`);
    try {
      await this._serverManager.HandleCommendOnline(session, head.UserID);
      Logger.Info(`[CommendOnlineHandler] 服务器列表已发送`);
    } catch (err) {
      Logger.Error(`[CommendOnlineHandler] 处理失败`, err as Error);
    }
  }
}

