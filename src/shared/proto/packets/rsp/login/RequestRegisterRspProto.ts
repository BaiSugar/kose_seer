import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: REQUEST_REGISTER (1003)] 请求注册响应
 * 
 * 预留接口，暂无响应参数
 */
export class RequestRegisterRspProto extends BaseProto {
  constructor() {
    super(CommandID.REQUEST_REGISTER);
  }

  serialize(): Buffer {
    // 暂无响应body
    return Buffer.alloc(0);
  }
}
