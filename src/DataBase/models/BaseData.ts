/**
 * 数据基类
 * 提供自动保存功能（包括深度 Proxy 支持）
 * 
 * 使用方法：
 * 1. 继承 BaseData
 * 2. 在 constructor 中调用 super(uid, noSaveFields, arrayFields)
 * 3. 实现 save() 方法
 */

import { Logger } from '../../shared/utils/Logger';

/**
 * 数据基类
 */
export abstract class BaseData {
  /** 用户ID（主键） - 子类必须初始化 */
  public Uid!: number;

  /** 保存定时器 */
  private _saveTimer: NodeJS.Timeout | null = null;
  
  /** 是否有待保存的修改 */
  private _pendingSave: boolean = false;

  /** 不需要自动保存的字段列表（黑名单） */
  private _noSaveFields: Set<string>;

  /** 需要深度 Proxy 包装的数组字段列表 */
  private _arrayFields: Set<string>;

  /**
   * 构造函数
   * @param uid 用户ID
   * @param noSaveFields 不需要自动保存的字段（主键、内部状态等）
   * @param arrayFields 需要深度 Proxy 包装的数组字段
   */
  constructor(uid: number, noSaveFields: string[] = [], arrayFields: string[] = []) {
    // 默认黑名单字段
    this._noSaveFields = new Set([
      'Uid',
      'userID',
      '_saveTimer',
      '_pendingSave',
      '_noSaveFields',
      '_arrayFields',
      ...noSaveFields
    ]);

    this._arrayFields = new Set(arrayFields);
  }

  /**
   * 创建 Proxy 包装（子类在 constructor 最后调用）
   */
  protected createProxy<T extends BaseData>(target: T): T {
    return new Proxy(target, {
      set: (obj, property: string, value) => {
        // 如果是数组字段，为数组创建深度 Proxy
        if (this._arrayFields.has(property) && Array.isArray(value)) {
          value = this.wrapArrayWithProxy(value);
        }

        // 设置新值
        (obj as any)[property] = value;

        // 如果不在黑名单中，触发保存
        if (!this._noSaveFields.has(property)) {
          this.scheduleSave();
        }

        return true;
      },
      get: (obj, property: string) => {
        const value = (obj as any)[property];
        
        // 如果是数组字段，确保它被 Proxy 包装
        if (this._arrayFields.has(property) && Array.isArray(value)) {
          return this.wrapArrayWithProxy(value);
        }
        
        return value;
      }
    });
  }

  /**
   * 为数组创建深度 Proxy，监听数组操作和对象属性修改
   */
  private wrapArrayWithProxy<T>(array: T[]): T[] {
    // 为数组中的每个对象创建 Proxy
    const wrappedItems = array.map(item => this.wrapObjectWithProxy(item));
    
    // 为数组本身创建 Proxy，监听数组操作（push, splice 等）
    return new Proxy(wrappedItems, {
      set: (target, property, value) => {
        if (property === 'length' || !isNaN(Number(property))) {
          // 数组长度变化或索引赋值
          if (typeof value === 'object' && value !== null) {
            target[property as any] = this.wrapObjectWithProxy(value);
          } else {
            target[property as any] = value;
          }
          this.scheduleSave();
          return true;
        }
        target[property as any] = value;
        return true;
      },
      get: (target, property) => {
        const value = target[property as any];
        
        // 拦截数组方法
        if (property === 'push') {
          return (...items: T[]) => {
            const wrappedItems = items.map(item => this.wrapObjectWithProxy(item));
            const result = Array.prototype.push.apply(target, wrappedItems);
            this.scheduleSave();
            return result;
          };
        }
        
        if (property === 'splice') {
          return (...args: any[]) => {
            // splice 的新增元素需要包装
            const wrappedArgs = args.map((arg, index) => {
              if (index >= 2 && typeof arg === 'object' && arg !== null) {
                return this.wrapObjectWithProxy(arg);
              }
              return arg;
            });
            const result = (Array.prototype.splice as any).apply(target, wrappedArgs);
            this.scheduleSave();
            return result;
          };
        }
        
        if (property === 'unshift') {
          return (...items: T[]) => {
            const wrappedItems = items.map(item => this.wrapObjectWithProxy(item));
            const result = Array.prototype.unshift.apply(target, wrappedItems);
            this.scheduleSave();
            return result;
          };
        }
        
        if (property === 'pop' || property === 'shift') {
          return () => {
            const result = Array.prototype[property].call(target);
            this.scheduleSave();
            return result;
          };
        }
        
        return value;
      }
    });
  }

  /**
   * 为对象创建 Proxy，监听属性修改
   */
  private wrapObjectWithProxy<T>(obj: T): T {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    return new Proxy(obj, {
      set: (target, property: string, value) => {
        (target as any)[property] = value;
        // 对象属性修改时触发保存
        this.scheduleSave();
        return true;
      }
    });
  }

  /**
   * 调度保存操作（防抖，100ms内的多次修改只保存一次）
   */
  protected scheduleSave(): void {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
    }

    this._pendingSave = true;
    this._saveTimer = setTimeout(async () => {
      if (this._pendingSave) {
        await this.save();
        this._pendingSave = false;
      }
      this._saveTimer = null;
    }, 100); // 100ms 防抖
  }

  /**
   * 立即保存到数据库（子类必须实现）
   */
  public abstract save(): Promise<void>;

  /**
   * 获取数据类名称（用于日志）
   */
  protected getDataClassName(): string {
    return this.constructor.name;
  }
}
