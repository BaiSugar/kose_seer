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
import { SkillEffectsConfig } from '../../../shared/config/game/SkillEffectsConfig';
import { AtomicEffectFactory } from './effects/atomic/core/AtomicEffectFactory';
import { IAtomicEffectParams } from './effects/atomic/core/IAtomicEffect';

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
      Logger.Debug(`[EffectTrigger] 技能无副作用: ${skill.name} (ID=${skill.id})`);
      return [];
    }

    Logger.Debug(
      `[EffectTrigger] 触发技能效果: ${skill.name} (ID=${skill.id}), ` +
      `副作用=${skill.sideEffect}, 时机=${timing}`
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
      if (!effectConfig.timing || !effectConfig.timing.includes(timing)) {
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
        // 克隆原子配置，避免修改原始配置
        const atomConfigWithArgs = { ...atomConfig };
        
        // 根据效果配置的参数定义，覆盖原子效果的参数
        if (effectConfig.args && effectConfig.args.length > 0 && effectArgs.length > 0) {
          for (let i = 0; i < effectConfig.args.length && i < effectArgs.length; i++) {
            const argDef = effectConfig.args[i];
            const argValue = effectArgs[i];
            
            // 将参数值应用到原子效果配置
            // 例如：args[0].name = "probability" → atomConfig.probability = argValue
            if (argDef.name) {
              (atomConfigWithArgs as any)[argDef.name] = argValue;
            }
          }
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

      // 2. 按顺序处理每个效果
      for (let i = 0; i < effectIds.length; i++) {
        const effectId = effectIds[i];
        
        // 获取效果配置
        const effectConfig = SkillEffectsConfig.Instance.GetEffectById(effectId);
        if (!effectConfig) {
          Logger.Warn(`[EffectTrigger] 效果配置不存在: effectId=${effectId}`);
          continue;
        }

        // 检查是否有原子效果组合配置
        if (!effectConfig.atomicComposition || !effectConfig.atomicComposition.atoms) {
          Logger.Warn(`[EffectTrigger] 效果缺少原子组合配置: effectId=${effectId}, name=${effectConfig.name}`);
          continue;
        }

        // 检查触发时机
        if (!effectConfig.timing || !effectConfig.timing.includes(timing)) {
          // 效果时机不匹配，静默跳过
          continue;
        }

        // 创建效果上下文
        const context = createEffectContext(attacker, defender, skill.id, damage, timing);
        context.effectId = effectId;
        context.skillType = skill.type;
        context.skillCategory = skill.category;
        context.skillPower = skill.power;

        // 执行原子效果组合
        const atoms = effectConfig.atomicComposition.atoms;
        Logger.Debug(
          `[EffectTrigger] 效果 ${i + 1}/${effectIds.length}: ${effectConfig.name} (ID=${effectId}), ` +
          `原子数: ${atoms.length}`
        );

        for (const atomConfig of atoms) {
          const atom = AtomicEffectFactory.getInstance().create(atomConfig as IAtomicEffectParams);
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
   * 应用效果结果到战斗精灵
   * 
   * @param results 效果结果数组
   * @param attacker 攻击方
   * @param defender 防守方
   */
  public static ApplyEffectResults(
    results: IEffectResult[],
    attacker: IBattlePet,
    defender: IBattlePet
  ): void {
    for (const result of results) {
      if (!result.success) {
        continue;
      }

      const target = result.target === 'attacker' ? attacker : defender;

      // ==================== 效果免疫检查 ====================
      if (this.IsImmune(target, result)) {
        Logger.Info(`[效果应用] ${target.name} 免疫效果: ${result.type}`);
        continue;
      }

      switch (result.type) {
        case 'heal':
        case 'absorb':
          // 回复HP
          if (result.value && result.value > 0) {
            target.hp = Math.min(target.maxHp, target.hp + result.value);
            Logger.Info(`[效果应用] ${result.target} 回复 ${result.value} HP`);
          }
          break;

        case 'damage':
        case 'recoil':
          // 造成伤害
          if (result.value && result.value > 0) {
            target.hp = Math.max(0, target.hp - result.value);
            Logger.Info(`[效果应用] ${result.target} 受到 ${result.value} 点伤害`);
          }
          break;

        case 'status':
          // 应用状态效果
          if (result.data && result.data.status !== undefined) {
            if (!target.statusDurations) {
              target.statusDurations = new Array(20).fill(0);
            }
            target.statusDurations[result.data.status] = result.data.duration || 3;
            target.status = result.data.status;
            target.statusTurns = result.data.duration || 3;
            // Proxy 会自动同步 statusArray
            
            Logger.Info(
              `[效果应用] ${result.target} 进入状态: ${result.data.statusName}, ` +
              `持续 ${result.data.duration} 回合`
            );
          }
          break;

        case 'stat_change':
          // 能力等级变化
          if (result.data && result.data.stat !== undefined && result.data.stages !== undefined) {
            if (!target.battleLv) {
              target.battleLv = [0, 0, 0, 0, 0, 0];
            }
            const statIndex = result.data.stat;
            const oldStage = target.battleLv[statIndex] || 0;
            const newStage = Math.max(-6, Math.min(6, oldStage + result.data.stages));
            target.battleLv[statIndex] = newStage;
            
            // 如果有持续时间，记录到effectCounters
            if (result.data.duration && result.data.duration > 0) {
              if (!target.effectCounters) {
                target.effectCounters = {};
              }
              
              // 检查是否已有同类临时效果
              const counterKey = `stat_${statIndex}_boost_${result.data.stages}`;
              const existingKeys = Object.keys(target.effectCounters).filter(
                k => k.startsWith(`stat_${statIndex}_boost_`)
              );
              
              if (existingKeys.length > 0) {
                // 已有同类效果，根据叠加规则处理
                const stackRule = result.data.stackRule || 'refresh'; // 默认刷新持续时间
                
                if (stackRule === 'refresh') {
                  // 刷新持续时间，不叠加等级
                  target.effectCounters[existingKeys[0]] = result.data.duration;
                  Logger.Info(
                    `[效果应用] ${result.target} 刷新能力变化持续时间: ` +
                    `${this.GetStatName(statIndex)}, 持续${result.data.duration}回合`
                  );
                } else if (stackRule === 'stack') {
                  // 叠加效果（新增计数器）
                  target.effectCounters[counterKey] = result.data.duration;
                  Logger.Info(
                    `[效果应用] ${result.target} 叠加能力变化: ` +
                    `${this.GetStatName(statIndex)} ${result.data.stages > 0 ? '+' : ''}${result.data.stages}, ` +
                    `持续${result.data.duration}回合`
                  );
                } else if (stackRule === 'replace') {
                  // 替换旧效果
                  // 先恢复旧效果
                  for (const oldKey of existingKeys) {
                    const oldMatch = oldKey.match(/stat_\d+_boost_(-?\d+)/);
                    if (oldMatch) {
                      const oldStages = parseInt(oldMatch[1]);
                      target.battleLv[statIndex] = Math.max(-6, Math.min(6, target.battleLv[statIndex] - oldStages));
                    }
                    delete target.effectCounters[oldKey];
                  }
                  // 应用新效果（已在上面应用）
                  target.effectCounters[counterKey] = result.data.duration;
                  Logger.Info(
                    `[效果应用] ${result.target} 替换能力变化: ` +
                    `${this.GetStatName(statIndex)} ${result.data.stages > 0 ? '+' : ''}${result.data.stages}, ` +
                    `持续${result.data.duration}回合`
                  );
                }
              } else {
                // 没有同类效果，直接添加
                target.effectCounters[counterKey] = result.data.duration;
                Logger.Info(
                  `[效果应用] ${result.target} 能力变化（临时${result.data.duration}回合）: ` +
                  `${this.GetStatName(statIndex)} ${result.data.stages > 0 ? '+' : ''}${result.data.stages} ` +
                  `(${oldStage} → ${newStage})`
                );
              }
            } else {
              const statNames = ['攻击', '防御', '特攻', '特防', '速度', '命中'];
              const change = result.data.stages > 0 ? '提升' : '降低';
              Logger.Info(
                `[效果应用] ${result.target} ${statNames[statIndex]}${change} ` +
                `${Math.abs(result.data.stages)} 级 (${oldStage} → ${newStage})`
              );
            }
          }
          break;

        case 'multi_hit':
          // 连续攻击（在伤害计算时处理）
          Logger.Info(`[效果应用] 连续攻击 ${result.value} 次`);
          break;

        case 'hp_equal':
          // 同生共死
          defender.hp = attacker.hp;
          Logger.Info(`[效果应用] 同生共死: 对方HP变为 ${defender.hp}`);
          break;

        case 'mercy':
          // 手下留情
          if (defender.hp <= 0) {
            defender.hp = 1;
            Logger.Info(`[效果应用] 手下留情: 对方HP保留1点`);
          }
          break;

        case 'encore':
          // 克制
          if (result.data && result.data.turns) {
            defender.encore = true;
            defender.encoreTurns = result.data.turns;
            Logger.Info(`[效果应用] 克制: 对方被迫使用上次技能 ${result.data.turns} 回合`);
          }
          break;

        case 'pp_reduce':
          // 减少PP
          if (defender.lastMove && defender.skillPP) {
            const skillIndex = defender.skills.indexOf(defender.lastMove);
            if (skillIndex >= 0 && defender.skillPP[skillIndex]) {
              defender.skillPP[skillIndex] = Math.max(0, defender.skillPP[skillIndex] - 1);
              Logger.Info(`[效果应用] 减少对方技能PP`);
            }
          }
          break;

        default:
          // 跳过元数据/控制流类型（这些类型不需要实际应用）
          if (result.type === 'conditional' || result.type === 'fixed_damage') {
            // conditional: 条件判断结果，不需要应用
            // fixed_damage: 固定伤害已通过伤害计算流程应用
            break;
          }
          Logger.Debug(`[效果应用] 未处理的效果类型: ${result.type}`);
      }
    }
  }

  /**
   * 检查效果是否应该触发（概率判定）
   */
  public static ShouldTrigger(chance: number): boolean {
    return Math.random() * 100 < chance;
  }

  /**
   * 检查目标是否免疫效果
   */
  private static IsImmune(target: IBattlePet, result: IEffectResult): boolean {
    if (!target.immuneFlags) {
      return false;
    }

    // 免疫状态效果
    if (result.type === 'status' && target.immuneFlags.status) {
      return true;
    }

    // 免疫能力下降
    if (result.type === 'stat_change' && result.data?.stages < 0 && target.immuneFlags.statDown) {
      return true;
    }

    return false;
  }

  /**
   * 获取能力名称
   */
  private static GetStatName(statIndex: number): string {
    const statNames = ['攻击', '防御', '特攻', '特防', '速度', '命中'];
    return statNames[statIndex] || '未知';
  }
}
