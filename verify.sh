#!/bin/bash

echo "==========================================="
echo "LangChain Chatbot - 项目验证脚本"
echo "==========================================="
echo ""

echo "📋 检查项目结构..."
directories=(
    "backend/db"
    "backend/tools"
    "backend/data"
    "frontend/src/components"
    "frontend/src/hooks"
    "frontend/src/services"
    "frontend/src/store"
    "frontend/src/types"
)

for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir"
    else
        echo "  ❌ $dir (不存在)"
    fi
done

echo ""
echo "📝 检查核心文件..."
files=(
    "backend/main.py"
    "backend/config.py"
    "backend/chatbot_engine.py"
    "backend/requirements.txt"
    "backend/.env"
    "frontend/package.json"
    "frontend/vite.config.ts"
    "agents.md"
    "README.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (不存在)"
    fi
done

echo ""
echo "🔍 检查后端 Python 语法..."
cd backend
python_files=(
    "main.py"
    "config.py"
    "chatbot_engine.py"
    "db/base.py"
    "db/models.py"
    "db/repositories.py"
    "tools/calculator.py"
    "tools/tavily_search.py"
)

all_valid=true
for file in "${python_files[@]}"; do
    if python -m py_compile "$file" 2>/dev/null; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (语法错误)"
        all_valid=false
    fi
done

echo ""
echo "📦 后端依赖检查..."
cd /Users/dalang/playground/langchain_chatbot
if [ -f "backend/requirements.txt" ]; then
    echo "  ✅ requirements.txt 存在"
    echo "  主要依赖:"
    grep -E "(fastapi|sqlalchemy|langchain|pydantic|zhipuai|tavily)" backend/requirements.txt | sed 's/^/    /'
else
    echo "  ❌ requirements.txt 不存在"
fi

echo ""
echo "📦 前端依赖检查..."
if [ -f "frontend/package.json" ]; then
    echo "  ✅ package.json 存在"
    echo "  主要依赖:"
    grep -E "(react|antd|axios|zustand|vite)" frontend/package.json | sed 's/^/    /'
else
    echo "  ❌ package.json 不存在"
fi

echo ""
echo "📝 检查环境变量配置..."
if [ -f "backend/.env" ]; then
    echo "  ✅ .env 文件存在"

    if grep -q "ZHIPUAI_API_KEY=your_zhipu_api_key_here" backend/.env; then
        echo "  ⚠️  警告: 请配置 ZHIPUAI_API_KEY"
    else
        echo "  ✅ ZHIPUAI_API_KEY 已配置"
    fi

    if grep -q "TAVILY_API_KEY=your_tavily_api_key_here" backend/.env; then
        echo "  ⚠️  警告: 请配置 TAVILY_API_KEY"
    else
        echo "  ✅ TAVILY_API_KEY 已配置"
    fi
else
    echo "  ❌ .env 文件不存在"
fi

echo ""
echo "==========================================="
echo "✨ 项目验证完成"
echo "==========================================="
echo ""
echo "下一步："
echo "  1. 配置 backend/.env 文件中的 API Keys"
echo "  2. 后端: cd backend && pip install -r requirements.txt && uvicorn main:app --reload"
echo "  3. 前端: cd frontend && npm install && npm run dev"
echo "  4. 访问 http://localhost:5173"
echo ""
