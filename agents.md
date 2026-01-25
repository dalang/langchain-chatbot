# LangChain Chatbot - POC Demo 需求文档

## 项目概述

本项目实现一个基于 LangChain 和智谱 AI 的网页版聊天机器人，支持工具调用、流式响应、非流式响应和会话持久化。

### 核心特性
- ✅ 前端：React + Ant Design X
- ✅ 后端：FastAPI + LangChain
- ✅ 双模式响应：SSE 流式 + 非流式响应
- ✅ 数据库：SQLite + aiosqlite 异步存储
- ✅ 工具支持：计算器、Tavily 搜索
- ✅ 会话管理：支持多会话持久化
- ✅ 思考过程展示：显示 Agent 的推理步骤
- ✅ 性能优化：RAF 批量更新、memo 组件、useTransition

### 参考文件
- `demo_zhipu.py` - 命令行版本的聊天机器人实现
- `chat_service.py` - 聊天服务层（封装流式和非流式逻辑）

---

## 技术架构

### 后端架构
```
┌─────────────────────────────────────────┐
│           FastAPI Server                │
├─────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ API Routes│→ │Chat      │→ │Tools   │ │
│  │   (SSE)  │  │Service   │  │        │ │
│  └──────────┘  └──────────┘  └────────┘ │
│                      ↓                  │
│              ┌──────────────┐          │
│              │  Chatbot     │          │
│              │  Engine      │          │
│              └──────────────┘          │
│                      ↓                  │
│              ┌──────────────┐          │
│              │  SQLite DB    │          │
│              │(aiosqlite)   │          │
│              └──────────────┘          │
└─────────────────────────────────────────┘
```

### 前端架构
```
┌─────────────────────────────────────────┐
│      React + Ant Design X             │
├─────────────────────────────────────────┤
│  ┌──────────────┐  ┌─────────────────┐ │
│  │ ChatContainer│  │  SSE Receiver   │ │
│  │              │  │  (EventSource)  │ │
│  ├──────────────┤  └─────────────────┘ │
│  │MessageList   │  ┌─────────────────┐ │
│  ├──────────────┤  │ Context Store    │ │
│  │InputArea     │← │ (Zustand)       │ │
│  ├──────────────┤  │                 │ │
│  │ProcessDisplay│  │                 │ │
│  ├──────────────┤  │                 │ │
│  │SettingsModal │  │                 │ │
│  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 功能需求

### 1. 后端功能

#### 1.1 API 端点

| 端点 | 方法 | 描述 | 请求体 | 响应 |
|------|------|------|--------|------|
| `/api/health` | GET | 健康检查 | - | `{"status": "healthy"}` |
| `/api/sessions` | POST | 创建会话 | - | `SessionResponse` |
| `/api/sessions/{id}` | GET | 获取会话 | - | `SessionResponse` |
| `/api/sessions` | GET | 会话列表 | `user_id?` | `List[SessionResponse]` |
| `/api/sessions/{id}` | DELETE | 删除会话 | - | `204 No Content` |
| `/api/sessions/{id}/messages` | GET | 获取消息 | - | `List[MessageResponse]` |
| `/api/chat` | POST | 发送消息（非流式） | `{sessionId, message}` | ChatResponse |
| `/api/stream-chat` | POST | 发送消息（流式） | `{sessionId, message}` | SSE Stream |
| `/api/sessions/{id}/clear` | DELETE | 清空会话 | - | `{"success": true}` |

#### 1.2 流式响应格式 (SSE)

```text
data: {"type": "message", "content": "你好"}

data: {"type": "tool_start", "tool": "calculator", "input": "2+2"}

data: {"type": "tool_result", "result": "4", "duration_ms": 120}

data: {"type": "message", "content": "结果是 4"}

data: {"type": "done"}
```

#### 1.3 数据库操作

- 创建新会话
- 保存用户消息
- 保存 AI 响应
- 保存工具执行步骤
- 查询会话历史

---

### 2. 前端功能

#### 2.1 核心组件

**ChatContainer**
- 主容器布局（Flex 垂直布局）
- 固定高度 90vh，内部滚动
- 响应式设计

**MessageList**
- 消息列表渲染（使用 Ant Design X 的 `Bubble.List`）
- 自动滚动到底部（使用 RAF 优化）
- 加载状态展示
- Memo 优化：CopyButton、MessageContent、MessageItem、StreamingMessageItem

**MessageContent**
- 流式渲染：纯文本 + 光标动画
- 完成后：Markdown 渲染
- 支持 `react-syntax-highlighter` 代码高亮

**InputArea**
- 多行文本输入（`Input.TextArea`）
- 发送按钮
- Enter/Shift+Enter 支持
- 清空会话按钮

**ProcessDisplay**（Collapse 组件）
- Agent 思考过程展示
- 工具调用详情展示
- 输入参数展示（JSON 格式）
- 执行结果展示
- 状态标签（pending/running/success/error）

**SettingsModal**
- 流式响应开关
- 对话记忆开关
- 工具调用开关
- 图标化 UI 设计

#### 2.2 打字机效果

- 使用 Ant Design X 的 `typing` 属性
- 配置：`effect: "typing"`, `step: 5-10`, `interval: 30-50ms`
- 流式数据实时更新

**性能优化**
- RAF (requestAnimationFrame) 批量更新
- 文本缓冲区减少渲染频率
- useTransition 优化滚动性能

#### 2.3 状态管理

```typescript
interface ChatState {
  sessionId: string;
  messages: Message[];
  isLoading: boolean;
  currentStreamingMessage: string;
  toolSteps: ToolStep[];
}
```

---

## 数据库 Schema

### sessions 表
```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,  -- UUID v4
    user_id TEXT,         -- 可选，预留用户字段
    title TEXT,          -- 会话标题
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_active ON sessions(is_active);
```

### messages 表
```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT,
    tool_calls JSON,      -- 工具调用信息（JSON）
    model TEXT,           -- 使用的模型
    tokens_used INTEGER,  -- Token 使用量
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_role ON messages(role);
CREATE INDEX idx_messages_created ON messages(created_at);
```

### tool_steps 表
```sql
CREATE TABLE tool_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    step_number INTEGER NOT NULL,
    tool_name TEXT NOT NULL,
    tool_input JSON NOT NULL,
    tool_output TEXT,
    tool_error TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER,
    status TEXT DEFAULT 'pending',  -- 'pending', 'running', 'completed', 'failed'
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE INDEX idx_tool_steps_message ON tool_steps(message_id);
CREATE INDEX idx_tool_steps_status ON tool_steps(status);
```

---

## 技术栈总览

| 层级 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| **后端** | | | |
| 框架 | FastAPI | 0.104+ | 高性能异步框架 |
| 数据库 | aiosqlite | 0.19+ | 异步 SQLite |
| ORM | SQLAlchemy | 2.0+ | 异步 ORM |
| AI 框架 | LangChain | 0.1+ | AI Agent 框架 |
| 模型 | ChatZhipuAI | - | 智谱 AI 模型 |
| 工具 | Tavily Search | - | 网络搜索 |
| | Calculator | - | 自定义计算器 |
| **前端** | | | |
| 框架 | React | 18.2+ | UI 框架 |
| 组件库 | Ant Design X | 1.0+ | 专用聊天组件 |
| 构建工具 | Vite | 5.0+ | 构建工具 |
| 状态管理 | Zustand | 4.4+ | 轻量级状态管理 |
| HTTP | Axios | 1.6+ | HTTP 客户端 |
| Markdown | @ant-design/x-markdown | - | Markdown 渲染 |
| 代码高亮 | react-syntax-highlighter | 15.5+ | 代码语法高亮 |

---

## 项目结构

```
langchain_chatbot/
├── backend/
│   ├── main.py                 # FastAPI 应用入口
│   ├── config.py               # 配置管理
│   ├── chat_service.py         # 聊天服务层（流式/非流式逻辑）
│   ├── chatbot_engine.py       # Chatbot 核心逻辑
│   ├── models.py               # Pydantic 数据模型
│   ├── requirements.txt         # Python 依赖
│   ├── .env                   # 环境变量（不提交）
│   │
│   ├── db/                    # 数据库相关
│   │   ├── __init__.py
│   │   ├── base.py            # SQLAlchemy 基类和引擎配置
│   │   ├── models.py          # 数据库模型
│   │   └── repositories.py    # 数据访问层
│   │
│   ├── tools/                 # 工具定义
│   │   ├── __init__.py
│   │   ├── calculator.py
│   │   └── tavily_search.py
│   │
│   └── data/                  # 数据库文件目录
│       └── .gitkeep
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatContainer.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── InputArea.tsx
│   │   │   ├── ToolDisplay.tsx
│   │   │   ├── ProcessDisplay.tsx  # 思考过程展示
│   │   │   └── SettingsModal.tsx   # 设置弹窗
│   │   ├── hooks/
│   │   │   └── useChat.ts      # 聊天状态管理
│   │   ├── services/
│   │   │   └── api.ts          # API 通信
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript 类型
│   │   ├── store/
│   │   │   ├── chatStore.ts    # 聊天状态
│   │   │   └── settingsStore.ts # 设置状态
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── .gitignore
├── README.md                   # 项目说明
└── agents.md                   # 本文档
```

---

## 开发计划

### Phase 1: 后端基础
- [x] 搭建 FastAPI 项目结构
- [x] 实现 SQLite 数据库初始化
- [x] 实现数据库 CRUD 操作
- [x] 实现会话管理逻辑
- [x] 实现 `/api/health` 端点

### Phase 2: Chatbot 核心
- [x] 迁移 demo_zhipu.py 的 Agent 逻辑
- [x] 集成工具系统
- [x] 实现流式响应生成器
- [x] 实现 `/api/stream-chat` SSE 端点
- [x] 实现 `/api/chat` 非流式端点
- [x] 会话历史读写
- [x] 提取 chat_service.py 服务层

### Phase 3: 前端基础
- [x] 搭建 React + Vite + Ant Design X 项目
- [x] 实现基础 UI 布局
- [x] 实现 ChatContainer 组件
- [x] 实现 MessageList 组件
- [x] 实现 InputArea 组件

### Phase 4: 前端交互
- [x] 实现 SSE 消息接收
- [x] 实现打字机效果
- [x] 实现 Markdown 渲染
- [x] 实现 ToolDisplay 组件
- [x] 实现 ProcessDisplay 组件
- [x] 实现 SettingsModal 组件
- [x] 状态管理集成
- [x] RAF 性能优化

### Phase 5: 集成与优化
- [x] 前后端联调
- [x] 错误处理完善
- [x] UI 样式优化
- [x] 响应式适配
- [ ] 添加用户认证系统（JWT）
- [ ] 支持多租户
- [ ] 添加日志系统

---

## 环境变量

### backend/.env 文件示例
```env
# API Keys
ZHIPUAI_API_KEY=your_zhipu_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here

# Database
DATABASE_URL=sqlite+aiosqlite:///./data/chatbot.db

# Server
HOST=127.0.0.1
PORT=8000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# LLM Config
MODEL_NAME=glm-4
TEMPERATURE=0.01
MAX_ITERATIONS=5

# Session
SESSION_EXPIRE_HOURS=24
```

---

## 快速开始

### 后端启动
```bash
cd backend

# 创建虚拟环境
uv venv
source .venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入 API Keys

# 启动服务
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### backend 特别说明
- **执行 python 脚本前必须通过 `source .venv/bin/activate` 激活虚拟环境** 

### 前端启动
```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173 查看应用

---

## 关键技术实现

### FastAPI 流式响应（SSE）

后端使用 `StreamingResponse` 实现服务器推送事件：

```python
from fastapi.responses import StreamingResponse
import json

async def chat_stream_generator(session_id: str, message: str):
    # 生成 SSE 事件
    yield f"data: {json.dumps({'type': 'message', 'content': '你好'})}\n\n"
    yield f"data: {json.dumps({'type': 'done'})}\n\n"

@app.post("/api/chat")
async def chat(request: ChatRequest):
    return StreamingResponse(
        chat_stream_generator(request.sessionId, request.message),
        media_type="text/event-stream"
    )
```

### 前端 SSE 接收

```typescript
const eventSource = new EventSource('/api/chat?sessionId=xxx');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'message') {
    // 处理消息
  } else if (data.type === 'done') {
    eventSource.close();
  }
};
```

### Ant Design X 打字机效果

```tsx
import { Bubble } from '@ant-design/x';

<Bubble
  content={message}
  typing={{
    effect: 'typing',
    step: 5,
    interval: 50,
  }}
/>
```

### SQLite 异步操作

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

async def get_messages(session: AsyncSession, session_id: str):
    result = await session.execute(
        select(Message).where(Message.session_id == session_id)
    )
    return result.scalars().all()
```

---

## 已知问题与限制

### 当前版本限制
- ❌ 无用户认证
- ❌ 单用户会话（无多租户）
- ❌ 数据库无备份机制
- ❌ 无日志系统
- ❌ 无消息导出功能

### 后续优化方向
- 添加用户认证系统（JWT）
- 支持 WebSocket 替代 SSE
- 添加更多工具插件
- 实现会话导入导出
- 添加统计分析面板
- 支持 PostgreSQL/MySQL 等其他数据库
- 添加 Docker 部署配置

---

## 参考资料

### LangChain
- [LangChain 官方文档](https://python.langchain.com/)
- [Agents 指南](https://python.langchain.com/docs/modules/agents/)
- [ZhipuAI 集成](https://python.langchain.com/docs/integrations/chat/zhipuai/)

### FastAPI
- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
- [StreamingResponse](https://fastapi.tiangolo.com/advanced/custom-response/#streamingresponse)

### Ant Design X
- [Ant Design X 官方文档](https://x.ant.design/)
- [Bubble 组件](https://x.ant.design/components/bubble)

---

## 依赖清单

### 后端依赖 (requirements.txt)
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
aiosqlite==0.19.0
pydantic==2.5.0
pydantic-settings==2.1.0
langchain==0.1.0
langchain-community==0.0.10
langchain-classic==0.0.7
langchain-core==0.1.10
zhipuai==2.0.1
tavily-python==0.3.1
python-multipart==0.0.6
```

### 前端依赖 (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@ant-design/x": "^1.0.0",
    "@ant-design/x-markdown": "^1.0.0",
    "antd": "^5.12.0",
    "axios": "^1.6.0",
    "react-syntax-highlighter": "^15.5.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/react-syntax-highlighter": "^15.5.0"
  }
}
```

---

**文档版本**: v2.0
**创建日期**: 2026-01-11
**更新日期**: 2026-01-24
**状态**: POC Demo（核心功能已完成）
**维护者**: LangChain Chatbot Team
