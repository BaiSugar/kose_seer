<template>
  <div class="space-y-8">
    <!-- Buttons -->
    <Card title="按钮组件">
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <Button variant="primary">主要按钮</Button>
          <Button variant="secondary">次要按钮</Button>
          <Button variant="success">成功按钮</Button>
          <Button variant="danger">危险按钮</Button>
          <Button variant="warning">警告按钮</Button>
          <Button variant="ghost">幽灵按钮</Button>
        </div>
        <div class="flex items-center gap-3">
          <Button variant="primary" size="small">小按钮</Button>
          <Button variant="primary" size="default">默认按钮</Button>
          <Button variant="primary" size="large">大按钮</Button>
        </div>
        <div class="flex items-center gap-3">
          <Button variant="primary" :loading="true">加载中</Button>
          <Button variant="primary" :disabled="true">禁用按钮</Button>
        </div>
      </div>
    </Card>

    <!-- Inputs -->
    <Card title="输入框组件">
      <div class="space-y-4 max-w-md">
        <Input
          v-model="demoInput"
          label="基本输入框"
          placeholder="请输入内容"
        />
        <Input
          v-model="demoInput"
          label="必填输入框"
          placeholder="请输入内容"
          :required="true"
        />
        <Input
          v-model="demoInput"
          label="带提示的输入框"
          placeholder="请输入内容"
          hint="这是一个提示信息"
        />
        <Input
          v-model="demoInput"
          label="错误状态"
          placeholder="请输入内容"
          error="这是一个错误信息"
        />
        <Input
          v-model="demoInput"
          label="禁用状态"
          placeholder="请输入内容"
          :disabled="true"
        />
      </div>
    </Card>

    <!-- Select -->
    <Card title="选择器组件">
      <div class="space-y-4 max-w-md">
        <Select
          v-model="demoSelect"
          label="基本选择器"
          :options="selectOptions"
          placeholder="请选择"
        />
        <Select
          v-model="demoSelect"
          label="必填选择器"
          :options="selectOptions"
          :required="true"
        />
        <Select
          v-model="demoSelect"
          label="带提示的选择器"
          :options="selectOptions"
          hint="这是一个提示信息"
        />
      </div>
    </Card>

    <!-- Switch -->
    <Card title="开关组件">
      <div class="space-y-4">
        <Switch v-model="demoSwitch1" label="基本开关" />
        <Switch v-model="demoSwitch2" label="默认开启" />
        <Switch v-model="demoSwitch3" label="禁用状态" :disabled="true" />
      </div>
    </Card>

    <!-- Badges -->
    <Card title="徽章组件">
      <div class="flex items-center gap-3">
        <Badge variant="default">默认</Badge>
        <Badge variant="success">成功</Badge>
        <Badge variant="warning">警告</Badge>
        <Badge variant="danger">危险</Badge>
        <Badge variant="info">信息</Badge>
      </div>
    </Card>

    <!-- Alerts -->
    <Card title="警告框组件">
      <div class="space-y-4">
        <Alert variant="info" title="信息提示">
          这是一条信息提示内容
        </Alert>
        <Alert variant="success" title="成功提示">
          这是一条成功提示内容
        </Alert>
        <Alert variant="warning" title="警告提示">
          这是一条警告提示内容
        </Alert>
        <Alert variant="danger" title="错误提示">
          这是一条错误提示内容
        </Alert>
        <Alert variant="info" title="可关闭的提示" :closable="true">
          这是一条可以关闭的提示内容
        </Alert>
      </div>
    </Card>

    <!-- Table -->
    <Card title="表格组件">
      <Table :columns="tableColumns" :data="tableData">
        <template #cell-status="{ row }">
          <Badge :variant="row.status === '在线' ? 'success' : 'default'">
            {{ row.status }}
          </Badge>
        </template>
        <template #cell-actions="{ row }">
          <div class="flex gap-2">
            <Button size="small" variant="primary">编辑</Button>
            <Button size="small" variant="danger">删除</Button>
          </div>
        </template>
      </Table>
    </Card>

    <!-- Pagination -->
    <Card title="分页组件">
      <Pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="100"
      />
    </Card>

    <!-- Modal -->
    <Card title="模态框组件">
      <Button variant="primary" @click="showModal = true">打开模态框</Button>
      
      <Modal v-model="showModal" title="示例模态框">
        <p class="text-gray-600">这是模态框的内容区域</p>
        <template #footer>
          <Button variant="secondary" @click="showModal = false">取消</Button>
          <Button variant="primary" @click="showModal = false">确定</Button>
        </template>
      </Modal>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button, Input, Select, Switch, Table, Pagination, Card, Badge, Alert, Modal } from '@/components/ui'

const demoInput = ref('')
const demoSelect = ref('')
const demoSwitch1 = ref(false)
const demoSwitch2 = ref(true)
const demoSwitch3 = ref(false)
const showModal = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)

const selectOptions = [
  { label: '选项一', value: '1' },
  { label: '选项二', value: '2' },
  { label: '选项三', value: '3' }
]

const tableColumns = [
  { key: 'id', label: 'ID', width: '80px' },
  { key: 'name', label: '姓名', width: '150px' },
  { key: 'email', label: '邮箱', width: '200px' },
  { key: 'status', label: '状态', width: '100px' },
  { key: 'actions', label: '操作', width: '150px' }
]

const tableData = [
  { id: 1, name: '张三', email: 'zhangsan@example.com', status: '在线' },
  { id: 2, name: '李四', email: 'lisi@example.com', status: '离线' },
  { id: 3, name: '王五', email: 'wangwu@example.com', status: '在线' }
]
</script>
