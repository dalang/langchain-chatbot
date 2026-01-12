import React, { useState } from 'react'
import { Card, Flex } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import MessageList from './MessageList'
import InputArea from './InputArea'
import ToolDisplay from './ToolDisplay'
import SettingsModal from './SettingsModal'
import useChat from '../hooks/useChat'

const ChatContainer: React.FC = () => {
  const {
    messages,
    isLoading,
    currentStreamingMessage,
    currentThought,
    toolSteps,
    sendMessage,
    clearMessages,
  } = useChat()

  const [settingsVisible, setSettingsVisible] = useState(false)

  return (
    <>
      <Card
        title="LangChain 智能助手"
        extra={
          <SettingOutlined
            onClick={() => setSettingsVisible(true)}
            style={{ cursor: 'pointer' }}
          />
        }
        style={{
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        bodyStyle={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        <Flex vertical style={{ flex: 1, overflow: 'hidden' }}>
          <MessageList
            messages={messages}
            currentStreamingMessage={currentStreamingMessage}
            currentThought={currentThought}
            toolSteps={toolSteps}
          />
          <ToolDisplay toolSteps={toolSteps} />
          <InputArea onSend={sendMessage} onClear={clearMessages} isLoading={isLoading} />
        </Flex>
      </Card>
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </>
  )
}

export default ChatContainer
