# LangChain Chatbot - POC Demo

基于 LangChain 和智谱 AI 的网页版聊天机器人。

## 项目特性

- ✅ 前端：React + Ant Design X
- ✅ 后端：FastAPI + LangChain
- ✅ 流式响应：SSE（Server-Sent Events）实现打字机效果
- ✅ 数据库：SQLite + aiosqlite 异步存储
- ✅ 工具支持：计算器、Tavily 搜索
- ✅ 会话管理：支持多会话持久化

## 技术栈

### 后端
- FastAPI - 高性能异步框架
- SQLAlchemy 2.0 - 异步 ORM
- LangChain - AI Agent 框架
- ChatZhipuAI - 智谱 AI 模型

### 前端
- React 18 - UI 框架
- Ant Design X - 专用聊天组件
- Vite - 构建工具
- Zustand - 状态管理

## 快速开始

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

## 环境变量

在 `backend/.env` 文件中配置：

```env
ZHIPUAI_API_KEY=your_zhipu_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

## 项目结构

```
langchain_chatbot/
├── backend/          # 后端 API 服务
├── frontend/         # 前端 React 应用
├── agents.md         # 详细需求文档
└── README.md         # 本文件
```

## API 端点

- `GET /health` - 健康检查
- `POST /api/sessions` - 创建会话
- `GET /api/sessions/{id}` - 获取会话
- `GET /api/sessions` - 会话列表
- `DELETE /api/sessions/{id}` - 删除会话
- `GET /api/sessions/{id}/messages` - 获取消息
- `DELETE /api/sessions/{id}/clear` - 清空会话
- `POST /api/chat` - 发送消息（流式 SSE）

## 开发说明

### 后端开发

后端使用 FastAPI，所有代码在 `backend/` 目录下。

- `main.py` - FastAPI 应用入口和路由
- `chatbot_engine.py` - LangChain Agent 逻辑
- `db/` - 数据库模型和仓储
- `tools/` - 工具定义

### 前端开发

前端使用 React + Vite，所有代码在 `frontend/src/` 目录下。

- `components/` - React 组件
- `hooks/` - 自定义 Hooks
- `services/` - API 服务
- `store/` - Zustand 状态管理

## 已知限制

- ❌ 无用户认证
- ❌ 单用户会话（无多租户）
- ❌ 数据库无备份机制

## 参考资料

- [agents.md](./agents.md) - 详细需求文档
- [LangChain 文档](https://python.langchain.com/)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [Ant Design X 文档](https://x.ant.design/)
