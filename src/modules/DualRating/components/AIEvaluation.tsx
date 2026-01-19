import { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Modal, Timeline, Divider, Spin, message } from 'antd';
import { useDate } from '../../../context/DateContext';
import { StatCard, TrendChart } from '../../../components';
import { getAIEvaluationData, getEvaluatorVersion } from '../../../services/dualRatingService';
import type { DailyAIEvaluation, EvaluatorVersion } from '../../../types';

const AIEvaluation = () => {
  const { selectedDate } = useDate();
  const [changelogVisible, setChangelogVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState<DailyAIEvaluation[]>([]);
  const [versionInfo, setVersionInfo] = useState<EvaluatorVersion | null>(null);

  // 获取 AI 评估数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [evaluationData, version] = await Promise.all([
          getAIEvaluationData(30),
          getEvaluatorVersion(),
        ]);
        setAllData(evaluationData);
        setVersionInfo(version);
      } catch (error) {
        message.error('获取AI评估数据失败');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentData = useMemo(() => {
    const dateStr = selectedDate.format('YYYY-MM-DD');
    return allData.find((d) => d.date === dateStr) || allData[allData.length - 1];
  }, [allData, selectedDate]);

  // 如果没有数据，显示加载中
  if (loading || !currentData || !versionInfo) {
    return (
      <div style={{ marginBottom: 24, textAlign: 'center', padding: '50px 0' }}>
        <Spin tip="加载中..." />
      </div>
    );
  }

  // 趋势图数据
  const trendData = {
    dates: allData.map((d) => d.date),
    empathy: allData.map((d) => d.empathyScore),
    positiveAttention: allData.map((d) => d.positiveAttentionScore),
    alliance: allData.map((d) => d.allianceScore),
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 className="section-title">1.2 AI客观评估</h3>

      {/* 评估器信息 */}
      <div className="version-info" style={{ marginBottom: 16 }}>
        <div>当前版本：{versionInfo.version}</div>
        <div>最后更新：{versionInfo.lastUpdate}</div>
        <a onClick={() => setChangelogVisible(true)}>查看变更日志</a>
      </div>

      {/* 三维度平均分 */}
      <Card size="small" title="三维度平均分（每日，100分制）" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <StatCard
              title="共情平均分"
              value={currentData.empathyScore}
              precision={1}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={8}>
            <StatCard
              title="积极关注平均分"
              value={currentData.positiveAttentionScore}
              precision={1}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={8}>
            <StatCard
              title="咨访同盟平均分"
              value={currentData.allianceScore}
              precision={1}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 趋势图 */}
      <Card size="small" title="累计趋势图（过去30天）">
        <TrendChart
          dates={trendData.dates}
          series={[
            { name: '共情', data: trendData.empathy, color: '#1890ff' },
            { name: '积极关注', data: trendData.positiveAttention, color: '#52c41a' },
            { name: '咨访同盟', data: trendData.alliance, color: '#722ed1' },
          ]}
          yAxisLabel="分数"
        />
      </Card>

      {/* 变更日志弹窗 */}
      <Modal
        title="评估器变更日志"
        open={changelogVisible}
        onCancel={() => setChangelogVisible(false)}
        footer={null}
      >
        <Timeline
          items={versionInfo.changelog.map((entry) => ({
            children: (
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  {entry.version} ({entry.date})
                </div>
                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                  {entry.changes.map((change, index) => (
                    <li key={index}>{change}</li>
                  ))}
                </ul>
              </div>
            ),
          }))}
        />
      </Modal>

      <Divider />
    </div>
  );
};

export default AIEvaluation;
