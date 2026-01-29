import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { RegisterManager } from '../../../../Game/Register';
import { RegisterReqProto } from '../../../../../shared/proto';
import { Logger } from '../../../../../shared/utils';

/**
 * [CMD: 2 REGISTER] 注册账号处理器
 */
@Opcode(CommandID.REGISTER, InjectType.REGISTER_MANAGER)
export class RegisterHandler implements IHandler {
  private _registerManager: RegisterManager;

  constructor(registerManager: RegisterManager) {
    this._registerManager = registerManager;
  }

  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    try {
      // 解析请求
      const req = new RegisterReqProto();
      req.deserialize(body);

      Logger.Info(`[RegisterHandler] 注册请求: email=${req.emailAddress}, password长度=${req.password.length}`);

      // 处理注册
      await this._registerManager.HandleRegister(
        session,
        req.password,
        req.emailAddress,
        req.emailCode,
        req.emailCodeRes
      );

    } catch (err) {
      Logger.Error('[RegisterHandler] 处理注册请求失败', err as Error);
    }
  }
}
