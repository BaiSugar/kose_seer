import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { RegisterManager } from '../../../../Game/Register';
import { SendEmailCodeReqProto } from '../../../../../shared/proto';
import { Logger } from '../../../../../shared/utils';

/**
 * [CMD: 3 SEND_EMAIL_CODE] 发送邮箱验证码处理器
 */
@Opcode(CommandID.SEND_EMAIL_CODE, InjectType.REGISTER_MANAGER)
export class SendEmailCodeHandler implements IHandler {
  private _registerManager: RegisterManager;

  constructor(registerManager: RegisterManager) {
    this._registerManager = registerManager;
  }

  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    try {
      // 解析请求
      const req = new SendEmailCodeReqProto();
      req.deserialize(body);

      Logger.Info(`[SendEmailCodeHandler] 发送验证码请求: email=${req.emailAddress}`);

      // 发送验证码
      await this._registerManager.HandleSendEmailCode(session, req.emailAddress);

    } catch (err) {
      Logger.Error('[SendEmailCodeHandler] 处理发送验证码请求失败', err as Error);
    }
  }
}
