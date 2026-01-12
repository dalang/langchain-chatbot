import React from "react";
import { Modal, Switch, Space, Typography } from "antd";
import useSettingsStore from "../store/settingsStore";

const { Text } = Typography;

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
    const { useStreamingChat, toggleStreamingChat } = useSettingsStore();

    return (
        <Modal
            title="设置"
            open={visible}
            onCancel={onClose}
            onOk={onClose}
            okText="确定"
            cancelText="取消"
        >
            <Space direction="vertical" style={{ width: "100%" }} size="large">
                <div>
                    <Space direction="vertical" size="small">
                        <Text strong>启用流式返回</Text>
                        <Text type="secondary">
                            开启后将使用流式 API，实时显示 Tool
                            调用和模型生成的内容。
                        </Text>
                        <Switch
                            checked={useStreamingChat}
                            onChange={toggleStreamingChat}
                        />
                    </Space>
                </div>
            </Space>
        </Modal>
    );
};

export default SettingsModal;
