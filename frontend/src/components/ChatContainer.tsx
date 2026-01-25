import React, { useState } from 'react'
import { Card, Flex, Tag, theme } from 'antd'
import { SettingOutlined, InfoCircleOutlined, BugOutlined } from '@ant-design/icons'
import MessageList from './MessageList'
import InputArea from './InputArea'
import SettingsModal from './SettingsModal'
import ConfigModal from './ConfigModal'
import DebugPanel from './DebugPanel'
import useChat from '../hooks/useChat'
import useSettingsStore from '../store/settingsStore'

const ChatContainer: React.FC = () => {
  const { token } = theme.useToken()
  const {
    messages,
    isLoading,
    currentStreamingMessage,
    sendMessage,
    clearMessages,
  } = useChat()

  const { debugMode } = useSettingsStore()
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [configVisible, setConfigVisible] = useState(false)

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '90vh', gap: 16 }}>
        <Card
          title={
            <Flex align="center" gap={8}>
              <span>LangChain 智能助手</span>
              {debugMode && (
                <Tag icon={<BugOutlined />} color="error" style={{ margin: 0 }}>
                  DEBUG MODE
                </Tag>
              )}
            </Flex>
          }
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
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            border: debugMode ? `1px solid ${token.colorError}` : undefined,
          }}
          headStyle={{
            backgroundColor: debugMode ? token.colorErrorBg : undefined,
            borderBottom: debugMode ? `1px solid ${token.colorErrorBorder}` : undefined,
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

        {debugMode && <DebugPanel />}
      </div>

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
