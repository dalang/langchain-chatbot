import React, { useState } from 'react'
import { Input, Button, Flex, Space } from 'antd'
import { SendOutlined, ClearOutlined, StopOutlined } from '@ant-design/icons'

interface InputAreaProps {
  onSend: (message: string) => void
  onClear: () => void
  onCancel: () => void
  isLoading: boolean
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, onClear, onCancel, isLoading }) => {
  const [inputValue, setInputValue] = useState('')

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return

    onSend(inputValue)
    setInputValue('')
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      style={{
        padding: '16px',
        borderTop: '1px solid #f0f0f0',
        background: '#fff',
        flexShrink: 0,
      }}
    >
      <Flex gap="small" align="flex-end">
        <Input.TextArea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={handleKeyPress}
          placeholder="输入消息... (Shift+Enter 换行)"
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={isLoading}
          style={{ flex: 1 }}
        />
        <Space>
          <Button icon={<ClearOutlined />} onClick={onClear} disabled={isLoading}>
            清空
          </Button>
          {isLoading && (
            <Button icon={<StopOutlined />} onClick={onCancel}>
              停止
            </Button>
          )}
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={isLoading}
          >
            发送
          </Button>
        </Space>
      </Flex>
    </div>
  )
}

export default InputArea
