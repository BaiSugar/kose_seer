/**
 * MailData 访问器
 * 提供 MailData 的便捷访问接口
 */

import { MailData } from '../models/MailData';
import { DataLoader } from '../loaders/DataLoader';
import { DataSaver } from '../savers/DataSaver';

/**
 * MailData 访问器
 */
export class MailDataAccessor {
  private static _instance: MailDataAccessor;

  private constructor() {}

  public static get Instance(): MailDataAccessor {
    if (!MailDataAccessor._instance) {
      MailDataAccessor._instance = new MailDataAccessor();
    }
    return MailDataAccessor._instance;
  }

  /**
   * 获取或创建 MailData
   */
  public async GetOrCreate(uid: number): Promise<MailData> {
    return DataLoader.Instance.GetOrCreate<MailData>('mail', uid);
  }

  /**
   * 获取 MailData（不创建）
   */
  public Get(uid: number): MailData | null {
    return DataLoader.Instance.Get<MailData>('mail', uid);
  }

  /**
   * 保存 MailData
   */
  public async Save(data: MailData): Promise<void> {
    return DataSaver.Instance.Save('mail', data);
  }
}
