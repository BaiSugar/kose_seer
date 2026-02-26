// Game event constants and payload types.
import { BattleType, BattleStatus } from '../../../shared/models/BattleModel';

export { BattleType, BattleStatus };

export const BattleEventType = {
  // Battle lifecycle
  BATTLE_START: 'battle:start',
  BATTLE_END: 'battle:end',

  // Round lifecycle
  ROUND_START: 'battle:round_start',
  ROUND_END: 'battle:round_end',

  // Attack result
  ATTACK_RESULT: 'battle:attack_result',

  // Pet state
  PET_DEAD: 'battle:pet_dead',
  PET_SWITCH: 'battle:pet_switch',

  // Status change
  STATUS_CHANGE: 'battle:status_change',

  // Catch
  CATCH_RESULT: 'battle:catch_result',

  // Escape
  ESCAPE_RESULT: 'battle:escape_result',
} as const;

export const PlayerEventType = {
  LOGIN: 'player:login',
  LOGOUT: 'player:logout',
  LEVEL_UP: 'player:level_up',
  COIN_CHANGE: 'player:coin_change',
} as const;

export const PetEventType = {
  PET_OBTAINED: 'pet:obtained',
  PET_RELEASED: 'pet:released',
  PET_EVOLUTION: 'pet:evolution',
  PET_LEVEL_UP: 'pet:level_up',
} as const;

export const ItemEventType = {
  ITEM_GAINED: 'item:gained',
  ITEM_SPENT: 'item:spent',
  ITEM_USED: 'item:used',
} as const;

export const TaskEventType = {
  TASK_ACCEPTED: 'task:accepted',
  TASK_COMPLETED: 'task:completed',
  TASK_PROGRESS: 'task:progress',
} as const;

export const SocialEventType = {
  FRIEND_ADDED: 'friend:added',
  FRIEND_REMOVED: 'friend:removed',
  MAIL_RECEIVED: 'mail:received',
  MAIL_READ: 'mail:read',
} as const;

export const EconomyEventType = {
  PURCHASE: 'economy:purchase',
  SELL: 'economy:sell',
  TRADE: 'economy:trade',
  COIN_CHANGE: 'economy:coin_change',
} as const;

export const MapEventType = {
  PEOPLE_WALK: 'map:people_walk',
  DANCE_ACTION: 'map:dance_action',
  PEOPLE_TRANSFORM: 'map:people_transform',
  AIMAT: 'map:aimat',
  CHAT: 'map:chat',
  PET_SHOW: 'map:pet_show',
  CHANGE_NICKNAME: 'map:change_nickname',
  CHANGE_COLOR: 'map:change_color',
  ON_OR_OFF_FLYING: 'map:on_or_off_flying',
} as const;
// ==================== Event source enums ====================

/** Item gain source */
export enum ItemGainSource {
  BUY = 'buy',
  GIVE = 'give',
  DROP = 'drop',
  GACHA = 'gacha',
  TASK_REWARD = 'task_reward',
  GOLD_BUY = 'gold_buy',
}

/** Pet obtain source */
export enum PetObtainSource {
  GIVE = 'give',
  CATCH = 'catch',
  TASK_REWARD = 'task_reward',
  BATTLE_REWARD = 'battle_reward',
}

// ==================== Battle events ====================

export interface IBattleStartEvent {
  type: typeof BattleEventType.BATTLE_START;
  timestamp: number;
  playerId?: number;
  battleType: BattleType;
  mapId: number;
  playerPetId: number;
  enemyPetId: number;
  enemyLevel: number;
}

export interface IBattleEndEvent {
  type: typeof BattleEventType.BATTLE_END;
  timestamp: number;
  playerId?: number;
  battleType: BattleType;
  mapId: number;
  isVictory: boolean;
  playerPetId: number;
  enemyPetId: number;
  rounds: number;
  extra: {
    puniDoorIndex?: number;
    sptId?: number;
    dropItems?: Array<{ itemId: number; count: number }>;
  };
}

export interface IBattleRoundStartEvent {
  type: typeof BattleEventType.ROUND_START;
  timestamp: number;
  playerId?: number;
  battleType: BattleType;
  mapId: number;
  round: number;
}

export interface IBattleRoundEndEvent {
  type: typeof BattleEventType.ROUND_END;
  timestamp: number;
  playerId?: number;
  battleType: BattleType;
  mapId: number;
  round: number;
  isOver: boolean;
  winnerId?: number;
}

export interface IAttackResultEvent {
  type: typeof BattleEventType.ATTACK_RESULT;
  timestamp: number;
  playerId?: number;
  attackerId: number;
  targetId: number;
  skillId: number;
  damage: number;
  isCritical: boolean;
  isMissed: boolean;
  hpChange: number;
}

export interface IPetDeadEvent {
  type: typeof BattleEventType.PET_DEAD;
  timestamp: number;
  playerId?: number;
  petId: number;
  catchTime: number;
  killerId: number;
}

export interface IPetSwitchEvent {
  type: typeof BattleEventType.PET_SWITCH;
  timestamp: number;
  playerId?: number;
  oldPetId: number;
  oldCatchTime: number;
  newPetId: number;
  newCatchTime: number;
}

export interface IStatusChangeEvent {
  type: typeof BattleEventType.STATUS_CHANGE;
  timestamp: number;
  playerId?: number;
  petId: number;
  status: BattleStatus;
  statusTurns: number;
  isAdd: boolean;
}

export interface ICatchResultEvent {
  type: typeof BattleEventType.CATCH_RESULT;
  timestamp: number;
  playerId?: number;
  targetPetId: number;
  success: boolean;
  capsuleId: number;
}

export interface IEscapeResultEvent {
  type: typeof BattleEventType.ESCAPE_RESULT;
  timestamp: number;
  playerId?: number;
  success: boolean;
  reason?: string;
}

// ==================== Item events ====================

export interface IItemGainedEvent {
  type: typeof ItemEventType.ITEM_GAINED;
  timestamp: number;
  playerId?: number;
  itemId: number;
  count: number;
  source: ItemGainSource;
}

export interface IItemSpentEvent {
  type: typeof ItemEventType.ITEM_SPENT;
  timestamp: number;
  playerId?: number;
  itemId: number;
  count: number;
  reason: string;
}

// ==================== Pet events ====================

export interface IPetObtainedEvent {
  type: typeof PetEventType.PET_OBTAINED;
  timestamp: number;
  playerId?: number;
  petId: number;
  level: number;
  catchTime: number;
  source: PetObtainSource;
}

export interface IPetReleasedEvent {
  type: typeof PetEventType.PET_RELEASED;
  timestamp: number;
  playerId?: number;
  petId: number;
  catchTime: number;
}

export interface IPetEvolutionEvent {
  type: typeof PetEventType.PET_EVOLUTION;
  timestamp: number;
  playerId?: number;
  oldPetId: number;
  newPetId: number;
  level: number;
  catchTime: number;
}

export interface IPetLevelUpEvent {
  type: typeof PetEventType.PET_LEVEL_UP;
  timestamp: number;
  playerId?: number;
  petId: number;
  oldLevel: number;
  newLevel: number;
  catchTime: number;
}

// ==================== Player events ====================

export interface IPlayerLevelUpEvent {
  type: typeof PlayerEventType.LEVEL_UP;
  timestamp: number;
  playerId?: number;
  oldLevel: number;
  newLevel: number;
}

export interface ICoinChangeEvent {
  type: typeof PlayerEventType.COIN_CHANGE;
  timestamp: number;
  playerId?: number;
  oldCoins: number;
  newCoins: number;
  change: number;
  reason: string;
}

export interface IPlayerLoginEvent {
  type: typeof PlayerEventType.LOGIN;
  timestamp: number;
  playerId?: number;
}

export interface IPlayerLogoutEvent {
  type: typeof PlayerEventType.LOGOUT;
  timestamp: number;
  playerId?: number;
}
