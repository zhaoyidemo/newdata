import { useEffect, useMemo, useState } from 'react';
import { Card, Table, Select, Space, Spin, message } from 'antd';
import { useDate } from '../../../context/DateContext';
import { TrendChart } from '../../../components';
import { getABTrendData } from '../../../services/dualRatingService';
import type { ABTestData } from '../../../types';

const ABSummary = () => {
  const { selectedDate } = useDate();
  const [trendMetric, setTrendMetric] = useState('fiveStarRatio');
  const [loading, setLoading] = useState(true);
  const [abTrendData, setAbTrendData] = useState<ABTestData[]>([]);

  // 获取 AB 测试趋势数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getABTrendData(30);
        setAbTrendData(data);
      } catch (error) {
        message.error('获取AB测试数据失败');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentData = useMemo(() => {
    const dateStr = selectedDate.format('YYYY-MM-DD');
    return abTrendData.find((d) => d.versionA.userRating.date === dateStr) || abTrendData[abTrendData.length - 1];
  }, [abTrendData, selectedDate]);

  // 如果没有数据，显示加载中
  if (loading || !currentData) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin tip="加载中..." />
      </div>
    );
  }

  const { versionA, versionB } = currentData;

  // 计算各项指标
  const calcRatio = (count: number, total: number) =>
    total > 0 ? ((count / total) * 100).toFixed(1) : '0';

  const aFiveStarRatio = calcRatio(versionA.userRating.fiveStarCount, versionA.userRating.totalRatedUsers);
  const bFiveStarRatio = calcRatio(versionB.userRating.fiveStarCount, versionB.userRating.totalRatedUsers);

  const aFourFiveRatio = calcRatio(versionA.userRating.fourFiveStarCount, versionA.userRating.totalRatedUsers);
  const bFourFiveRatio = calcRatio(versionB.userRating.fourFiveStarCount, versionB.userRating.totalRatedUsers);

  const aInsightRate = calcRatio(versionA.userRating.insightUsers, versionA.userRating.activeUsers);
  const bInsightRate = calcRatio(versionB.userRating.insightUsers, versionB.userRating.activeUsers);

  const aRatingRate = calcRatio(versionA.userRating.totalRatedUsers, versionA.userRating.insightUsers);
  const bRatingRate = calcRatio(versionB.userRating.totalRatedUsers, versionB.userRating.insightUsers);

  const tableData = [
    { key: '1', metric: '使用人数', versionA: versionA.userRating.activeUsers, versionB: versionB.userRating.activeUsers },
    { key: '2', metric: '5分人数', versionA: versionA.userRating.fiveStarCount, versionB: versionB.userRating.fiveStarCount },
    { key: '3', metric: '5分占比', versionA: `${aFiveStarRatio}%`, versionB: `${bFiveStarRatio}%` },
    { key: '4', metric: '4-5分人数', versionA: versionA.userRating.fourFiveStarCount, versionB: versionB.userRating.fourFiveStarCount },
    { key: '5', metric: '4-5分占比', versionA: `${aFourFiveRatio}%`, versionB: `${bFourFiveRatio}%` },
    { key: '6', metric: '洞察触发率', versionA: `${aInsightRate}%`, versionB: `${bInsightRate}%` },
    { key: '7', metric: '评分率', versionA: `${aRatingRate}%`, versionB: `${bRatingRate}%` },
    { key: '8', metric: '点踩率', versionA: `${versionA.userRating.dislikeRate}%`, versionB: `${versionB.userRating.dislikeRate}%` },
    { key: '9', metric: 'AI-共情均分', versionA: versionA.aiEvaluation.empathyScore.toFixed(1), versionB: versionB.aiEvaluation.empathyScore.toFixed(1) },
    { key: '10', metric: 'AI-积极关注均分', versionA: versionA.aiEvaluation.positiveAttentionScore.toFixed(1), versionB: versionB.aiEvaluation.positiveAttentionScore.toFixed(1) },
    { key: '11', metric: 'AI-咨访同盟均分', versionA: versionA.aiEvaluation.allianceScore.toFixed(1), versionB: versionB.aiEvaluation.allianceScore.toFixed(1) },
  ];

  const columns = [
    { title: '指标', dataIndex: 'metric', key: 'metric', width: 150 },
    { title: 'A版（心理咨询）', dataIndex: 'versionA', key: 'versionA', width: 150 },
    { title: 'B版（教练技术）', dataIndex: 'versionB', key: 'versionB', width: 150 },
    {
      title: '差值',
      key: 'diff',
      width: 100,
      render: (_: unknown, record: { versionA: string | number; versionB: string | number }) => {
        const a = typeof record.versionA === 'string' ? parseFloat(record.versionA) : record.versionA;
        const b = typeof record.versionB === 'string' ? parseFloat(record.versionB) : record.versionB;
        const diff = a - b;
        const prefix = diff > 0 ? '+' : '';
        const color = diff > 0 ? '#52c41a' : diff < 0 ? '#ff4d4f' : '#666';
        return <span style={{ color }}>{prefix}{diff.toFixed(1)}</span>;
      },
    },
  ];

  // 趋势图数据
  const getTrendSeriesData = (metric: string) => {
    const dates = abTrendData.map((d) => d.versionA.userRating.date);
    let seriesA: number[] = [];
    let seriesB: number[] = [];

    switch (metric) {
      case 'fiveStarRatio':
        seriesA = abTrendData.map((d) =>
          Number(calcRatio(d.versionA.userRating.fiveStarCount, d.versionA.userRating.totalRatedUsers))
        );
        seriesB = abTrendData.map((d) =>
          Number(calcRatio(d.versionB.userRating.fiveStarCount, d.versionB.userRating.totalRatedUsers))
        );
        break;
      case 'fourFiveRatio':
        seriesA = abTrendData.map((d) =>
          Number(calcRatio(d.versionA.userRating.fourFiveStarCount, d.versionA.userRating.totalRatedUsers))
        );
        seriesB = abTrendData.map((d) =>
          Number(calcRatio(d.versionB.userRating.fourFiveStarCount, d.versionB.userRating.totalRatedUsers))
        );
        break;
      case 'empathy':
        seriesA = abTrendData.map((d) => d.versionA.aiEvaluation.empathyScore);
        seriesB = abTrendData.map((d) => d.versionB.aiEvaluation.empathyScore);
        break;
      case 'positiveAttention':
        seriesA = abTrendData.map((d) => d.versionA.aiEvaluation.positiveAttentionScore);
        seriesB = abTrendData.map((d) => d.versionB.aiEvaluation.positiveAttentionScore);
        break;
      case 'alliance':
        seriesA = abTrendData.map((d) => d.versionA.aiEvaluation.allianceScore);
        seriesB = abTrendData.map((d) => d.versionB.aiEvaluation.allianceScore);
        break;
      case 'dislikeRate':
        seriesA = abTrendData.map((d) => d.versionA.userRating.dislikeRate);
        seriesB = abTrendData.map((d) => d.versionB.userRating.dislikeRate);
        break;
    }

    return { dates, seriesA, seriesB };
  };

  const { dates, seriesA, seriesB } = getTrendSeriesData(trendMetric);

  const metricOptions = [
    { value: 'fiveStarRatio', label: '5分占比' },
    { value: 'fourFiveRatio', label: '4-5分占比' },
    { value: 'dislikeRate', label: '点踩率' },
    { value: 'empathy', label: 'AI-共情均分' },
    { value: 'positiveAttention', label: 'AI-积极关注均分' },
    { value: 'alliance', label: 'AI-咨访同盟均分' },
  ];

  return (
    <div>
      <h3 className="section-title">2.1 AB对比总览</h3>

      <Card size="small" title="核心指标对比（每日）" style={{ marginBottom: 16 }}>
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          size="small"
          bordered
        />
      </Card>

      <Card
        size="small"
        title="AB版本累计趋势对比"
        extra={
          <Space>
            <span>指标：</span>
            <Select
              value={trendMetric}
              onChange={setTrendMetric}
              options={metricOptions}
              style={{ width: 150 }}
              size="small"
            />
          </Space>
        }
      >
        <TrendChart
          dates={dates}
          series={[
            { name: 'A版（心理咨询）', data: seriesA, color: '#1890ff' },
            { name: 'B版（教练技术）', data: seriesB, color: '#ff7a45' },
          ]}
          yAxisLabel={trendMetric.includes('Ratio') || trendMetric === 'dislikeRate' ? '占比(%)' : '分数'}
        />
      </Card>
    </div>
  );
};

export default ABSummary;
