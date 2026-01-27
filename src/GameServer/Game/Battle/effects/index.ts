/**
 * 战斗效果系统导出
 * 商业级技能效果架构
 * 
 * 使用 @Effect() 装饰器自动注册所有效果
 * 类似于 @Opcode 装饰器的自动注册机制
 */

// 核心系统
export * from './core/EffectContext';
export * from './core/BaseEffect';
export * from './core/EffectRegistry';
export * from './core/EffectDecorator';
export * from './core/EffectFactory';
export * from './core/EffectManager';
export * from './core/EffectResultBuilder';

// ==================== 重要：加载所有效果类 ====================
// 这个导入会强制执行所有效果类的装饰器
// 必须在其他导出之前执行
import './EffectLoader';

// 导入所有效果实现（触发装饰器执行）
// 这些导入会自动执行 @Effect() 装饰器，将效果注册到系统中
import './damage';
import './stat';
import './special';
import './status';

// 导出所有效果实现
export * from './damage';
export * from './stat';
export * from './special';
export * from './status';
