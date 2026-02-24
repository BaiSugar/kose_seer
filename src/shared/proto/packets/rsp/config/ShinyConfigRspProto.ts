import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';
import { BufferWriter } from '../../../../utils/BufferWriter';
import { IShinyConfigItem } from '../../../../config/game/interfaces/IShinyConfig';

/**
 * 异色配置响应
 * CMD 109001
 * 
 * 协议格式（与 ShinyConfig.as 匹配）：
 * - uint32: version (配置版本号)
 * - boolean: needUpdate (是否需要更新，如果客户端版本一致则为 false)
 * - uint16: count (配置数量，仅当 needUpdate=true 时有效)
 * - 对于每个配置：
 *   - uint32: shinyId
 *   - UTF: name
 *   - UTF: description
 *   - 20 个 float: colorMatrix
 *   - UTF: glowColor (如 "0xFFD700")
 *   - float: glowAlpha
 *   - float: glowBlur
 *   - float: glowStrength
 *   - UTF: petOverrides (JSON 字符串)
 */
export class ShinyConfigRspProto extends BaseProto {
  public version: number = 0;
  public needUpdate: boolean = true;
  public configs: IShinyConfigItem[] = [];

  constructor() {
    super(CommandID.SHINY_CONFIG_GET);
  }

  public deserialize(buffer: Buffer): void {
    // 响应包不需要反序列化
  }

  public serialize(): Buffer {
    const writer = new BufferWriter();

    // 写入版本号
    writer.WriteUInt32(this.version);

    // 写入是否需要更新
    writer.WriteBoolean(this.needUpdate);

    if (!this.needUpdate) {
      // 客户端配置已是最新，不发送配置数据
      return writer.ToBuffer();
    }

    // 写入配置数量
    writer.WriteUInt16(this.configs.length);

    // 写入每个配置
    for (const config of this.configs) {
      // shinyId
      writer.WriteUInt32(config.shinyId);

      // name
      writer.WriteUTF(config.name);

      // description
      writer.WriteUTF(config.description || '');

      // colorMatrix (20 个 float)
      if (config.colorMatrix && config.colorMatrix.length === 20) {
        for (let i = 0; i < 20; i++) {
          writer.WriteFloat(config.colorMatrix[i]);
        }
      } else {
        // 默认矩阵
        const defaultMatrix = [
          0.8, 0.2, 0.0, 0, 20,
          0.0, 0.6, 0.4, 0, 20,
          0.2, 0.0, 0.8, 0, 30,
          0,   0,   0,   1, 0
        ];
        for (let i = 0; i < 20; i++) {
          writer.WriteFloat(defaultMatrix[i]);
        }
      }

      // glow.color (转换为字符串格式 "0xFFD700")
      const glowColor = config.glow?.color || '0xFFD700';
      writer.WriteUTF(glowColor);

      // glow.alpha
      writer.WriteFloat(config.glow?.alpha ?? 0.8);

      // glow.blur
      writer.WriteFloat(config.glow?.blur ?? 12);

      // glow.strength
      writer.WriteFloat(config.glow?.strength ?? 2);

      // petOverrides (JSON 字符串)
      const overridesJson = config.petOverrides ? JSON.stringify(config.petOverrides) : '';
      writer.WriteUTF(overridesJson);
    }

    return writer.ToBuffer();
  }
}
