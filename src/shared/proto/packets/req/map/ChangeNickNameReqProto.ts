import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 修改昵称请求
 * CMD: 2061 CHANG_NICK_NAME
 */
export class ChangeNickNameReqProto extends BaseProto {
  public newNick: string = '';

  constructor() {
    super(CommandID.CHANG_NICK_NAME);
  }

  public deserialize(buffer: Buffer): void {
    if (buffer.length >= 16) {
      this.newNick = buffer.toString('utf8', 0, 16).replace(/\0/g, '');
    }
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(16);
    buffer.write(this.newNick, 0, 16, 'utf8');
    return buffer;
  }
}
