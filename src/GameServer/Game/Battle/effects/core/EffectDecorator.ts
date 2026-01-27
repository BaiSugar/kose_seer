import { BaseEffect } from './BaseEffect';
import { Logger } from '../../../../../shared/utils';

/**
 * 效果注册表（用于装饰器）
 * 存储所有通过装饰器注册的效果类
 */
class EffectClassRegistry {
  private static instance: EffectClassRegistry;
  private effectClasses: Array<new () => BaseEffect> = [];

  private constructor() {}

  public static getInstance(): EffectClassRegistry {
    if (!EffectClassRegistry.instance) {
      EffectClassRegistry.instance = new EffectClassRegistry();
    }
    return EffectClassRegistry.instance;
  }

  /**
   * 注册效果类
   */
  public register(effectClass: new () => BaseEffect): void {
    this.effectClasses.push(effectClass);
    Logger.Debug(`[EffectDecorator] 注册效果类: ${effectClass.name}`);
  }

  /**
   * 获取所有效果类
   */
  public getAllClasses(): Array<new () => BaseEffect> {
    return this.effectClasses;
  }

  /**
   * 创建所有效果实例
   */
  public createAllInstances(): BaseEffect[] {
    const instances: BaseEffect[] = [];
    
    for (const EffectClass of this.effectClasses) {
      try {
        const instance = new EffectClass();
        instances.push(instance);
      } catch (error) {
        Logger.Error(`[EffectDecorator] 创建效果实例失败: ${EffectClass.name}, Error=${error}`);
      }
    }
    
    return instances;
  }

  /**
   * 清空注册表
   */
  public clear(): void {
    this.effectClasses = [];
  }
}

/**
 * 效果装饰器
 * 自动注册效果类，类似于 @Opcode 装饰器
 * 
 * 使用方法：
 * @Effect()
 * export class AbsorbEffect extends BaseEffect {
 *   constructor() {
 *     super(SkillEffectType.ABSORB, '吸血', [EffectTiming.AFTER_DAMAGE_APPLY]);
 *   }
 *   // ...
 * }
 */
export function Effect() {
  return function <T extends new (...args: any[]) => BaseEffect>(target: T) {
    // 注册效果类
    EffectClassRegistry.getInstance().register(target as new () => BaseEffect);
    
    // 返回原始类
    return target;
  };
}

/**
 * 获取所有注册的效果实例
 */
export function getAllRegisteredEffects(): BaseEffect[] {
  const instances = EffectClassRegistry.getInstance().createAllInstances();
  Logger.Info(`[EffectDecorator] 通过装饰器创建了 ${instances.length} 个效果实例`);
  return instances;
}

/**
 * 清空效果注册表
 */
export function clearEffectRegistry(): void {
  EffectClassRegistry.getInstance().clear();
  Logger.Info('[EffectDecorator] 清空效果注册表');
}
