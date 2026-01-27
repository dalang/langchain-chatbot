import React, { useEffect, useState } from "react";
import { Card, Typography, Space, Tag, Spin, Button, theme } from "antd";
import { ReloadOutlined, CopyOutlined, CheckOutlined } from "@ant-design/icons";
import { chatApi, ConfigInfo } from "../services/api";
import useSettingsStore from "../store/settingsStore";
import useChatStore from "../store/chatStore";

const { Text } = Typography;

const DebugPanel: React.FC = () => {
  const { token } = theme.useToken();
  const [config, setConfig] = useState<ConfigInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const { useStreamingChat, enableMemory, enableToolCalls, debugMode } =
    useSettingsStore();
  const { sessionId } = useChatStore();

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data = await chatApi.getConfig();
      setConfig(data);
    } catch (err) {
      console.error("Failed to fetch config:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debugMode) {
      fetchConfig();
    }
  }, [debugMode, sessionId]);

  const handleCopy = () => {
    const debugInfo = {
      config,
      settings: {
        useStreamingChat,
        enableMemory,
        enableToolCalls,
      },
      sessionId,
      timestamp: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!debugMode) return null;

  return (
    <Card
      size="small"
      style={{
        height: 120,
        borderTop: `1px solid ${token.colorErrorBorder}`,
        backgroundColor: token.colorFillQuaternary,
      }}
      bodyStyle={{
        padding: "8px 12px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
      bordered={false}
    >
      <div style={headerStyle}>
        <Space size={4}>
          <Text strong style={{ fontSize: 11, color: token.colorError }}>
            DEBUG CONSOLE
          </Text>
        </Space>
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={fetchConfig}
            loading={loading}
            style={{ padding: "0 4px", fontSize: 10, height: 20 }}
          />
          <Button
            type="text"
            size="small"
            icon={
              copied ? (
                <CheckOutlined style={{ color: token.colorSuccess }} />
              ) : (
                <CopyOutlined />
              )
            }
            onClick={handleCopy}
            style={{ padding: "0 4px", fontSize: 10, height: 20 }}
          />
        </Space>
      </div>

      <div style={contentStyle}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 4 }}>
            <Spin size="small" />
          </div>
        ) : config ? (
          <Space size={12} style={{ flex: 1, flexWrap: "wrap" }}>
            <div style={inlineItemStyle}>
              <Text type="secondary" style={inlineLabelStyle}>
                Session ID:
              </Text>
              <Text code style={valueStyle}>
                {config.session?.id || sessionId || "N/A"}
              </Text>
            </div>
            <div style={inlineItemStyle}>
              <Text type="secondary" style={inlineLabelStyle}>
                Model:
              </Text>
              <Text code style={valueStyle}>
                {config.modelName}
              </Text>
            </div>
            <div style={inlineItemStyle}>
              <Text type="secondary" style={inlineLabelStyle}>
                Temp:
              </Text>
              <Text code style={valueStyle}>
                {config.temperature}
              </Text>
            </div>
            <div style={inlineItemStyle}>
              <Text type="secondary" style={inlineLabelStyle}>
                Iter:
              </Text>
              <Text code style={valueStyle}>
                {config.maxIterations}
              </Text>
            </div>
            <div style={inlineItemStyle}>
              <Text type="secondary" style={inlineLabelStyle}>
                Tools:
              </Text>
              <Space size={2}>
                {config.tools.map((t) => (
                  <Tag
                    key={t}
                    style={{
                      margin: 0,
                      fontSize: 9,
                      padding: "0 4px",
                      lineHeight: "16px",
                    }}
                  >
                    {t}
                  </Tag>
                ))}
              </Space>
            </div>
            <div style={inlineItemStyle}>
              <Text type="secondary" style={inlineLabelStyle}>
                Stream:
              </Text>
              <CompactStatusTag value={useStreamingChat} />
            </div>
            <div style={inlineItemStyle}>
              <Text type="secondary" style={inlineLabelStyle}>
                Mem:
              </Text>
              <CompactStatusTag value={enableMemory} />
            </div>
            <div style={inlineItemStyle}>
              <Text type="secondary" style={inlineLabelStyle}>
                Tools:
              </Text>
              <CompactStatusTag value={enableToolCalls} />
            </div>
          </Space>
        ) : (
          <Text type="secondary" style={{ fontSize: 10 }}>
            No config loaded
          </Text>
        )}
      </div>
    </Card>
  );
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
};

const inlineItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const inlineLabelStyle: React.CSSProperties = {
  fontSize: 10,
};

const valueStyle: React.CSSProperties = {
  fontSize: 10,
  padding: "0 4px",
};

const CompactStatusTag: React.FC<{ value: boolean }> = ({ value }) => (
  <Tag
    color={value ? "success" : "default"}
    style={{
      margin: 0,
      fontSize: 9,
      padding: "0 4px",
      lineHeight: "16px",
      minWidth: 24,
      textAlign: "center",
    }}
  >
    {value ? "ON" : "OFF"}
  </Tag>
);

export default DebugPanel;
