import { createHash } from 'crypto';
import { Logger } from '../utils';

/**
 * 加密处理器
 * 负责数据包的加密和解密
 * 
 * 算法来源: luvit/luvit_version/servers/gameserver/trafficlogger.lua
 */
export class CryptoHandler {
  private _key: number[] = [];
  private _enabled: boolean = false;

  /**
   * 初始化加密密钥
   * @param key 加密密钥（10个字符）
   */
  public initKey(key: string): void {
    // 将字符串转换为字节数组
    this._key = [];
    for (let i = 0; i < key.length; i++) {
      this._key.push(key.charCodeAt(i));
    }
    this._enabled = true;
    Logger.Debug(`[CryptoHandler] 密钥已初始化: ${key} (${this._key.length}字节)`);
  }

  /**
   * 生成加密密钥
   * 算法: key = MD5(keySeed XOR userID).substring(0, 10)
   * @param keySeed 密钥种子
   * @param userID 用户ID
   * @returns 10位加密密钥
   */
  public static GenerateKey(keySeed: number, userID: number): string {
    // 1. val = keySeed XOR userID
    const val = keySeed ^ userID;
    
    // 2. hash = MD5(val)
    const hash = createHash('md5').update(val.toString()).digest('hex');
    
    // 3. key = 前10个字符
    const key = hash.substring(0, 10);
    
    return key;
  }

  /**
   * 加密数据
   * 算法：解密的逆过程
   * @param data 原始数据
   * @returns 加密后的数据
   */
  public encrypt(data: Buffer): Buffer {
    if (!this._enabled || this._key.length === 0) {
      return data;
    }

    try {
      const plainLen = data.length;
      const keyLen = this._key.length;
      
      if (plainLen < 1) {
        return data;
      }

      // 第一步：异或密钥（解密的第三步的逆过程）
      const xored: number[] = [];
      let j = 1;
      let needBecomeZero = false;
      
      for (let i = 0; i < plainLen; i++) {
        if (j === 2 && needBecomeZero) {
          j = 1;
          needBecomeZero = false;
        }
        if (j > keyLen) {
          j = 1;
          needBecomeZero = true;
        }
        xored.push(data[i] ^ this._key[j - 1]);
        j++;
      }

      // 第二步：位移操作的逆过程
      // 解密: plain[i] = (temp[i] >> 5) | (temp[i+1] << 3)
      // 加密: temp[i+1] = (plain[i] >> 3) & 0xFF, temp[i] = (plain[i] << 5) | (temp[i+1] >> 3)
      const temp: number[] = new Array(plainLen + 1);
      
      // 从后往前计算
      temp[plainLen] = 0; // 最后一个字节初始化为0
      for (let i = plainLen - 1; i >= 0; i--) {
        // plain[i] = (temp[i] >> 5) | (temp[i+1] << 3)
        // 反推: temp[i] = (plain[i] << 5) | (temp[i+1] >> 3)
        const nextBits = (temp[i + 1] >> 3) & 0x07;
        temp[i] = ((xored[i] << 5) | nextBits) & 0xFF;
      }

      // 第三步：循环移位的逆过程
      const cipherLen = plainLen + 1;
      const result = this._key[(cipherLen - 1) % keyLen] * 13 % cipherLen;
      const cipher: number[] = new Array(cipherLen);
      
      for (let i = 0; i < cipherLen; i++) {
        const idx = (cipherLen - result + i) % cipherLen;
        cipher[idx] = temp[i];
      }

      return Buffer.from(cipher);
    } catch (err) {
      Logger.Error('[CryptoHandler] 加密失败', err as Error);
      return data;
    }
  }

  /**
   * 解密数据
   * 算法来源: trafficlogger.lua crypto:decrypt()
   * @param data 加密的数据
   * @returns 解密后的数据
   */
  public decrypt(data: Buffer): Buffer {
    if (!this._enabled || this._key.length === 0) {
      return data;
    }

    try {
      const cipherLen = data.length;
      const keyLen = this._key.length;
      
      if (cipherLen < 2) {
        return data;
      }

      // 第一步：循环移位
      const result = this._key[(cipherLen - 1) % keyLen] * 13 % cipherLen;
      const temp: number[] = [];
      
      for (let i = 0; i < cipherLen; i++) {
        const idx = (cipherLen - result + i) % cipherLen;
        temp.push(data[idx]);
      }

      // 第二步：位移操作
      const plain: number[] = [];
      for (let i = 0; i < cipherLen - 1; i++) {
        const byte = ((temp[i] >> 5) | (temp[i + 1] << 3)) & 0xFF;
        plain.push(byte);
      }

      // 第三步：异或密钥
      let j = 1;
      let needBecomeZero = false;
      
      for (let i = 0; i < plain.length; i++) {
        if (j === 2 && needBecomeZero) {
          j = 1;
          needBecomeZero = false;
        }
        if (j > keyLen) {
          j = 1;
          needBecomeZero = true;
        }
        plain[i] = plain[i] ^ this._key[j - 1];
        j++;
      }

      return Buffer.from(plain);
    } catch (err) {
      Logger.Error('[CryptoHandler] 解密失败', err as Error);
      return data;
    }
  }

  /**
   * 获取当前密钥
   */
  public get Key(): string {
    return String.fromCharCode(...this._key);
  }

  /**
   * 检查加密是否已启用
   */
  public get Enabled(): boolean {
    return this._enabled;
  }

  /**
   * 启用加密
   */
  public enable(): void {
    this._enabled = true;
  }

  /**
   * 禁用加密
   */
  public disable(): void {
    this._enabled = false;
  }
}
