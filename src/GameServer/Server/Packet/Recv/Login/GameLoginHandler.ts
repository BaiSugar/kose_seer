import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo, CommandID } from '../../../../../shared/protocol';
import { Logger } from '../../../../../shared/utils';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { LoginManager } from '../../../../Game/Login/LoginManager';
import { LoginReqProto } from '../../../../../shared/proto';

/**
 * [CMD: LOGIN_IN (1001)] 游戏登录处理�?
 * 请求: session(16字节)
 * 响应: 完整玩家信息
 */
@Opcode(CommandID.LOGIN_IN, InjectType.LOGIN_MANAGER)
export class GameLoginHandler implements IHandler {
  private _loginManager: LoginManager;

  constructor(loginManager: LoginManager) {
    this._loginManager = loginManager;
  }

  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    Logger.Info(`游戏登录 UserID=${head.UserID}`);
    session.UserID = head.UserID;

    const req = LoginReqProto.fromBuffer(body);
    await this._loginManager.HandleGameLogin(session, head.UserID, req.session);
  }
}

