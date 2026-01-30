export interface ConfigField {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'boolean' | 'textarea'
  required: boolean
  options?: string | string[]
  multiple?: boolean
  min?: number
  max?: number
  step?: number
}

export interface ConfigMetadata {
  name: string
  fields: ConfigField[]
}

export interface ConfigData {
  [key: string]: any
}

export interface SelectOption {
  value: number | string
  label: string
}
