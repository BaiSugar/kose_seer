/**
 * 效果生成工具
 * 从 skills.xml 和 skill_effects.xml 中提取所有效果，生成对应的效果类文件
 */

import * as fs from 'fs';
import * as path from 'path';
import * as xml2js from 'xml2js';

interface SkillMove {
  $: {
    ID: string;
    Name: string;
    SideEffect?: string;
    SideEffectArg?: string;
  };
}

interface SkillsXml {
  MovesTbl: {
    Moves: Array<{
      Move: SkillMove[];
    }>;
  };
}

interface SkillEffectXml {
  NewSe: {
    NewSeIdx: Array<{
      $: {
        Idx: string;
        Eid: string;
        Stat?: string;
        Times?: string;
        Args?: string;
        Desc?: string;
        Des?: string;
      };
    }>;
  };
}

// Eid 到效果名称和分类的映射（完整的 40 个 Eid）
const EID_MAPPING: { [key: number]: { name: string; category: 'status' | 'stat' | 'damage' | 'special' } } = {
  // Eid 1-10
  1: { name: '免疫能力下降', category: 'stat' },
  2: { name: '免疫异常状态', category: 'status' },
  3: { name: '伤害减免', category: 'damage' },
  4: { name: '同系回复', category: 'damage' },
  5: { name: '属性限制', category: 'special' },
  6: { name: '反击异常', category: 'status' },
  7: { name: '命中率下降', category: 'stat' },
  8: { name: '固定暴击率', category: 'special' },
  9: { name: '爆发回复', category: 'special' },
  10: { name: '无限PP', category: 'special' },
  
  // Eid 11-20
  11: { name: '反弹伤害', category: 'damage' },
  12: { name: '特攻提升', category: 'stat' },
  13: { name: '自动逃跑', category: 'special' },
  14: { name: '天敌害怕', category: 'status' },
  15: { name: '天敌伤害减少', category: 'damage' },
  16: { name: 'HP能力绑定', category: 'stat' },
  17: { name: '低血暴击', category: 'special' },
  18: { name: '必中', category: 'special' },
  19: { name: '必先手', category: 'special' },
  20: { name: '技能免疫', category: 'special' },
  
  // Eid 21-30
  21: { name: '致死存活', category: 'special' },
  22: { name: '直伤提升', category: 'damage' },
  23: { name: '低血秒杀', category: 'special' },
  24: { name: '技能闪避', category: 'special' },
  25: { name: '死亡回复', category: 'special' },
  26: { name: '属性增强', category: 'stat' },
  27: { name: '属性顺序限制', category: 'special' },
  28: { name: '属性伤害提升', category: 'damage' },
  29: { name: '命中率提升', category: 'stat' },
  30: { name: '暴击率提升', category: 'special' },
  
  // Eid 31-40
  31: { name: '存活几率', category: 'special' },
  32: { name: '秒杀几率', category: 'special' },
  33: { name: '低血回复几率', category: 'special' },
  34: { name: '特攻降低', category: 'stat' },
  35: { name: '受击提升', category: 'stat' },
  36: { name: '属性轮换限制', category: 'special' },
  37: { name: '反击秒杀', category: 'special' },
  38: { name: '伤害提升', category: 'damage' },
  39: { name: '偶数伤害提升', category: 'damage' },
  40: { name: '奇数伤害降低', category: 'damage' },
};

async function analyzeSkills() {
  const skillsPath = path.join(__dirname, '../config/data/skills.xml');
  const effectsPath = path.join(__dirname, '../config/data/skill_effects.xml');
  
  const skillsXmlContent = fs.readFileSync(skillsPath, 'utf-8');
  const effectsXmlContent = fs.readFileSync(effectsPath, 'utf-8');
  
  const parser = new xml2js.Parser();
  const skillsResult: SkillsXml = await parser.parseStringPromise(skillsXmlContent);
  const effectsResult: SkillEffectXml = await parser.parseStringPromise(effectsXmlContent);
  
  // 构建 effectId -> eid 映射
  const effectIdToEid = new Map<number, { eid: number; args: string; desc: string }>();
  for (const effect of effectsResult.NewSe.NewSeIdx) {
    const idx = parseInt(effect.$.Idx);
    const eid = parseInt(effect.$.Eid);
    const args = effect.$.Args || '';
    const desc = effect.$.Desc || effect.$.Des || '';
    effectIdToEid.set(idx, { eid, args, desc });
  }
  
  const moves = skillsResult.MovesTbl.Moves[0].Move;
  
  // 统计效果使用情况（按 effectId）
  const effectStats = new Map<number, { 
    count: number; 
    skills: string[]; 
    args: Set<string>;
    eid?: number;
    eidName?: string;
    category?: string;
  }>();
  
  for (const move of moves) {
    const sideEffect = move.$.SideEffect;
    if (sideEffect) {
      const effectId = parseInt(sideEffect);
      const skillName = move.$.Name;
      const arg = move.$.SideEffectArg || '';
      
      if (!effectStats.has(effectId)) {
        const effectInfo = effectIdToEid.get(effectId);
        const eid = effectInfo?.eid;
        const eidInfo = eid !== undefined ? EID_MAPPING[eid] : undefined;
        
        effectStats.set(effectId, { 
          count: 0, 
          skills: [], 
          args: new Set(),
          eid,
          eidName: eidInfo?.name,
          category: eidInfo?.category
        });
      }
      
      const stat = effectStats.get(effectId)!;
      stat.count++;
      stat.skills.push(skillName);
      if (arg) stat.args.add(arg);
    }
  }
  
  // 按效果ID排序
  const sortedEffects = Array.from(effectStats.entries()).sort((a, b) => a[0] - b[0]);
  
  console.log('=== 技能效果统计 ===\n');
  console.log(`总共发现 ${sortedEffects.length} 个不同的效果ID (effectId)\n`);
  
  // 按 Eid 分类统计
  const eidStats = new Map<number, number>();
  for (const [, stat] of sortedEffects) {
    if (stat.eid !== undefined) {
      eidStats.set(stat.eid, (eidStats.get(stat.eid) || 0) + 1);
    }
  }
  
  console.log('=== 按 Eid 分类统计 ===');
  const sortedEids = Array.from(eidStats.entries()).sort((a, b) => a[0] - b[0]);
  for (const [eid, count] of sortedEids) {
    const eidInfo = EID_MAPPING[eid];
    const name = eidInfo ? `${eidInfo.name} (${eidInfo.category})` : '未知';
    console.log(`Eid ${eid.toString().padStart(3)}: ${name.padEnd(20)} - ${count} 个配置`);
  }
  
  // 详细列表
  console.log('\n=== 详细效果列表 (前50个) ===\n');
  for (const [effectId, stat] of sortedEffects.slice(0, 50)) {
    const eidInfo = stat.eid !== undefined ? `Eid=${stat.eid} ${stat.eidName || '未知'}` : '未映射';
    const category = stat.category ? `[${stat.category}]` : '[未知]';
    console.log(`效果ID ${effectId.toString().padStart(3)} ${category} ${eidInfo}`);
    console.log(`  使用次数: ${stat.count}`);
    console.log(`  技能示例: ${stat.skills.slice(0, 3).join(', ')}${stat.skills.length > 3 ? '...' : ''}`);
    if (stat.args.size > 0) {
      console.log(`  参数示例: ${Array.from(stat.args).slice(0, 3).join(', ')}`);
    }
    console.log('');
  }
  
  // 生成待实现列表
  console.log('\n=== 高优先级效果（使用次数 > 20）===\n');
  const implemented = [1, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 29]; // 已实现的 Eid
  const highPriority = sortedEffects
    .filter(([, stat]) => stat.count > 20 && stat.eid !== undefined && !implemented.includes(stat.eid))
    .sort((a, b) => b[1].count - a[1].count); // 按使用次数降序
  
  for (const [effectId, stat] of highPriority) {
    const eidInfo = stat.eidName || `Eid${stat.eid}`;
    const category = stat.category || 'unknown';
    console.log(`- [ ] 效果${effectId} (Eid=${stat.eid}): ${eidInfo} (${category}) - 使用${stat.count}次`);
  }
}

analyzeSkills().catch(console.error);
