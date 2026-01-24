import React from 'react'
import { Collapse, Tag, Flex, Typography } from 'antd'
import {
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons'
import { ToolStep } from '../types'
import ToolOutputDisplay from './ToolOutputDisplay'

interface ToolDisplayProps {
  toolSteps: ToolStep[]
}

const ToolDisplay: React.FC<ToolDisplayProps> = ({ toolSteps }) => {
  const [collapsedSteps, setCollapsedSteps] = React.useState<Record<number, boolean>>({})

  if (toolSteps.length === 0) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <LoadingOutlined spin style={{ color: '#1890ff' }} />
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
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

  return (
    <div style={{ padding: '0 16px 16px 16px' }}>
      <Collapse
        defaultActiveKey={['tools']}
        items={[
          {
            key: 'tools',
            label: (
              <Flex gap="small" align="center">
                <span>工具执行步骤</span>
                <Tag color="blue">{toolSteps.length}</Tag>
              </Flex>
            ),
            children: (
              <Flex vertical gap="small" style={{ width: '100%' }}>
                {toolSteps.map((step, index) => {
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
                        <Flex
                          justify="space-between"
                          align="center"
                          style={{ width: '100%' }}
                        >
                          <Flex gap="small" align="center">
                            {getStatusIcon(step.status)}
                            <Typography.Text strong style={{ fontSize: '13px' }}>
                              {step.tool_name}
                            </Typography.Text>
                            {getStatusTag(step.status)}
                          </Flex>
                          <Flex gap="small" align="center">
                            {step.duration_ms && (
                              <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                {step.duration_ms}ms
                              </Typography.Text>
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
                                label="结果:"
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
            ),
          },
        ]}
      />
    </div>
  )
}

export default ToolDisplay
