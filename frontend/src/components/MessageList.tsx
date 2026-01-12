import React, { useEffect, useRef } from 'react'
import { Bubble, type BubbleProps } from '@ant-design/x'
import { Flex, Avatar } from 'antd'
import { RobotOutlined, UserOutlined } from '@ant-design/icons'
import { Message, ToolStep } from '../types'

interface MessageListProps {
  messages: Message[]
  currentStreamingMessage: string
  toolSteps: ToolStep[]
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentStreamingMessage,
  toolSteps,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const roleConfig: BubbleProps['role'] = {
    ai: {
      typing: true,
      avatar: () => <Avatar icon={<RobotOutlined />} />,
      variant: 'filled',
      placement: 'start',
      styles: {
        content: { backgroundColor: '#f5f5f5', color: '#000' },
      },
    },
    user: {
      typing: false,
      avatar: () => <Avatar icon={<UserOutlined />} />,
      variant: 'filled',
      placement: 'end',
      styles: {
        content: { backgroundColor: '#1890ff', color: '#fff' },
      },
    },
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, currentStreamingMessage, toolSteps])

  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        background: '#fafafa',
      }}
    >
      <Flex vertical gap="small">
        {messages.map((msg) => (
          <Bubble
            key={msg.id}
            role={msg.role === 'user' ? 'user' : 'ai'}
            content={msg.content || ''}
            typing={
              msg.role === 'ai'
                ? {
                    effect: 'typing',
                    step: 5,
                    interval: 50,
                  }
                : false
            }
          />
        ))}

        {currentStreamingMessage && (
          <Bubble
            key="streaming"
            role="ai"
            content={currentStreamingMessage}
            typing={{
              effect: 'typing',
              step: 5,
              interval: 50,
            }}
          />
        )}
      </Flex>
    </div>
  )
}

export default MessageList
