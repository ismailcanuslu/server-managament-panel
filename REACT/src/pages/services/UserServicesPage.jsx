import { Row, Col, Card, Button } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

function UserServicesPage() {
    const services = [
        {
            title: 'Kullanıcılar',
            icon: <UserOutlined style={{ fontSize: '24px' }} />,
            description: 'Kullanıcı hesaplarının yönetimi',
            link: '/dashboard/user-services/users'
        },
        {
            title: 'Roller',
            icon: <TeamOutlined style={{ fontSize: '24px' }} />,
            description: 'Kullanıcı rollerinin ve yetkilerinin yönetimi',
            link: '/dashboard/user-services/roles'
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

export default UserServicesPage; 