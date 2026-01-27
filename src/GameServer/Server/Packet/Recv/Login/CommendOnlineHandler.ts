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
    Logger.Info(`请求服务器列表?UserID=${head.UserID}`);
    await this._serverManager.HandleCommendOnline(session, head.UserID);
  }
}

