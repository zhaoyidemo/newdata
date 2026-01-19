// 评分分布
export interface RatingDistribution {
  rating1: number;
  rating2: number;
  rating3: number;
  rating4: number;
  rating5: number;
  unrated: number;
}

// 每日用户评分数据
export interface DailyUserRating {
  date: string;
  fiveStarCount: number;        // 5分人数
  fourFiveStarCount: number;    // 4-5分人数
  totalRatedUsers: number;      // 评分总人数
  insightUsers: number;         // 生成洞察用户数
  activeUsers: number;          // 活跃用户数
  totalConversations: number;   // 总对话轮次数
  distribution: RatingDistribution;
  // 点踩数据
  dislikeCount: number;         // 今日点踩轮次数
  dislikeRate: number;          // 点踩率 (点踩轮次数 ÷ 总对话轮次数)
  cumulativeDislikeCount: number; // 累计点踩轮次数
}

// 点踩对话示例
export interface DislikeConversation {
  topicId: string;
  dislikeTime: string;
  topic: string;
  messages: {
    role: 'user' | 'ai';
    content: string;
    isDisliked?: boolean;
  }[];
}

// 每日AI评估数据
export interface DailyAIEvaluation {
  date: string;
  empathyScore: number;           // 共情平均分 (0-100)
  positiveAttentionScore: number; // 积极关注平均分 (0-100)
  allianceScore: number;          // 咨访同盟平均分 (0-100)
}

// 交叉对照数据
export interface CrossAnalysisRow {
  userRating: string;
  topicCount: number;
  empathyAvg: number;
  positiveAttentionAvg: number;
  allianceAvg: number;
}

// AB测试版本数据
export interface VersionData {
  userRating: DailyUserRating;
  aiEvaluation: DailyAIEvaluation;
  crossAnalysis: CrossAnalysisRow[];
}

// AB测试对比数据
export interface ABTestData {
  versionA: VersionData;
  versionB: VersionData;
}

// 评估器版本信息
export interface EvaluatorVersion {
  version: string;
  lastUpdate: string;
  changelog: ChangelogEntry[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

