# Feedback Enhancement MCP Server

一个专门用于分析和增强反馈质量的 MCP 服务器，可以帮助您：

- 分析反馈的情感倾向和建设性
- 提供反馈改进建议
- 生成高质量的反馈模板
- 增强现有反馈的表达效果

## 🚀 功能特性

### 📊 反馈分析工具
- `analyze_feedback` - 全面分析反馈质量
- `feedback_sentiment_score` - 评估情感倾向和建设性

### ✨ 反馈增强工具
- `enhance_feedback` - 智能增强反馈内容
- `suggest_feedback_improvements` - 提供具体改进建议

### 📝 模板生成工具
- `generate_feedback_template` - 生成各种场景的反馈模板

## 📋 安装和配置

### 1. 安装依赖
```bash
cd examples/feedback-enhance-mcp
npm install
```

### 2. 在 mcp-manager 中配置
通过 mcp-manager 的 Web 界面添加以下配置：

**服务器名称**: `feedback-enhance`
**命令**: `node`
**参数**: `D:\MCP\mcp-manager\examples\feedback-enhance-mcp\index.js`

或者直接编辑 config.json：
```json
{
  "feedback-enhance": {
    "command": "node",
    "args": ["D:\\MCP\\mcp-manager\\examples\\feedback-enhance-mcp\\index.js"],
    "env": {
      "FEEDBACK_MODEL": "enhanced",
      "ANALYSIS_DEPTH": "detailed"
    }
  }
}
```

### 3. 通过代理使用
配置完成后，您可以在 AI 助手中使用以下工具：

- `feedback-enhance_analyze_feedback`
- `feedback-enhance_enhance_feedback`
- `feedback-enhance_suggest_feedback_improvements`
- `feedback-enhance_generate_feedback_template`
- `feedback-enhance_feedback_sentiment_score`

## 💡 使用示例

### 分析反馈质量
```
请使用 feedback-enhance_analyze_feedback 工具分析以下反馈：
"这个代码写得不好，有很多问题，需要重写。"
```

### 增强反馈内容
```
请使用 feedback-enhance_enhance_feedback 工具，以建设性风格增强以下反馈：
"这个设计不行，用户不会喜欢的。"
```

### 生成反馈模板
```
请使用 feedback-enhance_generate_feedback_template 工具，为代码审查场景生成一个支持性的反馈模板。
```

## 📈 分析维度

### 情感分析
- **积极**: 反馈传达正面态度
- **中性**: 反馈保持客观中性
- **消极**: 反馈偏向负面，需要调整

### 质量评估
1. **建设性** (1-10分): 是否提供改进建议
2. **具体性** (1-10分): 是否有具体的例子和细节
3. **可执行性** (1-10分): 是否包含可操作的建议

### 增强风格
- **constructive**: 建设性增强
- **professional**: 专业化表达
- **friendly**: 友好温和
- **detailed**: 详细具体

## 📚 最佳实践

### SBI 反馈模型
- **Situation**: 描述具体情况
- **Behavior**: 指出具体行为  
- **Impact**: 说明影响结果

### COIN 反馈方法
- **Context**: 提供背景信息
- **Observation**: 客观观察描述
- **Impact**: 分析产生的影响
- **Next**: 建议下一步行动

## 🔧 高级配置

### 环境变量
- `FEEDBACK_MODEL`: 分析模型类型
- `ANALYSIS_DEPTH`: 分析深度 (basic/detailed)
- `ENHANCEMENT_MODE`: 增强模式

### 自定义模板
您可以扩展反馈模板库，支持更多场景：
- 代码审查 (code_review)
- 绩效评估 (performance_review)  
- 项目反馈 (project_feedback)
- 学习反馈 (learning_feedback)
- 设计评审 (design_review)

## 🎯 使用场景

1. **团队协作**: 改善团队内部反馈质量
2. **代码审查**: 生成建设性的代码评审意见
3. **项目管理**: 优化项目反馈和沟通
4. **教学培训**: 为学习者提供更好的反馈
5. **产品开发**: 改进用户反馈的处理

通过使用这个 MCP 服务器，您可以显著提升反馈的质量和效果，促进更好的沟通和协作！