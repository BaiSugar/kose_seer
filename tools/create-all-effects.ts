/**
 * 批量创建所有效果类
 * 基于技能附加效果的 Eid 定义生成效果类文件
 * 注意：这里的 Eid 是技能附加效果，不是精灵特性（Spt）
 */

import * as fs from 'fs';
import * as path from 'path';

// 技能附加效果 Eid 定义（从 seer_skill_effects.lua 中提取）
const SKILL_EFFECT_EID_DEFINITIONS = [
  { eid: 1, name: 'Absorb', displayName: '吸血', category: 'damage', desc: '恢复造成伤害的一定比例HP' },
  { eid: 2, name: 'StatDown', displayName: '能力下降', category: 'stat', desc: '降低对方能力等级' },
  { eid: 3, name: 'StatUp', displayName: '能力提升', category: 'stat', desc: '提高自身能力等级' },
  { eid: 4, name: 'StatUp2', displayName: '能力提升2', category: 'stat', desc: '提高自身能力等级（变体）' },
  { eid: 5, name: 'StatDown2', displayName: '能力下降2', category: 'stat', desc: '降低对方能力等级（带概率）' },
  { eid: 6, name: 'Recoil', displayName: '反伤', category: 'damage', desc: '自身受到一定比例伤害' },
  { eid: 7, name: 'HPEqual', displayName: '同生共死', category: 'special', desc: '使对方HP变为与自己相同' },
  { eid: 8, name: 'Mercy', displayName: '手下留情', category: 'special', desc: '对方HP至少保留1' },
  { eid: 9, name: 'Rage', displayName: '愤怒', category: 'special', desc: '受到攻击后提升攻击力' },
  { eid: 10, name: 'Paralysis', displayName: '麻痹', category: 'status', desc: '使对方麻痹' },
  { eid: 11, name: 'Bind', displayName: '束缚', category: 'status', desc: '束缚效果，持续伤害' },
  { eid: 12, name: 'Burn', displayName: '烧伤', category: 'status', desc: '使对方烧伤' },
  { eid: 13, name: 'Poison', displayName: '中毒', category: 'status', desc: '使对方中毒' },
  { eid: 14, name: 'Bind2', displayName: '束缚2', category: 'status', desc: '束缚效果（变体）' },
  { eid: 15, name: 'Flinch', displayName: '畏缩', category: 'status', desc: '使对方畏缩' },
  { eid: 16, name: 'Freeze', displayName: '冰冻', category: 'status', desc: '使对方冰冻' },
  { eid: 17, name: 'Sleep', displayName: '睡眠', category: 'status', desc: '使对方睡眠' },
  { eid: 18, name: 'Fear', displayName: '害怕', category: 'status', desc: '使对方害怕' },
  { eid: 19, name: 'Confusion', displayName: '混乱', category: 'status', desc: '使对方混乱' },
  { eid: 20, name: 'Fatigue', displayName: '疲惫', category: 'status', desc: '下回合无法行动' },
  { eid: 21, name: 'Survive', displayName: '致死存活', category: 'special', desc: '受致命伤保留1HP' },
  { eid: 22, name: 'DamageModify', displayName: '伤害修正', category: 'damage', desc: '修正伤害值' },
  { eid: 23, name: 'InstantKill', displayName: '秒杀', category: 'special', desc: '低HP时一击必杀' },
  { eid: 28, name: 'TypeDamageUp', displayName: '属性伤害提升', category: 'damage', desc: 'XX系技能伤害增加n%' },
  { eid: 29, name: 'Flinch2', displayName: '畏缩2', category: 'status', desc: '使对方畏缩（变体）' },
  { eid: 30, name: 'Knockback', displayName: '击退', category: 'status', desc: '击退效果' },
  { eid: 31, name: 'MultiHit', displayName: '连续攻击', category: 'special', desc: '连续攻击2-5次' },
  { eid: 32, name: 'CritRateUp', displayName: '暴击提升', category: 'special', desc: '提高暴击率' },
  { eid: 33, name: 'PPReduce', displayName: '消化不良', category: 'special', desc: '减少对方技能PP' },
  { eid: 34, name: 'Encore', displayName: '克制', category: 'special', desc: '强制对方使用上次技能' },
  { eid: 35, name: 'Punishment', displayName: '惩罚', category: 'special', desc: '对方能力提升越多伤害越高' },
  { eid: 36, name: 'MustHit', displayName: '必中', category: 'special', desc: '技能必定命中' },
  { eid: 37, name: 'ComboAttack', displayName: '连击', category: 'special', desc: '连续攻击' },
  { eid: 38, name: 'Weakness', displayName: '虚弱', category: 'special', desc: '虚弱效果' },
  { eid: 39, name: 'DamageModify3', displayName: '伤害修正3', category: 'damage', desc: '伤害修正变体3' },
  { eid: 40, name: 'DamageModify4', displayName: '伤害修正4', category: 'damage', desc: '伤害修正变体4' },
];

// 生成效果类文件内容
function generateEffectFile(eid: number, name: string, displayName: string, category: string, desc: string): string {
  const timing = category === 'stat' ? 'AFTER_DAMAGE_APPLY' : 
                 category === 'status' ? 'AFTER_DAMAGE_APPLY' :
                 category === 'damage' ? 'BEFORE_DAMAGE_CALC' : 'BEFORE_DAMAGE_CALC';
  
  const className = `${name}Effect`;
  
  return `import { BaseEffect } from '../core/BaseEffect';
import { Effect } from '../core/EffectDecorator';
import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
import { EffectResultBuilder } from '../core/EffectResultBuilder';

/**
 * ${displayName}效果 (Eid=${eid})
 * ${desc}
 * 
 * 参数说明：
 * - 参见 skill_effects.xml 中的注释
 * 
 * 触发时机：${timing}
 */
@Effect()
export class ${className} extends BaseEffect {
  constructor() {
    super(
      ${eid},
      '${displayName}',
      [EffectTiming.${timing}]
    );
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const args = context.effectArgs;
    
    // TODO: 实现${displayName}效果逻辑
    // ${desc}
    // 参数: ${JSON.stringify(['待定'])}
    
    this.logEffect(\`${displayName}效果触发，参数: \${JSON.stringify(args)}\`);
    
    results.push(EffectResultBuilder.special(
      this.effectId,
      this.effectName,
      '${name.toLowerCase()}',
      'attacker',
      '${displayName}效果触发（待实现）'
    ));
    
    return results;
  }
}
`;
}

// 生成索引文件
function generateIndexFile(effects: typeof SKILL_EFFECT_EID_DEFINITIONS, category: string): string {
  const categoryEffects = effects.filter(e => e.category === category);
  const exports = categoryEffects.map(e => `export * from './${e.name}Effect';`).join('\n');
  return `/**
 * ${category} 效果导出
 * 自动生成
 */

${exports}
`;
}

// 主函数
function main() {
  const baseDir = path.join(__dirname, '../src/GameServer/Game/Battle/effects');
  
  // 按分类分组
  const grouped = SKILL_EFFECT_EID_DEFINITIONS.reduce((acc, effect) => {
    if (!acc[effect.category]) acc[effect.category] = [];
    acc[effect.category].push(effect);
    return acc;
  }, {} as Record<string, typeof SKILL_EFFECT_EID_DEFINITIONS>);
  
  let totalCreated = 0;
  let totalSkipped = 0;
  
  console.log('=== 开始批量创建技能附加效果类 ===\n');
  
  for (const [category, effects] of Object.entries(grouped)) {
    const categoryDir = path.join(baseDir, category);
    
    // 确保目录存在
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
      console.log(`📁 创建目录: ${category}/`);
    }
    
    console.log(`\n--- ${category.toUpperCase()} 分类 (${effects.length}个效果) ---`);
    
    // 生成效果文件
    for (const effect of effects) {
      const filePath = path.join(categoryDir, `${effect.name}Effect.ts`);
      
      // 跳过已存在的文件
      if (fs.existsSync(filePath)) {
        console.log(`⏭️  跳过: ${effect.name}Effect.ts (Eid=${effect.eid})`);
        totalSkipped++;
        continue;
      }
      
      const content = generateEffectFile(effect.eid, effect.name, effect.displayName, effect.category, effect.desc);
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ 创建: ${effect.name}Effect.ts (Eid=${effect.eid}) - ${effect.displayName}`);
      totalCreated++;
    }
    
    // 更新索引文件
    const indexPath = path.join(categoryDir, 'index.ts');
    const indexContent = generateIndexFile(effects, category);
    fs.writeFileSync(indexPath, indexContent, 'utf-8');
    console.log(`📦 更新: ${category}/index.ts`);
  }
  
  console.log(`\n=== 完成！===`);
  console.log(`✅ 创建: ${totalCreated} 个文件`);
  console.log(`⏭️  跳过: ${totalSkipped} 个文件`);
  console.log(`📊 总计: ${SKILL_EFFECT_EID_DEFINITIONS.length} 个技能附加效果`);
  
  console.log(`\n📝 下一步：`);
  console.log(`1. 运行 npm run build 检查编译`);
  console.log(`2. 参考 luvit/luvit_version/game/seer_skill_effects.lua 实现具体逻辑`);
  console.log(`3. 逐个实现高频使用的效果`);
  console.log(`\n💡 注意：这些是技能附加效果（SideEffect），不是精灵特性（Spt）`);
}

main();
