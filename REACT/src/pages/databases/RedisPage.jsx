import { Card, Space, Button, Table, Tag, Statistic, Row, Col, Alert } from 'antd';
import { DatabaseOutlined, DeleteOutlined, ClearOutlined } from '@ant-design/icons';
import { useState } from 'react';

function RedisPage() {
    const [loading, setLoading] = useState(false);
    const [databases, setDatabases] = useState([]);

    const columns = [
        {
            title: 'Veritabanı',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Durum',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'running' ? 'success' : 'error'}>
                    {status === 'running' ? 'Çalışıyor' : 'Durdu'}
                </Tag>
            ),
        },
        {
            title: 'Bellek',
            dataIndex: 'memory',
            key: 'memory',
            render: () => '0 MB',
        },
        {
            title: 'Anahtar Sayısı',
            dataIndex: 'keys',
            key: 'keys',
            render: () => '0',
        },
        {
            title: 'Bağlı İstemci',
            dataIndex: 'clients',
            key: 'clients',
            render: () => '0',
        },
        {
            title: 'Çalışma Süresi',
            dataIndex: 'uptime',
            key: 'uptime',
            render: () => '0s',
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button type="primary" size="small" disabled>Başlat</Button>
                    <Button icon={<ClearOutlined />} size="small" disabled>Temizle</Button>
                    <Button icon={<DeleteOutlined />} danger size="small" disabled>Sil</Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="page-container">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Alert
                    message="Redis Konfigürasyonu Bulunamadı"
                    description="Sisteminizde yüklü Redis konfigürasyonu bulunamadı. Lütfen Redis'i yükleyin ve yapılandırın."
                    type="warning"
                    showIcon
                />
                <Card>
                    <Table
                        columns={columns}
                        dataSource={[]}
                        loading={loading}
                        pagination={false}
                    />
                </Card>
            </Space>
        </div>
    );
}

export default RedisPage; 