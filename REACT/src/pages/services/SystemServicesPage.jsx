import { Card, Row, Col, Button } from 'antd';
import { Link } from 'react-router-dom';
import {
    ApiOutlined,
    CloudServerOutlined,
    ContainerOutlined,
    SearchOutlined
} from '@ant-design/icons';

function SystemServicesPage() {
    const services = [
        {
            title: 'Apache2',
            icon: <ApiOutlined style={{ fontSize: '24px' }} />,
            description: 'Web sunucusu yönetimi, sanal host yapılandırması',
            link: '/dashboard/system-services/apache2'
        },
        {
            title: 'PM2',
            icon: <CloudServerOutlined style={{ fontSize: '24px' }} />,
            description: 'Node.js uygulama ve servis yönetimi',
            link: '/dashboard/system-services/pm2'
        },
        {
            title: 'Docker',
            icon: <ContainerOutlined style={{ fontSize: '24px' }} />,
            description: 'Container ve image yönetimi',
            link: '/dashboard/system-services/docker'
        },
        {
            title: 'ElasticSearch',
            icon: <SearchOutlined style={{ fontSize: '24px' }} />,
            description: 'Arama motoru ve indeks yönetimi',
            link: '/dashboard/system-services/elastic'
        }
    ];

    return (
        <div className="page-container">
            <Row gutter={[16, 16]}>
                {services.map(service => (
                    <Col xs={24} sm={12} md={8} lg={6} key={service.title}>
                        <Card
                            hoverable
                            style={{ height: '100%' }}
                            actions={[
                                <Link to={service.link}>
                                    <Button type="primary">
                                        Yönet
                                    </Button>
                                </Link>
                            ]}
                        >
                            <Card.Meta
                                avatar={service.icon}
                                title={service.title}
                                description={service.description}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
}

export default SystemServicesPage; 