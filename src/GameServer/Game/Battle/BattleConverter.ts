import { IBattlePet, IAttackResult, BattleStatus } from '../../../shared/models/BattleModel';
import { SimplePetInfoProto } from '../../../shared/proto/common/SimplePetInfoProto';
import { FightPetInfoProto } from '../../../shared/proto/common/FightPetInfoProto';
import { AttackValueProto } from '../../../shared/proto/common/AttackValueProto';

/**
 * 战斗数据转换器
 * 负责将战斗数据模型转换为 Proto
 */
export class BattleConverter {
  /**
   * 将 IBattlePet 转换为 SimplePetInfoProto
   * 用于 NOTE_READY_TO_FIGHT (2503)
   */
  public static ToSimplePetInfo(pet: IBattlePet): SimplePetInfoProto {
    return new SimplePetInfoProto()
      .setPetId(pet.id)
      .setLevel(pet.level)
      .setHP(pet.hp, pet.maxHp)
      .setSkills(pet.skills.map(id => ({ id, pp: 20 })))
      .setCatchTime(pet.catchTime)
      .setCatchMap(301)
      .setCatchLevel(pet.level)
      .setSkinID(0);
  }

  /**
   * 将 IBattlePet 转换为 FightPetInfoProto
   * 用于 NOTE_START_FIGHT (2504)
   */
  public static ToFightPetInfo(pet: IBattlePet, userId: number, catchable: number): FightPetInfoProto {
    return new FightPetInfoProto()
      .setUserID(userId)
      .setPetID(pet.id)
      .setPetName(pet.name)
      .setCatchTime(pet.catchTime)
      .setHP(pet.hp, pet.maxHp)
      .setLevel(pet.level)
      .setCatchable(catchable)
      .setBattleLv(pet.battleLv);
  }

  /**
   * 将 IAttackResult 转换为 AttackValueProto
   * 用于 NOTE_USE_SKILL (2505)
   */
  public static ToAttackValue(
    attack: IAttackResult | undefined,
    defaultUserId: number,
    defaultHp: number,
    defaultMaxHp: number,
    defaultStatus: BattleStatus | undefined,
    defaultBattleLv: number[],
    petType: number
  ): AttackValueProto {
    const proto = new AttackValueProto();

    if (attack) {
      proto
        .setUserId(attack.userId)
        .setSkillId(attack.skillId)
        .setAtkTimes(attack.atkTimes)
        .setDamage(attack.damage)
        .setGainHP(attack.gainHp)
        .setRemainHp(attack.attackerRemainHp)
        .setMaxHp(attack.attackerMaxHp)
        .setState(attack.missed || attack.blocked ? 1 : 0)
        .setIsCrit(attack.isCrit ? 1 : 0)
        .setStatus(attack.attackerStatus)
        .setBattleLv(attack.attackerBattleLv)
        .setPetType(petType);
    } else {
      // 空攻击占位符
      // 将单个状态转换为状态数组
      const statusArray = new Array(20).fill(0);
      if (defaultStatus !== undefined && defaultStatus !== BattleStatus.NONE) {
        statusArray[defaultStatus] = 1;
      }
      
      proto
        .setUserId(defaultUserId)
        .setSkillId(0)
        .setAtkTimes(0)
        .setDamage(0)
        .setGainHP(0)
        .setRemainHp(defaultHp)
        .setMaxHp(defaultMaxHp)
        .setState(0)
        .setIsCrit(0)
        .setStatus(statusArray)
        .setBattleLv(defaultBattleLv)
        .setPetType(petType);
    }

    return proto;
  }

  /**
   * 批量转换精灵列表为 SimplePetInfoProto 数组
   */
  public static ToSimplePetInfoList(pets: IBattlePet[]): SimplePetInfoProto[] {
    return pets.map(pet => this.ToSimplePetInfo(pet));
  }
}
