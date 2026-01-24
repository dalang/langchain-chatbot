import React, { useEffect, useRef, useCallback, useMemo, memo, useTransition } from 'react'
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

const CopyButton = memo(({ content, onCopy }: { content: string; onCopy: (text: string) => void }) => (
  <Tooltip title="复制">
    <Button
      type="text"
      size="small"
      icon={<CopyOutlined />}
      onClick={() => onCopy(content)}
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
))

const MessageContent = memo(({ content, isStreaming }: { content: string; isStreaming?: boolean }) => {
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
})

const MessageItem = memo(({ message, aiStyles, userStyles, onCopy }: {
  message: Message
  aiStyles: any
  userStyles: any
  onCopy: (text: string) => void
}) => {
  const hasContent = message.content !== null && message.content !== undefined && message.content !== ''

  return (
    <Flex
      vertical
      gap="small"
      align={message.role === 'user' ? 'flex-end' : 'flex-start'}
    >
      {message.role === 'assistant' && <ProcessDisplay key={`process-${message.id}`} message={message} />}

      {hasContent && (
        <Flex
          gap="small"
          align={message.role === 'user' ? 'flex-end' : 'flex-start'}
          style={{
            flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
          }}
        >
          {message.role === 'assistant' ? (
            <div
              style={{
                ...aiStyles.content,
                maxWidth: '600px',
                wordBreak: 'break-word',
              }}
            >
              <MessageContent content={message.content || ''} isStreaming={false} />
            </div>
          ) : (
            <Bubble
              role="user"
              content={message.content || ''}
              avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />}
              styles={userStyles}
              placement="end"
              variant="filled"
            />
          )}
          {message.role === 'assistant' && <CopyButton content={message.content || ''} onCopy={onCopy} />}
        </Flex>
      )}
    </Flex>
  )
})

const StreamingMessageItem = memo(({ content, aiStyles, onCopy }: {
  content: string
  aiStyles: any
  onCopy: (text: string) => void
}) => (
  <Flex vertical gap="small" align="flex-start">
    <Flex gap="small" align="flex-start">
      <div
        style={{
          ...aiStyles.content,
          maxWidth: '600px',
          wordBreak: 'break-word',
        }}
      >
        <MessageContent content={content} isStreaming={true} />
      </div>
      <CopyButton content={content} onCopy={onCopy} />
    </Flex>
  </Flex>
))

const MessageList: React.FC<MessageListProps> = ({ messages, currentStreamingMessage }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [, startTransition] = useTransition()
  const lastScrollHeightRef = useRef(0)

  console.log('MessageList render:', { messagesCount: messages.length, hasStreaming: !!currentStreamingMessage })

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

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const newScrollHeight = scrollRef.current.scrollHeight
      if (newScrollHeight !== lastScrollHeightRef.current) {
        startTransition(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = newScrollHeight
            lastScrollHeightRef.current = newScrollHeight
          }
        })
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentStreamingMessage, scrollToBottom])

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
          <MessageItem
            key={msg.id}
            message={msg}
            aiStyles={aiStyles}
            userStyles={userStyles}
            onCopy={handleCopy}
          />
        ))}

        {currentStreamingMessage && (
          <StreamingMessageItem
            content={currentStreamingMessage}
            aiStyles={aiStyles}
            onCopy={handleCopy}
          />
        )}
      </Flex>
    </div>
  )
}

export default MessageList
