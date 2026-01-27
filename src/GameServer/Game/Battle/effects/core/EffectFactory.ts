import { BaseEffect } from './BaseEffect';
import { getAllRegisteredEffects } from './EffectDecorator';
import { SkillEffectType } from '../../../../../shared/models/SkillEffectModel';
import { Logger } from '../../../../../shared/utils';

/**
 * 效果工厂
 * 负责创建和管理所有效果实例
 * 使用装饰器自动注册所有效果，无需手动导入
 */
export class EffectFactory {
  /**
   * 创建所有效果实例
   * 通过 @Effect() 装饰器自动获取所有效果类
   * @returns 效果实例数组
   */
  public static createAllEffects(): BaseEffect[] {
    try {
      // 通过装饰器自动获取所有效果实例
      const effects = getAllRegisteredEffects();
      
      Logger.Info(`[EffectFactory] 通过装饰器自动创建了 ${effects.length} 个效果实例`);
      
      return effects;
      
    } catch (error) {
      Logger.Error(`[EffectFactory] 创建效果实例失败: ${error}`);
      return [];
    }
  }

  /**
   * 验证所有效果是否正确实现
   */
  public static validateEffects(effects: BaseEffect[]): boolean {
    const effectIds = new Set<number>();
    let isValid = true;

    for (const effect of effects) {
      const effectId = effect.getEffectId();
      
      // 检查是否有重复的效果ID
      if (effectIds.has(effectId)) {
        Logger.Error(`[EffectFactory] 发现重复的效果ID: ${effectId} (${effect.getEffectName()})`);
        isValid = false;
      }
      
      effectIds.add(effectId);
    }

    Logger.Info(`[EffectFactory] 效果验证完成: ${isValid ? '通过' : '失败'}, 共 ${effects.length} 个效果`);
    
    return isValid;
  }
}
