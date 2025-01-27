import { Card, Space, Button, Table, Tag, Statistic, Row, Col } from 'antd';
import { DatabaseOutlined, AreaChartOutlined, WarningOutlined } from '@ant-design/icons';

function OraclePage() {
    const instances = [
        {
            key: '1',
            name: 'PROD',
            status: 'running',
            version: '19c',
            size: '50GB',
            sessions: 150,
            lastBackup: '1 hour ago',
            archiveMode: 'ARCHIVELOG'
        },
        {
            key: '2',
            name: 'DEV',
            status: 'running',
            version: '19c',
            size: '25GB',
            sessions: 45,
            lastBackup: '5 hours ago',
            archiveMode: 'NOARCHIVELOG'
        },
        {
            key: '3',
            name: 'TEST',
            status: 'stopped',
            version: '18c',
            size: '15GB',
            sessions: 0,
            lastBackup: '1 day ago',
            archiveMode: 'ARCHIVELOG'
        }
    ];

    const columns = [
        {
            title: 'Instance Adı',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Durum',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'running' ? 'success' : 'error'}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Versiyon',
            dataIndex: 'version',
            key: 'version',
        },
        {
            title: 'Boyut',
            dataIndex: 'size',
            key: 'size',
        },
        {
            title: 'Aktif Oturum',
            dataIndex: 'sessions',
            key: 'sessions',
        },
        {
            title: 'Archive Mode',
            dataIndex: 'archiveMode',
            key: 'archiveMode',
            render: (mode) => (
                <Tag color={mode === 'ARCHIVELOG' ? 'green' : 'orange'}>
                    {mode}
                </Tag>
            ),
        },
        {
            title: 'Son Yedek',
            dataIndex: 'lastBackup',
            key: 'lastBackup',
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    {record.status === 'running' ? (
                        <Button danger size="small">Durdur</Button>
                    ) : (
                        <Button type="primary" size="small">Başlat</Button>
                    )}
                    <Button icon={<DatabaseOutlined />} size="small">
                        RMAN Backup
                    </Button>
                    <Button icon={<AreaChartOutlined />} size="small">
                        Performans
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="page-container">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Row gutter={16}>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Toplam Instance"
                                value={instances.length}
                                valueStyle={{ color: '#1677ff' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Çalışan"
                                value={instances.filter(i => i.status === 'running').length}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Durdurulmuş"
                                value={instances.filter(i => i.status === 'stopped').length}
                                valueStyle={{ color: '#ff4d4f' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Toplam Oturum"
                                value={instances.reduce((acc, curr) => acc + curr.sessions, 0)}
                                valueStyle={{ color: '#faad14' }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Card
                    title="Oracle Veritabanları"
                    extra={
                        <Space>
                            <Button type="primary" icon={<DatabaseOutlined />}>
                                Yeni Instance
                            </Button>
                            <Button icon={<WarningOutlined />} danger>
                                Alert Log
                            </Button>
                        </Space>
                    }
                >
                    <Table
                        columns={columns}
                        dataSource={instances}
                        pagination={false}
                    />
                </Card>
            </Space>
        </div>
    );
}

export default OraclePage; 