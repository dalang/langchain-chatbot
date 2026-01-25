import React from "react";
import { Modal, Switch, Space, Typography, List } from "antd";
import {
  ThunderboltOutlined,
  DatabaseOutlined,
  ToolOutlined,
  BugOutlined,
} from "@ant-design/icons";
import useSettingsStore from "../store/settingsStore";

const { Text } = Typography;

interface SettingItem {
  key: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const {
    useStreamingChat,
    enableMemory,
    enableToolCalls,
    debugMode,
    toggleStreamingChat,
    toggleMemory,
    toggleToolCalls,
    toggleDebugMode,
  } = useSettingsStore();

  const settings: SettingItem[] = [
    {
      key: "streaming",
      icon: <ThunderboltOutlined style={{ fontSize: 20, color: "#1890ff" }} />,
      title: "流式响应",
      description: "实时显示AI回复内容，提供更好的交互体验",
      checked: useStreamingChat,
      onChange: toggleStreamingChat,
    },
    {
      key: "memory",
      icon: <DatabaseOutlined style={{ fontSize: 20, color: "#52c41a" }} />,
      title: "对话记忆",
      description: "记住历史对话内容，实现上下文连续性",
      checked: enableMemory,
      onChange: toggleMemory,
    },
    {
      key: "tools",
      icon: <ToolOutlined style={{ fontSize: 20, color: "#faad14" }} />,
      title: "工具调用",
      description: "允许AI使用搜索、计算等工具扩展能力",
      checked: enableToolCalls,
      onChange: toggleToolCalls,
    },
    {
      key: "debug",
      icon: <BugOutlined style={{ fontSize: 20, color: "#f5222d" }} />,
      title: "Debug 模式",
      description: "启用调试界面，显示详细的配置和运行时信息",
      checked: debugMode,
      onChange: toggleDebugMode,
    },
  ];

  return (
    <Modal
      title="功能设置"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <List
        dataSource={settings}
        renderItem={(item) => (
          <List.Item
            style={{
              display: "flex",
              alignItems: "flex-start",
              padding: "16px 0",
            }}
          >
            <Space style={{ flex: 1 }} size="middle">
              <div style={{ marginTop: 2 }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <Text
                  strong
                  style={{ fontSize: 15, display: "block", marginBottom: 4 }}
                >
                  {item.title}
                </Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {item.description}
                </Text>
              </div>
              <Switch
                checked={item.checked}
                onChange={item.onChange}
                style={{ marginTop: 2 }}
              />
            </Space>
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default SettingsModal;
