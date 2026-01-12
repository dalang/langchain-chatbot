# 依赖安装问题修复指南

## 已修复的问题

1. ✅ `aiosqlite` 拼写错误（之前是 `aiosqlite`）
2. ✅ `langchain-classic` 添加了版本号 `==0.0.7`
3. ✅ `pydantic` 版本降级到 `2.5.0`（兼容性更好）
4. ✅ 创建了灵活版本文件 `requirements-flexible.txt`（使用 `>=` 替代 `==`）

## 常见问题

### 1. 拼写错误已修复
- ✅ `aiosqlite` (之前是 `aiosqlite`)
- ✅ `langchain-classic==0.0.7` (之前缺少版本号)
- ✅ `pydantic==2.5.0` (兼容性版本)

### 2. LangChain 包冲突
LangChain 的包结构比较复杂，可能需要先安装核心包：

```bash
pip install langchain-core
pip install langchain
pip install langchain-community
pip install langchain-classic
```

### 3. Python 版本要求
- 最低 Python 版本：3.8+
- 推荐 Python 版本：3.9+
- 检查版本：`python --version`

### 4. pip 版本要求
- 推荐 pip 版本：21.0+
- 升级 pip：`pip install --upgrade pip setuptools wheel`

## 🚀 安装方式

### 方式 1: 使用安装脚本（推荐）

```bash
cd backend
chmod +x install-deps.sh
./install-deps.sh
```

### 方式 2: 直接安装固定版本

```bash
cd backend
pip install -r requirements.txt
```

### 方式 3: 使用灵活版本（兼容性更好）

```bash
cd backend
pip install -r requirements-flexible.txt
```

### 方式 4: 使用虚拟环境（推荐）

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 运行应用
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 方式 5: 使用国内镜像（如果网络慢）

```bash
cd backend
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
```

## 🔍 验证安装

安装完成后，验证关键包：

```bash
python -c "import fastapi; print('✅ FastAPI:', fastapi.__version__)"
python -c "import sqlalchemy; print('✅ SQLAlchemy:', sqlalchemy.__version__)"
python -c "import langchain; print('✅ LangChain installed')"
python -c "import zhipuai; print('✅ ZhipuAI installed')"
python -c "import aiosqlite; print('✅ aiosqlite installed')"
```

## 🐛 问题排查

### 问题 1: No module named 'langchain-classic'
```bash
pip install langchain-classic
```

### 问题 2: No module named 'aiosqlite'
```bash
pip install aiosqlite
```

### 问题 3: Pydantic 版本冲突
```bash
pip uninstall pydantic
pip install pydantic==2.5.0
```

### 问题 4: LangChain 导入错误
```bash
pip install --upgrade langchain-core langchain langchain-community
```

## 📋 依赖版本说明

### 固定版本 (requirements.txt)
- 确保所有环境版本一致
- 适合生产环境部署
- 问题：可能不兼容某些 Python 版本

### 灵活版本 (requirements-flexible.txt)
- 使用 `>=` 而不是 `==`
- 允许安装兼容的新版本
- 适合开发环境
- 更容易解决冲突

## ✅ 推荐流程

```bash
# 1. 进入后端目录
cd backend

# 2. 创建虚拟环境（强烈推荐）
python -m venv venv

# 3. 激活虚拟环境
source venv/bin/activate  # Linux/macOS
# 或
venv\Scripts\activate     # Windows

# 4. 升级 pip
pip install --upgrade pip setuptools wheel

# 5. 安装依赖
pip install -r requirements.txt

# 6. 验证安装
python -c "import fastapi, sqlalchemy, langchain, zhipuai, aiosqlite; print('✅ 所有包安装成功')"

# 7. 配置环境变量
cp .env.example .env
# 编辑 .env 填入 API Keys

# 8. 启动服务
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## 📞 仍然遇到问题？

如果以上方法都无法解决，尝试：

1. 更新 Python 到最新版本
2. 使用不同的 Python 版本（3.9, 3.10, 3.11）
3. 清除 pip 缓存：`pip cache purge`
4. 使用 conda 环境：`conda create -n chatbot python=3.10`
5. 查看具体错误信息并搜索解决方案

---

**最后更新**: 2026-01-11
**文件**: DEPENDENCY_FIX.md
