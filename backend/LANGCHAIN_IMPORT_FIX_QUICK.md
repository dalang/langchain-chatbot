# LangChain 导入问题 - 快速修复

## ❌ 错误信息

```
ImportError: cannot import name 'AgentExecutor' from 'langchain.agents'
ImportError: cannot import name 'create_react_json_chat_agent'
```

## 🐛 问题原因

langchain 0.1.20 中没有 `create_react_json_chat_agent` 函数，正确的函数名是 `create_json_chat_agent`

## ✅ 一键修复

```bash
cd backend

# 卸载旧版本
pip uninstall -y langchain langchain-core langchain-community langchain-classic

# 安装新版本
pip install langchain==0.1.20
pip install langchain-community==0.0.10
pip install langchain-classic==0.0.7
pip install langchain-core==0.1.10

# 验证导入
python -c "from langchain.agents import AgentExecutor, create_json_chat_agent; print('✅ 导入成功')"
```

## 🚀 启动

```bash
cd /Users/dalang/playground/langchain_chatbot
python -m backend.main
```

## 🔍 详细说明

请查看 `backend/LANGCHAIN_IMPORT_FIX.md` 获取详细的修复说明。
