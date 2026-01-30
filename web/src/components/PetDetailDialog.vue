<template>
  <el-dialog
    v-model="visible"
    :title="`精灵详情 - ${petName}`"
    width="800px"
    @close="handleClose"
  >
    <div v-if="pet" class="pet-detail-content">
      <!-- 基本信息 -->
      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><InfoFilled /></el-icon>
            <span>基本信息</span>
          </div>
        </template>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="精灵ID">{{ pet.id }}</el-descriptions-item>
          <el-descriptions-item label="精灵名称">{{ petName }}</el-descriptions-item>
          <el-descriptions-item label="等级">Lv.{{ pet.level }}</el-descriptions-item>
          <el-descriptions-item label="捕获时间" :span="2">{{ formatCatchTime(pet.catchTime) }}</el-descriptions-item>
          <el-descriptions-item label="性格">{{ getNatureName(pet.nature) }}</el-descriptions-item>
          <el-descriptions-item label="经验值" :span="3">{{ pet.exp?.toLocaleString() || 0 }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 属性值 -->
      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><TrendCharts /></el-icon>
            <span>属性值</span>
          </div>
        </template>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="HP">{{ pet.hp }} / {{ pet.maxHp }}</el-descriptions-item>
          <el-descriptions-item label="攻击">{{ pet.atk }}</el-descriptions-item>
          <el-descriptions-item label="防御">{{ pet.def }}</el-descriptions-item>
          <el-descriptions-item label="特攻">{{ pet.spAtk }}</el-descriptions-item>
          <el-descriptions-item label="特防">{{ pet.spDef }}</el-descriptions-item>
          <el-descriptions-item label="速度">{{ pet.speed }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 努力值 (EV) -->
      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Promotion /></el-icon>
            <span>努力值 (EV)</span>
          </div>
        </template>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="HP">{{ pet.evHp || 0 }}</el-descriptions-item>
          <el-descriptions-item label="攻击">{{ pet.evAtk || 0 }}</el-descriptions-item>
          <el-descriptions-item label="防御">{{ pet.evDef || 0 }}</el-descriptions-item>
          <el-descriptions-item label="特攻">{{ pet.evSpAtk || 0 }}</el-descriptions-item>
          <el-descriptions-item label="特防">{{ pet.evSpDef || 0 }}</el-descriptions-item>
          <el-descriptions-item label="速度">{{ pet.evSpeed || 0 }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 个体值 (DV) -->
      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Star /></el-icon>
            <span>个体值 (DV)</span>
          </div>
        </template>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="HP">{{ pet.dvHp || 0 }}</el-descriptions-item>
          <el-descriptions-item label="攻击">{{ pet.dvAtk || 0 }}</el-descriptions-item>
          <el-descriptions-item label="防御">{{ pet.dvDef || 0 }}</el-descriptions-item>
          <el-descriptions-item label="特攻">{{ pet.dvSpAtk || 0 }}</el-descriptions-item>
          <el-descriptions-item label="特防">{{ pet.dvSpDef || 0 }}</el-descriptions-item>
          <el-descriptions-item label="速度">{{ pet.dvSpeed || 0 }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 技能列表 -->
      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><MagicStick /></el-icon>
            <span>技能列表</span>
          </div>
        </template>
        <div v-if="pet.skillArray && pet.skillArray.length > 0" class="skill-list">
          <div v-for="(skill, index) in pet.skillArray" :key="index" class="skill-item">
            <div class="skill-info">
              <span class="skill-name">{{ getSkillName(skill.id) }}</span>
              <span class="skill-id">(ID: {{ skill.id }})</span>
            </div>
            <div class="skill-pp">
              <span>PP: {{ skill.pp }} / {{ skill.maxPp }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-text">暂无技能</div>
      </el-card>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" @click="handleEdit">编辑</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { InfoFilled, TrendCharts, Promotion, Star, MagicStick } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config'

interface Props {
  modelValue: boolean
  pet: any
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'edit', pet: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const configStore = useConfigStore()

const visible = ref(props.modelValue)

// 监听外部变化
watch(() => props.modelValue, (val) => {
  visible.value = val
})

// 监听内部变化
watch(visible, (val) => {
  emit('update:modelValue', val)
  // 当对话框打开时加载技能名称
  if (val) {
    configStore.fetchSkillNames()
  }
})

// 格式化时间戳
const formatCatchTime = (timestamp: number) => {
  if (!timestamp) return '未知'
  // 如果时间戳小于10000000000，说明是秒级时间戳，需要转换为毫秒
  const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp
  const date = new Date(ms)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取精灵名称
const petName = computed(() => {
  if (!props.pet) return '未知精灵'
  return configStore.petNames[props.pet.id] || '未知精灵'
})

// 获取性格名称
const getNatureName = (natureId: number) => {
  // TODO: 从配置中获取性格名称
  const natureMap: Record<number, string> = {
    0: '勤奋',
    1: '孤独',
    2: '勇敢',
    3: '固执',
    4: '调皮',
    5: '大胆',
    6: '坦率',
    7: '悠闲',
    8: '淘气',
    9: '乐天',
    10: '胆小',
    11: '急躁',
    12: '认真',
    13: '爽朗',
    14: '天真',
    15: '内敛',
    16: '慢吞吞',
    17: '冷静',
    18: '温和',
    19: '温顺',
    20: '马虎',
    21: '慎重',
    22: '浮躁',
    23: '狂妄',
    24: '沉着'
  }
  return natureMap[natureId] || `未知性格(${natureId})`
}

// 获取技能名称
const getSkillName = (skillId: number | undefined) => {
  if (!skillId) return '未知技能'
  return configStore.skillNames[skillId] || `未知技能(${skillId})`
}

const handleClose = () => {
  visible.value = false
}

const handleEdit = () => {
  emit('edit', props.pet)
}
</script>

<style scoped>
.pet-detail-content {
  max-height: 65vh;
  overflow-y: auto;
}

.detail-card {
  margin-bottom: 16px;
}

.detail-card:last-child {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.skill-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  transition: all 0.2s;
}

.skill-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.skill-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.skill-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.skill-id {
  color: #6b7280;
  font-size: 12px;
}

.skill-pp {
  color: #6b7280;
  font-size: 13px;
}

.empty-text {
  text-align: center;
  color: #9ca3af;
  padding: 40px 20px;
  font-size: 14px;
}
</style>
