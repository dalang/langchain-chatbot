import React, { useState } from 'react'
import { Card, Flex } from 'antd'
import { SettingOutlined, InfoCircleOutlined } from '@ant-design/icons'
import MessageList from './MessageList'
import InputArea from './InputArea'
import SettingsModal from './SettingsModal'
import ConfigModal from './ConfigModal'
import useChat from '../hooks/useChat'

const ChatContainer: React.FC = () => {
  const {
    messages,
    isLoading,
    currentStreamingMessage,
    sendMessage,
    clearMessages,
  } = useChat()

  const [settingsVisible, setSettingsVisible] = useState(false)
  const [configVisible, setConfigVisible] = useState(false)

  return (
    <>
      <Card
        title="LangChain 智能助手"
        extra={
          <Flex gap={12}>
            <InfoCircleOutlined
              onClick={() => setConfigVisible(true)}
              style={{ cursor: 'pointer', fontSize: 16 }}
            />
            <SettingOutlined
              onClick={() => setSettingsVisible(true)}
              style={{ cursor: 'pointer', fontSize: 16 }}
            />
          </Flex>
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
          />
          <InputArea onSend={sendMessage} onClear={clearMessages} isLoading={isLoading} />
        </Flex>
      </Card>
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
      <ConfigModal
        visible={configVisible}
        onClose={() => setConfigVisible(false)}
      />
    </>
  )
}

export default ChatContainer
