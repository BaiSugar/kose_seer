import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';
import { BufferWriter } from '../../../../utils';

/**
 * 获取好友关系列表响应
 * CMD 2150: GET_RELATION_LIST
 * 
 * 响应格式：
 * - friendCount (4 bytes): 好友数量
 * - friendList: 好友列表（每个好友4字节userID）
 * - blackCount (4 bytes): 黑名单数量
 * - blackList: 黑名单列表（每个4字节userID）
 */
export class GetRelationListRspProto extends BaseProto {
  private friendList: number[];
  private blackList: number[];

  constructor(friendList: number[] = [], blackList: number[] = []) {
    super(CommandID.GET_RELATION_LIST);
    this.friendList = friendList;
    this.blackList = blackList;
  }

  public serialize(): Buffer {
    const writer = new BufferWriter(1024);

    // 好友列表
    writer.WriteUInt32(this.friendList.length);
    for (const friendId of this.friendList) {
      writer.WriteUInt32(friendId);
    }

    // 黑名单
    writer.WriteUInt32(this.blackList.length);
    for (const userId of this.blackList) {
      writer.WriteUInt32(userId);
    }

    return writer.ToBuffer();
  }

  public deserialize(buffer: Buffer): void {
    // 不需要实现
  }
}
