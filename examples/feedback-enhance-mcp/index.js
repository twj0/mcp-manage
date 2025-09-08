#!/usr/bin/env node

// Feedback Enhancement MCP Server
// 用于分析和增强反馈内容的 MCP 服务器

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

class FeedbackEnhanceMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'feedback-enhance-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    // 反馈分析历史
    this.feedbackHistory = [];
    this.enhancementTemplates = this.loadEnhancementTemplates();

    this.setupToolHandlers();
    this.setupResourceHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  loadEnhancementTemplates() {
    return {
      constructive: {
        name: "建设性反馈",
        patterns: [
          "我建议...",
          "可以考虑...",
          "一个改进的方法是...",
          "从我的经验来看..."
        ]
      },
      specific: {
        name: "具体化反馈",
        patterns: [
          "具体来说...",
          "例如，在...方面",
          "我注意到在...部分",
          "特别是..."
        ]
      },
      positive: {
        name: "积极正面",
        patterns: [
          "我很欣赏...",
          "做得很好的地方是...",
          "令人印象深刻的是...",
          "继续保持..."
        ]
      },
      actionable: {
        name: "可执行建议",
        patterns: [
          "下一步可以...",
          "建议尝试...",
          "可以通过...来改进",
          "考虑实施..."
        ]
      }
    };
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'analyze_feedback',
          description: '分析反馈内容的质量、情感和改进建议',
          inputSchema: {
            type: 'object',
            properties: {
              feedback: {
                type: 'string',
                description: '要分析的反馈内容'
              },
              context: {
                type: 'string',
                description: '反馈的上下文（可选）'
              },
              analysis_type: {
                type: 'string',
                enum: ['comprehensive', 'sentiment', 'quality', 'suggestions'],
                description: '分析类型',
                default: 'comprehensive'
              }
            },
            required: ['feedback']
          }
        },
        {
          name: 'enhance_feedback',
          description: '增强和改进反馈内容，使其更加建设性和有效',
          inputSchema: {
            type: 'object',
            properties: {
              feedback: {
                type: 'string',
                description: '原始反馈内容'
              },
              enhancement_style: {
                type: 'string',
                enum: ['constructive', 'professional', 'friendly', 'detailed'],
                description: '增强风格',
                default: 'constructive'
              },
              target_audience: {
                type: 'string',
                description: '目标受众（如：开发团队、学生、同事等）'
              }
            },
            required: ['feedback']
          }
        },
        {
          name: 'suggest_feedback_improvements',
          description: '为给定的反馈提供具体的改进建议',
          inputSchema: {
            type: 'object',
            properties: {
              feedback: {
                type: 'string',
                description: '需要改进的反馈内容'
              },
              improvement_areas: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['clarity', 'specificity', 'constructiveness', 'actionability', 'tone']
                },
                description: '要改进的方面'
              }
            },
            required: ['feedback']
          }
        },
        {
          name: 'generate_feedback_template',
          description: '生成特定场景下的反馈模板',
          inputSchema: {
            type: 'object',
            properties: {
              scenario: {
                type: 'string',
                enum: ['code_review', 'performance_review', 'project_feedback', 'learning_feedback', 'design_review'],
                description: '反馈场景'
              },
              tone: {
                type: 'string',
                enum: ['formal', 'casual', 'supportive', 'direct'],
                description: '反馈语调',
                default: 'supportive'
              },
              include_examples: {
                type: 'boolean',
                description: '是否包含示例',
                default: true
              }
            },
            required: ['scenario']
          }
        },
        {
          name: 'feedback_sentiment_score',
          description: '评估反馈的情感倾向和建设性程度',
          inputSchema: {
            type: 'object',
            properties: {
              feedback: {
                type: 'string',
                description: '要评分的反馈内容'
              },
              return_details: {
                type: 'boolean',
                description: '是否返回详细分析',
                default: false
              }
            },
            required: ['feedback']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analyze_feedback':
            return await this.analyzeFeedback(args);
          case 'enhance_feedback':
            return await this.enhanceFeedback(args);
          case 'suggest_feedback_improvements':
            return await this.suggestImprovements(args);
          case 'generate_feedback_template':
            return await this.generateTemplate(args);
          case 'feedback_sentiment_score':
            return await this.scoreSentiment(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `错误: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  setupResourceHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'feedback://history',
          name: 'Feedback Analysis History',
          description: '反馈分析历史记录',
          mimeType: 'application/json'
        },
        {
          uri: 'feedback://templates',
          name: 'Enhancement Templates',
          description: '反馈增强模板库',
          mimeType: 'application/json'
        },
        {
          uri: 'feedback://best-practices',
          name: 'Feedback Best Practices',
          description: '反馈最佳实践指南',
          mimeType: 'text/markdown'
        }
      ]
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case 'feedback://history':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(this.feedbackHistory, null, 2)
              }
            ]
          };

        case 'feedback://templates':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(this.enhancementTemplates, null, 2)
              }
            ]
          };

        case 'feedback://best-practices':
          return {
            contents: [
              {
                uri,
                mimeType: 'text/markdown',
                text: this.getBestPracticesGuide()
              }
            ]
          };

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  async analyzeFeedback(args) {
    const { feedback, context = '', analysis_type = 'comprehensive' } = args;

    const analysis = {
      feedback_text: feedback,
      context: context,
      timestamp: new Date().toISOString(),
      analysis: {}
    };

    // 基础分析
    analysis.analysis.word_count = feedback.split(/\s+/).length;
    analysis.analysis.sentiment = this.analyzeSentiment(feedback);
    analysis.analysis.constructiveness = this.analyzeConstructiveness(feedback);
    analysis.analysis.specificity = this.analyzeSpecificity(feedback);
    analysis.analysis.actionability = this.analyzeActionability(feedback);

    // 根据分析类型提供详细信息
    if (analysis_type === 'comprehensive' || analysis_type === 'quality') {
      analysis.quality_score = this.calculateQualityScore(analysis.analysis);
      analysis.improvement_suggestions = this.generateImprovementSuggestions(analysis.analysis);
    }

    // 保存到历史记录
    this.feedbackHistory.push(analysis);

    let result = `# 反馈分析报告

## 基本信息
- **反馈长度**: ${analysis.analysis.word_count} 词
- **分析时间**: ${analysis.timestamp}

## 情感分析
- **情感倾向**: ${analysis.analysis.sentiment.label} (${analysis.analysis.sentiment.score.toFixed(2)})
- **情感描述**: ${analysis.analysis.sentiment.description}

## 质量评估
- **建设性**: ${analysis.analysis.constructiveness.score}/10 - ${analysis.analysis.constructiveness.description}
- **具体性**: ${analysis.analysis.specificity.score}/10 - ${analysis.analysis.specificity.description}
- **可执行性**: ${analysis.analysis.actionability.score}/10 - ${analysis.analysis.actionability.description}`;

    if (analysis.quality_score) {
      result += `\n\n## 综合质量评分
**总分**: ${analysis.quality_score}/10

## 改进建议
${analysis.improvement_suggestions.map(s => `- ${s}`).join('\n')}`;
    }

    return {
      content: [
        {
          type: 'text',
          text: result
        }
      ]
    };
  }

  async enhanceFeedback(args) {
    const { feedback, enhancement_style = 'constructive', target_audience = '团队成员' } = args;

    const enhanced = this.applyEnhancement(feedback, enhancement_style, target_audience);

    return {
      content: [
        {
          type: 'text',
          text: `# 反馈增强结果

## 原始反馈
${feedback}

## 增强后的反馈 (${enhancement_style} 风格)
${enhanced.text}

## 增强说明
${enhanced.explanation}

## 改进要点
${enhanced.improvements.map(i => `- ${i}`).join('\n')}`
        }
      ]
    };
  }

  async suggestImprovements(args) {
    const { feedback, improvement_areas = ['clarity', 'specificity', 'constructiveness'] } = args;

    const suggestions = improvement_areas.map(area => {
      return this.getAreaSpecificSuggestions(feedback, area);
    });

    return {
      content: [
        {
          type: 'text',
          text: `# 反馈改进建议

## 原始反馈
${feedback}

## 具体改进建议
${suggestions.map(s => `### ${s.area}\n${s.suggestions.map(sg => `- ${sg}`).join('\n')}`).join('\n\n')}`
        }
      ]
    };
  }

  async generateTemplate(args) {
    const { scenario, tone = 'supportive', include_examples = true } = args;

    const template = this.createFeedbackTemplate(scenario, tone, include_examples);

    return {
      content: [
        {
          type: 'text',
          text: template
        }
      ]
    };
  }

  async scoreSentiment(args) {
    const { feedback, return_details = false } = args;

    const sentiment = this.analyzeSentiment(feedback);
    const constructiveness = this.analyzeConstructiveness(feedback);

    let result = `情感评分: ${sentiment.score.toFixed(2)} (${sentiment.label})
建设性评分: ${constructiveness.score}/10`;

    if (return_details) {
      result += `\n\n详细分析:
- 情感描述: ${sentiment.description}
- 建设性描述: ${constructiveness.description}
- 整体评价: ${this.getOverallAssessment(sentiment, constructiveness)}`;
    }

    return {
      content: [
        {
          type: 'text',
          text: result
        }
      ]
    };
  }

  // 辅助方法
  analyzeSentiment(text) {
    // 简化的情感分析
    const positiveWords = ['好', '优秀', '棒', '不错', '赞', '满意', '喜欢', '推荐'];
    const negativeWords = ['差', '糟糕', '失望', '问题', '错误', '不好', '讨厌', '反对'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
      if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
    });

    const score = (positiveCount - negativeCount + words.length) / (words.length * 2);
    let label, description;

    if (score > 0.6) {
      label = '积极';
      description = '反馈总体呈现积极正面的态度';
    } else if (score < 0.4) {
      label = '消极';
      description = '反馈偏向消极，可能需要调整语调';
    } else {
      label = '中性';
      description = '反馈保持中性客观的态度';
    }

    return { score, label, description };
  }

  analyzeConstructiveness(text) {
    const constructiveIndicators = ['建议', '可以', '应该', '改进', '优化', '考虑', '尝试'];
    const destructiveIndicators = ['糟糕', '垃圾', '无用', '愚蠢', '讨厌'];

    let constructiveCount = 0;
    let destructiveCount = 0;

    constructiveIndicators.forEach(indicator => {
      if (text.includes(indicator)) constructiveCount++;
    });

    destructiveIndicators.forEach(indicator => {
      if (text.includes(indicator)) destructiveCount++;
    });

    const score = Math.max(1, Math.min(10, (constructiveCount * 2 - destructiveCount + 5)));
    const description = score > 7 ? '反馈非常建设性' : score > 4 ? '反馈有一定建设性' : '反馈建设性不足';

    return { score, description };
  }

  analyzeSpecificity(text) {
    const specificIndicators = ['具体', '例如', '比如', '第', '行', '页', '部分', '方面'];
    const vagueIndicators = ['一些', '很多', '大概', '可能', '似乎'];

    let specificCount = 0;
    let vagueCount = 0;

    specificIndicators.forEach(indicator => {
      if (text.includes(indicator)) specificCount++;
    });

    vagueIndicators.forEach(indicator => {
      if (text.includes(indicator)) vagueCount++;
    });

    const score = Math.max(1, Math.min(10, (specificCount * 2 - vagueCount + 4)));
    const description = score > 7 ? '反馈非常具体' : score > 4 ? '反馈有一定具体性' : '反馈过于模糊';

    return { score, description };
  }

  analyzeActionability(text) {
    const actionableIndicators = ['请', '可以', '建议', '需要', '应该', '尝试', '考虑', '实施'];
    
    let actionableCount = 0;
    actionableIndicators.forEach(indicator => {
      if (text.includes(indicator)) actionableCount++;
    });

    const score = Math.max(1, Math.min(10, actionableCount * 2 + 3));
    const description = score > 7 ? '反馈提供了明确的行动指导' : score > 4 ? '反馈有一定可执行性' : '反馈缺乏可执行的建议';

    return { score, description };
  }

  calculateQualityScore(analysis) {
    return Math.round((analysis.constructiveness.score + analysis.specificity.score + analysis.actionability.score) / 3 * 10) / 10;
  }

  generateImprovementSuggestions(analysis) {
    const suggestions = [];

    if (analysis.constructiveness.score < 6) {
      suggestions.push('增加建设性建议，避免纯粹的批评');
    }

    if (analysis.specificity.score < 6) {
      suggestions.push('提供更具体的例子和细节');
    }

    if (analysis.actionability.score < 6) {
      suggestions.push('添加可执行的改进建议');
    }

    return suggestions;
  }

  applyEnhancement(feedback, style, audience) {
    // 简化的反馈增强逻辑
    let enhanced = feedback;
    const improvements = [];

    if (style === 'constructive') {
      enhanced = `基于对${audience}的反馈，我想分享以下观点：\n\n${enhanced}`;
      improvements.push('添加了建设性的开头');
    }

    if (style === 'professional') {
      enhanced = enhanced.replace(/很好|不错/g, '表现出色');
      enhanced = enhanced.replace(/不行|不好/g, '有改进空间');
      improvements.push('使用了更专业的表达');
    }

    return {
      text: enhanced,
      explanation: `应用了${style}风格的增强，针对${audience}进行了优化`,
      improvements
    };
  }

  getAreaSpecificSuggestions(feedback, area) {
    const suggestions = {
      clarity: [
        '使用更清晰的表达方式',
        '避免模糊的词汇',
        '组织逻辑结构'
      ],
      specificity: [
        '提供具体的例子',
        '引用具体的数据或事实',
        '明确指出问题位置'
      ],
      constructiveness: [
        '提供改进建议',
        '避免纯粹的批评',
        '关注解决方案'
      ],
      actionability: [
        '提供可执行的步骤',
        '设定明确的目标',
        '建议具体的行动'
      ],
      tone: [
        '使用更友好的语调',
        '保持专业和尊重',
        '平衡积极和消极的反馈'
      ]
    };

    return {
      area: area,
      suggestions: suggestions[area] || ['暂无建议']
    };
  }

  createFeedbackTemplate(scenario, tone, includeExamples) {
    const templates = {
      code_review: `# 代码审查反馈模板

## 积极方面
- [具体指出代码中做得好的地方]

## 改进建议
- [具体的改进建议]

## 下一步行动
- [明确的下一步指导]`,

      performance_review: `# 绩效评估反馈

## 表现亮点
- [具体的成就和优势]

## 发展机会
- [需要改进的领域]

## 发展计划
- [具体的发展建议和目标]`,

      // 其他模板...
    };

    return templates[scenario] || '暂无该场景的模板';
  }

  getOverallAssessment(sentiment, constructiveness) {
    if (sentiment.score > 0.6 && constructiveness.score > 7) {
      return '这是一个积极且建设性的反馈';
    } else if (sentiment.score < 0.4 && constructiveness.score < 4) {
      return '反馈偏向消极且缺乏建设性，建议重新组织';
    } else {
      return '反馈整体还可以，但仍有改进空间';
    }
  }

  getBestPracticesGuide() {
    return `# 有效反馈最佳实践指南

## 核心原则

### 1. 具体性 (Specificity)
- 提供具体的例子和证据
- 避免模糊的概括性陈述
- 明确指出问题的位置和原因

### 2. 建设性 (Constructiveness)
- 专注于行为而非个人特质
- 提供改进建议而非仅仅指出问题
- 保持解决问题的导向

### 3. 及时性 (Timeliness)
- 尽快提供反馈
- 在事件记忆犹新时进行讨论
- 避免积累问题后一次性反馈

### 4. 平衡性 (Balance)
- 同时提供积极和需要改进的反馈
- 先肯定成就，再提出改进建议
- 避免过于消极或过于积极

### 5. 可执行性 (Actionability)
- 提供明确的下一步行动
- 设定可测量的目标
- 确保建议是可实施的

## 反馈框架

### SBI 模型
- **Situation**: 描述具体情况
- **Behavior**: 指出具体行为
- **Impact**: 说明影响结果

### COIN 方法
- **Context**: 提供背景
- **Observation**: 客观观察
- **Impact**: 影响分析
- **Next**: 下一步行动

## 常见误区

1. **过于笼统**: "你做得不好" → "在项目管理方面需要改进"
2. **情绪化表达**: "太糟糕了" → "这个方法可能不是最优的"
3. **缺乏建议**: "有问题" → "建议尝试这种方法"
4. **延迟反馈**: 等待正式评估 → 及时给予反馈

## 语言技巧

### 积极语言
- "我建议..." 而非 "你应该..."
- "可以考虑..." 而非 "必须..."
- "这样做的好处是..." 而非 "不这样做就..."

### 中性表达
- "我观察到..." 而非 "你总是..."
- "在这种情况下..." 而非 "你从来不..."
- "一个可能的方法是..." 而非 "唯一的办法是..."`;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Feedback Enhancement MCP Server running on stdio');
    console.error('Available tools: analyze_feedback, enhance_feedback, suggest_feedback_improvements, generate_feedback_template, feedback_sentiment_score');
  }
}

// 启动服务器
const server = new FeedbackEnhanceMCPServer();
server.run().catch(console.error);