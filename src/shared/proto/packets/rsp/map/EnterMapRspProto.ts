import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';
import { SeerMapUserInfoProto } from '../../../common/SeerMapUserInfoProto';

/**
 * [CMD: 2001 ENTER_MAP] 进入地图响应
 * 返回玩家的完整信息
 */
export class EnterMapRspProto extends BaseProto {
  userInfo: SeerMapUserInfoProto;

  constructor(userInfo?: SeerMapUserInfoProto) {
    super(CommandID.ENTER_MAP);
    this.userInfo = userInfo || new SeerMapUserInfoProto();
  }

  serialize(): Buffer {
    return this.userInfo.serialize();
  }

  // 链式调用辅助方法
  setUserInfo(userInfo: SeerMapUserInfoProto): this {
    this.userInfo = userInfo;
    return this;
  }
}
