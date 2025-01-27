import { Card, Row, Col, Button } from 'antd';
import { Link } from 'react-router-dom';
import {
    DatabaseOutlined,
    ThunderboltOutlined,
    CloudOutlined
} from '@ant-design/icons';

function DatabasesPage() {
    const services = [
        {
            title: 'MariaDB',
            icon: <DatabaseOutlined style={{ fontSize: '24px' }} />,
            description: 'MariaDB veritabanı yönetimi',
            link: '/dashboard/databases/mariadb'
        },
        {
            title: 'Redis',
            icon: <ThunderboltOutlined style={{ fontSize: '24px' }} />,
            description: 'Redis önbellek yönetimi',
            link: '/dashboard/databases/redis'
        },
        {
            title: 'MongoDB',
            icon: <CloudOutlined style={{ fontSize: '24px' }} />,
            description: 'MongoDB NoSQL veritabanı yönetimi',
            link: '/dashboard/databases/mongodb'
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

export default DatabasesPage; 