import { Card, Space, Button, Table, Tag, Alert } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';

function ElasticSearchPage() {
    const [loading, setLoading] = useState(false);

    const columns = [
        {
            title: 'Index Adı',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Durum',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'green' ? 'success' : status === 'yellow' ? 'warning' : 'error'}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Döküman Sayısı',
            dataIndex: 'docs',
            key: 'docs',
            render: () => '0',
        },
        {
            title: 'Boyut',
            dataIndex: 'size',
            key: 'size',
            render: () => '0 MB',
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: () => (
                <Space>
                    <Button icon={<SearchOutlined />} size="small" disabled>İncele</Button>
                    <Button size="small" disabled>Yeniden İndeksle</Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="page-container">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Alert
                    message="ElasticSearch Konfigürasyonu Bulunamadı"
                    description="Sisteminizde yüklü ElasticSearch konfigürasyonu bulunamadı. Lütfen ElasticSearch'ü yükleyin ve yapılandırın."
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

export default ElasticSearchPage; 