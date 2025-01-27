import { Card, Space, Switch, Button, Table, Tag, Modal, Input, message, Tooltip } from 'antd';
import { ReloadOutlined, WarningOutlined, PlusOutlined, CheckOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const { TextArea } = Input;

function Apache2Page() {
    const [serviceData, setServiceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState('default');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newSiteName, setNewSiteName] = useState('');
    const [configContent, setConfigContent] = useState('');
    const [selectedSite, setSelectedSite] = useState(null);
    const [configModalVisible, setConfigModalVisible] = useState(false);
    const [siteConfig, setSiteConfig] = useState('');
    const [reloadingConfig, setReloadingConfig] = useState(false);
    const [restartingService, setRestartingService] = useState(false);
    const [togglingService, setTogglingService] = useState(false);
    const [testingConfig, setTestingConfig] = useState(false);
    const [refreshingStatus, setRefreshingStatus] = useState(false);
    const [toggleSiteLoading, setToggleSiteLoading] = useState({});

    useEffect(() => {
        fetchApacheStatus();
    }, []);

    const fetchApacheStatus = async () => {
        try {
            setRefreshingStatus(true);
            const response = await fetch('/api/apache2/status');
            const data = await response.json();
            setServiceData(data);
        } catch (error) {
            console.error('Apache2 durumu alınamadı:', error);
            message.error('Durum alınamadı');
        } finally {
            setLoading(false);
            setRefreshingStatus(false);
        }
    };

    const handleServiceAction = async (action) => {
        try {
            if (action === 'reload') {
                setReloadingConfig(true);
            } else if (action === 'restart') {
                setRestartingService(true);
            } else if (action === 'start' || action === 'stop') {
                setTogglingService(true);
            }

            const response = await fetch('/api/apache2/' + action, { method: 'POST' });

            if (!response.ok) {
                throw new Error('İşlem başarısız');
            }

            await fetchApacheStatus();

            if (action === 'reload') {
                message.success({
                    content: 'Yapılandırma başarıyla yenilendi',
                    duration: 3,
                    icon: <CheckOutlined style={{ color: '#52c41a' }} />
                });
            } else if (action === 'restart') {
                message.success({
                    content: 'Servis başarıyla yeniden başlatıldı',
                    duration: 3,
                    icon: <CheckOutlined style={{ color: '#52c41a' }} />
                });
            } else if (action === 'start' || action === 'stop') {
                message.success({
                    content: `Servis başarıyla ${action === 'start' ? 'başlatıldı' : 'durduruldu'}`,
                    duration: 3,
                    icon: <CheckOutlined style={{ color: '#52c41a' }} />
                });
            }
        } catch (error) {
            console.error(`Apache2 ${action} işlemi başarısız:`, error);
            if (action === 'reload') {
                message.error({
                    content: 'Yapılandırma yenilenirken bir hata oluştu',
                    duration: 3,
                    icon: <WarningOutlined style={{ color: '#ff4d4f' }} />
                });
            } else if (action === 'restart') {
                message.error({
                    content: 'Servis yeniden başlatılırken bir hata oluştu',
                    duration: 3,
                    icon: <WarningOutlined style={{ color: '#ff4d4f' }} />
                });
            } else if (action === 'start' || action === 'stop') {
                message.error({
                    content: `Servis ${action === 'start' ? 'başlatılırken' : 'durdurulurken'} bir hata oluştu`,
                    duration: 3,
                    icon: <WarningOutlined style={{ color: '#ff4d4f' }} />
                });
            }
        } finally {
            if (action === 'reload') {
                setReloadingConfig(false);
            } else if (action === 'restart') {
                setRestartingService(false);
            } else if (action === 'start' || action === 'stop') {
                setTogglingService(false);
            }
        }
    };

    const getProtocolType = (host) => {
        if (host.ssl === false && host.port === "443") {
            return 'reverse-proxy';
        } else if (host.ssl === true || host.port === "443") {
            return 'https';
        } else {
            return 'http';
        }
    };

    const getProtocolTag = (host) => {
        const type = getProtocolType(host);
        switch (type) {
            case 'https':
                return <Tag color="success">HTTPS</Tag>;
            case 'reverse-proxy':
                return <Tag color="warning">HTTPS (Reverse Proxy)</Tag>;
            case 'http':
                return <Tag color="default">HTTP</Tag>;
            default:
                return <Tag color="default">HTTP</Tag>;
        }
    };

    const sortVirtualHosts = (hosts) => {
        if (!hosts) return [];

        const sorted = [...hosts];

        switch (sortOrder) {
            case 'https':
                return sorted
                    .sort((a, b) => a.serverName.localeCompare(b.serverName))
                    .sort((a, b) => {
                        const aType = getProtocolType(a);
                        const bType = getProtocolType(b);
                        if (aType === bType) return 0;
                        if (aType === 'https') return -1;
                        if (bType === 'https') return 1;
                        return 0;
                    });
            case 'reverse-proxy':
                return sorted
                    .sort((a, b) => a.serverName.localeCompare(b.serverName))
                    .sort((a, b) => {
                        const aType = getProtocolType(a);
                        const bType = getProtocolType(b);
                        if (aType === bType) return 0;
                        if (aType === 'reverse-proxy') return -1;
                        if (bType === 'reverse-proxy') return 1;
                        return 0;
                    });
            case 'http':
                return sorted
                    .sort((a, b) => a.serverName.localeCompare(b.serverName))
                    .sort((a, b) => {
                        const aType = getProtocolType(a);
                        const bType = getProtocolType(b);
                        if (aType === bType) return 0;
                        if (aType === 'http') return -1;
                        if (bType === 'http') return 1;
                        return 0;
                    });
            default:
                return sorted.sort((a, b) => a.serverName.localeCompare(b.serverName));
        }
    };

    const toggleSort = () => {
        const orders = ['default', 'https', 'reverse-proxy', 'http'];
        const currentIndex = orders.indexOf(sortOrder);
        const nextIndex = (currentIndex + 1) % orders.length;
        setSortOrder(orders[nextIndex]);
    };

    const handleAddSite = async () => {
        try {
            const response = await fetch('/api/apache2/sites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siteName: newSiteName,
                    configContent: configContent
                })
            });

            if (response.ok) {
                message.success('Site başarıyla eklendi');
                setIsModalVisible(false);
                setNewSiteName('');
                setConfigContent('');
                fetchApacheStatus();
            } else {
                message.error('Site eklenirken bir hata oluştu');
            }
        } catch (error) {
            console.error('Site eklenemedi:', error);
            message.error('Site eklenirken bir hata oluştu');
        }
    };

    const showConfig = async (siteName) => {
        try {
            const response = await fetch(`/api/apache2/sites/${siteName}/config`);
            const data = await response.text();
            setSiteConfig(data);
            setSelectedSite(siteName);
            setConfigModalVisible(true);
        } catch (error) {
            console.error('Yapılandırma alınamadı:', error);
            message.error('Yapılandırma alınamadı');
        }
    };

    const toggleSite = async (siteName, enable) => {
        try {
            setToggleSiteLoading(prev => ({ ...prev, [siteName]: true }));
            const action = enable ? 'enable' : 'disable';
            const response = await fetch(`/api/apache2/sites/${siteName}/${action}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('İşlem başarısız');
            }

            await fetchApacheStatus();
            message.success(`Site ${enable ? 'etkinleştirildi' : 'devre dışı bırakıldı'}`);
        } catch (error) {
            console.error('Site durumu değiştirilemedi:', error);
            message.error('İşlem başarısız oldu');
            await fetchApacheStatus();
        } finally {
            setToggleSiteLoading(prev => ({ ...prev, [siteName]: false }));
        }
    };

    const testConfig = async () => {
        try {
            setTestingConfig(true);
            const response = await fetch('/api/apache2/test-config', { method: 'POST' });
            if (response.ok) {
                message.success({
                    content: 'Yapılandırma testi başarılı',
                    duration: 3,
                    icon: <CheckOutlined style={{ color: '#52c41a' }} />
                });
            } else {
                message.error({
                    content: 'Yapılandırma testi başarısız',
                    duration: 3,
                    icon: <WarningOutlined style={{ color: '#ff4d4f' }} />
                });
            }
        } catch (error) {
            console.error('Test başarısız:', error);
            message.error('Test sırasında bir hata oluştu');
        } finally {
            setTestingConfig(false);
        }
    };

    const deleteSite = async (siteName) => {
        try {
            const site = serviceData?.virtualHosts.find(h => h.serverName === siteName);
            if (site?.isActive) {
                message.error('Aktif site silinemez. Önce devre dışı bırakın.');
                return;
            }

            await fetch(`/api/apache2/sites/${siteName}`, { method: 'DELETE' });
            message.success('Site başarıyla silindi');
            fetchApacheStatus();
        } catch (error) {
            console.error('Site silinemedi:', error);
            message.error('Site silinirken bir hata oluştu');
        }
    };

    const groupVirtualHosts = (hosts) => {
        if (!hosts) return [];

        // Aynı serverName'e sahip kayıtları grupla
        const groupedHosts = hosts.reduce((acc, host) => {
            const existing = acc.find(h => h.serverName === host.serverName);
            if (existing) {
                // Varolan kayda port bilgisini ekle
                existing.ports = [...(existing.ports || []), host.port];
                // SSL durumunu koru
                existing.ssl = existing.ssl || host.ssl;
                // isActive durumunu güncelle - herhangi biri aktifse true, hepsi pasifse false
                existing.isActive = host.isActive || existing.isActive;
                // En son gelen documentRoot'u kullan
                existing.documentRoot = host.documentRoot;
                // Diğer özellikleri de koru
                existing.key = host.key;
            } else {
                // Yeni kayıt oluştur
                acc.push({
                    ...host,
                    ports: [host.port],
                    key: host.key || host.serverName // Eğer key yoksa serverName'i kullan
                });
            }
            return acc;
        }, []);

        // Tüm kayıtları döndür (aktif veya pasif)
        return groupedHosts;
    };

    const columns = [
        {
            title: 'Sunucu Adı',
            dataIndex: 'serverName',
            key: 'serverName',
            sorter: (a, b) => a.serverName.localeCompare(b.serverName),
        },
        {
            title: 'Portlar',
            dataIndex: 'ports',
            key: 'ports',
            render: (ports) => (
                <Space>
                    {ports.map(port => (
                        <Tag key={port}>{port}</Tag>
                    ))}
                </Space>
            )
        },
        {
            title: () => (
                <div style={{ cursor: 'pointer' }} onClick={toggleSort}>
                    Protokol {sortOrder !== 'default' &&
                        `(${sortOrder === 'reverse-proxy' ? 'REVERSE PROXY' : sortOrder.toUpperCase()})`}
                </div>
            ),
            dataIndex: 'ssl',
            key: 'ssl',
            render: (_, record) => (
                <Space>
                    {record.ports.includes("443") && !record.ssl && (
                        <Tag color="warning">HTTPS (Reverse Proxy)</Tag>
                    )}
                    {record.ssl && <Tag color="success">HTTPS</Tag>}
                    {record.ports.includes("80") && <Tag color="default">HTTP</Tag>}
                </Space>
            ),
        },
        {
            title: 'Belge Kök Dizini',
            dataIndex: 'documentRoot',
            key: 'documentRoot',
            ellipsis: {
                showTitle: false,
            },
            render: (documentRoot) => (
                <Tooltip placement="topLeft" title={documentRoot}>
                    {documentRoot}
                </Tooltip>
            ),
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: (_, record) => {
                const isLoading = toggleSiteLoading[record.serverName];
                return (
                    <Space>
                        <Switch
                            checkedChildren="Aktif"
                            unCheckedChildren="Pasif"
                            checked={record.isActive}
                            onChange={(checked) => toggleSite(record.serverName, checked)}
                            loading={isLoading}
                            disabled={isLoading}
                        />
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => showConfig(record.serverName)}
                            size="small"
                            disabled={isLoading}
                        >
                            Yapılandırma
                        </Button>
                        <Button
                            icon={<DeleteOutlined />}
                            danger
                            onClick={() => deleteSite(record.serverName)}
                            size="small"
                            disabled={record.isActive || isLoading}
                        >
                            Sil
                        </Button>
                    </Space>
                );
            },
        }
    ];

    return (
        <div className="page-container">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Card title="Apache2 Servisi" loading={loading}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div style={{ marginBottom: 16 }}>
                            <Tag color={serviceData?.isActive ? 'success' : 'error'} style={{ fontSize: 16 }}>
                                {serviceData?.isActive ? 'SERVİS ÇALIŞIYOR' : 'SERVİS DURDU'}
                            </Tag>
                        </div>
                        <Space>
                            <Switch
                                checkedChildren="Çalışıyor"
                                unCheckedChildren="Durdu"
                                checked={serviceData?.isActive}
                                onChange={(checked) => handleServiceAction(checked ? 'start' : 'stop')}
                                loading={togglingService}
                                disabled={togglingService || restartingService || reloadingConfig}
                            />
                            <Button
                                icon={<ReloadOutlined spin={restartingService} />}
                                onClick={() => handleServiceAction('restart')}
                                disabled={!serviceData?.isActive || togglingService || restartingService || reloadingConfig}
                                loading={restartingService}
                            >
                                Yeniden Başlat
                            </Button>
                            <Button
                                icon={<ReloadOutlined spin={reloadingConfig} />}
                                onClick={() => handleServiceAction('reload')}
                                disabled={!serviceData?.isActive || togglingService || restartingService || reloadingConfig}
                                loading={reloadingConfig}
                            >
                                Yapılandırmayı Yenile
                            </Button>
                        </Space>
                    </Space>
                </Card>

                <Card
                    title="Virtual Hosts"
                    extra={
                        <Space>
                            <Link to="/dashboard/system-services/apache2/wizard">
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    disabled={testingConfig || refreshingStatus}
                                >
                                    Yeni Konfigürasyon
                                </Button>
                            </Link>
                            <Button
                                icon={<CheckOutlined spin={testingConfig} />}
                                onClick={testConfig}
                                loading={testingConfig}
                                disabled={testingConfig || refreshingStatus || !serviceData?.isActive}
                            >
                                Yapılandırmayı Test Et
                            </Button>
                            <Button
                                icon={<ReloadOutlined spin={refreshingStatus} />}
                                onClick={fetchApacheStatus}
                                loading={refreshingStatus}
                                disabled={testingConfig || refreshingStatus}
                            >
                                Yenile
                            </Button>
                        </Space>
                    }
                >
                    <Table
                        columns={columns}
                        dataSource={sortVirtualHosts(groupVirtualHosts(serviceData?.virtualHosts))}
                        loading={loading}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                    />
                </Card>
            </Space>

            <Modal
                title="Yeni Site Ekle"
                open={isModalVisible}
                onOk={handleAddSite}
                onCancel={() => setIsModalVisible(false)}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Input
                        placeholder="Site Adı"
                        value={newSiteName}
                        onChange={(e) => setNewSiteName(e.target.value)}
                    />
                    <TextArea
                        rows={4}
                        placeholder="Site Yapılandırması"
                        value={configContent}
                        onChange={(e) => setConfigContent(e.target.value)}
                    />
                </Space>
            </Modal>

            <Modal
                title={`${selectedSite} Yapılandırması`}
                open={configModalVisible}
                onCancel={() => setConfigModalVisible(false)}
                footer={null}
            >
                <TextArea
                    rows={10}
                    value={siteConfig}
                    readOnly
                />
            </Modal>
        </div>
    );
}

export default Apache2Page; 