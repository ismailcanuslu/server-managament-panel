import { Card, Space, Button, Table, Tag, Alert } from 'antd';
import { ContainerOutlined } from '@ant-design/icons';
import { useState } from 'react';

function DockerPage() {
    const [loading, setLoading] = useState(false);

    const columns = [
        {
            title: 'Container ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'İsim',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Image',
            dataIndex: 'image',
            key: 'image',
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
            title: 'Port',
            dataIndex: 'ports',
            key: 'ports',
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: () => (
                <Space>
                    <Button type="primary" size="small" disabled>Başlat</Button>
                    <Button size="small" disabled>Yeniden Başlat</Button>
                    <Button danger size="small" disabled>Durdur</Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="page-container">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Alert
                    message="Docker Konfigürasyonu Bulunamadı"
                    description="Sisteminizde yüklü Docker konfigürasyonu bulunamadı. Lütfen Docker'ı yükleyin ve yapılandırın."
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

export default DockerPage; 