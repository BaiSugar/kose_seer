/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 依赖注入类型
 */
export enum InjectType {
  NONE = 0,
  LOGIN_MANAGER = 1,
  REGISTER_MANAGER = 2,
  SERVER_MANAGER = 3,
  MAP_MANAGER = 4,
  PET_MANAGER = 5,
  BATTLE_MANAGER = 6,
  ITEM_MANAGER = 7,
}

/**
 * Handler类型定义
 */
export interface IHandlerClass {
  new (...args: unknown[]): IHandler;
  CMD?: number;
  INJECT?: InjectType;
}

export interface IHandler {
  Handle(session: unknown, head: unknown, body: Buffer): void | Promise<void>;
}

/**
 * Handler注册表
 */
class HandlerRegistry {
  private _handlers: Map<number, IHandlerClass> = new Map();

  /**
   * 注册Handler
   */
  public Register(cmdID: number, handlerClass: IHandlerClass, injectType: InjectType = InjectType.NONE): void {
    this._handlers.set(cmdID, handlerClass);
    handlerClass.CMD = cmdID;
    handlerClass.INJECT = injectType;
  }

  /**
   * 获取所有已注册的Handler
   */
  public GetAll(): Map<number, IHandlerClass> {
    return this._handlers;
  }

  /**
   * 获取指定命令的Handler类
   */
  public Get(cmdID: number): IHandlerClass | undefined {
    return this._handlers.get(cmdID);
  }

  /**
   * 获取已注册数量
   */
  public get Count(): number {
    return this._handlers.size;
  }
}

// 全局Handler注册表
export const Handlers = new HandlerRegistry();

/**
 * [Opcode(CmdIds.xxx, InjectType.xxx)] 装饰器
 * 用于标记Handler类处理的命令ID和依赖注入类型
 *
 * @example
 * ```typescript
 * @Opcode(CommandID.MAIN_LOGIN_IN, InjectType.LOGIN_MANAGER)
 * export class MainLoginHandler implements IHandler {
 *   constructor(private _loginManager: LoginManager) {}
 *   public Handle(session: IClientSession, head: HeadInfo, body: Buffer): void {
 *     // ...
 *   }
 * }
 * ```
 */
export function Opcode(cmdID: number, injectType: InjectType = InjectType.NONE): ClassDecorator {
  return function (target: any): void {
    Handlers.Register(cmdID, target as IHandlerClass, injectType);

    // 添加静态属性
    Object.defineProperty(target, 'CMD', {
      value: cmdID,
      writable: false,
      enumerable: true,
      configurable: false
    });
    Object.defineProperty(target, 'INJECT', {
      value: injectType,
      writable: false,
      enumerable: true,
      configurable: false
    });
  };
}
