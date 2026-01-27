import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo, CommandID } from '../../../../../shared/protocol';
import { Logger } from '../../../../../shared/utils';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { LoginManager } from '../../../../Game/Login/LoginManager';
import { MainLoginReqProto } from '../../../../../shared/proto';

/**
 * [CMD: MAIN_LOGIN_IN (104)] 主登录处理器
 * 米米号登录请�? passwordMD5(32字节)
 * 邮箱登录请求: email(64字节) + passwordMD5(32字节) + unknown(4字节) + loginType(4字节) + unknown(4字节)
 * 响应: session(16字节) + roleCreated(4字节)
 */
@Opcode(CommandID.MAIN_LOGIN_IN, InjectType.LOGIN_MANAGER)
export class MainLoginHandler implements IHandler {
  private _loginManager: LoginManager;

  constructor(loginManager: LoginManager) {
    this._loginManager = loginManager;
  }

  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    // 判断登录类型：userID=0 表示邮箱登录
    if (head.UserID === 0) {
      // 邮箱登录
      const req = MainLoginReqProto.fromEmailLogin(body);
      Logger.Info(`邮箱登录 Email=${req.email}`);
      await this._loginManager.HandleEmailLogin(session, req.email!, req.passwordMD5);
    } else {
      // 米米号登�?
      const req = MainLoginReqProto.fromMimiLogin(body);
      Logger.Info(`米米号登录 UserID=${head.UserID}`);
      session.UserID = head.UserID;
      await this._loginManager.HandleMainLogin(session, head.UserID, req.passwordMD5);
    }
  }
}


