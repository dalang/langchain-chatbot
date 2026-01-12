import React, { useEffect, useRef, useCallback, useMemo } from 'react'
import { Bubble } from '@ant-design/x'
import { Flex, Avatar, Tag, Button, Tooltip, message } from 'antd'
import { RobotOutlined, UserOutlined, BulbOutlined, CopyOutlined } from '@ant-design/icons'
import { Message, ToolStep } from '../types'

interface MessageListProps {
  messages: Message[]
  currentStreamingMessage: string
  currentThought?: string
  toolSteps: ToolStep[]
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentStreamingMessage,
  currentThought,
  toolSteps,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      message.success('已复制到剪贴板')
    } catch (error) {
      message.error('复制失败')
    }
  }, [])

  const aiStyles = useMemo(
    () => ({
      content: {
        backgroundColor: '#f0f7ff',
        color: '#1a1a1a',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        padding: '12px 16px',
      },
      avatar: {
        backgroundColor: '#1890ff',
      },
    }),
    []
  )

  const userStyles = useMemo(
    () => ({
      content: {
        backgroundColor: '#1890ff',
        color: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 6px rgba(24, 144, 255, 0.25)',
        padding: '12px 16px',
        fontWeight: 500,
      },
      avatar: {
        backgroundColor: '#52c41a',
      },
    }),
    []
  )

  const CopyButton = ({ content }: { content: string }) => (
    <Tooltip title="复制">
      <Button
        type="text"
        size="small"
        icon={<CopyOutlined />}
        onClick={() => handleCopy(content)}
        style={{
          opacity: 0.5,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.5'
        }}
      />
    </Tooltip>
  )

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, currentStreamingMessage, currentThought, toolSteps])

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
          <Flex
            key={msg.id}
            gap="small"
            align={msg.role === 'user' ? 'flex-end' : 'flex-start'}
            style={{
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            }}
          >
            <Bubble
              role={msg.role === 'user' ? 'user' : 'assistant'}
              content={msg.content || ''}
              avatar={
                msg.role === 'user' ? (
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />
                ) : (
                  <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
                )
              }
              styles={msg.role === 'user' ? userStyles : aiStyles}
              placement={msg.role === 'user' ? 'end' : 'start'}
              variant="filled"
              typing={msg.role === 'assistant'}
            />
            {msg.role === 'assistant' && <CopyButton content={msg.content || ''} />}
          </Flex>
        ))}

        {currentThought && (
          <Flex gap="small" align="start" style={{ marginLeft: '8px' }}>
            <Avatar icon={<RobotOutlined />} size="small" />
            <Flex vertical gap="small" style={{ flex: 1 }}>
              <Tag icon={<BulbOutlined />} color="processing">
                思考中
              </Tag>
              <div
                style={{
                  background: '#f0f0f0',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              >
                {currentThought}
              </div>
            </Flex>
          </Flex>
        )}

        {currentStreamingMessage && (
          <Flex gap="small" align="flex-start">
            <Bubble
              key="streaming"
              role="assistant"
              content={currentStreamingMessage}
              avatar={<Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />}
              styles={aiStyles}
              placement="start"
              variant="filled"
              typing
            />
            <CopyButton content={currentStreamingMessage} />
          </Flex>
        )}
      </Flex>
    </div>
  )
}

export default MessageList
