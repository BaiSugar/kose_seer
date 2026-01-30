<template>
  <div class="space-y-6">
    <!-- 顶部说明卡片 -->
    <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
          <el-icon :size="24" color="white"><MapLocation /></el-icon>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">地图怪物配置说明</h3>
          <p class="text-sm text-gray-600 mb-1">
            {{ configData?.description || '此配置控制地图上野生精灵的刷新规则' }}
          </p>
          <p class="text-sm text-gray-600 flex items-center gap-1">
            <el-icon><InfoFilled /></el-icon>
            修改后点击"保存配置"，然后点击"重载配置"立即应用到游戏服务器。
          </p>
          <p class="text-sm text-gray-600 flex items-center gap-1">
            <el-icon><InfoFilled /></el-icon>
            目前全局配置暂不可用！
          </p>
        </div>
      </div>
    </div>

    <!-- 全局设置 -->
    <div v-if="configData?.globalSettings" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="bg-gray-900 px-6 py-4">
        <h3 class="text-lg font-semibold text-white flex items-center gap-2">
          <el-icon :size="20"><Setting /></el-icon>
          <span>全局设置</span>
        </h3>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 flex items-center gap-1">
              <el-icon><Star /></el-icon>
              默认闪光率
            </label>
            <el-input-number 
              v-model="configData.globalSettings.defaultShinyRate" 
              :min="0" 
              :max="1" 
              :step="0.01"
              class="w-full"
            />
            <p class="text-xs text-gray-500">野生精灵出现闪光的概率 (0-1)</p>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 flex items-center gap-1">
              <el-icon><Timer /></el-icon>
              默认刷新间隔(秒)
            </label>
            <el-input-number 
              v-model="configData.globalSettings.defaultRefreshInterval" 
              :min="1" 
              :max="3600"
              class="w-full"
            />
            <p class="text-xs text-gray-500">怪物刷新的时间间隔</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 地图列表 -->
    <div v-if="configData?.maps" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="bg-gray-900 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h3 class="text-lg font-semibold text-white">地图配置</h3>
          <span class="px-3 py-1 bg-white/20 rounded-full text-sm text-white font-medium">
            共 {{ filteredMapList.length }} 个地图
          </span>
        </div>
        <div class="flex gap-2">
          <el-button 
            type="success" 
            @click="handleSave"
            :icon="DocumentChecked"
          >
            保存配置
          </el-button>
          <el-button 
            @click="handleReload"
            :icon="RefreshRight"
            plain
          >
            重载配置
          </el-button>
        </div>
      </div>
      
      <div class="p-6">
        <!-- 搜索框 -->
        <div class="mb-6">
          <el-input
            v-model="searchQuery"
            placeholder="搜索地图ID或名称..."
            clearable
            class="w-full max-w-md"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <!-- 地图折叠面板 -->
        <el-collapse v-model="activeMapIds" class="space-y-4">
          <el-collapse-item 
            v-for="map in paginatedMaps" 
            :key="map.id" 
            :name="map.id"
            class="!border !border-gray-200 !rounded-lg overflow-hidden !mb-4"
          >
            <template #title>
              <div class="flex items-center gap-3 py-2 w-full">
                <div class="flex items-center gap-2 flex-1">
                  <span class="px-3 py-1 bg-gray-900 text-white rounded-lg font-semibold text-sm">
                    地图 {{ map.id }}
                  </span>
                  <span class="text-base font-semibold text-gray-900">{{ map.data.name }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1">
                    <el-icon><Grid /></el-icon>
                    {{ map.data.ogres?.length || 0 }} 个怪物
                  </span>
                  <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                    <el-icon><Refresh /></el-icon>
                    刷新: {{ map.data.spawnCount }}
                  </span>
                </div>
              </div>
            </template>

            <div class="p-6 bg-gray-50">
              <!-- 地图基本信息 -->
              <div class="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
                <h4 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <el-icon><Document /></el-icon>
                  <span>基本信息</span>
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="space-y-2">
                    <label class="text-xs font-medium text-gray-600">地图名称</label>
                    <el-input v-model="map.data.name" placeholder="输入地图名称" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-medium text-gray-600">刷新数量</label>
                    <el-input-number v-model="map.data.spawnCount" :min="1" :max="20" class="w-full" />
                  </div>
                  <div class="flex flex-col gap-2">
                    <label class="text-xs font-medium text-gray-600">随机数量</label>
                    <div class="custom-switch-wrapper">
                      <button
                        type="button"
                        role="switch"
                        :aria-checked="map.data.randomCount"
                        :class="[
                          'custom-switch',
                          map.data.randomCount ? 'custom-switch-on' : 'custom-switch-off'
                        ]"
                        @click="map.data.randomCount = !map.data.randomCount"
                      >
                        <span class="custom-switch-slider">
                          <span class="custom-switch-icon">
                            <svg v-if="map.data.randomCount" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                            <svg v-else class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                          </span>
                        </span>
                        <span class="custom-switch-label">
                          {{ map.data.randomCount ? '开启' : '关闭' }}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div v-if="map.data.randomCount" class="space-y-2">
                    <label class="text-xs font-medium text-gray-600">最小数量</label>
                    <el-input-number v-model="map.data.minCount" :min="1" :max="20" class="w-full" />
                  </div>
                  <div v-if="map.data.randomCount" class="space-y-2">
                    <label class="text-xs font-medium text-gray-600">最大数量</label>
                    <el-input-number v-model="map.data.maxCount" :min="1" :max="20" class="w-full" />
                  </div>
                </div>
              </div>

              <!-- 怪物列表 -->
              <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <el-icon><Avatar /></el-icon>
                    <span>怪物配置</span>
                  </h4>
                  <button
                    class="action-btn action-btn-add"
                    @click="handleAddOgre(map.id)"
                    title="添加怪物"
                  >
                    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span class="text">添加怪物</span>
                  </button>
                </div>
                
                <el-table 
                  :data="map.data.ogres" 
                  stripe
                  class="w-full"
                  :header-cell-style="{ background: '#f9fafb', color: '#374151', fontWeight: '600' }"
                >
                  <el-table-column prop="slot" label="槽位" width="80" align="center" />
                  <el-table-column prop="petId" label="精灵ID" width="150" align="center">
                    <template #default="{ row }">
                      <div class="flex flex-col items-center gap-1">
                        <span class="font-mono text-gray-900 font-semibold">{{ row.petId }}</span>
                        <span class="text-xs text-gray-500">{{ getPetName(row.petId) }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="等级范围" width="120" align="center">
                    <template #default="{ row }">
                      <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                        {{ row.minLevel }}-{{ row.maxLevel }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="expReward" label="经验" width="100" align="center">
                    <template #default="{ row }">
                      <span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-semibold">
                        +{{ row.expReward }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="catchRate" label="捕捉率" width="100" align="center">
                    <template #default="{ row }">
                      <span v-if="row.catchRate !== undefined && row.catchRate !== null" class="text-xs font-semibold" :class="row.catchRate > 0.5 ? 'text-green-600' : 'text-orange-600'">
                        {{ (row.catchRate * 100).toFixed(1) }}%
                      </span>
                      <span v-else class="text-xs text-gray-400">默认</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="catchable" label="可捕捉" width="100" align="center">
                    <template #default="{ row }">
                      <el-tag :type="row.catchable ? 'success' : 'danger'" size="small">
                        {{ row.catchable ? '是' : '否' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="isBoss" label="BOSS" width="80" align="center">
                    <template #default="{ row }">
                      <el-tag v-if="row.isBoss" type="warning" size="small">
                        <el-icon class="mr-1"><Trophy /></el-icon>
                        BOSS
                      </el-tag>
                      <span v-else class="text-gray-400 text-xs">-</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="weight" label="权重" width="80" align="center">
                    <template #default="{ row }">
                      <span class="text-xs text-gray-600">{{ row.weight }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="刷新配置" width="180" align="center">
                    <template #default="{ row }">
                      <div v-if="row.refreshConfig" class="text-xs space-y-1">
                        <div class="text-gray-600 flex items-center justify-center gap-1">
                          <el-icon><Timer /></el-icon>
                          {{ row.refreshConfig.refreshInterval }}s
                        </div>
                        <div class="text-gray-900 font-semibold flex items-center justify-center gap-1">
                          <el-icon><Star /></el-icon>
                          {{ (row.refreshConfig.shinyRate * 100).toFixed(1) }}%
                        </div>
                        <div v-if="row.refreshConfig.shinyPetId && row.refreshConfig.shinyPetId !== -1" class="flex flex-col items-center gap-0.5 mt-1 pt-1 border-t border-gray-200">
                          <span class="text-purple-600 font-mono font-semibold">{{ row.refreshConfig.shinyPetId }}</span>
                          <span class="text-purple-500 text-[10px]">{{ getPetName(row.refreshConfig.shinyPetId) }}</span>
                        </div>
                        <div v-else class="text-gray-400 text-[10px] mt-1 pt-1 border-t border-gray-200">
                          无闪光
                        </div>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="掉落物品" width="150" align="center">
                    <template #default="{ row }">
                      <div v-if="row.dropItems && row.dropItems.length > 0" class="text-xs space-y-2">
                        <div
                          v-for="(item, idx) in row.dropItems.slice(0, 2)"
                          :key="idx"
                          class="drop-item-cell"
                        >
                          <span class="text-blue-600 font-mono text-[10px]">{{ item.itemId }}</span>
                          <span class="item-name">{{ getItemName(item.itemId) }}</span>
                          <span class="text-gray-500 text-[10px]">{{ (item.dropRate * 100).toFixed(1) }}% × {{ item.minCount }}-{{ item.maxCount }}</span>
                        </div>
                        <div v-if="row.dropItems.length > 2" class="text-gray-400 text-[10px]">
                          +{{ row.dropItems.length - 2 }} 更多
                        </div>
                      </div>
                      <span v-else class="text-gray-400 text-xs">无掉落</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="140" fixed="right" align="center">
                    <template #default="{ $index }">
                      <div class="flex gap-1 justify-center action-buttons">
                        <button
                          class="action-btn action-btn-edit"
                          @click="handleEditOgre(map.id, $index)"
                          title="编辑"
                        >
                          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span class="text">编辑</span>
                        </button>
                        <button
                          class="action-btn action-btn-delete"
                          @click="handleDeleteOgre(map.id, $index)"
                          title="删除"
                        >
                          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span class="text">删除</span>
                        </button>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>

        <!-- 分页 -->
        <div class="mt-6 flex justify-center">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="filteredMapList.length"
            :page-sizes="[5, 10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            background
          />
        </div>
      </div>
    </div>

    <!-- 编辑怪物对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editingIndex === -1 ? '添加怪物' : '编辑怪物'"
      width="800px"
      :close-on-click-modal="false"
      class="edit-dialog"
      destroy-on-close
      :lock-scroll="true"
      :append-to-body="true"
    >
      <div class="dialog-content">
        <div v-if="editFormLoading" class="flex items-center justify-center py-20">
          <el-icon class="is-loading" :size="40"><Loading /></el-icon>
          <span class="ml-3 text-gray-500">加载中...</span>
        </div>
        <el-form v-else-if="editDialogVisible" :model="editForm" label-width="120px" class="space-y-4">
        <!-- 基本信息 -->
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 class="text-sm font-semibold text-gray-900 mb-3">基本信息</h4>
          
          <el-form-item label="槽位">
            <el-input-number v-model="editForm.slot" :min="0" :max="999" class="w-full" />
          </el-form-item>
          
          <el-form-item label="精灵" required>
            <PaginatedSelect
              v-model="editForm.petId"
              placeholder="请选择精灵"
              :fetch-data="fetchPetData"
              :page-size="50"
            />
          </el-form-item>
          
          <el-form-item label="是否闪光">
            <el-switch v-model="editForm.shiny" :active-value="1" :inactive-value="0" />
            <span class="ml-2 text-xs text-gray-500">{{ editForm.shiny ? '闪光' : '普通' }}</span>
          </el-form-item>
          
          <el-form-item label="权重">
            <el-input-number v-model="editForm.weight" :min="1" :max="100" class="w-full" />
            <span class="ml-2 text-xs text-gray-500">权重越高，出现概率越大</span>
          </el-form-item>
        </div>

        <!-- 等级和属性 -->
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 class="text-sm font-semibold text-gray-900 mb-3">等级和属性</h4>
          
          <el-form-item label="等级范围">
            <div class="flex gap-2 items-center w-full">
              <el-input-number v-model="editForm.minLevel" :min="1" :max="100" class="flex-1" />
              <span class="text-gray-500">-</span>
              <el-input-number v-model="editForm.maxLevel" :min="1" :max="100" class="flex-1" />
            </div>
          </el-form-item>
          
          <el-form-item label="固定等级">
            <el-input-number v-model="editForm.level" :min="1" :max="100" class="w-full" />
            <span class="ml-2 text-xs text-gray-500">如果设置，将忽略等级范围</span>
          </el-form-item>
          
          <el-form-item label="经验奖励">
            <el-input-number v-model="editForm.expReward" :min="0" :max="99999" class="w-full" />
          </el-form-item>
          
          <el-form-item label="经验倍率">
            <el-input-number
              v-model="editForm.expMultiplier"
              :min="0.1"
              :max="10"
              :step="0.1"
              :precision="1"
              class="w-full"
            />
          </el-form-item>
          
          <el-form-item label="捕捉率">
            <el-input-number
              v-model="editForm.catchRate"
              :min="0"
              :max="1"
              :step="0.01"
              :precision="2"
              class="w-full"
            />
            <span class="ml-2 text-xs text-gray-500">
              {{ editForm.catchRate ? (editForm.catchRate * 100).toFixed(1) + '%' : '未设置（使用精灵默认捕捉率）' }}
            </span>
          </el-form-item>
          
          <el-form-item label="可捕捉">
            <el-switch v-model="editForm.catchable" />
          </el-form-item>
          
          <el-form-item label="BOSS">
            <el-switch v-model="editForm.isBoss" />
          </el-form-item>
        </div>

        <!-- 刷新配置 -->
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 class="text-sm font-semibold text-gray-900 mb-3">刷新配置</h4>
          
          <el-form-item label="启用刷新">
            <el-switch v-model="editForm.refreshConfig.enabled" />
          </el-form-item>
          
          <el-form-item label="刷新间隔(秒)">
            <el-input-number
              v-model="editForm.refreshConfig.refreshInterval"
              :min="1"
              :max="3600"
              class="w-full"
            />
          </el-form-item>
          
          <el-form-item label="空位刷新">
            <el-switch v-model="editForm.refreshConfig.refreshOnEmpty" />
            <span class="ml-2 text-xs text-gray-500">怪物被击败后立即刷新</span>
          </el-form-item>
          
          <el-form-item label="时间段刷新">
            <div class="space-y-2 w-full">
              <div class="flex items-center gap-2">
                <el-checkbox v-model="editForm.refreshConfig.refreshAtDay">白天刷新</el-checkbox>
                <el-checkbox v-model="editForm.refreshConfig.refreshAtNight">夜晚刷新</el-checkbox>
              </div>
              <div class="flex gap-2 items-center">
                <el-input
                  v-model="editForm.refreshConfig.startTime"
                  type="time"
                  placeholder="开始时间"
                  class="flex-1"
                />
                <span class="text-gray-500">-</span>
                <el-input
                  v-model="editForm.refreshConfig.endTime"
                  type="time"
                  placeholder="结束时间"
                  class="flex-1"
                />
              </div>
            </div>
          </el-form-item>
          
          <el-form-item label="刷新模式">
            <el-radio-group v-model="editForm.refreshConfig.useInterval">
              <el-radio :value="true">间隔刷新</el-radio>
              <el-radio :value="false">定时刷新</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item v-if="!editForm.refreshConfig.useInterval" label="定时时间">
            <el-select
              v-model="editForm.refreshConfig.scheduleTime"
              multiple
              filterable
              allow-create
              placeholder="输入时间点 (HH:mm)"
              class="w-full"
            >
              <el-option
                v-for="time in ['00:00', '06:00', '12:00', '18:00']"
                :key="time"
                :label="time"
                :value="time"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="闪光率">
            <el-input-number
              v-model="editForm.refreshConfig.shinyRate"
              :min="0"
              :max="1"
              :step="0.01"
              :precision="2"
              class="w-full"
            />
            <span class="ml-2 text-xs text-gray-500">{{ (editForm.refreshConfig.shinyRate * 100).toFixed(1) }}%</span>
          </el-form-item>
          
          <el-form-item label="闪光精灵">
            <div class="flex flex-col gap-2 w-full">
              <PaginatedSelect
                v-model="editForm.refreshConfig.shinyPetId"
                placeholder="请选择闪光精灵（-1为无闪光）"
                :fetch-data="fetchShinyPetData"
                :page-size="50"
              />
              <span class="text-xs text-gray-500">
                选择 -1 表示无闪光精灵，或选择其他精灵作为闪光形态
              </span>
            </div>
          </el-form-item>
        </div>

        <!-- 掉落物品 -->
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-semibold text-gray-900">掉落物品</h4>
            <el-button size="small" @click="addDropItem">添加物品</el-button>
          </div>
          
          <div v-if="editForm.dropItems.length === 0" class="text-center text-gray-400 text-sm py-4">
            暂无掉落物品
          </div>
          
          <div v-else class="space-y-3">
            <div
              v-for="(item, index) in editForm.dropItems"
              :key="index"
              class="bg-white rounded-lg p-3 border border-gray-200"
            >
              <div class="flex items-start gap-2">
                <div class="flex-1 grid grid-cols-2 gap-2">
                  <el-form-item label="物品" label-width="60px" class="mb-2">
                    <PaginatedSelect
                      v-model="item.itemId"
                      placeholder="请选择物品"
                      :fetch-data="fetchItemData"
                      :page-size="50"
                    />
                  </el-form-item>
                  
                  <el-form-item label="掉落率" label-width="60px" class="mb-2">
                    <el-input-number
                      v-model="item.dropRate"
                      :min="0"
                      :max="1"
                      :step="0.01"
                      :precision="2"
                      class="w-full"
                    />
                  </el-form-item>
                  
                  <el-form-item label-width="60px" class="mb-0">
                    <template #label>
                      <span class="form-label-wrap">最小数量</span>
                    </template>
                    <el-input-number
                      v-model="item.minCount"
                      :min="1"
                      :max="999"
                      class="w-full"
                    />
                  </el-form-item>
                  
                  <el-form-item label-width="60px" class="mb-0">
                    <template #label>
                      <span class="form-label-wrap">最大数量</span>
                    </template>
                    <el-input-number
                      v-model="item.maxCount"
                      :min="1"
                      :max="999"
                      class="w-full"
                    />
                  </el-form-item>
                </div>
                
                <el-button
                  type="danger"
                  size="small"
                  @click="removeDropItem(index)"
                  :icon="Delete"
                  circle
                />
              </div>
              
              <div class="mt-2 text-xs text-gray-500">
                {{ getItemName(item.itemId) }} - {{ (item.dropRate * 100).toFixed(1) }}% 掉落 {{ item.minCount }}-{{ item.maxCount }} 个
              </div>
            </div>
          </div>
        </div>
      </el-form>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelEdit">取消</el-button>
          <el-button type="primary" @click="saveOgreEdit">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  MapLocation, 
  InfoFilled, 
  Setting, 
  Star, 
  Timer, 
  DocumentChecked, 
  RefreshRight,
  Document,
  Avatar,
  Grid,
  Refresh,
  Trophy,
  Delete,
  Loading,
  Search
} from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config'
import { configApi } from '@/api/config'
import PaginatedSelect from '@/components/PaginatedSelect.vue'

const configStore = useConfigStore()
const configData = ref<any>(null)
const activeMapIds = ref<string[]>([])
const currentPage = ref(1)
const pageSize = ref(5) // 默认每页只显示5个地图，避免卡顿
const searchQuery = ref('') // 搜索关键词

// 精灵名字映射
const petNames = ref<Record<number, string>>({})
// 物品名字映射
const itemNames = ref<Record<number, string>>({})

// 将 maps 对象转换为数组
const mapList = computed(() => {
  if (!configData.value?.maps) return []
  return Object.entries(configData.value.maps).map(([id, data]) => ({
    id,
    data: data as any
  }))
})

// 过滤后的地图列表（根据搜索关键词）
const filteredMapList = computed(() => {
  if (!searchQuery.value.trim()) {
    return mapList.value
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  return mapList.value.filter(map => {
    // 搜索地图ID
    if (map.id.toLowerCase().includes(query)) {
      return true
    }
    // 搜索地图名称
    if (map.data.name && map.data.name.toLowerCase().includes(query)) {
      return true
    }
    return false
  })
})

// 分页后的地图列表
const paginatedMaps = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredMapList.value.slice(start, end)
})

// 获取精灵名称
const getPetName = (petId: number): string => {
  return petNames.value[petId] || '未知精灵'
}

// 获取物品名称
const getItemName = (itemId: number): string => {
  return itemNames.value[itemId] || '未知物品'
}

// 加载配置
const loadConfig = async () => {
  try {
    const data = await configStore.fetchConfig('map-ogres')
    configData.value = data
    
    // 加载精灵名字映射
    petNames.value = await configStore.fetchPetNames() as Record<number, string>
    // 加载物品名字映射
    itemNames.value = await configStore.fetchItemNames() as Record<number, string>
    
    // 预加载选项数据，避免打开对话框时卡顿
    loadPetOptions()
    loadItemOptions()
  } catch (error) {
    console.error('加载配置失败:', error)
    ElMessage.error('加载配置失败')
  }
}

// 保存配置
const handleSave = async () => {
  try {
    // 显示加载状态
    const loading = ElMessage({
      message: '正在保存配置...',
      type: 'info',
      duration: 0
    })
    
    // 保存配置
    await configStore.saveConfig('map-ogres', configData.value)
    
    // 关闭加载提示
    loading.close()
    
    ElMessage.success('配置保存成功')
    
    // 弹出确认对话框询问是否重载
    ElMessageBox.confirm(
      '配置已保存到文件，是否立即重载配置使其生效？',
      '确认重载',
      {
        confirmButtonText: '立即重载',
        cancelButtonText: '稍后手动重载',
        type: 'info',
      }
    ).then(async () => {
      // 用户确认重载
      await handleReload()
    }).catch(() => {
      // 用户取消，不做任何操作
      ElMessage.info('配置已保存，请稍后手动点击"重载配置"按钮使其生效')
    })
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error('保存配置失败: ' + (error as any).message)
  }
}

// 重载配置
const handleReload = async () => {
  try {
    const loading = ElMessage({
      message: '正在重载配置...',
      type: 'info',
      duration: 0
    })
    
    await configStore.reloadConfig('map-ogres')
    
    loading.close()
    ElMessage.success('配置重载成功，游戏服务器已应用新配置')
  } catch (error) {
    console.error('重载配置失败:', error)
    ElMessage.error('重载配置失败: ' + (error as any).message)
  }
}

// 编辑对话框
const editDialogVisible = ref(false)
const editingMapId = ref<string>('')
const editingIndex = ref<number>(-1)
const editFormLoading = ref(false)
const editForm = ref<any>({
  slot: 0,
  petId: 0,
  shiny: 0,
  weight: 50,
  refreshConfig: {
    enabled: true,
    refreshInterval: 300,
    refreshOnEmpty: false,
    refreshAtNight: true,
    refreshAtDay: true,
    startTime: '00:00',
    endTime: '23:59',
    useInterval: true,
    useSchedule: false,
    scheduleTime: [],
    shinyRate: 0.1,
    shinyPetId: -1
  },
  minLevel: 1,
  maxLevel: 100,
  level: 5,
  expReward: 100,
  catchRate: 0.5,
  expMultiplier: 1,
  catchable: true,
  dropItems: [],
  isBoss: false
})

// 精灵选项
const petOptions = ref<any[]>([])
const petLoading = ref(false)
// 物品选项
const itemOptions = ref<any[]>([])
const itemLoading = ref(false)

// 获取精灵数据（用于分页选择器）
const fetchPetData = async (query: string, page: number, pageSize: number) => {
  const res = await configApi.searchPets(query, page, pageSize) as any
  return res.data || res
}

// 获取闪光精灵数据（包含"无闪光"选项）
const fetchShinyPetData = async (query: string, page: number, pageSize: number) => {
  const res = await configApi.searchPets(query, page, pageSize) as any
  const result = res.data || res
  
  // 在第一页添加"无闪光"选项
  if (page === 1) {
    result.items = [
      { value: -1, label: '无闪光 (ID: -1)' },
      ...result.items
    ]
    result.total += 1
  }
  
  return result
}

// 获取物品数据（用于分页选择器）
const fetchItemData = async (query: string, page: number, pageSize: number) => {
  const res = await configApi.searchItems(query, page, pageSize) as any
  return res.data || res
}

// 搜索精灵（远程搜索）
const searchPets = async (query: string) => {
  if (petLoading.value) return
  
  petLoading.value = true
  try {
    const res = await configApi.searchPets(query, 1, 100) as any
    const result = res.data || res
    petOptions.value = result.items || []
  } catch (error) {
    console.error('搜索精灵失败:', error)
  } finally {
    petLoading.value = false
  }
}

// 搜索物品（远程搜索）
const searchItems = async (query: string) => {
  if (itemLoading.value) return
  
  itemLoading.value = true
  try {
    const res = await configApi.searchItems(query, 1, 100) as any
    const result = res.data || res
    itemOptions.value = result.items || []
  } catch (error) {
    console.error('搜索物品失败:', error)
  } finally {
    itemLoading.value = false
  }
}

// 加载精灵选项（初始加载前100个）
const loadPetOptions = async () => {
  if (petOptions.value.length === 0) {
    await searchPets('')
  }
}

// 加载物品选项（初始加载前100个）
const loadItemOptions = async () => {
  if (itemOptions.value.length === 0) {
    await searchItems('')
  }
}

// 编辑怪物
const handleEditOgre = async (mapId: string, index: number) => {
  editingMapId.value = mapId
  editingIndex.value = index
  
  // 立即打开对话框，显示加载状态
  editFormLoading.value = true
  editDialogVisible.value = true
  
  // 使用 requestAnimationFrame 延迟数据准备，让浏览器先渲染对话框
  await new Promise(resolve => requestAnimationFrame(resolve))
  await nextTick()
  
  try {
    const ogre = configData.value.maps[mapId].ogres[index]
    // 深拷贝
    editForm.value = JSON.parse(JSON.stringify(ogre))
    
    // 确保所有字段存在
    if (!editForm.value.refreshConfig) {
      editForm.value.refreshConfig = {
        enabled: true,
        refreshInterval: 300,
        refreshOnEmpty: false,
        refreshAtNight: true,
        refreshAtDay: true,
        startTime: '00:00',
        endTime: '23:59',
        useInterval: true,
        useSchedule: false,
        scheduleTime: [],
        shinyRate: 0.1,
        shinyPetId: -1
      }
    }
    if (!editForm.value.dropItems) {
      editForm.value.dropItems = []
    }
    if (editForm.value.shiny === undefined) {
      editForm.value.shiny = 0
    }
    if (editForm.value.level === undefined) {
      editForm.value.level = Math.floor((editForm.value.minLevel + editForm.value.maxLevel) / 2)
    }
    if (editForm.value.expMultiplier === undefined) {
      editForm.value.expMultiplier = 1
    }
  } catch (error) {
    console.error('加载怪物数据失败:', error)
    ElMessage.error('加载怪物数据失败')
    editDialogVisible.value = false
  } finally {
    editFormLoading.value = false
  }
}

// 添加怪物
const handleAddOgre = async (mapId: string) => {
  editingMapId.value = mapId
  editingIndex.value = -1
  
  // 立即打开对话框
  editFormLoading.value = true
  editDialogVisible.value = true
  
  // 使用 requestAnimationFrame 延迟数据准备
  await new Promise(resolve => requestAnimationFrame(resolve))
  await nextTick()
  
  try {
    // 获取当前地图的怪物数量，自动设置slot
    const ogres = configData.value.maps[mapId].ogres || []
    const maxSlot = ogres.length > 0 ? Math.max(...ogres.map((o: any) => o.slot)) : -1
    
    editForm.value = {
      slot: maxSlot + 1,
      petId: 0,
      shiny: 0,
      weight: 50,
      refreshConfig: {
        enabled: true,
        refreshInterval: 300,
        refreshOnEmpty: false,
        refreshAtNight: true,
        refreshAtDay: true,
        startTime: '00:00',
        endTime: '23:59',
        useInterval: true,
        useSchedule: false,
        scheduleTime: [],
        shinyRate: 0.1,
        shinyPetId: -1
      },
      minLevel: 1,
      maxLevel: 100,
      level: 5,
      expReward: 100,
      catchRate: 0.5,
      expMultiplier: 1,
      catchable: true,
      dropItems: [],
      isBoss: false
    }
  } catch (error) {
    console.error('初始化怪物数据失败:', error)
    ElMessage.error('初始化怪物数据失败')
    editDialogVisible.value = false
  } finally {
    editFormLoading.value = false
  }
}

// 保存怪物编辑
const saveOgreEdit = () => {
  // 验证
  if (!editForm.value.petId || editForm.value.petId === 0) {
    ElMessage.error('请选择精灵')
    return
  }
  
  if (editForm.value.minLevel > editForm.value.maxLevel) {
    ElMessage.error('最小等级不能大于最大等级')
    return
  }
  
  const mapId = editingMapId.value
  
  if (editingIndex.value === -1) {
    // 添加新怪物
    if (!configData.value.maps[mapId].ogres) {
      configData.value.maps[mapId].ogres = []
    }
    configData.value.maps[mapId].ogres.push(editForm.value)
    ElMessage.success('添加成功')
  } else {
    // 编辑现有怪物
    configData.value.maps[mapId].ogres[editingIndex.value] = editForm.value
    ElMessage.success('修改成功')
  }
  
  editDialogVisible.value = false
  
  // 提醒用户保存和重载配置
  ElMessageBox.alert(
    '配置已在内存中修改，请点击页面上方的"保存配置"按钮保存到文件，然后点击"重载配置"按钮使其生效。',
    '提示',
    {
      confirmButtonText: '知道了',
      type: 'warning',
      center: true
    }
  )
}

// 取消编辑
const cancelEdit = () => {
  editDialogVisible.value = false
}

// 删除怪物
const handleDeleteOgre = (mapId: string, index: number) => {
  ElMessageBox.confirm(
    '确定要删除这个怪物吗？',
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    if (configData.value?.maps[mapId]?.ogres) {
      configData.value.maps[mapId].ogres.splice(index, 1)
      ElMessage.success('已删除')
      
      // 提醒用户保存和重载配置
      ElMessageBox.alert(
        '配置已在内存中修改，请点击页面上方的"保存配置"按钮保存到文件，然后点击"重载配置"按钮使其生效。',
        '提示',
        {
          confirmButtonText: '知道了',
          type: 'warning',
          center: true
        }
      )
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 添加掉落物品
const addDropItem = () => {
  editForm.value.dropItems.push({
    itemId: 0,
    dropRate: 0.1,
    minCount: 1,
    maxCount: 3
  })
}

// 删除掉落物品
const removeDropItem = (index: number | string) => {
  const idx = typeof index === 'string' ? parseInt(index) : index
  editForm.value.dropItems.splice(idx, 1)
}

onMounted(() => {
  loadConfig()
})

// 搜索时重置页码
watch(searchQuery, () => {
  currentPage.value = 1
})
</script>

<style scoped>
/* 编辑对话框样式 */
:deep(.edit-dialog .el-dialog__body) {
  padding: 0;
  height: 60vh;
  overflow: hidden;
}

.dialog-content {
  height: 60vh;
  overflow-y: auto;
  padding: 20px;
}

/* 自定义滚动条样式 */
.dialog-content::-webkit-scrollbar {
  width: 8px;
}

.dialog-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.dialog-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.dialog-footer {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding: 12px 20px;
  background: white;
  border-top: 1px solid #e5e7eb;
}

/* 掉落物品单元格样式 */
.drop-item-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  padding: 0.25rem;
}

.drop-item-cell .item-name {
  font-size: 10px;
  color: #4b5563;
  text-align: center;
  word-break: break-all;
  line-height: 1.2;
  max-width: 100%;
  display: inline-block;
}

/* 表单标签换行样式 */
.form-label-wrap {
  display: inline-block;
  max-width: 60px;
  word-break: break-all;
  line-height: 1.3;
  text-align: right;
}

/* 确保表单项内的组件宽度正确 */
:deep(.el-form-item__content) {
  width: 100%;
  flex: 1;
}

:deep(.el-form-item__content > *) {
  width: 100%;
}

:deep(.el-form-item__content .paginated-select) {
  width: 100% !important;
  display: block;
}

:deep(.el-form-item__content .el-select) {
  width: 100% !important;
  display: block;
}

/* Element Plus 折叠面板样式覆盖 */
:deep(.el-collapse-item__header) {
  background: white;
  border: none;
  padding: 0 1rem;
  font-weight: 500;
  transition: all 0.3s;
}

:deep(.el-collapse-item__header:hover) {
  background: #f9fafb;
}

:deep(.el-collapse-item__wrap) {
  border: none;
}

:deep(.el-collapse-item__content) {
  padding: 0;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 0.5rem;
  overflow: hidden;
}

:deep(.el-table__header-wrapper) {
  border-radius: 0.5rem 0.5rem 0 0;
}

:deep(.el-table td),
:deep(.el-table th) {
  border-color: #e5e7eb;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background: #f9fafb;
}

/* 输入框样式 */
:deep(.el-input__wrapper) {
  border-radius: 0.5rem;
  transition: all 0.3s;
}

:deep(.el-input__wrapper:hover) {
  border-color: #9ca3af;
}

:deep(.el-input-number) {
  width: 100%;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 1px solid;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  position: relative;
}

.action-btn .icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  transition: margin 0.3s ease;
}

.action-btn .text {
  display: inline-block;
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.action-btn:hover {
  padding-right: 0.75rem;
}

.action-btn:hover .icon {
  margin-right: 0.375rem;
}

.action-btn:hover .text {
  max-width: 4rem;
  opacity: 1;
}

.action-btn-edit {
  color: #1f2937;
  border-color: #d1d5db;
  background: white;
}

.action-btn-edit:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.action-btn-delete {
  color: #dc2626;
  border-color: #fecaca;
  background: white;
}

.action-btn-delete:hover {
  background: #fef2f2;
  border-color: #fca5a5;
}

.action-btn-add {
  color: white;
  border-color: #1f2937;
  background: #1f2937;
}

.action-btn-add:hover {
  background: #111827;
  border-color: #111827;
}

.action-btn-add .text {
  max-width: 0;
  opacity: 0;
}

.action-btn-add:hover .text {
  max-width: 6rem;
  opacity: 1;
}

/* 自定义开关样式 */
.custom-switch-wrapper {
  display: inline-block;
}

.custom-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2rem;
  padding: 0.25rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  outline: none;
  font-size: 0.875rem;
  font-weight: 500;
}

.custom-switch:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgba(31, 41, 55, 0.1);
}

.custom-switch-off {
  background: #e5e7eb;
  color: #6b7280;
  padding-right: 0.75rem;
}

.custom-switch-off:hover {
  background: #d1d5db;
}

.custom-switch-on {
  background: #1f2937;
  color: white;
  padding-left: 0.75rem;
  flex-direction: row-reverse;
}

.custom-switch-on:hover {
  background: #111827;
}

.custom-switch-slider {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  background: white;
  border-radius: 9999px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.custom-switch-on .custom-switch-slider {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.custom-switch-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-switch-off .custom-switch-icon {
  color: #9ca3af;
}

.custom-switch-on .custom-switch-icon {
  color: #1f2937;
}

.custom-switch-label {
  user-select: none;
  white-space: nowrap;
}
</style>
