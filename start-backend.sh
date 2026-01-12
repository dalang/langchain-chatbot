#!/bin/bash

echo "==========================================="
echo "LangChain Chatbot - 启动脚本"
echo "==========================================="
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

echo "📂 工作目录: $(pwd)"
echo ""

if [ ! -f "backend/.env" ]; then
    echo "❌ 错误: backend/.env 文件不存在"
    echo ""
    echo "请先复制环境变量模板："
    echo "  cp backend/.env.example backend/.env"
    echo ""
    echo "然后编辑 backend/.env 填入你的 API Keys"
    exit 1
fi

echo "✅ 环境变量配置文件存在"
echo ""

echo "🚀 启动后端服务..."
echo ""

cd backend
python -m backend.main

echo ""
echo "==========================================="
echo "服务已停止"
echo "==========================================="
