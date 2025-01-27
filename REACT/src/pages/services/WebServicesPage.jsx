import { Card, Row, Col, Button } from 'antd';
import { Link } from 'react-router-dom';
import {
    LockOutlined,
    MailOutlined
} from '@ant-design/icons';

function WebServicesPage() {
    const services = [
        {
            title: 'SSL Sertifikaları',
            icon: <LockOutlined style={{ fontSize: '24px' }} />,
            description: 'SSL sertifikası yönetimi ve yapılandırması',
            link: '/dashboard/web-services/ssl'
        },
        {
            title: 'Mail Servisleri',
            icon: <MailOutlined style={{ fontSize: '24px' }} />,
            description: 'Mail sunucusu yönetimi',
            onClick: () => window.open('https://mail.anadoluyazilim.com.tr/iredadmin', '_blank')
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
                                service.link ? (
                                    <Link to={service.link}>
                                        <Button type="primary">
                                            Yönet
                                        </Button>
                                    </Link>
                                ) : (
                                    <Button type="primary" onClick={service.onClick}>
                                        Yönet
                                    </Button>
                                )
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

export default WebServicesPage; 