import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: LOGIN_IN (1001)] 游戏登录响应
 */
export class LoginRspProto extends BaseProto {
  // 基础信息
  userId: number = 0;
  session: Buffer = Buffer.alloc(8);
  nickname: string = '';
  nicknameExtra: Buffer = Buffer.alloc(20);

  // 等级和经验
  level: number = 1;
  exp: number = 0;

  // 货币
  coins: number = 0;
  energy: number = 0;

  // VIP信息
  vipLevel: number = 0;
  vipValue: number = 0;

  // 服装信息
  clothCount: number = 0;
  clothes: Array<{ id: number }> = [];

  // 精灵信息
  currentPetId: number = 0;
  catchId: number = 0;

  // 地图信息
  mapId: number = 0;
  posX: number = 0;
  posY: number = 0;

  // 加密密钥种子（用于更新加密密钥）
  keySeed: number = 0;

  constructor() {
    super(CommandID.LOGIN_IN);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(300);

    // 基础信息
    writer.WriteUInt32(this.userId);
    writer.WriteBytes(this.session);
    writer.WriteBytes(this.buildString(this.nickname, 20));
    writer.WriteBytes(this.nicknameExtra);

    // 等级和经验
    writer.WriteUInt32(this.level);
    writer.WriteUInt32(this.exp);

    // 货币
    writer.WriteUInt32(this.coins);
    writer.WriteUInt32(this.energy);

    // VIP信息
    writer.WriteUInt32(this.vipLevel);
    writer.WriteUInt32(this.vipValue);

    // 服装信息
    writer.WriteUInt32(this.clothCount);
    for (let i = 0; i < this.clothCount && i < this.clothes.length; i++) {
      writer.WriteUInt32(this.clothes[i].id);
    }

    // 精灵信息
    writer.WriteUInt32(this.currentPetId);
    writer.WriteUInt32(this.catchId);

    // 地图信息
    writer.WriteUInt32(this.mapId);
    writer.WriteUInt32(this.posX);
    writer.WriteUInt32(this.posY);

    // 填充到至少200字节
    const currentLen = writer.Offset;
    if (currentLen < 200) {
      writer.WriteBytes(Buffer.alloc(200 - currentLen));
    }

    // 加密密钥种子（在末尾添加，不计入200字节填充）
    writer.WriteUInt32(this.keySeed);

    return writer.ToBuffer();
  }

  /**
   * 辅助方法：设置Session
   */
  setSession(sessionKey: string | undefined): this {
    if (sessionKey) {
      this.session = this.buildBuffer(sessionKey, 8);
    }
    return this;
  }

  /**
   * 辅助方法：设置昵称
   */
  setNickname(nickname: string): this {
    this.nickname = nickname;
    return this;
  }

  /**
   * 辅助方法：设置加密密钥种子
   */
  setKeySeed(keySeed: number): this {
    this.keySeed = keySeed;
    return this;
  }
}
