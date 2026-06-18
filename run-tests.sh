#!/usr/bin/env bash
# 运行测试和覆盖率
cd "C:/Users/JaNiy/WorkBuddy/Project/hospital-registration"
bun vitest run --coverage --exclude "src/tests/e2e/**" 2>&1