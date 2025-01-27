import { Table, Button, Space, Tag, Input, Card, Tooltip, Modal, Form, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';

function UsersPage() {
    const [searchText, setSearchText] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    const data = [
        {
            key: '1',
            username: 'admin',
            email: 'admin@example.com',
            role: 'Admin',
            status: 'Aktif',
            lastLogin: '2024-03-20 10:30',
            createdAt: '2024-01-01',
            loginAttempts: 0
        },
        {
            key: '2',
            username: 'moderator',
            email: 'moderator@example.com',
            role: 'Moderator',
            status: 'Aktif',
            lastLogin: '2024-03-19 15:45',
            createdAt: '2024-01-15',
            loginAttempts: 1
        },
        {
            key: '3',
            username: 'user1',
            email: 'user1@example.com',
            role: 'User',
            status: 'Aktif',
            lastLogin: '2024-03-18 09:15',
            createdAt: '2024-02-01',
            loginAttempts: 0
        },
        {
            key: '4',
            username: 'user2',
            email: 'user2@example.com',
            role: 'User',
            status: 'Pasif',
            lastLogin: '2024-03-15 14:20',
            createdAt: '2024-02-15',
            loginAttempts: 3
        }
    ];

    const columns = [
        {
            title: 'Kullanıcı Adı',
            dataIndex: 'username',
            key: 'username',
            sorter: (a, b) => a.username.localeCompare(b.username),
        },
        {
            title: 'E-posta',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Rol',
            dataIndex: 'role',
            key: 'role',
            render: (role) => (
                <Tag color={role === 'Admin' ? 'red' : role === 'Moderator' ? 'blue' : 'green'}>
                    <i className={`fas fa-${role === 'Admin' ? 'user-shield' : role === 'Moderator' ? 'user-cog' : 'user'} mr-1`}></i>
                    {role}
                </Tag>
            ),
        },
        {
            title: 'Durum',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'Aktif' ? 'success' : 'error'}>
                    <i className={`fas fa-${status === 'Aktif' ? 'check-circle' : 'times-circle'} mr-1`}></i>
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Son Giriş',
            dataIndex: 'lastLogin',
            key: 'lastLogin',
            render: (lastLogin) => (
                <Tooltip title={lastLogin}>
                    <i className="fas fa-clock mr-1"></i>
                    {lastLogin}
                </Tooltip>
            ),
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button type="primary" size="small">
                        <i className="fas fa-edit mr-1"></i>
                        Düzenle
                    </Button>
                    <Button type="default" size="small">
                        <i className="fas fa-key mr-1"></i>
                        Şifre
                    </Button>
                    <Button danger size="small">
                        <i className="fas fa-trash mr-1"></i>
                        Sil
                    </Button>
                </Space>
            ),
        },
    ];

    const handleAddUser = (values) => {
        console.log('Yeni kullanıcı:', values);
        setIsModalVisible(false);
        form.resetFields();
    };

    return (
        <div className="page-container">
            <Card
                title={
                    <Space>
                        <i className="fas fa-users"></i>
                        Kullanıcı Yönetimi
                    </Space>
                }
                extra={
                    <Space>
                        <Input
                            placeholder="Ara..."
                            prefix={<SearchOutlined />}
                            onChange={e => setSearchText(e.target.value)}
                            style={{ width: 200 }}
                        />
                        <Button type="primary" onClick={() => setIsModalVisible(true)}>
                            <i className="fas fa-user-plus mr-1"></i>
                            Yeni Kullanıcı
                        </Button>
                    </Space>
                }
            >
                <Table
                    columns={columns}
                    dataSource={data.filter(
                        user => user.username.toLowerCase().includes(searchText.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchText.toLowerCase())
                    )}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Toplam ${total} kullanıcı`
                    }}
                />
            </Card>

            <Modal
                title="Yeni Kullanıcı Ekle"
                open={isModalVisible}
                onOk={() => form.submit()}
                onCancel={() => setIsModalVisible(false)}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleAddUser}
                >
                    <Form.Item
                        name="username"
                        label="Kullanıcı Adı"
                        rules={[{ required: true, message: 'Kullanıcı adı gerekli!' }]}
                    >
                        <Input prefix={<i className="fas fa-user"></i>} />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="E-posta"
                        rules={[
                            { required: true, message: 'E-posta gerekli!' },
                            { type: 'email', message: 'Geçerli bir e-posta girin!' }
                        ]}
                    >
                        <Input prefix={<i className="fas fa-envelope"></i>} />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="Şifre"
                        rules={[{ required: true, message: 'Şifre gerekli!' }]}
                    >
                        <Input.Password prefix={<i className="fas fa-lock"></i>} />
                    </Form.Item>
                    <Form.Item
                        name="role"
                        label="Rol"
                        rules={[{ required: true, message: 'Rol seçimi gerekli!' }]}
                    >
                        <Select>
                            <Select.Option value="Admin">Admin</Select.Option>
                            <Select.Option value="Moderator">Moderator</Select.Option>
                            <Select.Option value="User">User</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default UsersPage; 