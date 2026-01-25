import React, { useEffect, useState } from "react";
import { Modal, Space, Typography, Descriptions, Spin, Alert } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { chatApi, ConfigInfo } from "../services/api";

const { Text, Title } = Typography;

interface ConfigModalProps {
  visible: boolean;
  onClose: () => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ visible, onClose }) => {
  const [config, setConfig] = useState<ConfigInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      fetchConfig();
    }
  }, [visible]);

  const fetchConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await chatApi.getConfig();
      setConfig(data);
    } catch (err) {
      setError("Failed to load configuration");
      console.error("Failed to fetch config:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <InfoCircleOutlined style={{ color: "#1890ff" }} />
          <span>后端配置信息</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </div>
      )}

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {config && !loading && (
        <Descriptions column={1} bordered>
          <Descriptions.Item
            label={
              <Space>
                <Text strong>模型名称</Text>
              </Space>
            }
            labelStyle={{ width: "120px" }}
          >
            <Text code style={{ fontSize: 14 }}>
              {config.modelName}
            </Text>
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <Space>
                <Text strong>温度参数</Text>
              </Space>
            }
            labelStyle={{ width: "120px" }}
          >
            <Text code style={{ fontSize: 14 }}>
              {config.temperature}
            </Text>
            <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
              值越低，输出越确定
            </Text>
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <Space>
                <Text strong>最大迭代次数</Text>
              </Space>
            }
            labelStyle={{ width: "120px" }}
          >
            <Text code style={{ fontSize: 14 }}>
              {config.maxIterations}
            </Text>
            <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
              Agent 最大推理步数
            </Text>
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <Space>
                <Text strong>可用工具</Text>
              </Space>
            }
            labelStyle={{ width: "120px" }}
          >
            <Space wrap>
              {config.tools.map((tool) => (
                <Text
                  key={tool}
                  code
                  style={{
                    fontSize: 13,
                    background: "#e6f7ff",
                    borderColor: "#91d5ff",
                    color: "#0050b3",
                  }}
                >
                  {tool}
                </Text>
              ))}
            </Space>
            <Text type="secondary" style={{ marginLeft: 0, fontSize: 12, marginTop: 8, display: 'block' }}>
              AI 可以调用这些工具来扩展能力
            </Text>
          </Descriptions.Item>
        </Descriptions>
      )}

      {config && !loading && (
        <div style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <InfoCircleOutlined style={{ marginRight: 4 }} />
            配置信息来自后端环境变量，仅供展示
          </Text>
        </div>
      )}
    </Modal>
  );
};

export default ConfigModal;
