<template>
  <div class="players-page">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="bg-gray-900 px-6 py-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-white">玩家管理</h3>
          <el-input
            v-model="searchText"
            placeholder="搜索玩家ID或昵称"
            style="width: 300px"
            clearable
            @change="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <div class="p-6">
        <el-table :data="players" border stripe>
          <el-table-column prop="userID" label="UID" width="100" fixed="left" />
          <el-table-column prop="nick" label="昵称" width="150" />
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.isOnline ? 'success' : 'info'" size="small">
                {{ row.isOnline ? '在线' : '离线' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="coins" label="赛尔豆" width="120" align="right">
            <template #default="{ row }">
              <span class="font-mono">{{ row.coins?.toLocaleString() || 0 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="energy" label="体力" width="100" align="center" />
          <el-table-column prop="allocatableExp" label="可分配经验" width="130" align="right">
            <template #default="{ row }">
              <span class="font-mono text-blue-600">{{ row.allocatableExp?.toLocaleString() || 0 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="vipLevel" label="超能NoNo" width="120" align="center">
            <template #default="{ row }">
              <span class="font-mono">{{ row.vipLevel || 0 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="petMaxLev" label="最高精灵等级" width="130" align="center" />
          <el-table-column prop="petAllNum" label="精灵总数" width="110" align="center" />
          <el-table-column prop="loginCnt" label="登录次数" width="110" align="center" />
          <el-table-column prop="regTime" label="注册时间" width="180">
            <template #default="{ row }">
              <span class="text-xs">{{ formatTime(row.regTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="250" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="handleViewDetail(row)">详情</el-button>
              <el-button size="small" type="primary" @click="handleGiveItem(row)">发送物品</el-button>
              <el-button size="small" type="danger" @click="handleBan(row)">封禁</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadPlayers"
          @size-change="loadPlayers"
          style="margin-top: 20px; justify-content: center"
        />
      </div>
    </div>

    <!-- 玩家详情对话框 -->
    <el-dialog
      v-model="detailDialog"
      :title="`玩家详情 - ${currentPlayer?.nickname || ''} (${currentPlayer?.uid || ''})`"
      width="1200px"
      top="5vh"
    >
      <div v-if="currentPlayer" class="player-detail-content">
        <div class="detail-layout">
          <!-- 左侧：基础信息 -->
          <div class="detail-left">
            <!-- 基本信息 -->
            <el-card class="detail-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><User /></el-icon>
                  <span>基本信息</span>
                </div>
              </template>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="UID">{{ currentPlayer.uid }}</el-descriptions-item>
                <el-descriptions-item label="昵称">{{ currentPlayer.nickname }}</el-descriptions-item>
                <el-descriptions-item label="颜色">{{ currentPlayer.color }}</el-descriptions-item>
                <el-descriptions-item label="纹理">{{ currentPlayer.texture }}</el-descriptions-item>
                <el-descriptions-item label="登录次数">{{ currentPlayer.loginCount }}</el-descriptions-item>
                <el-descriptions-item label="注册时间">{{ formatTime(currentPlayer.registerTime) }}</el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- 货币与资源 -->
            <el-card class="detail-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><Coin /></el-icon>
                  <span>货币与资源</span>
                </div>
              </template>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="赛尔豆">{{ currentPlayer.coins?.toLocaleString() || 0 }}</el-descriptions-item>
                <el-descriptions-item label="体力">{{ currentPlayer.energy }}</el-descriptions-item>
                <el-descriptions-item label="战斗徽章">{{ currentPlayer.fightBadge }}</el-descriptions-item>
                <el-descriptions-item label="可分配经验">{{ currentPlayer.allocatableExp?.toLocaleString() || 0 }}</el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- 超能NoNo -->
            <el-card class="detail-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><Star /></el-icon>
                  <span>超能NoNo</span>
                </div>
              </template>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="拥有NoNo">
                  <el-tag :type="currentPlayer.hasNono ? 'success' : 'info'" size="small">
                    {{ currentPlayer.hasNono ? '是' : '否' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="超级NoNo">
                  <el-tag :type="currentPlayer.superNono ? 'success' : 'info'" size="small">
                    {{ currentPlayer.superNono ? '是' : '否' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="NoNo昵称">{{ currentPlayer.nonoNick || '未设置' }}</el-descriptions-item>
                <el-descriptions-item label="NoNo颜色">{{ currentPlayer.nonoColor || 0 }}</el-descriptions-item>
                <el-descriptions-item label="NoNo体力">{{ currentPlayer.nonoPower || 0 }}</el-descriptions-item>
                <el-descriptions-item label="NoNo心情">{{ currentPlayer.nonoMate || 0 }}</el-descriptions-item>
                <el-descriptions-item label="超能NoNo等级">{{ currentPlayer.vipLevel || 0 }}</el-descriptions-item>
                <el-descriptions-item label="超能NoNo值">{{ currentPlayer.vipValue || 0 }}</el-descriptions-item>
                <el-descriptions-item label="超能NoNo阶段">{{ currentPlayer.vipStage || 0 }}</el-descriptions-item>
                <el-descriptions-item label="结束时间">
                  {{ currentPlayer.vipEndTime ? formatTime(currentPlayer.vipEndTime) : '未设置' }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- 战斗统计 -->
            <el-card class="detail-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><Trophy /></el-icon>
                  <span>战斗统计</span>
                </div>
              </template>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="王者之战胜利">{{ currentPlayer.monKingWin || 0 }}</el-descriptions-item>
                <el-descriptions-item label="混战胜利">{{ currentPlayer.messWin || 0 }}</el-descriptions-item>
                <el-descriptions-item label="竞技场最高连胜">{{ currentPlayer.maxArenaWins || 0 }}</el-descriptions-item>
                <el-descriptions-item label="当前关卡">{{ currentPlayer.curStage || 0 }}</el-descriptions-item>
                <el-descriptions-item label="最高关卡">{{ currentPlayer.maxStage || 0 }}</el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- 位置信息 -->
            <el-card class="detail-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><Location /></el-icon>
                  <span>位置信息</span>
                </div>
              </template>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="当前地图">{{ currentPlayer.mapId }}</el-descriptions-item>
                <el-descriptions-item label="坐标 X">{{ currentPlayer.posX || 0 }}</el-descriptions-item>
                <el-descriptions-item label="坐标 Y">{{ currentPlayer.posY || 0 }}</el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- 师徒信息 -->
            <el-card class="detail-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><User /></el-icon>
                  <span>师徒信息</span>
                </div>
              </template>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="老师ID">{{ currentPlayer.teacherID || '无' }}</el-descriptions-item>
                <el-descriptions-item label="学生ID">{{ currentPlayer.studentID || '无' }}</el-descriptions-item>
                <el-descriptions-item label="毕业次数">{{ currentPlayer.graduationCount || 0 }}</el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- 其他信息 -->
            <el-card class="detail-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><More /></el-icon>
                  <span>其他信息</span>
                </div>
              </template>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="今日在线时间">{{ Math.floor((currentPlayer.timeToday || 0) / 60) }} 分钟</el-descriptions-item>
                <el-descriptions-item label="时间限制">{{ currentPlayer.timeLimit || 0 }}</el-descriptions-item>
                <el-descriptions-item label="邀请者ID">{{ currentPlayer.inviter || '无' }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </div>

          <!-- 右侧：精灵、物品、任务 -->
          <div class="detail-right">
            <!-- 精灵信息 -->
            <el-card class="detail-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><Avatar /></el-icon>
                  <span>精灵信息 ({{ currentPlayer.petCount }} 只)</span>
                </div>
              </template>
              <el-descriptions :column="2" border size="small" style="margin-bottom: 12px;">
                <el-descriptions-item label="精灵总数">{{ currentPlayer.petCount }}</el-descriptions-item>
                <el-descriptions-item label="最高精灵等级">{{ currentPlayer.petMaxLev }}</el-descriptions-item>
              </el-descriptions>
              <el-input
                v-model="petSearchText"
                placeholder="搜索精灵ID或名字..."
                clearable
                size="small"
                style="margin-bottom: 12px;"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <div class="list-container">
                <div v-if="filteredPets.length === 0" class="empty-text">暂无匹配的精灵</div>
                <div v-else class="list-item clickable" v-for="pet in filteredPets" :key="pet.catchTime" @click="handleViewPet(pet)">
                  <div class="list-item-main">
                    <span class="list-item-title">{{ getPetName(pet.id) }} (ID: {{ pet.id }}) Lv.{{ pet.level }}</span>
                    <span class="list-item-info">HP: {{ pet.hp }}/{{ pet.maxHp }} | 经验: {{ pet.exp }}</span>
                  </div>
                </div>
              </div>
            </el-card>

            <!-- 物品信息 -->
            <el-card class="detail-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><Box /></el-icon>
                  <span>物品信息 ({{ currentPlayer.itemCount }} 个)</span>
                </div>
              </template>
              <el-input
                v-model="itemSearchText"
                placeholder="搜索物品ID或名字..."
                clearable
                size="small"
                style="margin-bottom: 12px;"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <div class="list-container">
                <div v-if="filteredItems.length === 0" class="empty-text">暂无匹配的物品</div>
                <div v-else class="list-item" v-for="(item, index) in filteredItems.slice(0, 20)" :key="index">
                  <div class="list-item-main">
                    <span class="list-item-title">{{ getItemName(item.itemId) }} (ID: {{ item.itemId }})</span>
                    <span class="list-item-info">数量: {{ item.count }} {{ item.expireTime > 0 ? '(限时)' : '' }}</span>
                  </div>
                </div>
                <div v-if="filteredItems.length > 20" class="more-text">还有 {{ filteredItems.length - 20 }} 个物品...</div>
              </div>
            </el-card>

            <!-- 任务信息 -->
            <el-card class="detail-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  <span>任务信息 ({{ currentPlayer.taskCount }} 个)</span>
                </div>
              </template>
              <el-input
                v-model="taskSearchText"
                placeholder="搜索任务ID或名字..."
                clearable
                size="small"
                style="margin-bottom: 12px;"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <div class="list-container">
                <div v-if="filteredTasks.length === 0" class="empty-text">暂无匹配的任务</div>
                <div v-else class="list-item" v-for="(task, index) in filteredTasks.slice(0, 20)" :key="index">
                  <div class="list-item-main">
                    <span class="list-item-title">{{ getTaskName(task.taskId) }} (ID: {{ task.taskId }})</span>
                    <el-tag :type="getTaskStatusType(task.status)" size="small">
                      {{ getTaskStatusText(task.status) }}
                    </el-tag>
                  </div>
                </div>
                <div v-if="filteredTasks.length > 20" class="more-text">还有 {{ filteredTasks.length - 20 }} 个任务...</div>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 发送物品对话框 -->
    <el-dialog v-model="giveItemDialog" title="发送物品" width="500px">
      <el-form :model="giveItemForm" label-width="100px">
        <el-form-item label="物品">
          <el-select v-model="giveItemForm.itemId" filterable placeholder="选择物品">
            <el-option
              v-for="item in itemOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="giveItemForm.count" :min="1" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="giveItemDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmGiveItem">确定</el-button>
      </template>
    </el-dialog>

    <!-- 精灵详情对话框 -->
    <PetDetailDialog
      v-model="petDetailDialog"
      :pet="currentPet"
      @edit="handleEditPet"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, User, Coin, Avatar, Box, Document, Star, Trophy, Location, More } from '@element-plus/icons-vue'
import { gmApi } from '@/api/gm'
import { useConfigStore } from '@/stores/config'
import PetDetailDialog from '@/components/PetDetailDialog.vue'

const configStore = useConfigStore()

const players = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchText = ref('')

const giveItemDialog = ref(false)
const giveItemForm = ref({ uid: 0, itemId: 0, count: 1 })
const itemOptions = ref<any[]>([])

// 详情对话框
const detailDialog = ref(false)
const currentPlayer = ref<any>(null)
const petSearchText = ref('')
const itemSearchText = ref('')
const taskSearchText = ref('')

// 精灵详情对话框
const petDetailDialog = ref(false)
const currentPet = ref<any>(null)

// 格式化时间戳
const formatTime = (timestamp: number) => {
  if (!timestamp) return '-'
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

// 获取精灵名字
const getPetName = (petId: number) => {
  return configStore.petNames[petId] || '未知精灵'
}

// 获取物品名字
const getItemName = (itemId: number) => {
  return configStore.itemNames[itemId] || '未知物品'
}

// 获取任务名字
const getTaskName = (taskId: number) => {
  return configStore.taskNames[taskId] || '未知任务'
}

// 获取任务状态文本
const getTaskStatusText = (status: number) => {
  const statusMap: Record<number, string> = {
    1: '已接受',
    2: '进行中',
    3: '已完成'
  }
  return statusMap[status] || '未接取'
}

// 获取任务状态类型
const getTaskStatusType = (status: number) => {
  const typeMap: Record<number, any> = {
    1: 'info',
    2: 'warning',
    3: 'success'
  }
  return typeMap[status] || 'info'
}

// 过滤精灵列表
const filteredPets = computed(() => {
  if (!currentPlayer.value?.pets) return []
  if (!petSearchText.value) return currentPlayer.value.pets
  
  const lowerSearch = petSearchText.value.toLowerCase()
  return currentPlayer.value.pets.filter((pet: any) => {
    const petName = getPetName(pet.id)
    return pet.id.toString().includes(petSearchText.value) || 
           petName.toLowerCase().includes(lowerSearch)
  })
})

// 过滤物品列表
const filteredItems = computed(() => {
  if (!currentPlayer.value?.items) return []
  if (!itemSearchText.value) return currentPlayer.value.items
  
  const lowerSearch = itemSearchText.value.toLowerCase()
  return currentPlayer.value.items.filter((item: any) => {
    const itemName = getItemName(item.itemId)
    return item.itemId.toString().includes(itemSearchText.value) || 
           itemName.toLowerCase().includes(lowerSearch)
  })
})

// 过滤任务列表
const filteredTasks = computed(() => {
  if (!currentPlayer.value?.tasks) return []
  if (!taskSearchText.value) return currentPlayer.value.tasks
  
  const lowerSearch = taskSearchText.value.toLowerCase()
  return currentPlayer.value.tasks.filter((task: any) => {
    const taskName = getTaskName(task.taskId)
    return task.taskId.toString().includes(taskSearchText.value) || 
           taskName.toLowerCase().includes(lowerSearch)
  })
})

// 查看精灵详情
const handleViewPet = (pet: any) => {
  currentPet.value = pet
  petDetailDialog.value = true
}

// 编辑精灵
const handleEditPet = (_pet: any) => {
  ElMessage.info('编辑功能开发中...')
  // TODO: 实现编辑功能
}

const loadPlayers = async () => {
  try {
    const res = await gmApi.getPlayers({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchText.value
    }) as any
    
    if (res.success) {
      players.value = res.data.players
      total.value = res.data.total
    } else {
      ElMessage.error(res.error || '加载玩家列表失败')
    }
  } catch (error) {
    console.error('加载玩家列表失败:', error)
    ElMessage.error('加载玩家列表失败')
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadPlayers()
}

const handleViewDetail = async (row: any) => {
  try {
    const loading = ElMessage({
      message: '加载玩家详情...',
      type: 'info',
      duration: 0
    })
    
    const [detailRes] = await Promise.all([
      gmApi.getPlayerDetail(row.userID),
      configStore.fetchPetNames(),
      configStore.fetchItemNames(),
      configStore.fetchTaskNames()
    ])
    
    loading.close()
    
    const res = detailRes as any
    if (!res.success) {
      ElMessage.error(res.error || '获取玩家详情失败')
      return
    }
    
    currentPlayer.value = res.data
    petSearchText.value = ''
    itemSearchText.value = ''
    taskSearchText.value = ''
    detailDialog.value = true
  } catch (error) {
    console.error('显示玩家详情失败:', error)
    ElMessage.error('显示玩家详情失败')
  }
}

const handleGiveItem = async (row: any) => {
  giveItemForm.value.uid = row.userID
  giveItemDialog.value = true
  
  if (itemOptions.value.length === 0) {
    itemOptions.value = await configStore.fetchOptions('items') as any[]
  }
}

const confirmGiveItem = async () => {
  try {
    await gmApi.giveItem(
      giveItemForm.value.uid,
      giveItemForm.value.itemId,
      giveItemForm.value.count
    )
    ElMessage.success('物品发送成功')
    giveItemDialog.value = false
  } catch (error) {
    ElMessage.error('物品发送失败')
  }
}

const handleBan = async (row: any) => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入封禁原因', '封禁玩家', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入封禁原因'
    })
    
    await gmApi.banPlayer(row.userID, true, reason)
    ElMessage.success('玩家已封禁')
    loadPlayers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('封禁失败')
    }
  }
}

loadPlayers()
</script>


<style scoped>
.player-detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-left,
.detail-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-card {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.list-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px;
}

.list-item {
  padding: 8px;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s;
}

.list-item:last-child {
  border-bottom: none;
}

.list-item:hover {
  background-color: #f9fafb;
}

.list-item.clickable {
  cursor: pointer;
}

.list-item.clickable:hover {
  background-color: #f3f4f6;
  border-left: 3px solid #2563eb;
}

.list-item-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.list-item-title {
  font-weight: 500;
  color: #1f2937;
  flex: 1;
}

.list-item-info {
  color: #6b7280;
  font-size: 13px;
}

.empty-text {
  text-align: center;
  color: #9ca3af;
  padding: 40px 20px;
  font-size: 14px;
}

.more-text {
  text-align: center;
  color: #9ca3af;
  padding: 8px;
  font-size: 13px;
  border-top: 1px solid #f3f4f6;
  margin-top: 8px;
}
</style>
