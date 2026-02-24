import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 请求异色配置
 * CMD 109001
 */
export class ShinyConfigReqProto extends BaseProto {
  public clientVersion: number = 0;  // 客户端缓存的配置版本

  constructor() {
    super(CommandID.SHINY_CONFIG_GET);
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;

    if (buffer.length >= 4) {
      this.clientVersion = buffer.readUInt32BE(offset);
      offset += 4;
    }
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }
}
