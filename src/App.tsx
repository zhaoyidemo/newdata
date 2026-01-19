import { ConfigProvider, Layout, Tabs, DatePicker, Typography, Space } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { DateProvider, useDate } from './context/DateContext';
import DualRating from './modules/DualRating';
import './App.css';

dayjs.locale('zh-cn');

const { Header, Content } = Layout;
const { Title } = Typography;

const AppContent = () => {
  const { selectedDate, setSelectedDate } = useDate();

  const tabItems = [
    {
      key: '1',
      label: '双重评分',
      children: <DualRating />,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          齐家AI 数据面板
        </Title>
        <Space>
          <span>选择日期：</span>
          <DatePicker
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            allowClear={false}
            disabledDate={(current) => current && current > dayjs().endOf('day')}
          />
        </Space>
      </Header>
      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        <Tabs
          defaultActiveKey="1"
          items={tabItems}
          size="large"
          style={{ background: '#fff', padding: '16px', borderRadius: '8px' }}
        />
      </Content>
    </Layout>
  );
};

const App = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <DateProvider>
        <AppContent />
      </DateProvider>
    </ConfigProvider>
  );
};

export default App;
