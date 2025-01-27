import { Card, Space, Button, Table, Tag, Statistic, Row, Col, Alert } from 'antd';
import { DatabaseOutlined, ReloadOutlined, BarChartOutlined } from '@ant-design/icons';
import { useState } from 'react';

function MongoDBPage() {
    const [loading, setLoading] = useState(false);
    const [databases, setDatabases] = useState([]);

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
                    {status === 'active' ? 'AKTİF' : 'PASİF'}
                </Tag>
            ),
        },
        {
            title: 'Koleksiyon',
            dataIndex: 'collections',
            key: 'collections',
            render: () => '0',
        },
        {
            title: 'Döküman Sayısı',
            dataIndex: 'documents',
            key: 'documents',
            render: () => '0',
        },
        {
            title: 'Boyut',
            dataIndex: 'size',
            key: 'size',
            render: () => '0 MB',
        },
        {
            title: 'Replica Sayısı',
            dataIndex: 'replicas',
            key: 'replicas',
            render: () => '0',
        },
        {
            title: 'Son Yedek',
            dataIndex: 'lastBackup',
            key: 'lastBackup',
            render: () => '-',
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button icon={<DatabaseOutlined />} size="small" disabled>Yedekle</Button>
                    <Button icon={<ReloadOutlined />} size="small" disabled>Compact</Button>
                    <Button icon={<BarChartOutlined />} size="small" disabled>İstatistikler</Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="page-container">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Alert
                    message="MongoDB Konfigürasyonu Bulunamadı"
                    description="Sisteminizde yüklü MongoDB konfigürasyonu bulunamadı. Lütfen MongoDB'yi yükleyin ve yapılandırın."
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

export default MongoDBPage; 