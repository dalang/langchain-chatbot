import React, { useState } from "react";
import { Card, Flex, Tag, theme } from "antd";
import { SettingOutlined, BugOutlined } from "@ant-design/icons";
import MessageList from "./MessageList";
import InputArea from "./InputArea";
import SettingsModal from "./SettingsModal";
import DebugPanel from "./DebugPanel";
import useChat from "../hooks/useChat";
import useSettingsStore from "../store/settingsStore";

const ChatContainer: React.FC = () => {
  const { token } = theme.useToken();
  const {
    messages,
    isLoading,
    currentStreamingMessage,
    sendMessage,
    cancelMessage,
    clearMessages,
  } = useChat();

  const { debugMode } = useSettingsStore();
  const [settingsVisible, setSettingsVisible] = useState(false);

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "95dvh",
          gap: 16,
          minHeight: 0,
        }}
      >
        <Card
          title={
            <Flex align="center" gap={8}>
              <span>LangChain 智能助手</span>
              {debugMode && (
                <Tag
                  icon={<BugOutlined />}
                  color="error"
                  style={{ margin: 0 }}
                ></Tag>
              )}
            </Flex>
          }
          extra={
            <Flex gap={12}>
              <SettingOutlined
                onClick={() => setSettingsVisible(true)}
                style={{ cursor: "pointer", fontSize: 16 }}
              />
            </Flex>
          }
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            border: debugMode ? `1px solid ${token.colorError}` : undefined,
            overflow: "hidden", // Ensure Card doesn't overflow
            minHeight: 0,
          }}
          headStyle={{
            backgroundColor: debugMode ? token.colorErrorBg : undefined,
            borderBottom: debugMode
              ? `1px solid ${token.colorErrorBorder}`
              : undefined,
            flexShrink: 0, // Header should not shrink
          }}
          bodyStyle={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: 0,
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            <MessageList
              messages={messages}
              currentStreamingMessage={currentStreamingMessage}
            />
            <InputArea
              onSend={sendMessage}
              onClear={clearMessages}
              onCancel={cancelMessage}
              isLoading={isLoading}
            />
          </div>
        </Card>

        {debugMode && <DebugPanel />}
      </div>

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </>
  );
};

export default ChatContainer;
