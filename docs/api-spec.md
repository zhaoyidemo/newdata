# 双重评分模块 API 接口文档

## 概述

本文档定义了齐家AI数据面板"双重评分"模块所需的后端 API 接口规范。

**基础路径**: `/api/dual-rating`

**通用响应格式**:
```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

**错误响应**:
```json
{
  "code": 400,
  "message": "错误描述",
  "data": null
}
```

---

## 数据脱敏要求（重要）

以下接口返回的对话内容**必须在后端完成脱敏处理**后再返回：

- `GET /api/dual-rating/dislike-conversations` - 点踩对话
- `GET /api/dual-rating/conversations-by-rating` - 按评分查看对话（尤其是1-4分低分对话）

### 脱敏规则

| 数据类型 | 脱敏规则 | 示例 |
|----------|----------|------|
| 手机号 | 保留前3后4位 | `138****1234` |
| 姓名（2字） | 保留姓，名用* | `张*` |
| 姓名（3字及以上） | 保留姓和最后一字 | `张*明`、`欧阳*修` |
| 身份证号 | 保留前4后4位 | `3201**********1234` |
| 银行卡号 | 保留后4位 | `************5678` |
| 邮箱 | 保留@前2位和域名 | `zh***@example.com` |
| 详细地址 | 仅保留省市区 | `江苏省南京市鼓楼区***` |
| 微信号/QQ号 | 全部替换 | `[已脱敏]` |
| 公司/学校名称 | 保留前2字 | `阿里**`、`南京**` |

### 敏感词检测

对话内容中如出现以下敏感信息，需自动检测并脱敏：

```
正则示例：
- 手机号: /1[3-9]\d{9}/g
- 身份证: /\d{17}[\dXx]/g
- 邮箱: /[\w.-]+@[\w.-]+\.\w+/g
- 银行卡: /\d{16,19}/g
```

### 脱敏示例

**原始对话**:
```
用户: 我叫张三，手机号是13812345678，住在南京市鼓楼区中山路100号
```

**脱敏后**:
```
用户: 我叫张*，手机号是138****5678，住在江苏省南京市鼓楼区***
```

### 注意事项

1. **脱敏必须在服务端完成**，敏感原文不能传输到前端
2. 统计数据（人数、评分等）无需脱敏
3. 脱敏后的数据应保持可读性，便于分析问题
4. 建议记录脱敏日志，便于审计

---

## 1. 用户评分数据

### 1.1 获取每日用户评分列表

获取指定日期范围内的用户评分统计数据。

**请求**
```
GET /api/dual-rating/user-ratings
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 是 | 开始日期，格式 YYYY-MM-DD |
| endDate | string | 是 | 结束日期，格式 YYYY-MM-DD |
| version | string | 否 | 版本筛选：`all`(默认) / `A` / `B` |

**响应示例**
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "date": "2025-01-19",
      "fiveStarCount": 120,
      "fourFiveStarCount": 185,
      "totalRatedUsers": 250,
      "insightUsers": 320,
      "activeUsers": 500,
      "totalConversations": 3000,
      "distribution": {
        "rating1": 8,
        "rating2": 15,
        "rating3": 42,
        "rating4": 65,
        "rating5": 120,
        "unrated": 70
      },
      "dislikeCount": 15,
      "dislikeRate": 0.5,
      "cumulativeDislikeCount": 5120
    }
  ]
}
```

**字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| date | string | 统计日期 |
| fiveStarCount | number | 5分人数（去重，同一用户当天多次评5分只算1人）|
| fourFiveStarCount | number | 4-5分人数（去重）|
| totalRatedUsers | number | 当天评分总人数（去重）|
| insightUsers | number | 当天生成洞察的用户数 |
| activeUsers | number | 当天活跃用户数（至少发起1次对话）|
| totalConversations | number | 当天总对话轮次数 |
| distribution | object | 评分分布详情 |
| distribution.rating1-5 | number | 各评分人数 |
| distribution.unrated | number | 生成洞察但未评分的人数 |
| dislikeCount | number | 当天点踩轮次数 |
| dislikeRate | number | 点踩率 = dislikeCount / totalConversations * 100 |
| cumulativeDislikeCount | number | 历史累计点踩总数 |

---

## 2. AI 评估数据

### 2.1 获取每日 AI 评估列表

获取 AI 评估器对对话质量的三维度评分数据。

**请求**
```
GET /api/dual-rating/ai-evaluations
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 是 | 开始日期，格式 YYYY-MM-DD |
| endDate | string | 是 | 结束日期，格式 YYYY-MM-DD |
| version | string | 否 | 版本筛选：`all`(默认) / `A` / `B` |

**响应示例**
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "date": "2025-01-19",
      "empathyScore": 75.5,
      "positiveAttentionScore": 78.2,
      "allianceScore": 72.8
    }
  ]
}
```

**字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| date | string | 统计日期 |
| empathyScore | number | 共情维度平均分（0-100）|
| positiveAttentionScore | number | 积极关注维度平均分（0-100）|
| allianceScore | number | 咨访同盟维度平均分（0-100）|

**评分维度说明**
- **共情**: AI 是否能理解和反映用户的情感状态
- **积极关注**: AI 是否展现出对用户的关心和支持
- **咨访同盟**: AI 与用户之间的信任和合作关系质量

---

## 3. 交叉对照数据

### 3.1 获取用户评分与 AI 评估交叉对照表

分析不同用户评分等级下的 AI 评估分数分布。

**请求**
```
GET /api/dual-rating/cross-analysis
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date | string | 是 | 统计日期，格式 YYYY-MM-DD |
| version | string | 否 | 版本筛选：`all`(默认) / `A` / `B` |

**响应示例**
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "userRating": "5分",
      "topicCount": 150,
      "empathyAvg": 82.5,
      "positiveAttentionAvg": 85.2,
      "allianceAvg": 80.1
    },
    {
      "userRating": "4分",
      "topicCount": 100,
      "empathyAvg": 76.3,
      "positiveAttentionAvg": 78.5,
      "allianceAvg": 74.2
    },
    {
      "userRating": "3分",
      "topicCount": 60,
      "empathyAvg": 68.1,
      "positiveAttentionAvg": 70.3,
      "allianceAvg": 66.5
    },
    {
      "userRating": "2分",
      "topicCount": 30,
      "empathyAvg": 58.2,
      "positiveAttentionAvg": 60.1,
      "allianceAvg": 55.8
    },
    {
      "userRating": "1分",
      "topicCount": 15,
      "empathyAvg": 45.5,
      "positiveAttentionAvg": 48.2,
      "allianceAvg": 42.1
    },
    {
      "userRating": "未评分",
      "topicCount": 80,
      "empathyAvg": 70.2,
      "positiveAttentionAvg": 72.5,
      "allianceAvg": 68.3
    }
  ]
}
```

**字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| userRating | string | 用户评分等级：5分/4分/3分/2分/1分/未评分 |
| topicCount | number | 该评分等级的话题数量 |
| empathyAvg | number | 该评分等级话题的 AI 共情平均分 |
| positiveAttentionAvg | number | 该评分等级话题的 AI 积极关注平均分 |
| allianceAvg | number | 该评分等级话题的 AI 咨访同盟平均分 |

---

## 4. 点踩对话数据

### 4.1 获取点踩对话列表

获取用户点踩的对话详情，用于分析问题回复。

**请求**
```
GET /api/dual-rating/dislike-conversations
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期（默认当天）|
| endDate | string | 否 | 结束日期（默认当天）|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20，最大 100 |

**响应示例**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 156,
    "page": 1,
    "pageSize": 20,
    "list": [
      {
        "topicId": "12345",
        "dislikeTime": "2025-01-19 14:30",
        "topic": "关于孩子学习问题",
        "messages": [
          {
            "role": "user",
            "content": "我儿子最近不爱学习了"
          },
          {
            "role": "ai",
            "content": "这很正常，青春期的孩子都会有这样的阶段"
          },
          {
            "role": "user",
            "content": "但我很担心他成绩下降"
          },
          {
            "role": "ai",
            "content": "你不用担心，成绩不重要",
            "isDisliked": true
          }
        ]
      }
    ]
  }
}
```

**字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| topicId | string | 话题唯一标识 |
| dislikeTime | string | 点踩时间 |
| topic | string | 话题标题/摘要 |
| messages | array | 对话消息列表 |
| messages[].role | string | 消息角色：`user` / `ai` |
| messages[].content | string | 消息内容 |
| messages[].isDisliked | boolean | 是否为被点踩的消息 |

---

## 5. AB 测试数据

### 5.1 获取 AB 版本汇总对比

获取 A/B 两个版本的关键指标对比数据。

**请求**
```
GET /api/dual-rating/ab-summary
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 是 | 开始日期 |
| endDate | string | 是 | 结束日期 |

**响应示例**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "versionA": {
      "name": "心理咨询风格",
      "userRating": {
        "fiveStarCount": 65,
        "fourFiveStarCount": 95,
        "totalRatedUsers": 125,
        "fiveStarRate": 52.0,
        "fourFiveStarRate": 76.0,
        "activeUsers": 250,
        "insightUsers": 160,
        "dislikeRate": 0.4
      },
      "aiEvaluation": {
        "empathyScore": 77.5,
        "positiveAttentionScore": 80.2,
        "allianceScore": 74.8
      }
    },
    "versionB": {
      "name": "教练技术风格",
      "userRating": {
        "fiveStarCount": 55,
        "fourFiveStarCount": 85,
        "totalRatedUsers": 120,
        "fiveStarRate": 45.8,
        "fourFiveStarRate": 70.8,
        "activeUsers": 250,
        "insightUsers": 155,
        "dislikeRate": 0.6
      },
      "aiEvaluation": {
        "empathyScore": 73.2,
        "positiveAttentionScore": 76.5,
        "allianceScore": 70.1
      }
    }
  }
}
```

---

## 6. 评估器版本信息

### 6.1 获取评估器版本和变更日志

**请求**
```
GET /api/dual-rating/evaluator-version
```

**响应示例**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "version": "v1.2.0",
    "lastUpdate": "2025-01-10",
    "changelog": [
      {
        "version": "v1.2.0",
        "date": "2025-01-10",
        "changes": [
          "优化共情维度评分标准",
          "调整咨访同盟权重"
        ]
      },
      {
        "version": "v1.1.0",
        "date": "2024-12-20",
        "changes": [
          "新增对沉默回应的评估",
          "修正积极关注评分偏差"
        ]
      }
    ]
  }
}
```

---

## 7. 按评分查看对话

### 7.1 获取指定评分的对话列表

用于"查看对话"功能，查看某个评分等级的对话详情。

**请求**
```
GET /api/dual-rating/conversations-by-rating
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date | string | 是 | 统计日期 |
| rating | number | 是 | 评分等级：1-5，0表示未评分 |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20 |

**响应示例**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 120,
    "page": 1,
    "pageSize": 20,
    "list": [
      {
        "topicId": "12345",
        "userId": "user_001",
        "rating": 5,
        "ratingTime": "2025-01-19 15:30",
        "topic": "亲子沟通问题",
        "messageCount": 8,
        "aiEvaluation": {
          "empathyScore": 85.2,
          "positiveAttentionScore": 88.1,
          "allianceScore": 82.5
        }
      }
    ]
  }
}
```

---

## 附录

### A. AB 版本分配规则

用户按 ID 进行固定分配：
- **A版（心理咨询风格）**: 用户ID为奇数
- **B版（教练技术风格）**: 用户ID为偶数

或使用专门的 AB 分组表进行管理。

### B. 数据统计口径

| 指标 | 计算方式 |
|------|----------|
| 5分占比 | 5分人数 ÷ 当天生成洞察且评分的总人数 × 100% |
| 4-5分占比 | (4分人数 + 5分人数) ÷ 当天生成洞察且评分的总人数 × 100% |
| 洞察触发率 | 今日生成洞察用户数 ÷ 今日活跃用户数 × 100% |
| 评分率 | 今日评分用户数 ÷ 今日生成洞察用户数 × 100% |
| 点踩率 | 点踩轮次数 ÷ 总对话轮次数 × 100% |

### C. 数据去重规则

- **用户评分**: 同一用户同一天多次评同一分数只计1人
- **活跃用户**: 按用户ID去重
- **点踩统计**: 按轮次统计，同一轮次多次点踩只计1次

### D. 建议的数据库索引

```sql
-- 用户评分表
CREATE INDEX idx_ratings_date_version ON user_ratings(date, version);
CREATE INDEX idx_ratings_user_date ON user_ratings(user_id, date);

-- AI评估表
CREATE INDEX idx_evaluations_date ON ai_evaluations(date);
CREATE INDEX idx_evaluations_topic ON ai_evaluations(topic_id);

-- 点踩记录表
CREATE INDEX idx_dislikes_date ON dislikes(created_at);
```
