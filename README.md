# LangChain Chatbot

基于 LangChain 和智谱 AI 的智能网页版聊天机器人，支持实时流式响应、工具调用和对话记忆。

## 🎬 演示视频


## 🎯 产品功能

### 核心对话功能

- **智能问答**：基于智谱 AI GLM-4 模型，提供高质量的对话体验
- **流式响应**：使用 SSE 技术实现打字机效果，实时展示 AI 生成过程
- **非流式响应**：支持等待完整生成后再返回，适合需要稳定输出的场景
- **对话记忆**：可选启用历史对话上下文，实现连续的多轮对话

### 思考过程可视化

- **Chain of Thought 展示**：实时显示 AI 的思考推理过程
- **工具调用追踪**：展示工具调用的完整生命周期（pending → running → completed）
- **性能统计**：显示思考时长、工具调用次数、总耗时等数据

### 会话管理

- **多会话支持**：同时管理多个独立的对话会话
- **会话持久化**：自动保存所有对话历史到 SQLite 数据库
- **会话操作**：
  - ✅ 创建新会话
  - ✅ 查看会话列表（含消息计数）
  - ✅ 删除会话
  - ✅ 清空会话消息
  - ✅ 取消正在进行的 AI 生成

### 用户交互

- **快捷键支持**：
  - `Enter` - 发送消息
  - `Shift+Enter` - 换行
- **Markdown 渲染**：支持代码高亮、列表、引用等富文本格式
- **代码高亮**：集成 react-syntax-highlighter，提供语法高亮
- **自动滚动**：自动滚动到最新消息，使用 RAF 优化性能

### 功能设置

- **流式响应开关**：切换实时流式/完整返回模式
- **对话记忆开关**：启用/禁用历史对话上下文
- **工具调用开关**：控制 AI 是否可以使用工具
- **Debug 模式**：开发者调试界面，显示详细运行信息

### 性能优化

- **RAF 批量更新**：使用 requestAnimationFrame 批量处理流式文本，避免 UI 卡顿
- **组件 Memo 化**：减少不必要的渲染，提升整体性能
- **文本缓冲区**：智能管理高频 SSE 更新
- **异步数据库**：使用 aiosqlite 实现高性能数据库操作

---

## 🏗️ 技术栈

### 后端
- **FastAPI** - 高性能异步 Web 框架
- **LangChain** - AI Agent 框架
- **ChatZhipuAI** - 智谱 AI GLM-4 模型集成
- **SQLAlchemy 2.0** - 异步 ORM
- **aiosqlite** - 异步 SQLite 驱动
- **Tavily** - 实时网络搜索工具

### 前端
- **React 18** - UI 框架
- **Ant Design X** - 专用 AI 聊天组件库
- **Vite** - 高性能构建工具
- **Zustand** - 轻量级状态管理
- **TypeScript** - 类型安全
- **@ant-design/x-markdown** - Markdown 渲染
- **react-syntax-highlighter** - 代码高亮

---

## 📊 数据库架构

### 表结构

| 表名 | 描述 | 关键字段 |
|------|------|---------|
| **sessions** | 会话表 | id (UUID), user_id, title, is_active |
| **messages** | 消息表 | id, session_id, role, content, tool_calls, tokens_used |
| **tool_steps** | 工具执行步骤 | id, message_id, tool_name, tool_input, tool_output, status, duration_ms |

### 数据关系
```
Session (1) ←→ (N) Message (1) ←→ (N) ToolStep
```

---

## 🚀 快速开始

### 后端启动

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入 API Keys

# 启动服务（方法 1: 使用启动脚本）
./start-backend.sh

# 启动服务（方法 2: 直接运行）
python -m backend.main

# 启动服务（方法 3: 使用 uvicorn）
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

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

## 🔧 环境变量配置

在 `backend/.env` 文件中配置：

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
TEMPERATURE=0.1
MAX_ITERATIONS=5

# Session
SESSION_EXPIRE_HOURS=24
```

---

## 🔧 开发说明

### 后端开发

后端使用 FastAPI，所有代码在 `backend/` 目录下。

- `main.py` - FastAPI 应用入口和路由
- `chatbot_engine.py` - LangChain Agent 逻辑
- `chat_service.py` - 聊天服务层（流式/非流式逻辑）
- `db/` - 数据库模型和仓储
- `tools/` - 工具定义

### 前端开发

前端使用 React + Vite，所有代码在 `frontend/src/` 目录下。

- `components/` - React 组件
- `store/` - Zustand 状态管理
- `hooks/` - 自定义 Hooks
- `services/` - API 服务
- `types/` - TypeScript 类型定义


## 📚 参考资料

- [agents.md](./agents.md) - 详细需求文档
- [LangChain 文档](https://python.langchain.com/)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [Ant Design X 文档](https://x.ant.design/)
- [ZhipuAI 文档](https://open.bigmodel.cn/dev/api)

---

## 📄 许可证

本项目为 POC Demo，仅供学习和参考使用。

---

**文档版本**: v3.0
**创建日期**: 2026-01-11
**最后更新**: 2026-01-25
**状态**: POC Demo（核心功能已完成）
