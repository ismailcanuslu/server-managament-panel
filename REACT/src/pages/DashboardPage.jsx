import { Layout, Menu, Card, Breadcrumb, Input, Switch, theme, Progress, Button, Statistic, Row, Col, Space, Typography, Table, Tooltip, Modal, Dropdown } from 'antd';
import { SearchOutlined, MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined, DatabaseOutlined, DashboardOutlined, DesktopOutlined, CloudUploadOutlined, CloudDownloadOutlined, HddOutlined, ApiOutlined, GlobalOutlined, WindowsOutlined, UserOutlined, TeamOutlined, CodeOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import './DashboardPage.css';
import { useAuth } from '../contexts/AuthContext';
import { message } from 'antd';

const { Header, Content, Footer, Sider } = Layout;
const { useToken } = theme;
const { Title } = Typography;

function getItem(label, key, icon, children) {
    return {
        key,
        icon,
        children,
        label,
    };
}

const routeTitles = {
    'system-services': 'Sistem Servisleri',
    'web-services': 'Web Servisleri',
    'databases': 'Veritabanları',
    'apache2': 'Apache2',
    'pm2': 'PM2',
    'docker': 'Docker',
    'elastic': 'ElasticSearch',
    'ssl': 'SSL',
    'mariadb': 'MariaDB',
    'redis': 'Redis',
    'mongodb': 'MongoDB',
    'files': 'Dosyalar',
    'new': 'Yeni Konfigürasyon',
    'wizard': 'Yeni Konfigürasyon',
    'users': 'Kullanıcılar',
    'user-services': 'Kullanıcı Servisleri',
    'roles': 'Roller',
    'webssh': 'Web SSH',
};

function DashboardPage({ isDarkMode, setIsDarkMode }) {
    const [collapsed, setCollapsed] = useState(true);
    const { token } = useToken();
    const location = useLocation();
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [systemInfo, setSystemInfo] = useState(null);
    const navigate = useNavigate();
    const isHomePage = location.pathname === '/dashboard';
    const { user, logout } = useAuth();

    const generateBreadcrumb = () => {
        const paths = location.pathname.split('/').filter(Boolean);
        const breadcrumbItems = paths.map((path, index) => {
            const url = `/${paths.slice(0, index + 1).join('/')}`;

            // Eğer path "logs" ise, bu item'ı atla
            if (path === 'logs') {
                return null;
            }

            // Eğer bu son item ve önceki path "logs" ise, bu bir uygulama adıdır
            const isAppName = index > 0 && paths[index - 1] === 'logs';
            const title = isAppName ? path : (routeTitles[path] || path);

            return {
                title: index === paths.length - 1 ? (
                    title
                ) : (
                    <Link to={url}>{title}</Link>
                ),
                key: url,
            };
        }).filter(Boolean); // null olan item'ları filtrele

        return [
            {
                title: <Link to="/dashboard">Ana Sayfa</Link>,
                key: 'dashboard',
            },
            ...breadcrumbItems.slice(1),
        ];
    };

    useEffect(() => {
        if (isHomePage) {
            fetchMetrics();
            fetchSystemInfo();
            const metricsInterval = setInterval(fetchMetrics, 5000); // Her 5 saniyede bir güncelle
            const systemInfoInterval = setInterval(fetchSystemInfo, 300000); // Her 5 dakikada bir güncelle

            return () => {
                clearInterval(metricsInterval);
                clearInterval(systemInfoInterval);
            };
        }
    }, [isHomePage]);

    const fetchMetrics = async () => {
        try {
            const response = await fetch('/api/servermetrics');
            const data = await response.json();
            setMetrics(data);
        } catch (error) {
            console.error('Metrikler alınamadı:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSystemInfo = async () => {
        try {
            const response = await fetch('/api/systeminfo');
            const data = await response.json();
            setSystemInfo(data);
        } catch (error) {
            console.error('Sistem bilgileri alınamadı:', error);
        }
    };

    const handleMenuClick = ({ key, keyPath }) => {
        // Ana sayfa kontrolü
        if (key === '1') {
            navigate('/dashboard');
            return;
        }

        // Mail servisleri için özel kontrol
        if (key === 'mail') {
            window.open('https://mail.anadoluyazilim.com.tr/iredadmin', '_blank');
            return;
        }

        // Alt menüler için path oluşturma
        if (keyPath.length > 1) {
            const path = keyPath.reverse().join('/');
            navigate(`/dashboard/${path}`);
        } else {
            navigate(`/dashboard/${key}`);
        }
    };

    const menuItems = [
        {
            key: '1',
            icon: 'fa-gauge-high',
            label: 'Dashboard'
        },
        {
            key: 'user-services',
            icon: 'fa-users',
            label: 'Kullanıcı Servisleri',
            children: [
                {
                    key: 'users',
                    icon: 'fa-user',
                    label: 'Kullanıcılar'
                },
                {
                    key: 'roles',
                    icon: 'fa-user-shield',
                    label: 'Roller'
                },
            ]
        },
        {
            key: 'system-services',
            icon: 'fa-gears',
            label: 'Sistem Servisleri',
            children: [
                { key: 'apache2', label: 'Apache2' },
                { key: 'pm2', label: 'PM2' },
                { key: 'docker', label: 'Docker' },
                { key: 'elastic', label: 'ElasticSearch' },
            ]
        },
        {
            key: 'web-services',
            icon: 'fa-globe',
            label: 'Web Servisleri',
            children: [
                { key: 'ssl', label: 'SSL Sertifikaları' },
                {
                    key: 'mail',
                    label: 'Mail Servisleri',
                    onClick: () => window.open('https://mail.anadoluyazilim.com.tr/iredadmin', '_blank')
                }
            ]
        },
        {
            key: 'databases',
            icon: 'fa-database',
            label: 'Veritabanları ve Havuzlar',
            children: [
                { key: 'mariadb', label: 'MariaDB' },
                { key: 'redis', label: 'Redis' },
                { key: 'mongodb', label: 'MongoDB' },
            ]
        },
        { key: 'files', icon: 'fa-folder', label: 'Dosyalar ve FTP' },
        { key: 'webssh', icon: 'fa-terminal', label: 'Web SSH' },
    ];

    const networkColumns = [
        {
            title: 'Arayüz',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'IP Adresi',
            dataIndex: 'ipAddress',
            key: 'ipAddress',
        },
        {
            title: 'Alınan',
            dataIndex: 'rxBytes',
            key: 'rxBytes',
        },
        {
            title: 'Gönderilen',
            dataIndex: 'txBytes',
            key: 'txBytes',
        },
    ];

    const diskColumns = [
        {
            title: 'Bağlama Noktası',
            dataIndex: 'mountPoint',
            key: 'mountPoint',
        },
        {
            title: 'Toplam',
            dataIndex: 'total',
            key: 'total',
        },
        {
            title: 'Kullanılan',
            dataIndex: 'used',
            key: 'used',
        },
        {
            title: 'Boş',
            dataIndex: 'free',
            key: 'free',
        },
        {
            title: 'Kullanım',
            dataIndex: 'usagePercentage',
            key: 'usagePercentage',
            render: (value) => (
                <Progress
                    percent={Math.round(value * 100) / 100}
                    size="small"
                    status={value > 90 ? 'exception' : 'normal'}
                />
            ),
        },
    ];

    // Dark mode değiştiğinde localStorage'a kaydet
    useEffect(() => {
        localStorage.setItem('darkMode', isDarkMode);
    }, [isDarkMode]);

    // Sayfa yüklendiğinde dark mode tercihini localStorage'dan al
    useEffect(() => {
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode !== null) {
            setIsDarkMode(savedDarkMode === 'true');
        }
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
        message.success('Başarıyla çıkış yapıldı');
    };

    return (
        <Layout className="dashboard-layout">
            <Header className="dashboard-header">
                <div className="header-left">
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        className="trigger-button"
                    />
                    <div className="brand">
                        <img src="/fav.webp" alt="Logo" className="header-logo" />
                        <span className="brand-text">Anadolu Yazılım</span>
                    </div>
                    <Input
                        prefix={<SearchOutlined />}
                        placeholder="Ara..."
                        className="search-input"
                    />
                </div>
                <div className="header-right">
                    <Space>
                        <Switch
                            checked={isDarkMode}
                            onChange={setIsDarkMode}
                            checkedChildren={<i className="fas fa-moon" />}
                            unCheckedChildren={<i className="fas fa-sun" />}
                        />
                        <BellOutlined className="notification-icon" />
                    </Space>
                </div>
            </Header>
            <Layout>
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    className="dashboard-sider"
                    theme={isDarkMode ? 'dark' : 'light'}
                    trigger={null}
                >
                    <div className="logo-container">
                        <img src="/logo_cd.webp" alt="Logo" className="dashboard-logo" />
                    </div>
                    <Menu
                        theme={isDarkMode ? 'dark' : 'light'}
                        defaultSelectedKeys={['1']}
                        mode="inline"
                        onClick={handleMenuClick}
                        items={menuItems.map(item => {
                            if (item.children) {
                                return {
                                    key: item.key,
                                    icon: <i className={`fas ${item.icon}`} />,
                                    label: item.label,
                                    children: item.children.map(child => ({
                                        key: child.key,
                                        icon: <i className={`fas ${child.icon}`} />,
                                        label: child.label
                                    }))
                                };
                            }
                            return {
                                key: item.key,
                                icon: <i className={`fas ${item.icon}`} />,
                                label: item.label
                            };
                        })}
                    />
                    <div className="sider-footer">
                        <Dropdown
                            placement="topRight"
                            trigger={['click']}
                            dropdownRender={() => (
                                <div className="user-dropdown-menu">
                                    <div className="user-info">
                                        <span className="username">{user?.username}</span>
                                        <span className="role">Admin</span>
                                    </div>
                                    <div className="divider" />
                                    <div className="menu-item" onClick={handleLogout}>
                                        <i className="fas fa-sign-out-alt" />
                                        <span>Çıkış Yap</span>
                                    </div>
                                </div>
                            )}
                        >
                            <Button type="text" shape="circle" className="user-avatar">
                                {user?.username.charAt(0).toUpperCase()}
                            </Button>
                        </Dropdown>
                    </div>
                </Sider>
                <Layout>
                    <div className="breadcrumb-container">
                        <Breadcrumb items={generateBreadcrumb()} />
                    </div>
                    <Content className="dashboard-content">
                        {location.pathname === '/dashboard' ? (
                            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                                <Title level={4}>Sistem Durumu</Title>

                                {metrics && systemInfo ? (
                                    <>
                                        {/* Sistem Bilgileri */}
                                        <Row gutter={[16, 16]}>
                                            <Col xs={24} lg={6}>
                                                <Card loading={loading} style={{ height: '100%' }}>
                                                    <Statistic
                                                        title="İşletim Sistemi"
                                                        value={systemInfo.osInfo.name}
                                                        prefix={<i className="fab fa-ubuntu" />}
                                                    />
                                                    <div className="info-text">
                                                        Kernel: {systemInfo.osInfo.kernel}
                                                    </div>
                                                </Card>
                                            </Col>
                                            <Col xs={24} lg={6}>
                                                <Card loading={loading} style={{ height: '100%' }}>
                                                    <Statistic
                                                        title="Çalışma Süresi"
                                                        value={systemInfo.osInfo.uptime.replace(/days/g, 'gün').replace(/hours/g, 'saat').replace(/minutes/g, 'dakika')}
                                                        prefix={<ApiOutlined />}
                                                    />
                                                    <div className="info-text">
                                                        Mimari: {systemInfo.osInfo.architecture}
                                                    </div>
                                                </Card>
                                            </Col>
                                            <Col xs={24} lg={6}>
                                                <Card loading={loading} style={{ height: '100%' }}>
                                                    <Row gutter={[0, 16]}>
                                                        <Col span={24}>
                                                            <Statistic
                                                                title="Web Siteleri"
                                                                value={`${systemInfo.services.apache2Sites} Web Sitesi`}
                                                                prefix={<GlobalOutlined />}
                                                            />
                                                        </Col>
                                                        <Col span={24}>
                                                            <Statistic
                                                                title="PM2 Servisleri"
                                                                value={`${systemInfo.services.pm2Services} Servis`}
                                                                prefix={<ApiOutlined />}
                                                            />
                                                        </Col>
                                                    </Row>
                                                </Card>
                                            </Col>
                                            <Col xs={24} lg={6}>
                                                <Card loading={loading} style={{ height: '100%' }}>
                                                    <Statistic
                                                        title="Veritabanları ve Havuzlar"
                                                        value={`${systemInfo.services.mariadbDatabases} Adet`}
                                                        prefix={<DatabaseOutlined />}
                                                    />
                                                    <div className="info-text">
                                                        MariaDB, Redis, MongoDB
                                                    </div>
                                                </Card>
                                            </Col>
                                        </Row>

                                        {/* CPU ve RAM */}
                                        <Row gutter={[16, 16]}>
                                            <Col xs={24} lg={12}>
                                                <Card title="CPU Bilgileri" loading={loading} style={{ height: '100%' }}>
                                                    <Space direction="vertical" style={{ width: '100%' }}>
                                                        <Row gutter={[16, 16]}>
                                                            <Col span={12}>
                                                                <Statistic
                                                                    title="Model"
                                                                    value={metrics.cpu.model}
                                                                    prefix={<DesktopOutlined />}
                                                                />
                                                            </Col>
                                                            <Col span={12}>
                                                                <Statistic
                                                                    title="Çekirdek/Thread"
                                                                    value={`${metrics.cpu.cores}/${metrics.cpu.threads}`}
                                                                />
                                                            </Col>
                                                        </Row>
                                                        <Progress
                                                            percent={metrics.cpu.usage}
                                                            status={metrics.cpu.usage > 90 ? 'exception' : 'normal'}
                                                            format={percent => `${percent}%`}
                                                            style={{ marginTop: 24 }}
                                                        />
                                                    </Space>
                                                </Card>
                                            </Col>
                                            <Col xs={24} lg={12}>
                                                <Card title="Bellek Kullanımı" loading={loading} style={{ height: '100%' }}>
                                                    <Space direction="vertical" style={{ width: '100%' }}>
                                                        <Row gutter={[16, 16]}>
                                                            <Col span={12}>
                                                                <Statistic
                                                                    title="Toplam"
                                                                    value={metrics.memory.total}
                                                                    prefix={<HddOutlined />}
                                                                />
                                                            </Col>
                                                            <Col span={12}>
                                                                <Statistic
                                                                    title="Kullanılan"
                                                                    value={metrics.memory.used}
                                                                    prefix={<HddOutlined style={{ color: '#1890ff' }} />}
                                                                />
                                                            </Col>
                                                        </Row>
                                                        <Progress
                                                            percent={metrics.memory.usagePercentage}
                                                            status={metrics.memory.usagePercentage > 90 ? 'exception' : 'normal'}
                                                            format={percent => `${percent.toFixed(2)}%`}
                                                            style={{ marginTop: 24 }}
                                                        />
                                                    </Space>
                                                </Card>
                                            </Col>
                                        </Row>

                                        {/* Ağ İstatistikleri */}
                                        <Card title="Ağ İstatistikleri" loading={loading}>
                                            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                                                <Col span={8}>
                                                    <Statistic
                                                        title="Anlık Hız"
                                                        value={metrics.network.currentSpeed}
                                                        prefix={<CloudUploadOutlined spin />}
                                                    />
                                                </Col>
                                                <Col span={8}>
                                                    <Statistic
                                                        title="İndirme Hızı"
                                                        value={metrics.network.downloadSpeed}
                                                        prefix={<CloudDownloadOutlined style={{ color: '#52c41a' }} />}
                                                        valueStyle={{ color: '#52c41a' }}
                                                    />
                                                </Col>
                                                <Col span={8}>
                                                    <Statistic
                                                        title="Yükleme Hızı"
                                                        value={metrics.network.uploadSpeed}
                                                        prefix={<CloudUploadOutlined style={{ color: '#1890ff' }} />}
                                                        valueStyle={{ color: '#1890ff' }}
                                                    />
                                                </Col>
                                            </Row>
                                            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                                                <Col span={12}>
                                                    <Statistic
                                                        title="Toplam Alınan"
                                                        value={metrics.network.totalReceived}
                                                        prefix={<CloudDownloadOutlined />}
                                                    />
                                                </Col>
                                                <Col span={12}>
                                                    <Statistic
                                                        title="Toplam Gönderilen"
                                                        value={metrics.network.totalTransmitted}
                                                        prefix={<CloudUploadOutlined />}
                                                    />
                                                </Col>
                                            </Row>
                                            <Table
                                                columns={networkColumns}
                                                dataSource={metrics.network.interfaces.filter(i =>
                                                    i.name !== 'bytes  packets errors dropped  missed   mcast' &&
                                                    i.name !== 'bytes  packets errors dropped carrier collsns'
                                                )}
                                                pagination={false}
                                                size="small"
                                            />
                                        </Card>

                                        {/* Disk Kullanımı */}
                                        <Card title="Disk Kullanımı" loading={loading}>
                                            <Table
                                                columns={diskColumns}
                                                dataSource={metrics.disk}
                                                pagination={false}
                                                size="small"
                                            />
                                        </Card>
                                    </>
                                ) : (
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} sm={12}>
                                            <Card loading={true} />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <Card loading={true} />
                                        </Col>
                                        <Col span={24}>
                                            <Card loading={true} />
                                        </Col>
                                        <Col span={24}>
                                            <Card loading={true} />
                                        </Col>
                                    </Row>
                                )}
                            </Space>
                        ) : (
                            <Outlet />
                        )}
                    </Content>
                    <Footer className="dashboard-footer">
                        Server Management Panel ©{new Date().getFullYear()}
                    </Footer>
                </Layout>
            </Layout>
        </Layout>
    );
}

export default DashboardPage; 