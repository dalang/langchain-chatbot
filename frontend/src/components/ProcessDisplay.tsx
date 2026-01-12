import React from 'react'
import { Collapse, Tag, Flex, Typography, Divider } from 'antd'
import {
  BulbOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { Message } from '../types'

interface ProcessDisplayProps {
  message: Message
}

const formatDuration = (ms?: number | null): string => {
  if (!ms) return ''
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

const ProcessDisplay: React.FC<ProcessDisplayProps> = ({ message }) => {
  const { thought, thought_duration_ms, tool_steps } = message

  if (!thought && (!tool_steps || tool_steps.length === 0)) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <LoadingOutlined spin style={{ color: '#1890ff', fontSize: '14px' }} />
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '14px' }} />
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '14px' }} />
      default:
        return null
    }
  }

  const getStatusTag = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'default',
      running: 'processing',
      completed: 'success',
      failed: 'error',
    }
    return <Tag color={colors[status] || 'default'}>{status}</Tag>
  }

  const totalToolDuration = tool_steps?.reduce((sum, step) => sum + (step.duration_ms || 0), 0) || 0
  const completedToolCount = tool_steps?.filter((s) => s.status === 'completed').length || 0

  const summaryParts: React.ReactNode[] = []

  if (thought && thought_duration_ms) {
    summaryParts.push(
      <Flex key="thought" gap="4" align="center">
        <BulbOutlined style={{ color: '#faad14' }} />
        <span style={{ color: '#8c8c8c', fontSize: '13px' }}>已思考 {formatDuration(thought_duration_ms)}</span>
      </Flex>
    )
  }

  if (tool_steps && tool_steps.length > 0) {
    summaryParts.push(
      <Flex key="tools" gap="4" align="center">
        <ToolOutlined style={{ color: '#1890ff' }} />
        <span style={{ color: '#8c8c8c', fontSize: '13px' }}>
          工具调用 {completedToolCount}/{tool_steps.length} 次
          {totalToolDuration > 0 && ` (${formatDuration(totalToolDuration)})`}
        </span>
      </Flex>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      <Collapse
        size="small"
        ghost
        items={[
          {
            key: 'process',
            label: (
              <Flex gap="small" align="center">
                {summaryParts}
              </Flex>
            ),
              children: (
              <Flex vertical gap="small" style={{ width: '100%' }}>
                {thought && (
                  <div
                    style={{
                      padding: '12px',
                      background: '#fffbe6',
                      border: '1px solid #ffe58f',
                      borderRadius: '6px',
                    }}
                  >
                    <Flex gap="small" align="center" style={{ marginBottom: '8px' }}>
                      <BulbOutlined style={{ color: '#faad14' }} />
                      <Typography.Text strong style={{ color: '#d46b08' }}>
                        思考过程
                      </Typography.Text>
                      {thought_duration_ms && (
                        <Flex gap="4" align="center" style={{ marginLeft: 'auto' }}>
                          <ClockCircleOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />
                          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                            {formatDuration(thought_duration_ms)}
                          </Typography.Text>
                        </Flex>
                      )}
                    </Flex>
                    <Typography.Paragraph
                      style={{ margin: 0, fontSize: '13px', lineHeight: '1.6' }}
                    >
                      {thought}
                    </Typography.Paragraph>
                  </div>
                )}

                {tool_steps && tool_steps.length > 0 && (
                  <>
                    {thought && <Divider style={{ margin: '8px 0' }} />}
                    <Flex vertical gap="small">
                      {tool_steps.map((step, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '10px',
                            background:
                              step.status === 'running'
                                ? '#e6f7ff'
                                : step.status === 'failed'
                                  ? '#fff1f0'
                                  : '#fafafa',
                            borderRadius: '6px',
                            border: '1px solid #d9d9d9',
                          }}
                        >
                          <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                            <Flex gap="small" align="center">
                              {getStatusIcon(step.status)}
                              <RightOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />
                              <Typography.Text strong style={{ fontSize: '13px' }}>
                                {step.tool_name}
                              </Typography.Text>
                              {getStatusTag(step.status)}
                            </Flex>
                            {step.duration_ms && (
                              <Flex gap="4" align="center">
                                <ClockCircleOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />
                                <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                  {formatDuration(step.duration_ms)}
                                </Typography.Text>
                              </Flex>
                            )}
                          </Flex>

                          {step.tool_input && (
                            <div
                              style={{
                                marginTop: '8px',
                                padding: '8px',
                                background: '#f5f5f5',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              <Typography.Text type="secondary" style={{ fontSize: '11px' }}>
                                输入:
                              </Typography.Text>
                              <pre style={{ margin: 0, marginTop: '4px' }}>
                                {JSON.stringify(step.tool_input, null, 2)}
                              </pre>
                            </div>
                          )}

                          {step.tool_output && (
                            <div
                              style={{
                                marginTop: '8px',
                                padding: '8px',
                                background: '#f0f9ff',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              <Typography.Text type="secondary" style={{ fontSize: '11px' }}>
                                输出:
                              </Typography.Text>
                              <pre style={{ margin: 0, marginTop: '4px' }}>
                                {step.tool_output}
                              </pre>
                            </div>
                          )}

                          {step.tool_error && (
                            <div
                              style={{
                                marginTop: '8px',
                                padding: '8px',
                                background: '#fff1f0',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              <Typography.Text type="danger" style={{ fontSize: '11px' }}>
                                错误:
                              </Typography.Text>
                              <pre style={{ margin: 0, marginTop: '4px', color: '#ff4d4f' }}>
                                {step.tool_error}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </Flex>
                  </>
                )}
              </Flex>
            ),
          },
        ]}
      />
    </div>
  )
}

export default ProcessDisplay
