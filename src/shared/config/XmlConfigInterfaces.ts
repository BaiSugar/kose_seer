/**
 * XML配置接口定义
 * 对应luvit中的XML配置文件结构
 */

/**
 * 精灵配置接口
 */
export interface IPetXmlConfig {
  Monsters: {
    Monster?: IPetMonster | IPetMonster[];
  };
}

export interface IPetMonster {
  ID: number;
  DefName: string;
  Type: number;
  Type2?: number;
  HP: number;
  Atk: number;
  Def: number;
  SpAtk: number;
  SpDef: number;
  Spd: number;
  GrowthType?: number;
  YieldingExp?: number;
  YieldingEV?: string;
  EvolvesFrom?: number;
  EvolvesTo?: number;
  EvolvingLv?: number;
  CatchRate?: number;
  EvolvFlag?: number;
  EvolvItem?: number;
  EvolvItemCount?: number;
  FreeForbidden?: number;
  NaturalEnemy?: string;
  FuseMaster?: number;
  FuseSub?: number;
  IsRareMon?: number;
  IsDark?: number;
  isRidePet?: number;
  isFlyPet?: number;
  nameY?: number;
  speed?: number;
  scale?: number;
  VipBtlAdj?: number;
  Gender?: number;
  EvolveBabin?: number;
  IsAbilityMon?: number;
  VariationID?: number;
  breedingmon?: number;
  supermon?: number;
  PetClass?: number;
  FormParam?: number;
  CharacterAttrParam?: string;
  GradeParam?: number;
  AddSeParam?: number;
  RealId?: number;
  ModifyPower?: number;
  Resist?: number;
  Combo?: string;
  Diyracemax?: number;
  Diyracemin?: number;
  Transform?: string;
  Rec?: string;
  Oth?: string;
  Tag?: string;
  AdvMove?: string;
  ExtraMoves?: {
    Move?: number | number[];
  };
  LearnableMoves?: {
    Move?: ILearnableMove | ILearnableMove[];
  };
}

/**
 * 可学习技能接口
 */
export interface ILearnableMove {
  ID: number;
  LearningLv: number;
}

/**
 * 技能配置接口
 */
export interface ISkillXmlConfig {
  MovesTbl: {
    Moves?: {
      Move?: ISkillMove | ISkillMove[];
    };
  };
}

export interface ISkillMove {
  ID: number;
  Name: string;
  Category: number;
  Type: number;
  Power: number;
  MaxPP: number;
  Accuracy: number;
  Url?: string;
  CD?: number;
  CritRate?: number;
  Priority?: number;
  SideEffect?: number;
  SideEffectArg?: string;
  info?: string;
  MustHit?: number;
  CritAtkFirst?: number;
  CritAtkSecond?: number;
  CritSelfHalfHp?: number;
  CritFoeHalfHp?: number;
  DmgBindLv?: number;
  PwrBindDv?: number;
  PwrDouble?: number;
}

/**
 * 物品配置接口
 */
export interface IItemXmlConfig {
  Items: {
    Cat?: IItemCategory | IItemCategory[];
  };
}

export interface IItemCategory {
  ID: number;
  DbCatID: number;
  Name: string;
  Max?: number;
  url?: string;
  Item?: IItem | IItem[];
}

export interface IItem {
  ID: number;
  Name: string;
  Rarity?: number;
  Price?: number;
  SellPrice?: number;
  RepairPrice?: number;
  WorkPrice?: number;
  Tradability?: number;
  VipTradability?: number;
  VipOnly?: number;
  LifeTime?: number;
  Repairable?: number;
  Max?: number;
  type?: string;
  speed?: number;
  BreedTime?: number;
  BreedMonID?: number;
  BreedMonLv?: number;
  MaxHPUp?: number;
  TransformTo?: string;
  ProduceAble?: number;
  VipTeamOnly?: number;
  NeedScience?: number;
  UseEnergy?: number;
  SuperDonate?: number;
  PkHp?: number;
  PkAtk?: number;
  PkDef?: number;
  PkFireRange?: number;
  LevelUpAble?: number;
  ItemSeId?: number;
  MonAttrReset?: number;
  MonNatureReset?: number;
  DecreMonLv?: number;
  DualEffectTimes?: number;
  TrinalEffectTimes?: number;
  AutoBtlTimes?: number;
  EnergyAbsorbTimes?: number;
  NewSeIdx?: number;
  YuanShenDegrade?: number;
  DailyKey?: string;
  DailyOutMax?: number;
  wd?: number;
  UseMax?: number;
  purpose?: number;
  Bean?: number;
  Hide?: number;
  hideNum?: number;
  Sort?: number;
}

/**
 * 技能效果配置接口
 */
export interface ISkillEffectsXmlConfig {
  SkillEffects: {
    Effect?: ISkillEffect | ISkillEffect[];
  };
}

export interface ISkillEffect {
  ID: number;
  Name: string;
  Description?: string;
  [key: string]: any;
}

/**
 * SPT配置接口
 */
export interface ISptXmlConfig {
  Monsters: {
    Monster?: IPetMonster | IPetMonster[];
  };
}
