import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo, CommandID } from '../../../../../shared/protocol';
import { Logger } from '../../../../../shared/utils';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { LoginManager } from '../../../../Game/Login/LoginManager';
import { CreateRoleReqProto } from '../../../../../shared/proto';

/**
 * [CMD: CREATE_ROLE (108)] 创建角色处理�?
 * 请求: userID(4字节) + nickname(16字节) + color(4字节) = 24字节
 * 响应: session(16字节)
 */
@Opcode(CommandID.CREATE_ROLE, InjectType.LOGIN_MANAGER)
export class CreateRoleHandler implements IHandler {
  private _loginManager: LoginManager;

  constructor(loginManager: LoginManager) {
    this._loginManager = loginManager;
  }

  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const req = CreateRoleReqProto.fromBuffer(body);
    Logger.Info(`创建角色: userID=${req.userID}, nickname=${req.nickname}, color=${req.color}`);

    // 使用 session 中的 userID 
    const actualUserID = session.UserID || req.userID;
    await this._loginManager.CreatePlayer(session, actualUserID, req.nickname, req.color);
  }
}

