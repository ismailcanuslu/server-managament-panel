import { Card, Space, Button, Table, Tag, Statistic, Row, Col } from 'antd';
import { DatabaseOutlined, SyncOutlined } from '@ant-design/icons';

function MSSQLPage() {
    const databases = [
        {
            key: '1',
            name: 'CustomerDB',
            status: 'online',
            size: '5.2GB',
            lastBackup: '2 hours ago',
            recovery: 'Full'
        },
        {
            key: '2',
            name: 'InventoryDB',
            status: 'online',
            size: '2.8GB',
            lastBackup: '5 hours ago',
            recovery: 'Simple'
        },
        {
            key: '3',
            name: 'ArchiveDB',
            status: 'offline',
            size: '15GB',
            lastBackup: '1 day ago',
            recovery: 'Full'
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
                <Tag color={status === 'online' ? 'success' : 'error'}>
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
            title: 'Son Yedek',
            dataIndex: 'lastBackup',
            key: 'lastBackup',
        },
        {
            title: 'Recovery Model',
            dataIndex: 'recovery',
            key: 'recovery',
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button icon={<DatabaseOutlined />} size="small">
                        Yedekle
                    </Button>
                    <Button icon={<SyncOutlined />} size="small">
                        Bakım
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
                                title="Çevrimiçi"
                                value={databases.filter(db => db.status === 'online').length}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Çevrimdışı"
                                value={databases.filter(db => db.status === 'offline').length}
                                valueStyle={{ color: '#ff4d4f' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Toplam Boyut"
                                value="23GB"
                                valueStyle={{ color: '#faad14' }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Card
                    title="MSSQL Veritabanları"
                    extra={
                        <Button type="primary" icon={<DatabaseOutlined />}>
                            Yeni Veritabanı
                        </Button>
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

export default MSSQLPage; 