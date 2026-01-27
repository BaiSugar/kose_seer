import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 修改昵称响应
 * CMD: 2061 CHANG_NICK_NAME
 */
export class ChangeNickNameRspProto extends BaseProto {
  public userId: number = 0;
  public newNick: string = '';

  constructor(userId: number = 0, newNick: string = '') {
    super(CommandID.CHANG_NICK_NAME);
    this.userId = userId;
    this.newNick = newNick;
  }

  public deserialize(buffer: Buffer): void {
    this.userId = buffer.readUInt32BE(0);
    this.newNick = buffer.toString('utf8', 4, 20).replace(/\0/g, '');
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(20);
    buffer.writeUInt32BE(this.userId, 0);
    buffer.write(this.newNick, 4, 16, 'utf8');
    return buffer;
  }
}
