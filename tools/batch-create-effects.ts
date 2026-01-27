/**
 * 批量创建效果类文件
 * 优先创建使用频率最高的效果
 */

import * as fs from 'fs';
import * as path from 'path';

// 高优先级效果定义（使用次数 > 20）
const HIGH_PRIORITY_EFFECTS = [
  // 能力变化效果 (stat)
  { id: 2, name: 'StatBoost', displayName: '能力提升', category: 'stat', desc: '提升自身某项能力等级' },
  { id: 3, name: 'StatBoost2', displayName: '能力提升2', category: 'stat', desc: '提升自身某项能力等级（变体）' },
  { id: 4, name: 'StatReduce', displayName: '能力下降', category: 'stat', desc: '降低对方某项能力等级' },
  { id: 5, name: 'StatReduce2', displayName: '能力下降2', category: 'stat', desc: '降低对方某项能力等级（变体）' },
  
  // 特殊效果 (special) - 高频使用
  { id: 31, name: 'MultiHit', displayName: '连续攻击', category: 'special', desc: '连续攻击2-5次' },
  { id: 33, name: 'PPReduce', displayName: '消化不良', category: 'special', desc: '减少对方技能PP' },
  { id: 32, name: 'CritRateUp', displayName: '暴击提升', category: 'special', desc: '提高暴击率' },
  { id: 22, name: 'DamageModify', displayName: '伤害修正', category: 'damage', desc: '修正伤害值' },
  { id: 37, name: 'ComboAttack', displayName: '连击', category: 'special', desc: '连续攻击' },
  { id: 9, name: 'Rage', displayName: '愤怒', category: 'special', desc: '受到伤害后提升攻击力' },
  { id: 40, name: 'DamageModify4', displayName: '伤害修正4', category: 'damage', desc: '伤害修正变体4' },
  { id: 30, name: 'Knockback', displayName: '击退', category: 'status', desc: '击退效果' },
  { id: 21, name: 'Survive', displayName: '致死存活', category: 'special', desc: '受致命伤保留1HP' },
  { id: 35, name: 'Punishment', displayName: '惩罚', category: 'special', desc: '对方能力提升越多伤害越高' },
  
  // 未知但高频效果
  { id: 93, name: 'Effect93', displayName: '效果93', category: 'special', desc: '高频效果，待分析' },
  { id: 58, name: 'Effect58', displayName: '效果58', category: 'special', desc: '高频效果，待分析' },
  { id: 60, name: 'Effect60', displayName: '效果60', category: 'special', desc: '高频效果，待分析' },
  { id: 43, name: 'Effect43', displayName: '效果43', category: 'special', desc: '高频效果，待分析' },
  { id: 46, name: 'Effect46', displayName: '效果46', category: 'special', desc: '高频效果，待分析' },
  { id: 88, name: 'Effect88', displayName: '效果88', category: 'special', desc: '高频效果，待分析' },
  { id: 52, name: 'Effect52', displayName: '效果52', category: 'special', desc: '高频效果，待分析' },
  { id: 50, name: 'Effect50', displayName: '效果50', category: 'special', desc: '高频效果，待分析' },
];

// 生成效果类文件内容
function generateEffectFile(effect: typeof HIGH_PRIORITY_EFFECTS[0]): string {
  const timing = effect.category === 'stat' ? 'AFTER_DAMAGE_APPLY' : 'BEFORE_DAMAGE_CALC';
  
  return `import { BaseEffect } from '../core/BaseEffect';
import { Effect } from '../core/EffectDecorator';
import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
import { EffectResultBuilder } from '../core/EffectResultBuilder';

/**
 * ${effect.displayName}效果 (Eid=${effect.id})
 * ${effect.desc}
 * 
 * 参数说明：
 * - args[0]: 待实现
 * 
 * 触发时机：${timing}
 */
@Effect()
export class ${effect.name}Effect extends BaseEffect {
  constructor() {
    super(
      ${effect.id},
      '${effect.displayName}',
      [EffectTiming.${timing}]
    );
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const args = context.effectArgs;
    
    // TODO: 实现${effect.displayName}效果逻辑
    // 参数: ${JSON.stringify(args)}
    
    this.logEffect(\`${effect.displayName}效果触发，参数: \${JSON.stringify(args)}\`);
    
    results.push(EffectResultBuilder.special(
      this.effectId,
      this.effectName,
      '${effect.name.toLowerCase()}',
      'attacker',
      '${effect.displayName}效果触发（待实现）'
    ));
    
    return results;
  }
}
`;
}

// 生成索引文件
function generateIndexFile(effects: typeof HIGH_PRIORITY_EFFECTS): string {
  const exports = effects.map(e => `export * from './${e.name}Effect';`).join('\n');
  return `/**
 * ${effects[0].category} 效果导出
 * 自动生成，请勿手动修改
 */

${exports}
`;
}

// 主函数
function main() {
  const baseDir = path.join(__dirname, '../src/GameServer/Game/Battle/effects');
  
  // 按分类分组
  const grouped = HIGH_PRIORITY_EFFECTS.reduce((acc, effect) => {
    if (!acc[effect.category]) acc[effect.category] = [];
    acc[effect.category].push(effect);
    return acc;
  }, {} as Record<string, typeof HIGH_PRIORITY_EFFECTS>);
  
  let totalCreated = 0;
  
  for (const [category, effects] of Object.entries(grouped)) {
    const categoryDir = path.join(baseDir, category);
    
    // 确保目录存在
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    
    // 生成效果文件
    for (const effect of effects) {
      const filePath = path.join(categoryDir, `${effect.name}Effect.ts`);
      
      // 跳过已存在的文件
      if (fs.existsSync(filePath)) {
        console.log(`⏭️  跳过已存在: ${effect.name}Effect.ts`);
        continue;
      }
      
      const content = generateEffectFile(effect);
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ 创建: ${category}/${effect.name}Effect.ts (Eid=${effect.id})`);
      totalCreated++;
    }
    
    // 生成索引文件
    const indexPath = path.join(categoryDir, 'index.ts');
    const indexContent = generateIndexFile(effects);
    fs.writeFileSync(indexPath, indexContent, 'utf-8');
    console.log(`📦 更新索引: ${category}/index.ts\n`);
  }
  
  console.log(`\n🎉 完成！共创建 ${totalCreated} 个效果文件`);
  console.log(`\n📝 下一步：`);
  console.log(`1. 查看生成的文件并实现具体逻辑`);
  console.log(`2. 参考 Lua 源码或原始效果描述`);
  console.log(`3. 运行 npm run build 检查编译错误`);
}

main();
