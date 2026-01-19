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

## 数据脱敏规范（重要）

以下接口返回的对话内容**必须在后端完成脱敏处理**后再返回：

- `GET /api/dual-rating/dislike-conversations` - 点踩对话
- `GET /api/dual-rating/conversations-by-rating` - 按评分查看对话（尤其是1-4分低分对话）

### 一、核心原则

1. **双轨存储**：原文与脱敏版本分开存储，通过唯一ID关联
2. **权限隔离**：原文仅限最小授权人员访问，脱敏版用于日常分析
3. **可追溯**：脱敏标记支持必要时的回查（如用户投诉核实）
4. **语义完整**：脱敏后仍能准确理解对话情境和问题本质

### 二、脱敏标记规范

采用统一标记格式：`[类型:序号]`

| 标记 | 含义 | 示例 |
|------|------|------|
| `[P:1]` | Person 人名 | 张伟 → [P:1] |
| `[C:1]` | Child 孩子名 | 小明 → [C:1] |
| `[S:1]` | School 学校 | 北京XX小学 → [S:1] |
| `[H:1]` | Hospital 医院 | 儿童医院 → [H:1] |
| `[O:1]` | Organization 机构/公司 | 阿里巴巴 → [O:1] |
| `[L:1]` | Location 地点 | 朝阳区XX路 → [L:1] |
| `[T:1]` | Teacher 老师名 | 王老师 → [T:1] |
| `[D:1]` | Date 具体日期 | 3月15日 → [D:1] |
| `[N:1]` | Number 敏感数字 | 手机号、金额等 → [N:1] |
| `[M:1]` | Medical 医疗信息 | 诊断号、病历号 → [M:1] |

### 三、分类脱敏规则

#### 3.1 人物信息

| 原始类型 | 脱敏处理 | 附加元数据 |
|---------|---------|-----------|
| 家长姓名 | [P:序号] | 角色：主诉人/配偶/祖辈 |
| 孩子姓名 | [C:序号] | 性别、年龄段（如：男，8-9岁） |
| 孩子昵称 | 与正名同序号 | - |
| 老师姓名 | [T:序号] | 角色：班主任/科任/校长 |
| 医生姓名 | [P:序号] | 角色：医生 |
| 其他亲属 | [P:序号] | 关系：外婆/舅舅等 |

#### 3.2 机构信息

| 原始类型 | 脱敏处理 | 附加元数据 |
|---------|---------|-----------|
| 学校 | [S:序号] | 类型+层级（公立小学/私立初中/重点高中） |
| 幼儿园 | [S:序号] | 类型（公立/私立/国际） |
| 培训机构 | [O:序号] | 类型（学科/艺术/体育） |
| 医院 | [H:序号] | 级别（三甲/专科/社区） |
| 工作单位 | [O:序号] | 行业（互联网/金融/教育/体制内） |

#### 3.3 地理信息

| 原始类型 | 脱敏处理 | 附加元数据 |
|---------|---------|-----------|
| 详细地址 | [L:序号] | 城市层级（一线/新一线/二线/三四线） |
| 小区名 | [L:序号] | - |
| 城市+区县 | [L:序号] | 城市层级 |

#### 3.4 时间信息

| 原始类型 | 脱敏处理 | 附加元数据 |
|---------|---------|-----------|
| 具体日期 | [D:序号] | 相对时间（当天/近一周/近一月/更早） |
| 孩子生日 | 直接转换 | 仅保留年龄（如：6岁3个月） |
| 事件时间 | 保留时段 | 上午/下午/晚上/深夜 |

#### 3.5 数字与账号

| 原始类型 | 脱敏处理 | 附加元数据 |
|---------|---------|-----------|
| 手机号 | [N:序号] | - |
| 身份证号 | [N:序号] | - |
| 微信/QQ | [N:序号] | - |
| 收入金额 | [N:序号] | 区间（月入<1万/1-3万/3-5万/5万+） |
| 消费金额 | 视情况保留或[N:序号] | 如与教育投入相关可保留范围 |

#### 3.6 医疗健康信息

| 原始类型 | 脱敏处理 | 附加元数据 |
|---------|---------|-----------|
| 病历号/诊断号 | [M:序号] | - |
| 诊断结果 | 可保留类型 | 如：ADHD、自闭谱系、焦虑症 |
| 药物名称 | 可保留 | 有助于理解情况 |
| 测评分数 | 可保留范围 | 如：中等/偏低/临床水平 |

### 四、脱敏示例

**原始对话**：
```
用户：我儿子张浩今年在北京市朝阳区实验小学上三年级，上周三班主任王丽打电话说他又打人了。我老公李明在字节跳动上班，996根本不管孩子，每次都是我一个人去学校。张浩之前在北京儿童医院看过，说是多动症，开了专注达在吃。我们家住在望京SOHO附近，我手机13812345678，有问题可以联系我。
```

**脱敏后**：
```
用户：我儿子[C:1]今年在[L:1][S:1]上三年级，[D:1]班主任[T:1]打电话说他又打人了。我老公[P:1]在[O:1]上班，996根本不管孩子，每次都是我一个人去学校。[C:1]之前在[H:1]看过，说是多动症，开了专注达在吃。我们家住在[L:2]附近，我手机[N:1]，有问题可以联系我。
```

**实体映射表**（仅高权限可访问）：

| entity_tag | original_value | entity_type | metadata |
|------------|----------------|-------------|----------|
| [C:1] | 张浩 | child | {"gender":"男","age":"8-9岁","grade":"三年级"} |
| [P:1] | 李明 | person | {"role":"配偶","relation":"父亲"} |
| [T:1] | 王丽 | teacher | {"role":"班主任"} |
| [S:1] | 实验小学 | school | {"type":"公立小学"} |
| [O:1] | 字节跳动 | organization | {"industry":"互联网"} |
| [H:1] | 北京儿童医院 | hospital | {"level":"三甲专科"} |
| [L:1] | 北京市朝阳区 | location | {"city_tier":"一线"} |
| [L:2] | 望京SOHO附近 | location | {"type":"住址"} |
| [D:1] | 上周三 | date | {"relative":"近一周"} |
| [N:1] | 13812345678 | number | {"type":"手机号"} |

### 五、存储结构设计

```sql
-- 对话主表
conversations (
  conversation_id,      -- 主键
  user_id_hash,         -- 用户ID哈希值
  score,                -- 评分1-5
  created_at,
  conversation_type,    -- 问题类型标签
  child_age_range,      -- 孩子年龄段
  city_tier             -- 城市层级
)

-- 原文表【高权限访问，加密存储】
raw_messages (
  message_id,
  conversation_id,
  role,                 -- user/assistant
  raw_content,          -- 原文（AES-256加密）
  created_at
)

-- 脱敏表【日常分析使用】
masked_messages (
  message_id,
  conversation_id,
  role,
  masked_content,       -- 脱敏后文本
  created_at
)

-- 实体映射表【高权限访问，加密存储】
entity_mapping (
  conversation_id,
  entity_tag,           -- [P:1], [S:1]等
  original_value,       -- 原始值（加密）
  entity_type,
  metadata              -- JSON格式附加信息
)
```

### 六、权限分级

| 角色 | 可访问数据 | 用途 |
|------|-----------|------|
| 数据分析师 | 脱敏表 + 元数据 | 日常分析、模型优化 |
| 产品经理 | 脱敏表 | 问题类型研究、功能迭代 |
| 质量审核员 | 脱敏表 + 原文表（审批后） | 用户投诉核查 |
| 数据安全员 | 全部 | 脱敏执行、审计 |

**原文访问需走审批流程**：申请 → 数据安全员审批 → 开通临时权限（最长72小时） → 全程日志记录 → 到期自动回收

### 七、脱敏执行流程

```
1. 数据提取：筛选评分1-4分 / 点踩的对话
       ↓
2. 自动化脱敏：
   • 正则匹配：手机号、身份证、邮箱
   • NER模型：人名、地名、机构名
   • 规则库：学校、医院等关键词
       ↓
3. 生成实体映射表：为每个实体分配标签并记录原值
       ↓
4. 人工复核（抽检10%）：检查遗漏、上下文关联泄露、语义完整性
       ↓
5. 入库：原文加密存储，脱敏版供分析使用
```

### 八、安全保障

| 措施 | 说明 |
|------|------|
| 传输加密 | 全程HTTPS，内部传输TLS 1.3 |
| 存储加密 | 原文表、映射表AES-256加密 |
| 访问日志 | 记录所有查询操作，保留180天 |
| 脱敏审计 | 每月抽检脱敏质量，每季度规则评审 |
| 数据保留 | 原文保留90天后自动销毁，脱敏数据按需保留 |

### 九、特殊场景

1. **危机类对话**（涉及自伤/伤他）：额外标记 `[CRISIS]`，原文访问需双人审批
2. **图片/语音描述内容**：同等适用脱敏规则
3. **统计数据**（人数、评分等数值）：无需脱敏

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
