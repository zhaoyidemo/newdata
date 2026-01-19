import { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Table, Button, Divider, Spin, message } from 'antd';
import { useDate } from '../../../context/DateContext';
import { StatCard, TrendChart } from '../../../components';
import { getABTrendData, getEvaluatorVersion } from '../../../services/dualRatingService';
import type { ABTestData, EvaluatorVersion } from '../../../types';

interface VersionDetailProps {
  version: 'A' | 'B';
}

const VersionDetail = ({ version }: VersionDetailProps) => {
  const { selectedDate } = useDate();
  const [loading, setLoading] = useState(true);
  const [abTrendData, setAbTrendData] = useState<ABTestData[]>([]);
  const [versionInfo, setVersionInfo] = useState<EvaluatorVersion | null>(null);

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [trendData, evalVersion] = await Promise.all([
          getABTrendData(30),
          getEvaluatorVersion(),
        ]);
        setAbTrendData(trendData);
        setVersionInfo(evalVersion);
      } catch (error) {
        message.error('获取版本详情数据失败');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentData = useMemo(() => {
    if (abTrendData.length === 0) return null;
    const dateStr = selectedDate.format('YYYY-MM-DD');
    const dayData = abTrendData.find((d) => d.versionA.userRating.date === dateStr) || abTrendData[abTrendData.length - 1];
    return version === 'A' ? dayData.versionA : dayData.versionB;
  }, [abTrendData, selectedDate, version]);

  const allVersionData = useMemo(() => {
    return abTrendData.map((d) => (version === 'A' ? d.versionA : d.versionB));
  }, [abTrendData, version]);

  // 如果没有数据，显示加载中
  if (loading || !currentData || !versionInfo) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin tip="加载中..." />
      </div>
    );
  }

  const { userRating, aiEvaluation, crossAnalysis } = currentData;

  // 计算指标
  const fiveStarRatio = userRating.totalRatedUsers > 0
    ? ((userRating.fiveStarCount / userRating.totalRatedUsers) * 100).toFixed(1)
    : '0';

  const fourFiveStarRatio = userRating.totalRatedUsers > 0
    ? ((userRating.fourFiveStarCount / userRating.totalRatedUsers) * 100).toFixed(1)
    : '0';

  const insightTriggerRate = userRating.activeUsers > 0
    ? ((userRating.insightUsers / userRating.activeUsers) * 100).toFixed(1)
    : '0';

  const ratingRate = userRating.insightUsers > 0
    ? ((userRating.totalRatedUsers / userRating.insightUsers) * 100).toFixed(1)
    : '0';

  // 趋势图数据
  const dates = allVersionData.map((d) => d.userRating.date);
  const userRatingTrend = {
    fiveStarRatio: allVersionData.map((d) =>
      d.userRating.totalRatedUsers > 0
        ? Number(((d.userRating.fiveStarCount / d.userRating.totalRatedUsers) * 100).toFixed(1))
        : 0
    ),
    fourFiveStarRatio: allVersionData.map((d) =>
      d.userRating.totalRatedUsers > 0
        ? Number(((d.userRating.fourFiveStarCount / d.userRating.totalRatedUsers) * 100).toFixed(1))
        : 0
    ),
  };

  const aiTrend = {
    empathy: allVersionData.map((d) => d.aiEvaluation.empathyScore),
    positiveAttention: allVersionData.map((d) => d.aiEvaluation.positiveAttentionScore),
    alliance: allVersionData.map((d) => d.aiEvaluation.allianceScore),
  };

  // 评分分布
  const distributionData = [
    { key: '5', rating: '5分', count: userRating.distribution.rating5 },
    { key: '4', rating: '4分', count: userRating.distribution.rating4 },
    { key: '3', rating: '3分', count: userRating.distribution.rating3 },
    { key: '2', rating: '2分', count: userRating.distribution.rating2 },
    { key: '1', rating: '1分', count: userRating.distribution.rating1 },
    { key: '0', rating: '未评分', count: userRating.distribution.unrated },
  ];

  const distributionColumns = [
    { title: '评分', dataIndex: 'rating', key: 'rating' },
    { title: '人数', dataIndex: 'count', key: 'count' },
    {
      title: '操作',
      key: 'action',
      render: () => <Button type="link" size="small">查看对话</Button>,
    },
  ];

  // 交叉对照
  const crossColumns = [
    { title: '用户评分', dataIndex: 'userRating', key: 'userRating' },
    { title: '话题数', dataIndex: 'topicCount', key: 'topicCount' },
    { title: 'AI-共情均分', dataIndex: 'empathyAvg', key: 'empathyAvg', render: (v: number) => v.toFixed(1) },
    { title: 'AI-积极关注均分', dataIndex: 'positiveAttentionAvg', key: 'positiveAttentionAvg', render: (v: number) => v.toFixed(1) },
    { title: 'AI-咨访同盟均分', dataIndex: 'allianceAvg', key: 'allianceAvg', render: (v: number) => v.toFixed(1) },
  ];

  return (
    <div>
      {/* 用户主观评分 */}
      <h4 style={{ marginBottom: 12 }}>用户主观评分</h4>
      <Card size="small" title="北极星指标" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <StatCard title="5分人数" value={userRating.fiveStarCount} suffix="人" />
          </Col>
          <Col span={6}>
            <StatCard title="5分占比" value={fiveStarRatio} suffix="%" />
          </Col>
          <Col span={6}>
            <StatCard title="4-5分人数" value={userRating.fourFiveStarCount} suffix="人" />
          </Col>
          <Col span={6}>
            <StatCard title="4-5分占比" value={fourFiveStarRatio} suffix="%" />
          </Col>
        </Row>
      </Card>

      <Card size="small" title="转化漏斗指标" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <StatCard title="洞察触发率" value={insightTriggerRate} suffix="%" />
          </Col>
          <Col span={12}>
            <StatCard title="评分率" value={ratingRate} suffix="%" />
          </Col>
        </Row>
      </Card>

      <Card size="small" title="评分分布" style={{ marginBottom: 16 }}>
        <Table columns={distributionColumns} dataSource={distributionData} pagination={false} size="small" />
      </Card>

      <Card size="small" title="点踩数据" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <StatCard title="今日点踩轮次数" value={userRating.dislikeCount} suffix="次" />
          </Col>
          <Col span={8}>
            <StatCard
              title="点踩率"
              value={userRating.dislikeRate}
              suffix="%"
              valueStyle={{ color: userRating.dislikeRate > 1 ? '#ff4d4f' : '#52c41a' }}
            />
          </Col>
          <Col span={8}>
            <StatCard title="累计点踩轮次数" value={userRating.cumulativeDislikeCount} suffix="次" />
          </Col>
        </Row>
        <div style={{ marginTop: 16 }}>
          <Button type="link" style={{ padding: 0 }}>查看点踩对话</Button>
        </div>
      </Card>

      <Card size="small" title="趋势图" style={{ marginBottom: 16 }}>
        <TrendChart
          dates={dates}
          series={[
            { name: '5分占比', data: userRatingTrend.fiveStarRatio, color: '#52c41a' },
            { name: '4-5分占比', data: userRatingTrend.fourFiveStarRatio, color: '#1890ff' },
          ]}
          yAxisLabel="占比(%)"
          height={250}
        />
      </Card>

      <Divider />

      {/* AI客观评估 */}
      <h4 style={{ marginBottom: 12 }}>AI客观评估</h4>
      <div className="version-info" style={{ marginBottom: 16 }}>
        <span>评估器版本：{versionInfo.version} | 最后更新：{versionInfo.lastUpdate}</span>
      </div>

      <Card size="small" title="三维度平均分" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <StatCard title="共情平均分" value={aiEvaluation.empathyScore} precision={1} />
          </Col>
          <Col span={8}>
            <StatCard title="积极关注平均分" value={aiEvaluation.positiveAttentionScore} precision={1} />
          </Col>
          <Col span={8}>
            <StatCard title="咨访同盟平均分" value={aiEvaluation.allianceScore} precision={1} />
          </Col>
        </Row>
      </Card>

      <Card size="small" title="趋势图" style={{ marginBottom: 16 }}>
        <TrendChart
          dates={dates}
          series={[
            { name: '共情', data: aiTrend.empathy, color: '#1890ff' },
            { name: '积极关注', data: aiTrend.positiveAttention, color: '#52c41a' },
            { name: '咨访同盟', data: aiTrend.alliance, color: '#722ed1' },
          ]}
          yAxisLabel="分数"
          height={250}
        />
      </Card>

      <Divider />

      {/* 交叉对照 */}
      <h4 style={{ marginBottom: 12 }}>交叉对照</h4>
      <Card size="small" title="用户评分 vs AI评估对照表">
        <Table
          columns={crossColumns}
          dataSource={crossAnalysis.map((item, index) => ({ ...item, key: index }))}
          pagination={false}
          size="small"
          bordered
        />
      </Card>
    </div>
  );
};

export default VersionDetail;
