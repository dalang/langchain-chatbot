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
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons'
import { Message, ToolStep } from '../types'
import ToolOutputDisplay from './ToolOutputDisplay'

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

  const [collapsedSteps, setCollapsedSteps] = React.useState<Record<number, boolean>>({})

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

  const toggleStep = (index: number) => {
    setCollapsedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const isStepExpanded = (step: ToolStep, index: number): boolean => {
    if (step.status === 'running') return true
    if (step.status === 'failed') return true
    return !collapsedSteps[index]
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
                      {tool_steps.map((step, index) => {
                        const isExpanded = isStepExpanded(step, index)
                        return (
                          <div
                            key={index}
                            style={{
                              borderRadius: '6px',
                              border: '1px solid #d9d9d9',
                              background:
                                step.status === 'running'
                                  ? '#e6f7ff'
                                  : step.status === 'failed'
                                    ? '#fff1f0'
                                    : '#fafafa',
                            }}
                          >
                            <div
                              onClick={() => toggleStep(index)}
                              style={{
                                cursor: 'pointer',
                                padding: '10px',
                                borderRadius: '6px 6px 0 0',
                                transition: 'background 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  step.status === 'running'
                                    ? '#bae7ff'
                                    : step.status === 'failed'
                                      ? '#ffccc7'
                                      : '#f5f5f5'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  step.status === 'running'
                                    ? '#e6f7ff'
                                    : step.status === 'failed'
                                      ? '#fff1f0'
                                      : '#fafafa'
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
                                <Flex gap="small" align="center">
                                  {step.duration_ms && (
                                    <Flex gap="4" align="center">
                                      <ClockCircleOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />
                                      <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                        {formatDuration(step.duration_ms)}
                                      </Typography.Text>
                                    </Flex>
                                  )}
                                  {isExpanded ? <UpOutlined /> : <DownOutlined />}
                                </Flex>
                              </Flex>
                            </div>

                            <div
                              style={{
                                padding: isExpanded ? '0 10px 10px 10px' : '0 10px 10px 10px',
                              }}
                            >
                              {step.tool_input && (
                                <ToolOutputDisplay
                                  content={step.tool_input}
                                  label="输入:"
                                  type="input"
                                />
                              )}

                              {isExpanded && (
                                <>
                                  {step.tool_output && (
                                    <ToolOutputDisplay
                                      content={step.tool_output}
                                      label="输出:"
                                      type="output"
                                    />
                                  )}

                                  {step.tool_error && (
                                    <ToolOutputDisplay
                                      content={step.tool_error}
                                      label="错误:"
                                      type="error"
                                    />
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
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
