#!/bin/bash

echo "==========================================="
echo "后端服务启动脚本"
echo "==========================================="
echo ""

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_DIR"

echo "📂 工作目录: $(pwd)"
echo ""

if [ ! -f ".env" ]; then
    echo "❌ 错误: .env 文件不存在"
    echo ""
    echo "请先复制环境变量模板："
    echo "  cp .env.example .env"
    echo ""
    echo "然后编辑 .env 填入你的 API Keys"
    exit 1
fi

echo "✅ 环境变量配置文件存在"
echo ""

echo "🔍 检查 Python 环境..."
if ! command -v python &> /dev/null; then
    echo "❌ Python 未安装"
    exit 1
fi

PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}')
echo "✅ Python 版本: $PYTHON_VERSION"
echo ""

echo "🔍 检查 uvicorn 安装..."
if ! python -c "import uvicorn" 2>/dev/null; then
    echo "❌ uvicorn 未安装，正在安装..."
    pip install uvicorn[standard]
fi

echo "✅ uvicorn 已安装"
echo ""

echo "==========================================="
echo "启动方式选择"
echo "==========================================="
echo ""
echo "1. 模块方式（推荐）"
echo "   python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000"
echo ""
echo "2. 直接命令方式"
echo "   uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000"
echo ""
echo "3. 交互式方式"
echo "   uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000 --log-level debug"
echo ""

read -p "选择启动方式 (1/2/3，默认1): " choice
choice=${choice:-1}

echo ""
echo "==========================================="
echo "🚀 启动服务..."
echo "==========================================="
echo ""

case $choice in
    1)
        echo "使用模块方式启动..."
        python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
        ;;
    2)
        echo "使用直接命令方式启动..."
        uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
        ;;
    3)
        echo "使用交互式方式启动（调试模式）..."
        uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000 --log-level debug
        ;;
    *)
        echo "无效选择，使用默认方式（模块方式）"
        python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
        ;;
esac
