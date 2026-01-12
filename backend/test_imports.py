#!/usr/bin/env python3

import sys

print("===========================================")
print("LangChain 导入测试")
print("===========================================")
print("")

tests = []

print("测试 1: 导入 langchain.agents.AgentExecutor...")
try:
    from langchain.agents import AgentExecutor

    print("  ✅ 成功")
    tests.append(True)
except Exception as e:
    print(f"  ❌ 失败: {e}")
    tests.append(False)

print("测试 2: 导入 langchain.agents.create_json_chat_agent...")
try:
    from langchain.agents import create_json_chat_agent

    print("  ✅ 成功")
    tests.append(True)
except Exception as e:
    print(f"  ❌ 失败: {e}")
    tests.append(False)

print("测试 3: 导入 langchain.agents.create_react_json_chat_agent...")
try:
    from langchain.agents import create_react_json_chat_agent

    print("  ✅ 成功")
    tests.append(True)
except Exception as e:
    print(f"  ❌ 失败: {e}")
    tests.append(False)

print("测试 4: 导入 ChatZhipuAI...")
try:
    from langchain_community.chat_models.zhipuai import ChatZhipuAI

    print("  ✅ 成功")
    tests.append(True)
except Exception as e:
    print(f"  ❌ 失败: {e}")
    tests.append(False)

print("测试 5: 导入 langchain.hub...")
try:
    from langchain import hub

    print("  ✅ 成功")
    tests.append(True)
except Exception as e:
    print(f"  ❌ 失败: {e}")
    tests.append(False)

print("测试 6: 导入 langchain_core...")
try:
    import langchain_core

    print("  ✅ 成功")
    tests.append(True)
except Exception as e:
    print(f"  ❌ 失败: {e}")
    tests.append(False)

print("")
print("===========================================")
if all(tests):
    print("✅ 所有测试通过！")
    print("正确导入：")
    print("  from langchain.agents import AgentExecutor, create_react_json_chat_agent")
    sys.exit(0)
else:
    print("❌ 部分测试失败")
    print(f"成功: {sum(tests)}/{len(tests)}")
    print("")
    print("建议修复：")
    if not tests[0]:
        print(
            "  - 尝试: pip install --upgrade langchain langchain-core langchain-community"
        )
    if not tests[1] or not tests[2]:
        print("  - LangChain 版本可能不兼容")
        print("  - 尝试降级: pip install langchain==0.0.350")
    sys.exit(1)
