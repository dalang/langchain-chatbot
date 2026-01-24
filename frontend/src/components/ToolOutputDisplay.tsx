import React, { useState } from 'react'
import { Typography, Button, message } from 'antd'
import { CopyOutlined, CheckOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'

interface ToolOutputDisplayProps {
  content: string | object | null | undefined
  label?: string
  type?: 'input' | 'output' | 'error'
  maxLines?: number
}

const ToolOutputDisplay: React.FC<ToolOutputDisplayProps> = ({
  content,
  label,
  type = 'output',
  maxLines = 10,
}) => {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  if (content === null || content === undefined || content === '') return null

  let displayContent: string
  let isJson = false

  try {
    if (typeof content === 'string') {
        const trimmed = content.trim()
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
             const parsed = JSON.parse(content)
             displayContent = JSON.stringify(parsed, null, 2)
             isJson = true
        } else {
             displayContent = content
        }
    } else {
        displayContent = JSON.stringify(content, null, 2)
        isJson = true
    }
  } catch (e) {
    displayContent = String(content)
  }

  const lines = displayContent.split('\n')
  const lineCount = lines.length
  const shouldCollapse = !expanded && lineCount > maxLines
  
  const renderedContent = shouldCollapse 
    ? lines.slice(0, maxLines).join('\n') + '\n...' 
    : displayContent

  const getStyles = () => {
    switch(type) {
        case 'error': return { bg: '#fff1f0', color: '#cf1322', borderColor: '#ffccc7' }
        case 'input': return { bg: '#fafafa', color: 'rgba(0, 0, 0, 0.88)', borderColor: '#d9d9d9' }
        case 'output': 
        default: return { bg: '#f0f9ff', color: 'rgba(0, 0, 0, 0.88)', borderColor: '#bae7ff' }
    }
  }

  const styles = getStyles()

  const handleCopy = () => {
    navigator.clipboard.writeText(displayContent)
    setCopied(true)
    message.success('已复制')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{
        marginTop: '8px',
        padding: '8px 12px',
        background: styles.bg,
        borderRadius: '6px',
        border: `1px solid ${styles.borderColor}`,
        fontSize: '12px',
      }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            {label && (
                <Typography.Text type={type === 'error' ? 'danger' : 'secondary'} style={{ fontSize: '11px', fontWeight: 600 }}>
                    {label}
                </Typography.Text>
            )}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
                 {isJson && <span style={{ 
                     fontSize: '9px', 
                     color: '#8c8c8c',
                     border: '1px solid rgba(0,0,0,0.1)', 
                     padding: '0 4px', 
                     borderRadius: '4px',
                     background: 'rgba(255,255,255,0.5)'
                 }}>JSON</span>}
                 <Button 
                    type="text" 
                    size="small" 
                    icon={copied ? <CheckOutlined /> : <CopyOutlined />} 
                    onClick={handleCopy}
                    style={{ height: '20px', padding: '0 4px', fontSize: '12px', color: '#8c8c8c' }}
                 />
            </div>
        </div>

      <pre
        style={{
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
          color: styles.color,
          fontSize: '12px',
          lineHeight: '1.5',
        }}
      >
        {renderedContent}
      </pre>

      {lineCount > maxLines && (
        <div style={{ textAlign: 'center', marginTop: '8px', borderTop: `1px dashed ${styles.borderColor}`, paddingTop: '4px' }}>
            <Button 
                type="link" 
                size="small" 
                onClick={() => setExpanded(!expanded)}
                icon={expanded ? <UpOutlined /> : <DownOutlined />}
                style={{ fontSize: '11px', height: '20px', padding: 0 }}
            >
                {expanded ? '收起' : `展开全部 (${lineCount} 行)`}
            </Button>
        </div>
      )}
    </div>
  )
}

export default ToolOutputDisplay
