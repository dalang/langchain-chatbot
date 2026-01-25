import React, { useState } from 'react'
import { Input, Button, Flex, Space } from 'antd'
import { SendOutlined, ClearOutlined } from '@ant-design/icons'

const StopSquare = () => (
  <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor">
    <rect width="16" height="16" rx="2" fill="#ff4d4f" />
  </svg>
)

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

  const handleButtonClick = () => {
    if (isLoading) {
      onCancel()
    } else {
      handleSend()
    }
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
      <div>
        <Flex gap="small" align="flex-end" className="input-area-flex">
          <Input.TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleKeyPress}
            placeholder="输入消息... (Shift+Enter 换行)"
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={isLoading}
            style={{ flex: 1 }}
          />
          <Space className="input-area-space">
            <Button icon={<ClearOutlined />} onClick={onClear} disabled={isLoading}>
              清空
            </Button>
            <Button
              type="primary"
              icon={isLoading ? <StopSquare /> : <SendOutlined />}
              onClick={handleButtonClick}
            >
              {isLoading ? '发送中' : '发送'}
            </Button>
          </Space>
        </Flex>
        <style>{`
          .input-area-flex {
            display: flex;
            flex-direction: row;
            align-items: flex-end;
            gap: 8px;
          }
          .input-area-flex > :first-child {
            flex: 1;
          }
          .input-area-space {
            display: flex;
            flex-direction: row;
            gap: 8px;
          }
          @media (max-width: 767px) {
            .input-area-flex {
              flex-direction: column;
              align-items: stretch;
              gap: 8px;
            }
            .input-area-flex > :first-child {
              width: 100%;
              flex: none;
            }
            .input-area-space {
              flex-direction: column;
              width: 100%;
              gap: 8px;
            }
            .input-area-space .ant-btn {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  )
}

export default InputArea
