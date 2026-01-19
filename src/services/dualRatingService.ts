/**
 * 双重评分模块数据服务层
 * 支持 mock 数据和真实 API 两种模式切换
 */

import type {
  DailyUserRating,
  DailyAIEvaluation,
  CrossAnalysisRow,
  EvaluatorVersion,
  ABTestData,
  DislikeConversation,
} from '../types';
import {
  generateUserRatingData,
  generateAIEvaluationData,
  generateCrossAnalysisData,
  generateABTestData,
  generateABTrendData,
  evaluatorVersion,
  sampleDislikeConversations,
} from '../mock';

// 环境变量配置
const DATA_MODE = import.meta.env.VITE_DATA_MODE || 'mock';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;

// 判断是否使用 mock 数据
const useMock = DATA_MODE === 'mock';

/**
 * 通用 API 请求封装
 */
async function fetchApi<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // 假设后端返回格式为 { code: 0, message: 'success', data: ... }
    if (result.code !== 0) {
      throw new Error(result.message || 'API Error');
    }

    return result.data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('请求超时');
    }
    throw error;
  }
}

/**
 * 获取用户评分数据
 * @param days 天数（mock 模式使用）
 * @param startDate 开始日期（API 模式使用）
 * @param endDate 结束日期（API 模式使用）
 * @param version 版本筛选 all/A/B
 */
export async function getUserRatingData(
  days: number = 30,
  startDate?: string,
  endDate?: string,
  version: string = 'all'
): Promise<DailyUserRating[]> {
  if (useMock) {
    // Mock 模式：直接返回生成的数据
    return generateUserRatingData(days);
  }

  // API 模式：调用后端接口
  return fetchApi<DailyUserRating[]>('/api/dual-rating/user-ratings', {
    startDate: startDate || '',
    endDate: endDate || '',
    version,
  });
}

/**
 * 获取 AI 评估数据
 * @param days 天数（mock 模式使用）
 * @param startDate 开始日期（API 模式使用）
 * @param endDate 结束日期（API 模式使用）
 * @param version 版本筛选 all/A/B
 */
export async function getAIEvaluationData(
  days: number = 30,
  startDate?: string,
  endDate?: string,
  version: string = 'all'
): Promise<DailyAIEvaluation[]> {
  if (useMock) {
    return generateAIEvaluationData(days);
  }

  return fetchApi<DailyAIEvaluation[]>('/api/dual-rating/ai-evaluations', {
    startDate: startDate || '',
    endDate: endDate || '',
    version,
  });
}

/**
 * 获取交叉对照数据
 * @param date 统计日期
 * @param version 版本筛选 all/A/B
 */
export async function getCrossAnalysisData(
  date?: string,
  version: string = 'all'
): Promise<CrossAnalysisRow[]> {
  if (useMock) {
    return generateCrossAnalysisData();
  }

  return fetchApi<CrossAnalysisRow[]>('/api/dual-rating/cross-analysis', {
    date: date || '',
    version,
  });
}

/**
 * 获取点踩对话列表
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @param page 页码
 * @param pageSize 每页数量
 */
export async function getDislikeConversations(
  startDate?: string,
  endDate?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ total: number; list: DislikeConversation[] }> {
  if (useMock) {
    // Mock 模式：返回示例数据
    return {
      total: sampleDislikeConversations.length,
      list: sampleDislikeConversations,
    };
  }

  return fetchApi<{ total: number; list: DislikeConversation[] }>(
    '/api/dual-rating/dislike-conversations',
    {
      startDate: startDate || '',
      endDate: endDate || '',
      page: String(page),
      pageSize: String(pageSize),
    }
  );
}

/**
 * 获取评估器版本信息
 */
export async function getEvaluatorVersion(): Promise<EvaluatorVersion> {
  if (useMock) {
    return evaluatorVersion;
  }

  return fetchApi<EvaluatorVersion>('/api/dual-rating/evaluator-version');
}

/**
 * 获取 AB 测试单日数据
 * @param date 统计日期
 */
export async function getABTestData(date: string): Promise<ABTestData> {
  if (useMock) {
    return generateABTestData(date);
  }

  return fetchApi<ABTestData>('/api/dual-rating/ab-summary', {
    startDate: date,
    endDate: date,
  });
}

/**
 * 获取 AB 测试趋势数据
 * @param days 天数（mock 模式使用）
 * @param startDate 开始日期（API 模式使用）
 * @param endDate 结束日期（API 模式使用）
 */
export async function getABTrendData(
  days: number = 30,
  startDate?: string,
  endDate?: string
): Promise<ABTestData[]> {
  if (useMock) {
    return generateABTrendData(days);
  }

  // API 模式需要后端支持返回趋势数据
  return fetchApi<ABTestData[]>('/api/dual-rating/ab-trend', {
    startDate: startDate || '',
    endDate: endDate || '',
  });
}

/**
 * 获取指定评分的对话列表
 * @param date 统计日期
 * @param rating 评分等级 1-5，0表示未评分
 * @param page 页码
 * @param pageSize 每页数量
 */
export async function getConversationsByRating(
  date: string,
  rating: number,
  page: number = 1,
  pageSize: number = 20
): Promise<{ total: number; list: unknown[] }> {
  if (useMock) {
    // Mock 模式：返回空列表（此功能需要真实数据）
    return { total: 0, list: [] };
  }

  return fetchApi<{ total: number; list: unknown[] }>(
    '/api/dual-rating/conversations-by-rating',
    {
      date,
      rating: String(rating),
      page: String(page),
      pageSize: String(pageSize),
    }
  );
}

// 导出数据模式，供组件判断使用
export const isUsingMockData = useMock;
