#!/bin/bash

echo "==========================================="
echo "LangChain Chatbot - 完整启动脚本"
echo "==========================================="
echo ""

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_DIR"

echo "📂 项目目录: $(pwd)"
echo ""

BACKEND_RUNNING=false
FRONTEND_RUNNING=false

cleanup() {
    echo ""
    echo "==========================================="
    echo "停止所有服务..."
    echo "==========================================="
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "📋 检查依赖..."

# 检查 Python 依赖
if ! python -c "import fastapi" 2>/dev/null; then
    echo "❌ Python 依赖未安装"
    echo ""
    read -p "是否立即安装 Python 依赖？(y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd backend
        pip install -r requirements.txt
        cd ..
    else
        echo "请先安装依赖：cd backend && pip install -r requirements.txt"
        exit 1
    fi
else
    echo "✅ Python 依赖已安装"
fi

# 检查 Node.js 依赖
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 Node.js"
    exit 1
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "❌ Node.js 依赖未安装"
    echo ""
    read -p "是否立即安装 Node.js 依赖？(y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd frontend
        npm install
        cd ..
    else
        echo "请先安装依赖：cd frontend && npm install"
        exit 1
    fi
else
    echo "✅ Node.js 依赖已安装"
fi

echo ""
echo "🚀 启动服务..."
echo ""

# 启动后端
cd backend
python -m backend.main &
BACKEND_PID=$!
BACKEND_RUNNING=true
cd ..

echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"
echo "   后端地址: http://127.0.0.1:8000"
echo "   API 文档: http://127.0.0.1:8000/docs"
echo ""

# 等待后端启动
sleep 2

# 启动前端
cd frontend
npm run dev &
FRONTEND_PID=$!
FRONTEND_RUNNING=true
cd ..

echo "✅ 前端服务已启动 (PID: $FRONTEND_PID)"
echo "   前端地址: http://localhost:5173"
echo ""

echo "==========================================="
echo "✨ 服务已启动"
echo "==========================================="
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 等待进程
wait $BACKEND_PID $FRONTEND_PID
