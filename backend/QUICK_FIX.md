# 快速修复依赖问题

## 最简单的修复方法

### 方法 1: 使用虚拟环境（强烈推荐）

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 升级 pip
pip install --upgrade pip setuptools wheel

# 安装依赖
pip install -r requirements.txt

# 启动
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 方法 2: 直接修复关键问题

```bash
cd backend

# 安装核心依赖
pip install fastapi uvicorn python-multipart

# 安装数据库
pip install sqlalchemy aiosqlite

# 安装 LangChain（按顺序）
pip install langchain-core
pip install langchain
pip install langchain-community
pip install langchain-classic

# 安装 Pydantic
pip install pydantic==2.5.0
pip install pydantic-settings

# 安装 AI 模型
pip install zhipuai tavily-python

# 安装工具
pip install python-dotenv
```

### 方法 3: 使用国内镜像（网络慢时）

```bash
cd backend
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
```

## 已修复的问题

1. ✅ `aiosqlite` 拼写错误（之前是 `aiosqlite`）
2. ✅ `langchain-classic` 添加了版本号 `==0.0.7`
3. ✅ `pydantic` 版本降级到 `2.5.0`（兼容性更好）
4. ✅ 创建了灵活版本文件 `requirements-flexible.txt`（使用 `>=` 替代 `==`）

## 验证安装

```bash
cd backend
python -c "
import fastapi
import sqlalchemy
import aiosqlite
import langchain
import zhipuai
print('✅ 所有核心依赖已安装')
"
```

## 启动应用

```bash
cd backend

# 方法 1: 使用模块方式（推荐）
python -m backend.main

# 方法 2: 使用启动脚本
./start-backend.sh

# 方法 3: 使用 uvicorn
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```
