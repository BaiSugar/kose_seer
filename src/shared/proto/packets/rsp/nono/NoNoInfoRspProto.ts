import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 9003 NONO_INFO] NoNo 信息响应
 * 
 * 基于官方服务器抓包数据
 * 
 * 字段列表（按官方顺序）：
 * - userID (4)
 * - flag (4)
 * - state (4)
 * - nick (16)
 * - superNono (4)
 * - color (4)
 * - power (4)
 * - mate (4)
 * - iq (4)
 * - ai (2) ← 注意：2字节！
 * - birth (4)
 * - chargeTime (4)
 * - func (20 bytes) ← 160位功能列表
 * - superEnergy (4)
 * - superLevel (4)
 * - superStage (4)
 * 
 * 总长度：94字节
 */
export class NoNoInfoRspProto extends BaseProto {
  userID: number = 0;
  flag: number = 1;
  state: number = 1;
  nick: string = 'NONO';
  superNono: number = 0;
  color: number = 0xFFFFFF;
  power: number = 10000;
  mate: number = 10000;
  iq: number = 0;
  ai: number = 0;
  birth: number = 0;
  chargeTime: number = 500;
  func: boolean[] = new Array(160).fill(true);  // 160位功能列表，默认全部开启
  superEnergy: number = 0;
  superLevel: number = 0;
  superStage: number = 0;

  constructor() {
    super(CommandID.NONO_INFO);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(256);
    
    // 按官方顺序写入字段
    writer.WriteUInt32(this.userID);                // userID (4)
    writer.WriteUInt32(this.flag);                  // flag (4)
    writer.WriteUInt32(this.state);                 // state (4)
    writer.WriteBytes(this.buildString(this.nick, 16)); // nick (16)
    writer.WriteUInt32(this.superNono);             // superNono (4)
    writer.WriteUInt32(this.color);                 // color (4)
    writer.WriteUInt32(this.power);                 // power (4)
    writer.WriteUInt32(this.mate);                  // mate (4)
    writer.WriteUInt32(this.iq);                    // iq (4)
    writer.WriteUInt16(this.ai);                    // ai (2) ← 注意：2字节！
    writer.WriteUInt32(this.birth);                 // birth (4)
    writer.WriteUInt32(this.chargeTime);            // chargeTime (4)
    
    // func (20 bytes = 160 bits)
    // 将160个布尔值打包成20字节
    const funcBytes = Buffer.alloc(20);
    for (let i = 0; i < 160; i++) {
      if (this.func[i]) {
        const byteIndex = Math.floor(i / 8);
        const bitIndex = i % 8;
        funcBytes[byteIndex] |= (1 << bitIndex);
      }
    }
    writer.WriteBytes(funcBytes);                   // func (20)
    
    writer.WriteUInt32(this.superEnergy);           // superEnergy (4)
    writer.WriteUInt32(this.superLevel);            // superLevel (4)
    writer.WriteUInt32(this.superStage);            // superStage (4)
    
    const buffer = writer.ToBuffer();
    
    // 详细日志
    console.log(`[NoNoInfoRspProto] 序列化完成（官方格式）: 总长度=${buffer.length}字节`);
    console.log(`  userID=${this.userID}, flag=${this.flag}, state=${this.state}`);
    console.log(`  nick="${this.nick}", superNono=${this.superNono}, color=0x${this.color.toString(16)}`);
    console.log(`  power=${this.power}, mate=${this.mate}, iq=${this.iq}, ai=${this.ai}`);
    console.log(`  birth=${this.birth}, chargeTime=${this.chargeTime}`);
    console.log(`  superEnergy=${this.superEnergy}, superLevel=${this.superLevel}, superStage=${this.superStage}`);
    console.log(`  func: ${this.func.filter(f => f).length}/160 功能开启`);
    console.log(`  前64字节: ${buffer.subarray(0, Math.min(64, buffer.length)).toString('hex')}`);
    
    return buffer;
  }
}

