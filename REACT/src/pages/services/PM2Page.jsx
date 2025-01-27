import { Card, Space, Button, Table, Tag, Statistic, Row, Col, Modal, Spin } from 'antd';
import { ReloadOutlined, PlayCircleOutlined, PauseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

function PM2Page() {
    const navigate = useNavigate();
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({}); // Her süreç için loading durumu
    const [logModalVisible, setLogModalVisible] = useState(false);
    const [selectedApp, setSelectedApp] = useState(null);
    const [logs, setLogs] = useState('');
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    useEffect(() => {
        fetchProcesses();
    }, []);

    const fetchProcesses = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/pm2/list');
            const data = await response.json();

            const formattedProcesses = data.map(process => ({
                key: process.pm_id.toString(),
                name: process.name,
                status: process.pm2_env?.status || 'unknown',
                cpu: `${process.monit?.cpu || 0}%`,
                memory: `${Math.round((process.monit?.memory || 0) / (1024 * 1024))}MB`,
                uptime: formatUptime(process.pm2_env?.pm_uptime || 0),
                namespace: process.pm2_env?.namespace || 'default',
                version: process.pm2_env?.version || 'N/A',
                username: process.pm2_env?.username || 'unknown'
            }));

            setProcesses(formattedProcesses);
        } catch (error) {
            console.error('PM2 verileri alınamadı:', error);
            message.error('Veriler alınamadı');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (name, action) => {
        try {
            setActionLoading(prev => ({ ...prev, [name]: true }));
            const response = await fetch(`/api/pm2/${action}/${name}`, { method: 'POST' });

            if (!response.ok) {
                throw new Error(`${action} işlemi başarısız`);
            }

            message.success(`Süreç ${action === 'start' ? 'başlatıldı' : action === 'stop' ? 'durduruldu' : 'yeniden başlatıldı'}`);
            await fetchProcesses();
        } catch (error) {
            console.error(`${action} işlemi başarısız:`, error);
            message.error(`${action} işlemi başarısız oldu`);
        } finally {
            setActionLoading(prev => ({ ...prev, [name]: false }));
        }
    };

    const showLogs = async (app) => {
        try {
            setIsLoadingLogs(true);
            setSelectedApp(app);
            setLogModalVisible(true);

            const response = await fetch(`/api/pm2/logs/${app.name}?lines=100`);
            if (!response.ok) throw new Error('Loglar alınamadı');

            const data = await response.text();
            setLogs(data);
        } catch (error) {
            message.error('Loglar alınamadı: ' + error.message);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const columns = [
        {
            title: 'Uygulama Adı',
            dataIndex: 'name',
            key: 'name',
            render: (name) => (
                <Button
                    type="link"
                    onClick={() => navigate(`/dashboard/system-services/pm2/logs/${name}`)}
                >
                    {name}
                </Button>
            ),
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
            title: 'CPU',
            dataIndex: 'cpu',
            key: 'cpu',
        },
        {
            title: 'Bellek',
            dataIndex: 'memory',
            key: 'memory',
        },
        {
            title: 'Çalışma Süresi',
            dataIndex: 'uptime',
            key: 'uptime',
        },
        {
            title: 'Kullanıcı',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: (_, record) => {
                const isLoading = actionLoading[record.name];
                return (
                    <Space>
                        {record.status === 'online' ? (
                            <Button
                                icon={<PauseCircleOutlined />}
                                type="primary"
                                danger
                                size="small"
                                onClick={() => handleAction(record.name, 'stop')}
                                loading={isLoading}
                                disabled={isLoading}
                            >
                                Durdur
                            </Button>
                        ) : (
                            <Button
                                icon={<PlayCircleOutlined />}
                                type="primary"
                                size="small"
                                onClick={() => handleAction(record.name, 'start')}
                                loading={isLoading}
                                disabled={isLoading}
                            >
                                Başlat
                            </Button>
                        )}
                        <Button
                            icon={<ReloadOutlined spin={isLoading} />}
                            size="small"
                            onClick={() => handleAction(record.name, 'restart')}
                            loading={isLoading}
                            disabled={isLoading}
                        >
                            Yeniden Başlat
                        </Button>
                    </Space>
                );
            },
        },
    ];

    return (
        <>
            <div className="page-container">
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <Row gutter={16}>
                        <Col span={6}>
                            <Card>
                                <Statistic
                                    title="Toplam Uygulama"
                                    value={processes.length}
                                    valueStyle={{ color: '#1677ff' }}
                                />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card>
                                <Statistic
                                    title="Çalışan"
                                    value={processes.filter(p => p.status === 'online').length}
                                    valueStyle={{ color: '#52c41a' }}
                                />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card>
                                <Statistic
                                    title="Durmuş"
                                    value={processes.filter(p => p.status !== 'online').length}
                                    valueStyle={{ color: '#ff4d4f' }}
                                />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card>
                                <Statistic
                                    title="Toplam Bellek"
                                    value={`${Math.round(processes.reduce((acc, curr) => {
                                        const memory = parseFloat(curr.memory);
                                        return acc + (isNaN(memory) ? 0 : memory);
                                    }, 0))} MB`}
                                    valueStyle={{ color: '#faad14' }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Card
                        title="PM2 Uygulamaları"
                        extra={
                            <Space>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => navigate('/dashboard/system-services/pm2/new')}
                                >
                                    Yeni Konfigürasyon
                                </Button>
                                <Button
                                    icon={<ReloadOutlined spin={loading} />}
                                    onClick={fetchProcesses}
                                    loading={loading}
                                >
                                    Yenile
                                </Button>
                            </Space>
                        }
                    >
                        <Table
                            columns={columns}
                            dataSource={processes}
                            pagination={false}
                            loading={loading}
                        />
                    </Card>
                </Space>
            </div>

            <Modal
                title={`${selectedApp?.name || ''} Logları`}
                open={logModalVisible}
                onCancel={() => setLogModalVisible(false)}
                width={800}
                footer={null}
            >
                {isLoadingLogs ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Spin />
                    </div>
                ) : (
                    <pre style={{
                        backgroundColor: '#f5f5f5',
                        padding: 16,
                        borderRadius: 4,
                        maxHeight: '60vh',
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {logs}
                    </pre>
                )}
            </Modal>
        </>
    );
}

// Yardımcı fonksiyon
const formatUptime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const uptime = Date.now() - timestamp;
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} gün`;
    if (hours > 0) return `${hours} saat`;
    return `${minutes} dakika`;
};

export default PM2Page; 