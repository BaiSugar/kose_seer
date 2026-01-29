import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { RegisterManager } from '../../../../Game/Register';
import { Logger } from '../../../../../shared/utils';

/**
 * [CMD: 1003 REQUEST_REGISTER] 请求注册处理器
 * 预留接口，暂时返回成功响应
 */
@Opcode(CommandID.REQUEST_REGISTER, InjectType.REGISTER_MANAGER)
export class RequestRegisterHandler implements IHandler {
  private _registerManager: RegisterManager;

  constructor(registerManager: RegisterManager) {
    this._registerManager = registerManager;
  }

  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    try {
      Logger.Info('[RequestRegisterHandler] 请求注册');
      await this._registerManager.HandleRequestRegister(session);
    } catch (err) {
      Logger.Error('[RequestRegisterHandler] 处理请求注册失败', err as Error);
    }
  }
}
