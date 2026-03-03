/**
 * 技能效果触发器
 * 负责在战斗中触发和应用技能效果
 * 
 * 集成原子效果系统到战斗流程
 * 
 * 支持多效果技能：
 * - 单效果: SideEffect="4", SideEffectArg="0 100 1"
 * - 多效果: SideEffect="4 4 4", SideEffectArg="0 100 1 1 100 1 2 100 1"
 * 
 * 使用原子效果组合：
 * - 从 skill_effects_v2.json 读取 atomicComposition 配置
 * - 使用 AtomicEffectFactory 创建原子效果实例
 * - 执行原子效果组合并返回结果
 */

import { Logger } from '../../../shared/utils';
import { IBattlePet } from '../../../shared/models/BattleModel';
import { ISkillConfig } from '../../../shared/models/SkillModel';
import { EffectTiming, createEffectContext, IEffectResult } from './effects/core/EffectContext';
import { MatchesEffectTiming } from './effects/core/EffectTimingResolver';
import { SkillEffectsConfig } from '../../../shared/config/game/SkillEffectsConfig';
import { AtomicEffectFactory } from './effects/atomic/core/AtomicEffectFactory';
import { IAtomicEffectParams } from './effects/atomic/core/IAtomicEffect';
import { EffectApplicator } from './EffectApplicator';

/**
 * 效果触发器类
 */
export class EffectTrigger {

  /**
   * 触发技能的所有附加效果（支持多效果）
   * 
   * @param skill 技能配置
   * @param attacker 攻击方
   * @param defender 防守方
   * @param damage 造成的伤害
   * @param timing 触发时机
   * @returns 效果结果数组
   */
  public static TriggerSkillEffect(
    skill: ISkillConfig,
    attacker: IBattlePet,
    defender: IBattlePet,
    damage: number,
    timing: EffectTiming
  ): IEffectResult[] {
    // 如果技能没有附加效果，直接返回
    if (!skill.sideEffect || skill.sideEffect === 0) {
      return [];
    }

    // 只在INFO级别显示技能效果触发
    Logger.Info(
      `[技能效果] ${skill.name} 触发效果 (时机=${timing})`
    );

    // 检查是否为多效果技能
    const sideEffectStr = skill.sideEffect.toString();
    if (sideEffectStr.includes(' ')) {
      // 多效果技能
      return this.TriggerMultipleSkillEffects(skill, attacker, defender, damage, timing);
    } else {
      // 单效果技能
      return this.TriggerSingleSkillEffect(skill, attacker, defender, damage, timing);
    }
  }

  /**
   * 触发单个技能效果（使用原子效果组合）
   * 
   * @param skill 技能配置
   * @param attacker 攻击方
   * @param defender 防守方
   * @param damage 造成的伤害
   * @param timing 触发时机
   * @returns 效果结果数组
   */
  private static TriggerSingleSkillEffect(
    skill: ISkillConfig,
    attacker: IBattlePet,
    defender: IBattlePet,
    damage: number,
    timing: EffectTiming
  ): IEffectResult[] {
    const results: IEffectResult[] = [];

    try {
      const effectId = typeof skill.sideEffect === 'number' 
        ? skill.sideEffect 
        : parseInt(skill.sideEffect?.toString() || '0');

      // 1. 从新配置系统获取效果信息
      const effectConfig = SkillEffectsConfig.Instance.GetEffectById(effectId);
      if (!effectConfig) {
        Logger.Warn(`[EffectTrigger] 效果配置不存在: effectId=${effectId}`);
        return [];
      }

      // 2. 检查是否有原子效果组合配置
      if (!effectConfig.atomicComposition || !effectConfig.atomicComposition.atoms) {
        Logger.Warn(`[EffectTrigger] 效果缺少原子组合配置: effectId=${effectId}, name=${effectConfig.name}`);
        return [];
      }

      // 3. 检查是否在正确的时机触发
      if (!MatchesEffectTiming(effectConfig.timing, timing)) {
        // 效果时机不匹配，静默跳过
        return [];
      }

      // 4. 创建效果上下文
      const context = createEffectContext(attacker, defender, skill.id, damage, timing);
      context.effectId = effectId;
      context.skillType = skill.type;
      context.skillCategory = skill.category;
      context.skillPower = skill.power;

      // 5. 解析 SideEffectArg 参数
      const effectArgs = this.ParseEffectArgs(skill.sideEffectArg);
      context.effectArgs = effectArgs;

      // 6. 执行原子效果组合
      const atoms = effectConfig.atomicComposition.atoms;
      Logger.Debug(
        `[EffectTrigger] 执行原子效果组合: ${effectConfig.name} (ID=${effectId}), ` +
        `原子数: ${atoms.length}, 时机: ${timing}, 参数: ${effectArgs.join(',')}`
      );

      for (const atomConfig of atoms) {
        // 深度克隆原子配置，避免修改原始配置
        const atomConfigWithArgs = JSON.parse(JSON.stringify(atomConfig));

        // 根据效果配置的参数定义，覆盖原子效果的参数
        if (effectConfig.args && effectConfig.args.length > 0 && effectArgs.length > 0) {
          // 构建参数映射表
          const argMap: Record<string, number> = {};
          for (let i = 0; i < effectConfig.args.length && i < effectArgs.length; i++) {
            const argDef = effectConfig.args[i];
            const argValue = effectArgs[i];

            if (argDef.name) {
              // 将参数值应用到顶层原子效果配置
              (atomConfigWithArgs as any)[argDef.name] = argValue;
              argMap[argDef.name] = argValue;
            }
          }

          // 将参数传播到嵌套的 then/else 子效果中
          this.PropagateArgsToNestedAtoms(atomConfigWithArgs, argMap);
        }

        const atom = AtomicEffectFactory.getInstance().create(atomConfigWithArgs as IAtomicEffectParams);
        if (!atom) {
          Logger.Warn(`[EffectTrigger] 创建原子效果失败: type=${atomConfig.type}`);
          continue;
        }

        // 检查原子效果是否可以在当前时机触发
        if (!atom.canTriggerAt(timing)) {
          // 原子效果时机不匹配，静默跳过
          continue;
        }

        // 执行原子效果
        const atomResults = atom.execute(context);
        results.push(...atomResults);

        Logger.Debug(
          `[EffectTrigger] 原子效果执行: ${atom.name}, 结果数: ${atomResults.length}`
        );
      }

      if (results.length > 0) {
        Logger.Info(
          `[EffectTrigger] 效果执行成功: ${effectConfig.name} (ID=${effectId}), ` +
          `总结果数: ${results.length}`
        );
      }

    } catch (error) {
      Logger.Error(`[EffectTrigger] 单效果执行失败: ${error}`, error as Error);
    }

    return results;
  }

  /**
   * 触发多个技能效果（使用原子效果组合）
   * 
   * 示例：
   * SideEffect="4 4 4 4 4 4"
   * SideEffectArg="0 100 1 1 100 1 2 100 1 3 100 1 4 100 1 5 100 1"
   * 
   * @param skill 技能配置
   * @param attacker 攻击方
   * @param defender 防守方
   * @param damage 造成的伤害
   * @param timing 触发时机
   * @returns 效果结果数组
   */
  private static TriggerMultipleSkillEffects(
    skill: ISkillConfig,
    attacker: IBattlePet,
    defender: IBattlePet,
    damage: number,
    timing: EffectTiming
  ): IEffectResult[] {
    const allResults: IEffectResult[] = [];

    try {
      // 1. 解析多个效果ID
      const sideEffectStr = skill.sideEffect?.toString() || '';
      const effectIds = sideEffectStr.split(' ').map(id => parseInt(id.trim())).filter(id => id > 0);
      
      if (effectIds.length === 0) {
        return [];
      }

      Logger.Debug(
        `[EffectTrigger] 多效果技能: ${skill.name} (ID=${skill.id}), ` +
        `效果数: ${effectIds.length}, 时机: ${timing}`
      );

      // 2. 解析所有参数，按每个效果的argsNum分割
      const allArgs = this.ParseEffectArgs(skill.sideEffectArg);
      let argOffset = 0;

      // 3. 按顺序处理每个效果
      for (let i = 0; i < effectIds.length; i++) {
        const effectId = effectIds[i];

        // 获取效果配置
        const effectConfig = SkillEffectsConfig.Instance.GetEffectById(effectId);
        if (!effectConfig) {
          Logger.Warn(`[EffectTrigger] 效果配置不存在: effectId=${effectId}`);
          continue;
        }

        // 提取当前效果的参数
        const argsNum = effectConfig.argsNum || (effectConfig.args ? effectConfig.args.length : 0);
        const effectArgs = allArgs.slice(argOffset, argOffset + argsNum);
        argOffset += argsNum;

        // 检查是否有原子效果组合配置
        if (!effectConfig.atomicComposition || !effectConfig.atomicComposition.atoms) {
          Logger.Warn(`[EffectTrigger] 效果缺少原子组合配置: effectId=${effectId}, name=${effectConfig.name}`);
          continue;
        }

        // 检查触发时机
        if (!MatchesEffectTiming(effectConfig.timing, timing)) {
          // 效果时机不匹配，静默跳过
          continue;
        }

        // 创建效果上下文
        const context = createEffectContext(attacker, defender, skill.id, damage, timing);
        context.effectId = effectId;
        context.skillType = skill.type;
        context.skillCategory = skill.category;
        context.skillPower = skill.power;
        context.effectArgs = effectArgs;

        // 执行原子效果组合
        const atoms = effectConfig.atomicComposition.atoms;
        Logger.Debug(
          `[EffectTrigger] 效果 ${i + 1}/${effectIds.length}: ${effectConfig.name} (ID=${effectId}), ` +
          `原子数: ${atoms.length}, 参数: ${effectArgs.join(',')}`
        );

        for (const atomConfig of atoms) {
          // 深度克隆原子配置，避免修改原始配置
          const atomConfigWithArgs = JSON.parse(JSON.stringify(atomConfig));

          // 根据效果配置的参数定义，覆盖原子效果的参数
          if (effectConfig.args && effectConfig.args.length > 0 && effectArgs.length > 0) {
            const argMap: Record<string, number> = {};
            for (let j = 0; j < effectConfig.args.length && j < effectArgs.length; j++) {
              const argDef = effectConfig.args[j];
              const argValue = effectArgs[j];

              if (argDef.name) {
                (atomConfigWithArgs as any)[argDef.name] = argValue;
                argMap[argDef.name] = argValue;
              }
            }

            // 将参数传播到嵌套的 then/else 子效果中
            this.PropagateArgsToNestedAtoms(atomConfigWithArgs, argMap);
          }

          const atom = AtomicEffectFactory.getInstance().create(atomConfigWithArgs as IAtomicEffectParams);
          if (!atom) {
            Logger.Warn(`[EffectTrigger] 创建原子效果失败: type=${atomConfig.type}`);
            continue;
          }

          // 检查原子效果是否可以在当前时机触发
          if (!atom.canTriggerAt(timing)) {
            continue;
          }

          // 执行原子效果
          const atomResults = atom.execute(context);
          allResults.push(...atomResults);

          if (atomResults.length > 0) {
            Logger.Debug(
              `[EffectTrigger] 原子效果执行: ${atom.name}, 结果数: ${atomResults.length}`
            );
          }
        }
      }

      Logger.Info(
        `[EffectTrigger] 多效果技能执行完成: ${skill.name}, ` +
        `总结果数: ${allResults.length}`
      );

    } catch (error) {
      Logger.Error(`[EffectTrigger] 多效果执行失败: ${error}`, error as Error);
    }

    return allResults;
  }

  /**
   * 解析效果参数字符串
   * 
   * @param sideEffectArg 参数字符串或数字，例如 "10" 或 10 或 "2 5" 或 "0 100 1"
   * @returns 参数数组
   */
  private static ParseEffectArgs(sideEffectArg?: string | number): number[] {
    if (sideEffectArg === undefined || sideEffectArg === null) {
      return [];
    }

    try {
      // 如果是数字，直接返回单元素数组
      if (typeof sideEffectArg === 'number') {
        return [sideEffectArg];
      }

      // 如果是字符串，按空格分割
      const argStr = sideEffectArg.toString().trim();
      if (argStr === '') {
        return [];
      }

      return argStr.split(/\s+/).map(arg => {
        const num = parseInt(arg);
        return isNaN(num) ? 0 : num;
      });
    } catch (error) {
      Logger.Warn(`[EffectTrigger] 解析效果参数失败: ${sideEffectArg}`);
      return [];
    }
  }

  /**
   * 批量触发效果（用于多个时机）
   */
  public static TriggerMultipleEffects(
    skill: ISkillConfig,
    attacker: IBattlePet,
    defender: IBattlePet,
    damage: number,
    timings: EffectTiming[]
  ): IEffectResult[] {
    const allResults: IEffectResult[] = [];

    for (const timing of timings) {
      const results = this.TriggerSkillEffect(skill, attacker, defender, damage, timing);
      allResults.push(...results);
    }

    return allResults;
  }

  /**
   * 应用效果结果到战斗精灵（委托给 EffectApplicator）
   */
  public static ApplyEffectResults(
    results: IEffectResult[],
    attacker: IBattlePet,
    defender: IBattlePet
  ): void {
    EffectApplicator.Apply(results, attacker, defender);
  }

  /**
   * 检查效果是否应该触发（概率判定）
   */
  public static ShouldTrigger(chance: number): boolean {
    return EffectApplicator.ShouldTrigger(chance);
  }

  /**
   * 参数名到嵌套原子效果字段的映射
   * args中定义的name → 实际原子效果中的字段名
   */
  private static readonly ARG_FIELD_MAP: Record<string, string> = {
    'statIndex': 'stat',
    'level': 'change',
    'probability': 'value',
  };

  /**
   * 将参数传播到嵌套的 then/else 子效果中
   * 解决 conditional 包裹 stat_modifier 等场景下参数丢失的问题
   */
  private static PropagateArgsToNestedAtoms(atomConfig: any, argMap: Record<string, number>): void {
    const branches = ['then', 'else'];
    for (const branch of branches) {
      if (!Array.isArray(atomConfig[branch])) continue;
      for (const childAtom of atomConfig[branch]) {
        // 将参数应用到子效果，使用字段映射
        for (const [argName, argValue] of Object.entries(argMap)) {
          const fieldName = this.ARG_FIELD_MAP[argName] || argName;
          // 仅在子效果已有该字段时覆盖（避免污染不相关的原子效果）
          if (fieldName in childAtom) {
            childAtom[fieldName] = argValue;
          }
        }
        // 递归处理更深层的嵌套
        this.PropagateArgsToNestedAtoms(childAtom, argMap);
      }
    }
  }
}
