/**
 * 閻炴凹鍋勬慨鈺呮偋鐟欏嫧鍋撹婢х晫鎮扮仦鑺ョ彜
 *
 * 閻忓繐鎸砄SS閻炴凹鍋勬慨鈺呮偋鐟欏嫧鍋撹缁儤绋夐埀顒勫箳閵夈儱寮抽柟瀛樕戦弸鐔煎极閸喓浜紒鐙呯磿閸ゅ酣鏁?
 * - 闁瑰灈鍋撻柤瀹犲Г閺呫儵寮稿鍛殸 EffectTrigger 濞?skill.sideEffect 濡炵懓宕慨?
 * - 閻炴凹鍋勬慨鈺呮偋鐟欏嫧鍋撹閺?PassiveEffectRunner 濞?pet.effectCounters 濡炵懓宕慨?
 * - 濞戞挶鍊涢埀顒€鎳庨崣锟犳偨?AtomicEffectFactory 闁圭瑳鍡╂斀闁告鍠庨悺娆撳极閸喓浜?
 *
 * 閻熸瑱绠戣ぐ鍌炲棘閻熸壆纭€闁?
 * - BattleEffectIntegration 闁革负鍔嶉惁鈩冪▔椤忓懏顦ч柡鍫ョ細閻ㄧ喖鎮?TriggerAtTiming()
 * - PassiveEffectRunner 闂侇剙绉村鑽ゅ垝閸撗傜触闂婎剦鍋傜粭鍌氣枖閵娿儱鏂€闁汇劌瀚～锕傚礉閵娧冾棗闁?
 * - 闁告牕缍婇崢銈夊籍閼稿灚绨?+ 閻熸瑦甯熸竟濠囧级閳ュ弶顐介柛姘嚱缁辨繈鏌呭宕囩畺闁告鍠庨悺娆撳极閸喓浜€规悶鍎卞鍫曞箥瑜戦、?
 */

import { Logger } from '../../../shared/utils';
import { IBattlePet } from '../../../shared/models/BattleModel';
import { ISkillConfig } from '../../../shared/models/SkillModel';
import { EffectTiming, IEffectContext, IEffectResult, createEffectContext } from './effects/core/EffectContext';
import { ResolveEffectTimings } from './effects/core/EffectTimingResolver';
import { AtomicEffectFactory } from './effects/atomic/core/AtomicEffectFactory';
import { IAtomicEffectParams } from './effects/atomic/core/IAtomicEffect';
import { SkillEffectsConfig } from '../../../shared/config/game/SkillEffectsConfig';
import { IAbilityEntry } from './BossAbility/BossAbilityConfig';

// ==================== 闁规亽鍎辫ぐ娑氣偓瑙勭煯缁?====================

/**
 * 婵炲鍔岄崬浠嬪捶閵娧呯勘闁诲繋绲婚棅鈺傜▔婵犲嫭鐣遍悶姘煎亜婵晠鎮х憴鍕ㄥ亾?
 */
export interface IRegisteredPassive {
  effectId: number;             // 闁绘顫夐埀顒夋箟D (濠?1902, 1904)
  name: string;                 // 闁绘顫夐埀顑啯鍊崇紒?
  timings: EffectTiming[];      // 閻熸瑱绠戣ぐ鍌炲籍閼稿灚绨氶柛鎺擃殙閵?
  role: PassiveRole;            // 閻熸瑱绠戣ぐ鍌滄喆閹烘洖顥忛柡澶嗏偓鍙夘偨
  atoms: IAtomicEffectParams[]; // 闁告鍠庨悺娆撳极閸喓浜梺鏉跨Ф閻?
  argValues: number[];          // 鐎规瓕灏闁哄鍔楀▓鎴﹀矗閸屾稒娈堕柛?
  immuneFlags?: IImmuneFlags;   // 闁稿繐绉堕弻鍛村冀閸ヮ亶鍞堕柨娑樼墕閸ㄥ灚鎱ㄧ€ｎ亜顕ч柡鍐╂构缁旀潙鈻庨埄鍐ｅ亾瑜戦鏇犵磾椤曞棛绀?
}

/**
 * 閻炴凹鍋勬慨鈺呮偋鐟欏嫧鍋撹濞堟垹鎲撮幒鏇烆棌闁哄鈧弶顐?
 * - attacker: 濞寸姴鎳庣紞瀣偋鐟欏嫧鍋撹鐎垫棃寮垫径搴樺亾閸涱喗笑闁衡偓鐠囨彃姣婇柡鍌濐潐濡炲倻鎲撮敃鈧ぐ鍌炴晬閸繍娲ら煫鍥ф噸閼垫垿濡存担瑙勭樄闁告垹绮ぐ渚€宕￠崶椋庣
 * - defender: 濞寸姴鎳庣紞瀣偋鐟欏嫧鍋撹鐎垫棃寮垫径搴樺亾閸涱喗笑闂傚啯褰冮悾褔寮憴鍕槯閻熸瑱绠戣ぐ鍌炴晬閸繍娲ゅù绗哄€曢濠囧礄韫囨挸甯抽柕鍡曠瀵棄顕ｉ惂鍝ョ
 * - any: 闁哄啰濮鹃鎴﹀绩鐠囪尙鏆撻梺顔尖偓鐔滄洟宕ｉ幋顖滅濠碘€冲€归惁锟犲炊閻愬弶鍊ら柛銉у仩椤㈠懘濡存担绋垮赋闁汇値鍋嗙悮顐︽晬?
 */
export type PassiveRole = 'attacker' | 'defender' | 'any';

/**
 * 闁稿繐绉堕弻鍛村冀閸ヮ亶鍞?
 */
export interface IImmuneFlags {
  statDown?: boolean;     // 闁稿繐绉堕弻鍛存嚄閽樺顫斿☉鎾愁儔濡?
  status?: boolean;       // 闁稿繐绉堕弻鍛嚕閸屾氨鍩楅柣妯垮煐閳?
}

/**
 * 閻炴凹鍋勬慨鈺呮偋鐟欏嫧鍋撹琚濋柛娆愬灣缁楀倹绋夌€ｎ偅鐎?
 */
export interface IPassiveTriggerContext {
  attacker: IBattlePet;
  defender: IBattlePet;
  skill?: ISkillConfig;
  damage?: number;
  turn?: number;
}

// ==================== 閻庢稒锚閸嬪秹鏌?====================

export const REGISTERED_PASSIVES_KEY = '_registered_passives';

// ==================== 闁哄秶顭堢缓鍓х尵?====================

/**
 * 閻炴凹鍋勬慨鈺呮偋鐟欏嫧鍋撹婢х晫鎮扮仦鑺ョ彜
 */
export class PassiveEffectRunner {

  /**
   * 濞戞捁娅ｇ花鍧楁倶閸偅鏆堥柛鎰焷椤箓宕濋妸褍顥楅柟?
   *
   * 濞?skill_effects_v2.json 閻犲洩顕цぐ鍥偋鐟欏嫧鍋撹閸樸倗绱旈鍡欑閻熸瑱绲鹃悗鑺ョ▔閸濆嫬鏂ч悗娑欏姈閺呫儵寮稿鍛煁闁告艾鐗炵槐?
   * 閻庢稒锚閸嬪秹宕烽妸褏缈遍柣蹇曟暩濞?effectCounters 濞戞搩鍘归埀?
   * 闁衡偓椤栨稑鐦梺顐ｄ亢缁?IAbilityEntry.args 閻熸洖妫涘ú濠冾渶濡鍚囬柛娆忓€归弳鐔煎Υ?
   *
   * 閻庣敻鈧稓鑹鹃柛蹇撶Ф閺屽懐鐚鹃懡銈咁棗闁诡儸宥囩闁告艾鏈鍌滄媼閸撗呮瀭 immuneFlags 濞寸姰鍎扮欢浣冪疀椤愶腹鍋撻悢宄扮伈闁哄偆鍘归埀?
   */
  public static RegisterPassives(pet: IBattlePet, abilityEntries: IAbilityEntry[]): void {
    if (!pet.effectCounters) {
      pet.effectCounters = {};
    }
    if (!pet.immuneFlags) {
      pet.immuneFlags = {};
    }

    const passives: IRegisteredPassive[] = [];

    for (const entry of abilityEntries) {
      const passive = this.BuildPassiveFromConfig(entry.id, entry.args);
      if (!passive) continue;

      passives.push(passive);

      // 闁稿繐绉堕弻鍛尵閼姐倕顥楅柟顑秶绐楅悹浣稿⒔閻?immuneFlags 闊浂鍋婇埀顒傚枑閻栵絿鎷?
      if (passive.immuneFlags) {
        if (passive.immuneFlags.statDown) {
          pet.immuneFlags.statDown = true;
        }
        if (passive.immuneFlags.status) {
          pet.immuneFlags.status = true;
        }
      }

      Logger.Info(
        `[PassiveEffectRunner] Register passive: ${pet.name} - ${passive.name} ` +
        `(ID=${entry.id}, timing=[${passive.timings.join(',')}], role=${passive.role})`
      );
    }

    pet.effectCounters[REGISTERED_PASSIVES_KEY] = passives;

    Logger.Info(
      `[PassiveEffectRunner] ${pet.name} total registered passives: ${passives.length}`
    );
  }

  /**
   * 闁革负鍔嶇€垫氨鈧纰嶅鍌炲嫉妤﹀晝鏇㈠矗閹寸姷缈遍柣蹇曟暩濞堟垿骞嶉埀顒勫嫉婢跺﹤鐖遍梺鏉跨Х椤箓宕濋妸褍顥楅柟?
   *
   * @param owner 閻炴凹鍋勬慨鈺呮偋鐟欏嫧鍋撹鐎垫棃寮垫径搴樺亾?
   * @param opponent 閻庝絻顫夋晶?
   * @param timing 鐟滅増鎸告晶鐘垫喆閿曗偓瑜板倿寮懜鍨皻
   * @param ctx 閻熸瑱绠戣ぐ鍌涚▔婵犱胶鐟撻柡鍌氭祫缁辨瑩宕犻崨顓熷創闁衡偓鐠囪尙鏆撻柛蹇撶－闁挳濡存担鐟拔楅柤鍐差潟閳ь兛妞掑┑鈧悗鐟扮－閻℃垿鏁?
   * @returns 闁轰礁鐗婇悘澶岀磼閹惧浜柡浣瑰缁?
   */
  public static TriggerAtTiming(
    owner: IBattlePet,
    opponent: IBattlePet,
    timing: EffectTiming,
    ctx: IPassiveTriggerContext
  ): IEffectResult[] {
    const passives = this.GetRegisteredPassives(owner);
    if (passives.length === 0) return [];

    const results: IEffectResult[] = [];

    // 闁告帇鍊栭弻?owner 闁革负鍔岀紞瀣礈瀹ュ棙鏆伴柛鎴ｎ唺閼垫垿鎯冮崟顕呮健闁?
    const isOwnerAttacker = (owner === ctx.attacker);

    for (const passive of passives) {
      // 1. 闁哄啳鍩栧┃鈧柛鏍х秺閸?
      if (!passive.timings.includes(timing)) continue;

      // 2. 閻熸瑦甯熸竟濠囧礌瑜版帒甯?
      if (passive.role === 'attacker' && !isOwnerAttacker) continue;
      if (passive.role === 'defender' && isOwnerAttacker) continue;

      // 3. 闁哄瀚紓鎾诲极閸喓浜☉鎾筹梗缁楀懘寮?
      const effectContext = createEffectContext(
        ctx.attacker,
        ctx.defender,
        ctx.skill?.id || 0,
        ctx.damage || 0,
        timing
      );
      effectContext.turn = ctx.turn || 0;
      effectContext.effectId = passive.effectId;
      effectContext.skillType = ctx.skill?.type || 0;
      effectContext.skillCategory = ctx.skill?.category || 0;
      effectContext.skillPower = ctx.skill?.power || 0;
      effectContext.effectArgs = passive.argValues;

      // 4. 闁圭瑳鍡╂斀闁告鍠庨悺娆撳极閸喓浜?
      const passiveResults = this.ExecuteAtoms(passive, effectContext);
      results.push(...passiveResults);
    }

    return results;
  }

  /**
   * 婵☆偀鍋撻柡灞诲劤缁ㄥ潡鎮橀崹顐Ｐ﹂柛姘鹃檮濠€浣割啅閸欏鏆堥柛鎰灱濞堟垹鎮銏犘楅柣妤勵潐閳?
   */
  public static HasPassives(pet: IBattlePet): boolean {
    const passives = this.GetRegisteredPassives(pet);
    return passives.length > 0;
  }

  /**
   * 婵炴挸鎳愰幃濠勫垝閸撗傜触濞戞挸锕﹀▓鎴﹀箥閳ь剟寮垫径搴蕉闁告柣鍔庢竟鎺楀箑?
   */
  public static CleanupPassives(pet: IBattlePet): void {
    if (pet.effectCounters) {
      delete pet.effectCounters[REGISTERED_PASSIVES_KEY];
    }
    if (pet.immuneFlags) {
      pet.immuneFlags = {};
    }

    Logger.Debug(`[PassiveEffectRunner] Cleanup passives: ${pet.name}`);
  }

  // ==================== 闁告劕鎳橀崕鎾棘鐟欏嫮銆?====================

  /**
   * 闁兼儳鍢茶ぐ鍥╁垝閸撗傜触闂婎剦鍋傜粭鍌氣枖閵娿儱鏂€闁汇劌瀚～锕傚礉閵娧冾棗闁诡儸鍐ㄧ仚閻?
   */
  private static GetRegisteredPassives(pet: IBattlePet): IRegisteredPassive[] {
    if (!pet.effectCounters || !pet.effectCounters[REGISTERED_PASSIVES_KEY]) {
      return [];
    }
    return pet.effectCounters[REGISTERED_PASSIVES_KEY] as IRegisteredPassive[];
  }

  /**
   * 濞?JSON 闂佹澘绉堕悿鍡涘几閸曨偆绱﹀☉鎾亾濞戞搩浜ｉ～锕傚礉閵娧冾棗闁?
   *
   * @param abilityId 闁绘顫夐埀顒夋箟D
   * @param overrideArgs 閻熸洖妫涘ú濠囧矗閸屾稒娈堕柨娑樼墛濞肩敻鎳?boss_abilities.json闁?
   */
  private static BuildPassiveFromConfig(abilityId: number, overrideArgs?: number[]): IRegisteredPassive | null {
    const config = SkillEffectsConfig.Instance.GetEffectById(abilityId);
    if (!config) {
      Logger.Warn(`[PassiveEffectRunner] Passive config not found: ${abilityId}`);
      return null;
    }

    const passiveCompat = (config as any).passiveCompat;
    if (config.category !== 'passive' && !passiveCompat?.enabled) {
      Logger.Warn(`[PassiveEffectRunner] Effect is not passive: ${abilityId} (category=${config.category})`);
      return null;
    }

    // 閻熸瑱绲鹃悗鐣屾喆閿曗偓瑜板倿寮懜鍨皻
    const timings = this.ParseTimings((passiveCompat?.timing || config.timing || []) as string[]);
    if (timings.length === 0) {
      Logger.Warn(`[PassiveEffectRunner] Passive has no valid timings: ${abilityId}`);
      return null;
    }

    // 閻熸瑱绲鹃悗鐣屾喆閹烘洖顥忛柡澶嗏偓鍙夘偨
    const passiveConfig = (config as any).passiveConfig;
    const role: PassiveRole = passiveCompat?.role || passiveConfig?.role || this.InferRole(config);

    // 閻熸瑱绲鹃悗浠嬪礂瀹ュ洦鐒婚柡宥呮穿椤?
    const immuneFlags = this.ParseImmuneFlags(config);

    // 閻熸瑱绲鹃悗浠嬪储閻旈鎽嶉柡浣哥墛閻忓鏌婂鍥╂瀭
    const atoms = this.ParseAtoms(config);

    // 閻熸瑱绲鹃悗浠嬪矗閸屾稒娈堕柛濠勩€嬬槐妾晇errideArgs 濞村吋锚閸樻稒绂嶆惔銊у笡閻犱降鍊曢埀顒傘€嬬槐?
    const argValues = this.ResolveArgValues(config, overrideArgs);

    return {
      effectId: abilityId,
      name: config.name,
      timings,
      role,
      atoms,
      argValues,
      immuneFlags: immuneFlags || undefined
    };
  }

  /**
   * 閻熸瑱绲鹃悗鐣屾喆閿曗偓瑜板倿寮懜鍨皻閻庢稒顨堥浣圭▔闊叀绀嬮柡瀣煯婵?
   */
  private static ParseTimings(timingStrs: string[]): EffectTiming[] {
    return ResolveEffectTimings(timingStrs);
  }

  /**
   * 闁哄秷顫夊畵渚€鎮х憴鍕ㄥ亾瑜忕悮顐﹀垂鐎ｎ偄鑵归柡鍌ゅ弨椤鎳濋崣澶嬭拫濞?
   *
   * 濠碘€冲€归悘?JSON 濞戞搩鍘介惀鍛村嫉婢跺鈻旂€殿喖绻橀崢銈囩磾?passiveConfig.role闁?
   * 闁告帗鐟﹂悧鎾箲椤斿晝鏇㈠矗閹寸偞顦ч柡鍫濇惈閹蜂即宕㈤悢椋庢憤闁轰礁鐗婇悘澶岀尵鐠囪尙鈧兘骞掗妸锔界劷闁?
   * - AFTER_DAMAGE_CALC / BEFORE_DAMAGE_APPLY + 濞寸鍊曢濠囧礄韫囨挸甯?闁告艾鎲￠弫?闁?defender
   * - BEFORE_CRIT_CHECK / BEFORE_HIT_CHECK + 闁告稒鍨濋懙?闁哄棙娼欓崵顔芥櫠閻愭彃顫?闁?attacker
   * - TURN_START / TURN_END 闁?any
   * - BATTLE_START 闁?any
   */
  private static InferRole(config: any): PassiveRole {
    const timings: EffectTiming[] = ResolveEffectTimings(config.timing || []);

    // 闁搞儳鍋涢幃?闁瑰瓨蓱閺嬬喓鐥閸╁棝鎯冮崟顒侇槯闁哄牏灏ㄧ槐婵囩▔瀹ュ懎闅橀柛鎺戞閺佸墽鈧?
    if (timings.includes(EffectTiming.TURN_START) ||
        timings.includes(EffectTiming.TURN_END) ||
        timings.includes(EffectTiming.BATTLE_START)) {
      return 'any';
    }

    // 濞寸鍊曢濠勬媼閿涘嫮鏆柣鈺冾焾閸櫻囨儍閸曨剚顦ч柡鍫㈠皑缁辨繂螞閳ь剟寮婚妷銉ュ緮濞达絾鎸婚弲銉╁几?
    const atoms = config.atomicComposition?.atoms || [];
    for (const atom of atoms) {
      const type = atom.type;
      const specialType = atom.specialType;

      // 闁告垵绻嬪┑鈧?闁告艾鎲￠弫?闁告瑥绉撮懘?闁?defender
      if (specialType === 'damage_reduction_passive' ||
          specialType === 'same_type_absorb' ||
          specialType === 'type_immunity' ||
          type === 'reflect') {
        return 'defender';
      }

      // 闁哄棙娼欓崵?闁告稒鍨濋懙?濠电偘绀佹慨?濠⒀呭仜瀹?闁?attacker
      if (type === 'crit_modifier' ||
          type === 'accuracy_modifier' ||
          type === 'power_modifier' ||
          type === 'priority_modifier') {
        return 'attacker';
      }
    }

    return 'any';
  }

  /**
   * 閻熸瑱绲鹃悗浠嬪礂瀹ュ洦鐒婚柡宥呮穿椤?
   */
  private static ParseImmuneFlags(config: any): IImmuneFlags | null {
    // 濞村吋锚閸樻稒鎷呯捄銊︽殢闁哄倹澹嗗▓?passiveConfig.immuneFlags
    if (config.passiveConfig?.immuneFlags) {
      return config.passiveConfig.immuneFlags;
    }

    // 闁稿繒鍘ч鎰板籍瑜忓▓?abilityConfig.flags
    const abilityConfig = config.abilityConfig;
    if (!abilityConfig?.flags) return null;

    const flags = abilityConfig.flags as string[];
    const immuneFlags: IImmuneFlags = {};
    let hasFlags = false;

    if (flags.includes('boss_stat_down_immunity')) {
      immuneFlags.statDown = true;
      hasFlags = true;
    }
    if (flags.includes('boss_status_immunity')) {
      immuneFlags.status = true;
      hasFlags = true;
    }

    return hasFlags ? immuneFlags : null;
  }

  /**
   * 閻熸瑱绲鹃悗浠嬪储閻旈鎽嶉柡浣哥墛閻忓鏌婂鍥╂瀭
   */
  private static ParseAtoms(config: any): IAtomicEffectParams[] {
    if (!config.atomicComposition?.atoms) return [];
    return config.atomicComposition.atoms as IAtomicEffectParams[];
  }

  /**
   * 閻熸瑱绲鹃悗浠嬪矗閸屾稒娈堕柛?
   *
   * 濞村吋锚閸樻稒鎷呯捄銊︽殢 overrideArgs闁挎稑鐗婂鐢告嚊?boss_abilities.json闁挎稑顧€缁?
   * 闁哄牜浜濊ぐ浣圭瑹濞戞瑦顦ч柛銉у仱閳ь兘鍋撻柛?config.args[].default闁?
   */
  private static ResolveArgValues(config: any, overrideArgs?: number[]): number[] {
    if (!config.args || config.args.length === 0) return [];

    return config.args.map((arg: any, index: number) => {
      // 濞村吋锚閸樻稒鎷呯捄銊︽殢閻熸洖妫涘ú濠囧矗閸屾稒娈?
      if (overrideArgs && index < overrideArgs.length) {
        return overrideArgs[index];
      }
      // 闁搞儳鍋ら埀顑藉亾闁告帊鍗崇划顖滄媼閵堝應鍋?
      const val = arg.default;
      return typeof val === 'number' ? val : 0;
    });
  }

  /**
   * 闁圭瑳鍡╂斀閻炴凹鍋勬慨鈺呮偋鐟欏嫧鍋撹濞堟垿宕㈤悢椋庢憤闁轰礁鐗婇悘?
   */
  private static ExecuteAtoms(
    passive: IRegisteredPassive,
    context: IEffectContext
  ): IEffectResult[] {
    const results: IEffectResult[] = [];

    for (const atomConfig of passive.atoms) {
      // 閻忓繐妫楀顒勫极閺夊簱鍋撻懝閭︽船闁烩晜鐗曢崺宀勫储閻旈鎽嶉柡浣哥墛閻忓鏌婂鍥╂瀭濞?
      const resolvedConfig = this.ApplyArgValues(atomConfig, passive);

      const atom = AtomicEffectFactory.getInstance().create(resolvedConfig);
      if (!atom) {
        Logger.Warn(
          `[PassiveEffectRunner] Failed to create passive atom: ${passive.name}, ` +
          `type=${atomConfig.type}`
        );
        continue;
      }

      // 婵☆偀鍋撻柡灞诲劚鐢偆鈧稒鍔栭弲銉╁几濠婂嫭笑闁告熬闄勯弫顕€骞愭担鍝ョЪ闁告挸绉靛鍌炲嫉?
      if (!atom.canTriggerAt(context.timing)) continue;

      const atomResults = atom.execute(context);
      results.push(...atomResults);

      if (atomResults.length > 0) {
        Logger.Debug(
          `[PassiveEffectRunner] Passive atom executed: ${passive.name} (ID=${passive.effectId}), ` +
          `atom=${atom.name}, results=${atomResults.length}`
        );
      }
    }

    return results;
  }

  /**
   * 閻忓繐妫楀顒勫极閺夊簱鍋撻悡搴ｅ畨闁活潿鍔岄崺宀勫储閻旈鎽嶉柡浣哥墛閻忓鏌婂鍥╂瀭
   *
   * 濠碘€冲€归悘?atomConfig 濞戞搩鍘惧▓鎴﹀蓟閹邦亪鍤嬮悗娑欘殕椤斿矂宕愰梻纾嬬 "$argN" 闁哄秶鍘х槐锟犲箣閺嶎兘鍋撻崨顓炴闁轰焦婢橀幃鏇㈠礌瑜版帒甯抽柨?
   * 闁告帗鐟ч弫?argValues[N] 闁哄洦瀵у畷鏌ュΥ?
   *
   * 闁告艾鏈鍌炲冀鐟欏嫬绁?effect config 濞戞搩鍘惧▓?args 閻庤鐭粻鐔兼晬鐏炵晫娈洪柛娆忓€归弳鐔煎磹閸忕厧鐦?name 閻熸洖妫涘ú濠囧礆娴兼潙甯崇紓鍐惧枙閼垫垿濡?
   */
  private static ApplyArgValues(
    atomConfig: IAtomicEffectParams,
    passive: IRegisteredPassive
  ): IAtomicEffectParams {
    if (passive.argValues.length === 0) return atomConfig;

    const resolved = { ...atomConfig };

    // 闂侇剙绉村濠氭煀瀹ュ洨鏋傚☉鎿冨幘濞堟垿骞嶉埀顒勫嫉婢跺﹦鎽熸繛鍫㈩暜缁辨繈寮撮幐搴″簥闁告瑥鍊归弳鐔奉嚕閺囩姵鏆?
    for (const [key, value] of Object.entries(resolved)) {
      if (key === 'type') continue;

      // 閻庢稒顨堥浣圭▔閸欏澹愮€殿喖绻掑▓鎴﹀矗閸屾稒娈剁€殿喗娲滈弫? "$arg0", "$arg1", ...
      if (typeof value === 'string' && value.startsWith('$arg')) {
        const argIndex = parseInt(value.substring(4));
        if (!isNaN(argIndex) && argIndex < passive.argValues.length) {
          (resolved as any)[key] = passive.argValues[argIndex];
        }
      }
    }

    return resolved;
  }
}
