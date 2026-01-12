import React, { useEffect, useRef, useCallback, useMemo } from 'react'
import { Bubble } from '@ant-design/x'
import { Flex, Avatar, Button, Tooltip, message } from 'antd'
import { UserOutlined, CopyOutlined } from '@ant-design/icons'
import { XMarkdown } from '@ant-design/x-markdown'
import { Message } from '../types'
import ProcessDisplay from './ProcessDisplay'

interface MessageListProps {
  messages: Message[]
  currentStreamingMessage: string
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentStreamingMessage }) => {
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

  const MessageContent = ({ content, isStreaming }: { content: string; isStreaming?: boolean }) => {
    // 流式输出时：显示纯文本 + 打字机光标效果（避免markdown渲染导致的抖动）
    // 输出完成后：显示完整的markdown渲染
    if (isStreaming) {
      return (
        <div
          style={{
            fontSize: '14px',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {content}
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '18px',
              backgroundColor: '#1890ff',
              marginLeft: '4px',
              animation: 'blink 1s infinite',
              verticalAlign: 'text-bottom',
              borderRadius: '2px',
            }}
          />
          <style>{`
            @keyframes blink {
              0%, 50% { opacity: 1; }
              51%, 100% { opacity: 0; }
            }
          `}</style>
        </div>
      )
    }

    // 非流式输出：使用完整的markdown渲染
    return (
      <XMarkdown
        style={{
          fontSize: '14px',
          lineHeight: '1.6',
        }}
      >
        {content}
      </XMarkdown>
    )
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, currentStreamingMessage])

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
            vertical
            gap="small"
            align={msg.role === 'user' ? 'flex-end' : 'flex-start'}
          >
            {msg.role === 'assistant' && <ProcessDisplay key={`process-${msg.id}`} message={msg} />}

            <Flex
              gap="small"
              align={msg.role === 'user' ? 'flex-end' : 'flex-start'}
              style={{
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
               {msg.role === 'assistant' ? (
                 <div
                   style={{
                     ...aiStyles.content,
                     maxWidth: '600px',
                     wordBreak: 'break-word',
                   }}
                 >
                   <MessageContent content={msg.content || ''} isStreaming={false} />
                 </div>
               ) : (
                <Bubble
                  role="user"
                  content={msg.content || ''}
                  avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />}
                  styles={userStyles}
                  placement="end"
                  variant="filled"
                />
              )}
              {msg.role === 'assistant' && <CopyButton content={msg.content || ''} />}
            </Flex>
          </Flex>
        ))}

        {currentStreamingMessage && (
          <Flex vertical gap="small" align="flex-start">
            <Flex gap="small" align="flex-start">
              <div
                style={{
                  ...aiStyles.content,
                  maxWidth: '600px',
                  wordBreak: 'break-word',
                }}
              >
                <MessageContent content={currentStreamingMessage} isStreaming={true} />
              </div>
              <CopyButton content={currentStreamingMessage} />
            </Flex>
          </Flex>
        )}
      </Flex>
    </div>
  )
}

export default MessageList
