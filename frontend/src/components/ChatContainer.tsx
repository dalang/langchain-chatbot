import React from 'react'
import { Card, Flex } from 'antd'
import MessageList from './MessageList'
import InputArea from './InputArea'
import ToolDisplay from './ToolDisplay'
import useChat from '../hooks/useChat'

const ChatContainer: React.FC = () => {
  const {
    messages,
    isLoading,
    currentStreamingMessage,
    toolSteps,
    sendMessage,
  } = useChat()

  return (
    <Card
      title="LangChain 智能助手"
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
          toolSteps={toolSteps}
        />
        <ToolDisplay toolSteps={toolSteps} />
        <InputArea onSend={sendMessage} isLoading={isLoading} />
      </Flex>
    </Card>
  )
}

export default ChatContainer
