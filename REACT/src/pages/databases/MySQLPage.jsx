import { Card, Space, Button, Table, Tag, Statistic, Row, Col } from 'antd';
import { DatabaseOutlined, SyncOutlined, ToolOutlined } from '@ant-design/icons';

function MySQLPage() {
    const databases = [
        {
            key: '1',
            name: 'wordpress_db',
            status: 'active',
            size: '1.8GB',
            tables: 12,
            charset: 'utf8mb4',
            lastBackup: '3 hours ago'
        },
        {
            key: '2',
            name: 'ecommerce_db',
            status: 'active',
            size: '3.5GB',
            tables: 25,
            charset: 'utf8mb4',
            lastBackup: '6 hours ago'
        },
        {
            key: '3',
            name: 'analytics_db',
            status: 'maintenance',
            size: '8.2GB',
            tables: 8,
            charset: 'utf8mb4',
            lastBackup: '1 day ago'
        }
    ];

    const columns = [
        {
            title: 'Veritabanı Adı',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Durum',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'active' ? 'success' : 'warning'}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Boyut',
            dataIndex: 'size',
            key: 'size',
        },
        {
            title: 'Tablo Sayısı',
            dataIndex: 'tables',
            key: 'tables',
        },
        {
            title: 'Karakter Seti',
            dataIndex: 'charset',
            key: 'charset',
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
                    <Button icon={<DatabaseOutlined />} size="small">
                        Yedekle
                    </Button>
                    <Button icon={<ToolOutlined />} size="small">
                        Onar
                    </Button>
                    <Button icon={<SyncOutlined />} size="small">
                        Optimize Et
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
                                title="Toplam Veritabanı"
                                value={databases.length}
                                valueStyle={{ color: '#1677ff' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Aktif"
                                value={databases.filter(db => db.status === 'active').length}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Bakımda"
                                value={databases.filter(db => db.status === 'maintenance').length}
                                valueStyle={{ color: '#faad14' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Toplam Boyut"
                                value="13.5GB"
                                valueStyle={{ color: '#1677ff' }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Card
                    title="MySQL Veritabanları"
                    extra={
                        <Space>
                            <Button icon={<DatabaseOutlined />} type="primary">
                                Yeni Veritabanı
                            </Button>
                            <Button icon={<SyncOutlined />}>
                                Tümünü Yedekle
                            </Button>
                        </Space>
                    }
                >
                    <Table
                        columns={columns}
                        dataSource={databases}
                        pagination={false}
                    />
                </Card>
            </Space>
        </div>
    );
}

export default MySQLPage; 