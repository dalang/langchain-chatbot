# LangChain 导入问题修复

## ❌ 问题描述

```
ImportError: cannot import name 'AgentExecutor' from 'langchain.agents'
```

## 🔍 原因分析

LangChain 0.1.20 版本中，可能存在以下问题：

1. 导入函数名错误：没有 `create_react_json_chat_agent`，应该是 `create_json_chat_agent`
2. 依赖版本不匹配
3. 重复函数定义

## ✅ 已修复的问题

### 1. 导入语句修复（重要！）

**错误**：
```python
from langchain.agents import create_react_json_chat_agent
```

**正确**：
```python
from langchain.agents import AgentExecutor, create_json_chat_agent
```

### 2. 版本更新

将 `langchain` 从 `0.1.0` 升级到 `0.1.20`

```txt
langchain==0.1.20
```

### 3. 代理环境清理

在 `chatbot_engine.py` 中添加了代理清理：

```python
import os
os.environ.pop("all_proxy", None)
os.environ.pop("ALL_PROXY", None)
os.environ.pop("http_proxy", None)
os.environ.pop("https_proxy", None)
```

## 🚀 解决方案

### 方案 1: 重新安装依赖（推荐）

```bash
cd backend

# 卸载旧版本
pip uninstall -y langchain langchain-core langchain-community langchain-classic

# 重新安装
pip install langchain==0.1.20
pip install langchain-community==0.0.10
pip install langchain-classic==0.0.7
pip install langchain-core==0.1.10
```

### 方案 2: 升级所有依赖

```bash
cd backend
pip install --upgrade langchain langchain-core langchain-community langchain-classic
```

### 方案 3: 使用虚拟环境

```bash
cd backend

# 创建新的虚拟环境
python -m venv venv_clean

# 激活虚拟环境
source venv_clean/bin/activate

# 安装依赖
pip install -r requirements.txt

# 运行应用
python -m backend.main
```

## 🔍 验证修复

运行以下命令验证导入：

```bash
cd backend
python -c "
from langchain.agents import AgentExecutor, create_json_chat_agent
from langchain_community.chat_models.zhipuai import ChatZhipuAI
print('✅ 所有导入成功')
"
```

## 📝 修改的文件

1. `backend/requirements.txt` - 更新 `langchain` 版本到 `0.1.20`
2. `backend/requirements-flexible.txt` - 更新 `langchain` 版本到 `0.1.20`
3. `backend/chatbot_engine.py` - 修复导入（使用正确的函数名）

## 🚨 如果仍然失败

如果仍然遇到导入错误，尝试：

1. 检查 Python 版本（需要 3.9+）:
   ```bash
   python --version
   ```

2. 完全重新创建虚拟环境:
   ```bash
   cd backend
   rm -rf venv
   python -m venv venv
   source venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

---

**最后更新**: 2026-01-11
**状态**: ✅ 已修复（修复了错误的导入函数名）

