#!/bin/bash

echo "==========================================="
echo "后端依赖安装指南"
echo "==========================================="
echo ""

# 检查 Python 版本
python_version=$(python --version 2>&1 | awk '{print $2}')
echo "🐍 Python 版本: $python_version"

# 检查 pip 版本
pip_version=$(pip --version 2>&1 | awk '{print $2}')
echo "📦 pip 版本: $pip_version"
echo ""

# 选项 1: 使用固定版本（推荐）
echo "选项 1: 安装固定版本的依赖（推荐）"
echo "命令: pip install -r requirements.txt"
echo ""

# 选项 2: 使用灵活版本（兼容性更好）
echo "选项 2: 安装灵活版本的依赖（兼容性更好）"
echo "命令: pip install -r requirements-flexible.txt"
echo ""

# 选项 3: 分步安装（调试用）
echo "选项 3: 分步安装（如果遇到问题可以使用）"
echo ""

read -p "选择安装方式 (1/2/3): " choice

case $choice in
    1)
        echo ""
        echo "📦 安装固定版本依赖..."
        pip install -r requirements.txt
        ;;
    2)
        echo ""
        echo "📦 安装灵活版本依赖..."
        pip install -r requirements-flexible.txt
        ;;
    3)
        echo ""
        echo "📦 分步安装依赖..."
        
        echo "安装 FastAPI..."
        pip install fastapi uvicorn python-multipart
        
        echo "安装数据库..."
        pip install sqlalchemy aiosqlite
        
        echo "安装 Pydantic..."
        pip install pydantic pydantic-settings
        
        echo "安装 LangChain..."
        pip install langchain langchain-community langchain-classic langchain-core
        
        echo "安装 AI 模型..."
        pip install zhipuai tavily-python
        
        echo "安装工具..."
        pip install python-dotenv
        ;;
    *)
        echo "无效选择"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 依赖安装成功！"
    echo ""
    echo "下一步："
    echo "  1. 配置 backend/.env 文件"
    echo "  2. 运行: uvicorn main:app --reload --host 127.0.0.1 --port 8000"
else
    echo ""
    echo "❌ 依赖安装失败"
    echo ""
    echo "常见问题："
    echo "  1. Python 版本过低（需要 Python 3.8+）"
    echo "  2. pip 版本过低（建议升级: pip install --upgrade pip）"
    echo "  3. 网络问题（检查代理设置）"
    echo ""
    echo "解决方案："
    echo "  - 使用虚拟环境: python -m venv venv"
    echo "  - 升级 pip: pip install --upgrade pip setuptools wheel"
    echo "  - 使用国内镜像: pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt"
    exit 1
fi
