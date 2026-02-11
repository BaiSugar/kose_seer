/**
 * 战斗精灵代理
 * 使用 Proxy 自动同步状态字段，避免 status、statusTurns、statusArray、statusDurations 不一致
 * 
 * 自动同步规则：
 * 1. 设置 pet.status 时，自动更新 statusArray 和 statusDurations
 * 2. 设置 pet.statusTurns 时，自动更新对应的 statusArray 和 statusDurations
 * 3. 设置 pet.statusDurations[i] 时，自动更新 statusArray[i]
 * 4. 设置 pet.battleLevels[i] 时，自动同步到 battleLv[i]（协议字段）
 * 
 * 使用方法：
 * ```typescript
 * const pet = createBattlePetProxy(rawPet);
 * pet.status = 2;  // 自动同步 statusArray[2] 和 statusDurations[2]
 * ```
 */

import { IBattlePet, BattleStatus } from '../../../shared/models/BattleModel';
import { Logger } from '../../../shared/utils';

/**
 * 创建战斗精灵代理
 * 自动同步状态相关字段
 */
export function createBattlePetProxy(pet: IBattlePet): IBattlePet {
  // 初始化状态数组
  if (!pet.statusArray) {
    pet.statusArray = new Array(20).fill(0);
  }
  if (!pet.statusDurations) {
    pet.statusDurations = new Array(20).fill(0);
  }
  if (!pet.battleLv) {
    pet.battleLv = new Array(6).fill(0);
  }
  if (!pet.battleLevels) {
    pet.battleLevels = [0, 0, 0, 0, 0, 0];
  }

  // 创建 battleLevels 的 Proxy（监听数组元素修改，同步到 battleLv）
  const battleLevelsProxy = new Proxy(pet.battleLevels, {
    set(target: number[], index: string | symbol, value: any): boolean {
      const numIndex = typeof index === 'string' ? parseInt(index) : -1;

      if (numIndex >= 0 && numIndex < 6) {
        target[numIndex] = value;

        // 同步到 battleLv
        if (!pet.battleLv) {
          pet.battleLv = new Array(6).fill(0);
        }
        pet.battleLv[numIndex] = value;
        return true;
      }

      (target as any)[index] = value;
      return true;
    }
  });

  // 替换原始的 battleLevels
  pet.battleLevels = battleLevelsProxy;

  // 创建 statusDurations 的 Proxy（监听数组元素修改）
  const statusDurationsProxy = new Proxy(pet.statusDurations, {
    set(target: number[], index: string | symbol, value: any): boolean {
      const numIndex = typeof index === 'string' ? parseInt(index) : -1;
      
      // 如果是数组索引
      if (numIndex >= 0 && numIndex < 20) {
        target[numIndex] = value;
        
        // 同步到 statusArray
        if (!pet.statusArray) {
          pet.statusArray = new Array(20).fill(0);
        }
        pet.statusArray[numIndex] = value;
        
        // 只在有实际状态变化时记录日志
        if (value > 0) {
          Logger.Debug(`[BattlePetProxy] statusDurations[${numIndex}] = ${value}, 已同步到 statusArray`);
        }
        return true;
      }
      
      // 其他属性直接设置
      (target as any)[index] = value;
      return true;
    }
  });

  // 替换原始的 statusDurations
  pet.statusDurations = statusDurationsProxy;

  // 创建精灵对象的 Proxy（监听 status 和 statusTurns）
  return new Proxy(pet, {
    set(target: IBattlePet, prop: string | symbol, value: any): boolean {
      // 拦截 status 设置
      if (prop === 'status') {
        const oldStatus = target.status;
        target.status = value;

        // 初始化数组
        if (!target.statusArray) {
          target.statusArray = new Array(20).fill(0);
        }
        if (!target.statusDurations) {
          target.statusDurations = new Array(20).fill(0);
        }

        // 清除旧状态
        if (oldStatus !== undefined && oldStatus >= 0 && oldStatus < 20) {
          target.statusArray[oldStatus] = 0;
          target.statusDurations[oldStatus] = 0;
        }

        // 设置新状态
        if (value !== undefined && value >= 0 && value < 20) {
          const duration = target.statusTurns || 3;
          target.statusArray[value] = duration;
          target.statusDurations[value] = duration;
          
          Logger.Debug(
            `[BattlePetProxy] status = ${value}, 已同步到 statusArray[${value}] = ${duration}`
          );
        } else if (value === undefined || value === BattleStatus.NONE) {
          // 清除所有状态
          target.statusArray.fill(0);
          target.statusDurations.fill(0);
          target.statusTurns = 0;
          
          Logger.Debug(`[BattlePetProxy] status = undefined, 已清除所有状态`);
        }

        return true;
      }

      // 拦截 statusTurns 设置
      if (prop === 'statusTurns') {
        target.statusTurns = value;

        // 如果有当前状态，同步持续时间
        if (target.status !== undefined && target.status >= 0 && target.status < 20) {
          if (!target.statusArray) {
            target.statusArray = new Array(20).fill(0);
          }
          if (!target.statusDurations) {
            target.statusDurations = new Array(20).fill(0);
          }

          target.statusArray[target.status] = value;
          target.statusDurations[target.status] = value;
          
          Logger.Debug(
            `[BattlePetProxy] statusTurns = ${value}, 已同步到 statusArray[${target.status}]`
          );
        }

        return true;
      }

      // 拦截 statusArray 设置（整个数组替换）
      if (prop === 'statusArray') {
        target.statusArray = value;
        
        // 同步到 statusDurations
        if (Array.isArray(value)) {
          if (!target.statusDurations) {
            target.statusDurations = new Array(20).fill(0);
          }
          for (let i = 0; i < Math.min(value.length, 20); i++) {
            target.statusDurations[i] = value[i];
          }
          
          // 只在有非零值时记录日志
          const hasNonZero = value.some(v => v > 0);
          if (hasNonZero) {
            Logger.Debug(`[BattlePetProxy] statusArray 已替换，已同步到 statusDurations`);
          }
        }
        
        return true;
      }

      // 拦截 statusDurations 设置（整个数组替换）
      if (prop === 'statusDurations') {
        // 创建新的 Proxy 数组
        const newProxy = new Proxy(value, {
          set(arrTarget: number[], index: string | symbol, arrValue: any): boolean {
            const numIndex = typeof index === 'string' ? parseInt(index) : -1;
            
            if (numIndex >= 0 && numIndex < 20) {
              arrTarget[numIndex] = arrValue;
              
              if (!target.statusArray) {
                target.statusArray = new Array(20).fill(0);
              }
              target.statusArray[numIndex] = arrValue;
              
              // 只在有实际状态变化时记录日志
              if (arrValue > 0) {
                Logger.Debug(`[BattlePetProxy] statusDurations[${numIndex}] = ${arrValue}, 已同步到 statusArray`);
              }
              return true;
            }
            
            (arrTarget as any)[index] = arrValue;
            return true;
          }
        });
        
        target.statusDurations = newProxy;
        
        // 同步到 statusArray
        if (Array.isArray(value)) {
          if (!target.statusArray) {
            target.statusArray = new Array(20).fill(0);
          }
          for (let i = 0; i < Math.min(value.length, 20); i++) {
            target.statusArray[i] = value[i];
          }
          
          // 只在有非零值时记录日志
          const hasNonZero = value.some((v: number) => v > 0);
          if (hasNonZero) {
            Logger.Debug(`[BattlePetProxy] statusDurations 已替换，已同步到 statusArray`);
          }
        }
        
        return true;
      }

      // 拦截 battleLevels 设置（整个数组替换）
      if (prop === 'battleLevels') {
        target.battleLevels = value;

        // 同步到 battleLv
        if (Array.isArray(value)) {
          if (!target.battleLv) {
            target.battleLv = new Array(6).fill(0);
          }
          for (let i = 0; i < Math.min(value.length, 6); i++) {
            target.battleLv[i] = value[i];
          }
        }

        // 创建 Proxy 监听数组元素修改
        const blProxy = new Proxy(value, {
          set(arrTarget: number[], index: string | symbol, arrValue: any): boolean {
            const numIndex = typeof index === 'string' ? parseInt(index) : -1;

            if (numIndex >= 0 && numIndex < 6) {
              arrTarget[numIndex] = arrValue;

              // 同步到 battleLv
              if (!target.battleLv) {
                target.battleLv = new Array(6).fill(0);
              }
              target.battleLv[numIndex] = arrValue;
              return true;
            }

            (arrTarget as any)[index] = arrValue;
            return true;
          }
        });

        target.battleLevels = blProxy;
        return true;
      }

      // 其他属性直接设置
      (target as any)[prop] = value;
      return true;
    }
  });
}

/**
 * 手动同步状态数组（用于已存在的对象）
 * 如果对象已经是 Proxy，此方法会自动触发同步
 */
export function syncBattlePetStatus(pet: IBattlePet): void {
  // 初始化数组
  if (!pet.statusArray) {
    pet.statusArray = new Array(20).fill(0);
  }
  if (!pet.statusDurations) {
    pet.statusDurations = new Array(20).fill(0);
  }

  // 清空所有状态
  pet.statusArray.fill(0);
  pet.statusDurations.fill(0);

  // 如果有主要状态，设置对应位置的持续时间
  if (pet.status !== undefined && pet.status >= 0 && pet.status < 20) {
    const duration = pet.statusTurns || 3;
    pet.statusArray[pet.status] = duration;
    pet.statusDurations[pet.status] = duration;
  }

  Logger.Debug(`[BattlePetProxy] 手动同步状态: status=${pet.status}, turns=${pet.statusTurns}`);
}
