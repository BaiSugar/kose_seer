/**
 * 效果加载器
 * 强制导入所有效果类，触发装饰器执行
 * 
 * 这个文件必须在服务器启动时被导入，以确保所有效果类的装饰器被执行
 */

// ==================== 伤害效果 ====================
import './damage/AbsorbEffect';
import './damage/RecoilEffect';

// ==================== 能力变化效果 ====================
import './stat/StatDownEffect';
import './stat/StatUpEffect';
import './stat/StatUp2Effect';
import './stat/StatDown2Effect';

// ==================== 特殊效果 ====================
import './special/HPEqualEffect';
import './special/MercyEffect';
import './special/RageEffect';
import './special/MultiHitEffect';
import './special/PPReduceEffect';
import './special/EncoreEffect';
import './special/PunishmentEffect';

// ==================== 状态效果 ====================
import './status/ParalysisEffect';
import './status/PoisonEffect';
import './status/BurnEffect';
import './status/FreezeEffect';
import './status/SleepEffect';
import './status/FearEffect';
import './status/ConfusionEffect';
import './status/FlinchEffect';
import './status/BindEffect';
import './status/FatigueEffect';

import { Logger } from '../../../../shared/utils';
import { EffectManager } from './core/EffectManager';

/**
 * 初始化效果系统
 * 这个函数会被自动调用，确保所有效果类被加载
 */
export function initializeEffects(): void {
  Logger.Info('[EffectLoader] 所有效果类已加载，装饰器已执行');
  
  // 现在初始化 EffectManager，此时所有效果类已经通过装饰器注册
  const manager = EffectManager.getInstance();
  manager.initialize();
  
  Logger.Info('[EffectLoader] 效果系统初始化完成');
}

// 自动执行初始化
initializeEffects();
