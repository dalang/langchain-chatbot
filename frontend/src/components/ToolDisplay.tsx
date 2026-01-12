import React from 'react'
import { Collapse, Tag, Flex, Typography } from 'antd'
import {
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { ToolStep } from '../types'

interface ToolDisplayProps {
  toolSteps: ToolStep[]
}

const ToolDisplay: React.FC<ToolDisplayProps> = ({ toolSteps }) => {
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
                {toolSteps.map((step, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '8px',
                      background:
                        step.status === 'running' ? '#e6f7ff' : '#fafafa',
                      borderRadius: '4px',
                    }}
                  >
                    <Flex
                      justify="space-between"
                      align="center"
                      style={{ width: '100%' }}
                    >
                      <Flex gap="small" align="center">
                        {getStatusIcon(step.status)}
                        <Typography.Text strong>
                          {step.tool_name}
                        </Typography.Text>
                        {getStatusTag(step.status)}
                      </Flex>
                      {step.duration_ms && (
                        <Typography.Text type="secondary">
                          {step.duration_ms}ms
                        </Typography.Text>
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
                        <Typography.Text type="secondary">输入:</Typography.Text>
                        <pre style={{ margin: 0 }}>
                          {JSON.stringify(step.tool_input, null, 2)}
                        </pre>
                      </div>
                    )}

                    {step.tool_output && (
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
                        <Typography.Text type="secondary">结果:</Typography.Text>
                        <pre style={{ margin: 0 }}>{step.tool_output}</pre>
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
                        <Typography.Text type="danger">错误:</Typography.Text>
                        <pre style={{ margin: 0, color: '#ff4d4f' }}>
                          {step.tool_error}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </Flex>
            ),
          },
        ]}
      />
    </div>
  )
}

export default ToolDisplay
