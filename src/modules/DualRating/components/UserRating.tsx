import { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Table, Button, Divider, Modal, Tag, Typography, Spin, message } from 'antd';
import { DislikeOutlined } from '@ant-design/icons';
import { useDate } from '../../../context/DateContext';
import { StatCard, TrendChart } from '../../../components';
import { getUserRatingData, getDislikeConversations } from '../../../services/dualRatingService';
import type { DailyUserRating, DislikeConversation } from '../../../types';

const { Text } = Typography;

const UserRating = () => {
  const { selectedDate } = useDate();
  const [dislikeModalVisible, setDislikeModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState<DailyUserRating[]>([]);
  const [dislikeConversations, setDislikeConversations] = useState<DislikeConversation[]>([]);
  const [dislikeLoading, setDislikeLoading] = useState(false);

  // 获取用户评分数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getUserRatingData(30);
        setAllData(data);
      } catch (error) {
        message.error('获取用户评分数据失败');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 获取点踩对话
  const fetchDislikeConversations = async () => {
    setDislikeLoading(true);
    try {
      const result = await getDislikeConversations();
      setDislikeConversations(result.list);
    } catch (error) {
      message.error('获取点踩对话失败');
      console.error(error);
    } finally {
      setDislikeLoading(false);
    }
  };

  const handleOpenDislikeModal = () => {
    setDislikeModalVisible(true);
    fetchDislikeConversations();
  };

  const currentData = useMemo(() => {
    const dateStr = selectedDate.format('YYYY-MM-DD');
    return allData.find((d) => d.date === dateStr) || allData[allData.length - 1];
  }, [allData, selectedDate]);

  // 如果没有数据，显示加载中
  if (loading || !currentData) {
    return (
      <div style={{ marginBottom: 24, textAlign: 'center', padding: '50px 0' }}>
        <Spin tip="加载中..." />
      </div>
    );
  }

  // 计算指标
  const fiveStarRatio = currentData.totalRatedUsers > 0
    ? ((currentData.fiveStarCount / currentData.totalRatedUsers) * 100).toFixed(1)
    : '0';

  const fourFiveStarRatio = currentData.totalRatedUsers > 0
    ? ((currentData.fourFiveStarCount / currentData.totalRatedUsers) * 100).toFixed(1)
    : '0';

  const insightTriggerRate = currentData.activeUsers > 0
    ? ((currentData.insightUsers / currentData.activeUsers) * 100).toFixed(1)
    : '0';

  const ratingRate = currentData.insightUsers > 0
    ? ((currentData.totalRatedUsers / currentData.insightUsers) * 100).toFixed(1)
    : '0';

  // 趋势图数据
  const trendData = {
    dates: allData.map((d) => d.date),
    fiveStarRatio: allData.map((d) =>
      d.totalRatedUsers > 0 ? Number(((d.fiveStarCount / d.totalRatedUsers) * 100).toFixed(1)) : 0
    ),
    fourFiveStarRatio: allData.map((d) =>
      d.totalRatedUsers > 0 ? Number(((d.fourFiveStarCount / d.totalRatedUsers) * 100).toFixed(1)) : 0
    ),
  };

  // 评分分布表格
  const distributionData = [
    { key: '5', rating: '5分', count: currentData.distribution.rating5 },
    { key: '4', rating: '4分', count: currentData.distribution.rating4 },
    { key: '3', rating: '3分', count: currentData.distribution.rating3 },
    { key: '2', rating: '2分', count: currentData.distribution.rating2 },
    { key: '1', rating: '1分', count: currentData.distribution.rating1 },
    { key: '0', rating: '未评分', count: currentData.distribution.unrated },
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

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 className="section-title">1.1 用户主观评分</h3>

      {/* 北极星指标 */}
      <Card size="small" title="北极星指标（每日）" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <StatCard
              title="5分人数（去重）"
              value={currentData.fiveStarCount}
              suffix="人"
            />
          </Col>
          <Col span={6}>
            <StatCard
              title="5分占比"
              value={fiveStarRatio}
              suffix="%"
              tooltip="5分人数 ÷ 当天生成洞察且评分的总人数"
            />
          </Col>
          <Col span={6}>
            <StatCard
              title="4-5分人数（去重）"
              value={currentData.fourFiveStarCount}
              suffix="人"
            />
          </Col>
          <Col span={6}>
            <StatCard
              title="4-5分占比"
              value={fourFiveStarRatio}
              suffix="%"
              tooltip="(4分人数 + 5分人数) ÷ 当天生成洞察且评分的总人数"
            />
          </Col>
        </Row>
      </Card>

      {/* 转化漏斗指标 */}
      <Card size="small" title="转化漏斗指标（每日）" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <StatCard
              title="洞察触发率"
              value={insightTriggerRate}
              suffix="%"
              tooltip="今日生成洞察用户数 ÷ 今日活跃用户数"
            />
          </Col>
          <Col span={8}>
            <StatCard
              title="评分率"
              value={ratingRate}
              suffix="%"
              tooltip="今日评分用户数 ÷ 今日生成洞察用户数"
            />
          </Col>
          <Col span={8}>
            <StatCard
              title="今日活跃用户"
              value={currentData.activeUsers}
              suffix="人"
              tooltip="今日至少发起1次对话的用户"
            />
          </Col>
        </Row>
      </Card>

      {/* 趋势图 */}
      <Card size="small" title="累计趋势图（过去30天）" style={{ marginBottom: 16 }}>
        <TrendChart
          dates={trendData.dates}
          series={[
            { name: '5分占比', data: trendData.fiveStarRatio, color: '#52c41a' },
            { name: '4-5分占比', data: trendData.fourFiveStarRatio, color: '#1890ff' },
          ]}
          yAxisLabel="占比(%)"
        />
      </Card>

      {/* 评分分布 */}
      <Card size="small" title="评分分布（每日）" style={{ marginBottom: 16 }}>
        <p style={{ marginBottom: 12, color: '#ff4d4f', fontSize: 12 }}>
          说明：1-4分都代表用户不满，需要关注和改进
        </p>
        <Table
          columns={distributionColumns}
          dataSource={distributionData}
          pagination={false}
          size="small"
        />
      </Card>

      {/* 点踩数据 */}
      <Card size="small" title="点踩数据（每日）" style={{ marginBottom: 16 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <StatCard
              title="今日点踩轮次数"
              value={currentData.dislikeCount}
              suffix="次"
            />
          </Col>
          <Col span={6}>
            <StatCard
              title="点踩率"
              value={currentData.dislikeRate}
              suffix="%"
              tooltip="点踩轮次数 ÷ 总对话轮次数"
              valueStyle={{ color: currentData.dislikeRate > 1 ? '#ff4d4f' : '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <StatCard
              title="累计点踩轮次数"
              value={currentData.cumulativeDislikeCount}
              suffix="次"
            />
          </Col>
          <Col span={6}>
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Button
                type="primary"
                icon={<DislikeOutlined />}
                onClick={handleOpenDislikeModal}
              >
                查看所有点踩对话
              </Button>
            </div>
          </Col>
        </Row>
        <p style={{ color: '#666', fontSize: 12, marginBottom: 16 }}>
          说明：统计维度为"轮次"，一个用户可能对多个回复点踩。只统计点踩，不统计点赞。
        </p>
        <TrendChart
          dates={allData.map((d) => d.date)}
          series={[
            { name: '点踩率', data: allData.map((d) => d.dislikeRate), color: '#ff4d4f' },
          ]}
          yAxisLabel="点踩率(%)"
          showLegend={false}
          height={250}
        />
      </Card>

      {/* 点踩对话弹窗 */}
      <Modal
        title="点踩对话列表（按时间倒序）"
        open={dislikeModalVisible}
        onCancel={() => setDislikeModalVisible(false)}
        footer={null}
        width={700}
      >
        {dislikeLoading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin tip="加载中..." />
          </div>
        ) : (
          dislikeConversations.map((conv) => (
            <Card
              key={conv.topicId}
              size="small"
              title={
                <span>
                  话题ID：{conv.topicId}
                  <Text type="secondary" style={{ marginLeft: 16, fontSize: 12 }}>
                    点踩时间：{conv.dislikeTime}
                  </Text>
                </span>
              }
              style={{ marginBottom: 16 }}
            >
              <p style={{ marginBottom: 8, color: '#666' }}>话题：{conv.topic}</p>
              {conv.messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    marginBottom: 8,
                    background: msg.role === 'user' ? '#f5f5f5' : '#e6f7ff',
                    borderRadius: 4,
                    border: msg.isDisliked ? '2px solid #ff4d4f' : 'none',
                  }}
                >
                  <Text strong>{msg.role === 'user' ? '用户' : '齐家AI'}：</Text>
                  <Text>{msg.content}</Text>
                  {msg.isDisliked && (
                    <Tag color="error" style={{ marginLeft: 8 }}>
                      <DislikeOutlined /> 点踩
                    </Tag>
                  )}
                </div>
              ))}
            </Card>
          ))
        )}
      </Modal>

      <Divider />
    </div>
  );
};

export default UserRating;
