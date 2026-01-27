/**
 * 物品模块元数据
 * 包含物品相关的所有命令元数据定义
 */
import { CommandID } from '../CommandID';
import { ICommandMeta } from './CommandMetaRegistry';

export const ItemModuleMetadata: ICommandMeta[] = [
  {
    cmdID: CommandID.ITEM_BUY,
    name: 'ITEM_BUY',
    desc: '购买物品',
    request: [
      { name: 'itemId', type: 'uint32', desc: '物品ID' },
      { name: 'count', type: 'uint32', desc: '购买数量' },
      { name: 'itemLevel', type: 'uint32', desc: '物品等级' },
      { name: 'cash', type: 'uint32', desc: '现金标志' }
    ],
    response: [
      { name: 'result', type: 'uint32', desc: '结果 (0=成功, 103203=唯一物品已拥有)' },
      { name: 'itemId', type: 'uint32', desc: '物品ID' },
      { name: 'count', type: 'uint32', desc: '数量' },
      { name: 'expireTime', type: 'uint32', desc: '过期时间' },
      { name: 'itemLevel', type: 'uint32', desc: '物品等级' }
    ]
  },
  {
    cmdID: CommandID.CHANGE_CLOTH,
    name: 'CHANGE_CLOTH',
    desc: '更换服装',
    request: [
      { name: 'clothCount', type: 'uint32', desc: '服装数量' },
      { 
        name: 'clothIds', 
        type: 'array',
        arrayCountField: 'clothCount',
        arrayFields: [
          { name: 'clothId', type: 'uint32', desc: '服装ID' }
        ],
        desc: '服装ID列表'
      }
    ],
    response: [
      { name: 'userId', type: 'uint32', desc: '用户ID' },
      { name: 'clothCount', type: 'uint32', desc: '服装数量' },
      { 
        name: 'clothes', 
        type: 'array',
        arrayCountField: 'clothCount',
        arrayFields: [
          { name: 'clothId', type: 'uint32', desc: '服装ID' },
          { name: 'clothType', type: 'uint32', desc: '服装类型' }
        ],
        desc: '服装列表'
      }
    ]
  },
  {
    cmdID: CommandID.ITEM_LIST,
    name: 'ITEM_LIST',
    desc: '获取物品列表',
    request: [
      { name: 'itemType1', type: 'uint32', desc: '物品类型1（范围起始）' },
      { name: 'itemType2', type: 'uint32', desc: '物品类型2（范围结束）' },
      { name: 'itemType3', type: 'uint32', desc: '物品类型3（额外类型）' }
    ],
    response: [
      { name: 'itemCount', type: 'uint32', desc: '物品数量' },
      { name: 'items', type: 'bytes', desc: '物品列表 [itemId(4) + count(4) + expireTime(4) + unknown(4)]...' }
    ]
  }
];
