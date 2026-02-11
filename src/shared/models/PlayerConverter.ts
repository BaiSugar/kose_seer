/**
 * 玩家数据模型转换器
 * 负责在内部数据模型(IPlayerInfo)和Proto之间转换
 */

import { IPlayerInfo } from './PlayerModel';
import { LoginRspProto } from '../proto';
import { IClothInfo } from './PlayerModel';

/**
 * 将IPlayerInfo转换为LoginRspProto
 * 用于游戏登录响应
 */
export function PlayerInfoToLoginProto(player: IPlayerInfo, sessionKey?: string): LoginRspProto {
  const proto = new LoginRspProto();
  
  // 基础信息
  proto.userId = player.userID;
  proto.regTime = player.regTime || Math.floor(Date.now() / 1000); // 使用实际注册时间
  proto.nickname = player.nick;
  proto.vip = player.vipLevel > 0;
  proto.viped = player.vipLevel > 0;
  proto.dsFlag = 0;
  proto.color = player.color || 0;
  proto.texture = player.texture || 1;
  proto.energy = player.energy;
  proto.coins = player.coins;
  proto.fightBadge = player.fightBadge || 0;
  proto.mapId = player.mapID;
  proto.posX = player.posX;
  proto.posY = player.posY;
  
  proto.timeToday = player.timeToday || 0;
  proto.timeLimit = player.timeLimit || 0;
  proto.isClothHalfDay = false;
  proto.isRoomHalfDay = false;
  proto.iFortressHalfDay = false;
  proto.isHQHalfDay = false;
  proto.loginCnt = player.loginCnt || 0;
  proto.inviter = player.inviter || 0;
  proto.newInviteeCnt = 0;
  // VIP字段：TypeScript端存储在players表，Lua端存储在nono对象
  // 但发送时值是一样的
  proto.vipLevel = player.vipLevel || 0;
  proto.vipValue = player.vipValue || 0;
  proto.vipStage = player.vipStage || 0;
  proto.autoCharge = 0; // TypeScript端没有此字段，使用默认值0
  // vipEndTime: 如果是超能NoNo且未设置，使用0x7FFFFFFF
  const isSuper = player.superNono || false;
  proto.vipEndTime = player.vipEndTime || (isSuper ? 0x7FFFFFFF : 0);
  proto.freshManBonus = 0;
  
  // nonoChipList (80 bytes) - all false for now
  proto.nonoChipList = new Array(80).fill(false);
  
  // dailyResArr (50 bytes) - all 0 for now
  proto.dailyResArr = new Array(50).fill(0);
  
  proto.teacherID = player.teacherID || 0;
  proto.studentID = player.studentID || 0;
  proto.graduationCount = player.graduationCount || 0;
  proto.maxPuniLv = 100; // Lua端默认值100
  proto.petMaxLev = player.petMaxLev || 100; // Lua端默认值100
  proto.petAllNum = player.petAllNum || 0;
  proto.monKingWin = player.monKingWin || 0;
  proto.curStage = player.curStage || 0;
  proto.maxStage = player.maxStage || 0;
  proto.curFreshStage = 0;
  proto.maxFreshStage = 0;
  proto.maxArenaWins = player.maxArenaWins || 0;
  proto.twoTimes = 0;
  proto.threeTimes = 0;
  proto.autoFight = 0;
  proto.autoFightTimes = 0;
  proto.energyTimes = 0;
  proto.learnTimes = 0;
  proto.monBtlMedal = 0;
  proto.recordCnt = 0;
  proto.obtainTm = 0;
  proto.soulBeadItemID = 0;
  proto.expireTm = 0;
  proto.fuseTimes = 0;
  proto.hasNono = player.hasNono || false;
  proto.superNono = player.superNono || false;
  // 重要：Lua端发送 nono.flag (值1)，TypeScript端也发送 nonoFlag
  // 如果没有NoNo，Lua端发送 0xFFFFFFFF
  proto.nonoState = player.hasNono ? (player.nonoFlag || 0) : 0xFFFFFFFF;
  proto.nonoColor = player.nonoColor || 0;
  proto.nonoNick = player.nonoNick || 'NoNo'; // 和Lua端默认值一致
  proto.badge = player.badge || 0;
  
  // 当前称号
  proto.curTitle = player.curTitle || 0;
  
  // Boss成就列表
  proto.bossAchievement = player.bossAchievement || new Array(200).fill(false);

  return proto;
}

/**
 * 从LoginRspProto提取基础玩家信息
 * 用于更新IPlayerInfo的部分字段
 */
export function LoginProtoToPlayerInfo(proto: LoginRspProto, existingPlayer: IPlayerInfo): IPlayerInfo {
  return {
    ...existingPlayer,
    userID: proto.userId,
    nick: proto.nickname,
    coins: proto.coins,
    energy: proto.energy,
    vipLevel: proto.vipLevel,
    vipValue: proto.vipValue,
    mapID: proto.mapId,
    posX: proto.posX,
    posY: proto.posY
  };
}

/**
 * 创建简化的服装信息列表
 * 用于Proto序列化
 */
export function SimplifyClothes(clothes: IClothInfo[]): Array<{ id: number }> {
  return clothes.map(cloth => ({ id: cloth.id }));
}
