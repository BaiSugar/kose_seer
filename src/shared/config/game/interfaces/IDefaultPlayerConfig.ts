/**
 * 默认玩家配置接口
 */

export interface IDefaultPlayerConfig {
  description: string;
  player: IDefaultPlayerData;
  nono: IDefaultNonoData;
}

export interface IDefaultPlayerData {
  energy: number;
  coins: number;
  fightBadge: number;
  allocatableExp: number;
  mapId: number;
  posX: number;
  posY: number;
  timeToday: number;
  timeLimit: number;
  loginCnt: number;
  inviter: number;
  vipLevel: number;
  vipValue: number;
  vipStage: number;
  vipEndTime: number;
  teacherId: number;
  studentId: number;
  graduationCount: number;
  petMaxLev: number;
  petAllNum: number;
  monKingWin: number;
  curStage: number;
  maxStage: number;
  curFreshStage: number;
  maxFreshStage: number;
  maxArenaWins: number;
}

export interface IDefaultNonoData {
  hasNono: number;
  superNono: number;
  nonoState: number;
  nonoColor: number;
  nonoNick: string;
  nonoFlag: number;
  nonoPower: number;
  nonoMate: number;
  nonoIq: number;
  nonoAi: number;
  nonoSuperLevel: number;
  nonoBio: number;
  nonoChargeTime: number;
  nonoExpire: number;
  nonoChip: number;
  nonoGrow: number;
}
