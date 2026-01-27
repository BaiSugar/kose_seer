import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo, CommandID } from '../../../../../shared/protocol';
import { Logger } from '../../../../../shared/utils';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { ServerManager } from '../../../../Game/Server/ServerManager';

/**
 * [CMD: RANGE_ONLINE (106)] 范围服务器查询处理器
 * 请求: (�?
 * 响应: onlineCnt(4) + servers...
 */
@Opcode(CommandID.RANGE_ONLINE, InjectType.SERVER_MANAGER)
export class RangeOnlineHandler implements IHandler {
  private _serverManager: ServerManager;

  constructor(serverManager: ServerManager) {
    this._serverManager = serverManager;
  }

  public async Handle(session: IClientSession, head: HeadInfo, _body: Buffer): Promise<void> {
    Logger.Info(`范围服务器查讯 UserID=${head.UserID}`);
    await this._serverManager.HandleRangeOnline(session, head.UserID);
  }
}

