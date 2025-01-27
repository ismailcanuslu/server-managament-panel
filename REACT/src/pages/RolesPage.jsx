import { Table, Button, Space, Tag, Input, Card, Modal, Form, Select, Checkbox } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';

function RolesPage() {
    const [searchText, setSearchText] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    const data = [
        {
            key: '1',
            name: 'Süper Admin',
            description: 'Tüm yetkilere sahip rol',
            permissions: ['Tam Yetki'],
            userCount: 2,
            status: 'Aktif',
            createdAt: '2024-01-01'
        },
        {
            key: '2',
            name: 'Sistem Yöneticisi',
            description: 'Sistem yönetimi yetkileri',
            permissions: ['Sistem Yönetimi', 'Servis Yönetimi'],
            userCount: 3,
            status: 'Aktif',
            createdAt: '2024-01-15'
        },
        {
            key: '3',
            name: 'Veritabanı Yöneticisi',
            description: 'Veritabanı yönetimi yetkileri',
            permissions: ['Veritabanı Yönetimi'],
            userCount: 4,
            status: 'Aktif',
            createdAt: '2024-02-01'
        },
        {
            key: '4',
            name: 'Geliştirici',
            description: 'Geliştirici yetkileri',
            permissions: ['Kod Görüntüleme', 'Deployment'],
            userCount: 8,
            status: 'Aktif',
            createdAt: '2024-02-15'
        }
    ];

    const columns = [
        {
            title: 'Rol Adı',
            dataIndex: 'name',
            key: 'name',
            render: (text) => (
                <Space>
                    <i className="fas fa-user-shield"></i>
                    {text}
                </Space>
            ),
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Açıklama',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'İzinler',
            dataIndex: 'permissions',
            key: 'permissions',
            render: permissions => (
                <Space wrap>
                    {permissions.map(permission => (
                        <Tag color="blue" key={permission}>
                            <i className="fas fa-check-circle mr-1"></i>
                            {permission}
                        </Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: 'Kullanıcı Sayısı',
            dataIndex: 'userCount',
            key: 'userCount',
            render: (count) => (
                <Space>
                    <i className="fas fa-users"></i>
                    {count}
                </Space>
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
                        İzinler
                    </Button>
                    <Button danger size="small">
                        <i className="fas fa-trash mr-1"></i>
                        Sil
                    </Button>
                </Space>
            ),
        },
    ];

    const handleAddRole = (values) => {
        console.log('Yeni rol:', values);
        setIsModalVisible(false);
        form.resetFields();
    };

    return (
        <div className="page-container">
            <Card
                title={
                    <Space>
                        <i className="fas fa-user-shield"></i>
                        Rol Yönetimi
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
                            <i className="fas fa-plus-circle mr-1"></i>
                            Yeni Rol
                        </Button>
                    </Space>
                }
            >
                <Table
                    columns={columns}
                    dataSource={data.filter(
                        role => role.name.toLowerCase().includes(searchText.toLowerCase()) ||
                            role.description.toLowerCase().includes(searchText.toLowerCase())
                    )}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Toplam ${total} rol`
                    }}
                />
            </Card>

            <Modal
                title="Yeni Rol Ekle"
                open={isModalVisible}
                onOk={() => form.submit()}
                onCancel={() => setIsModalVisible(false)}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleAddRole}
                >
                    <Form.Item
                        name="name"
                        label="Rol Adı"
                        rules={[{ required: true, message: 'Rol adı gerekli!' }]}
                    >
                        <Input prefix={<i className="fas fa-user-shield"></i>} />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Açıklama"
                        rules={[{ required: true, message: 'Açıklama gerekli!' }]}
                    >
                        <Input.TextArea />
                    </Form.Item>
                    <Form.Item
                        name="permissions"
                        label="İzinler"
                        rules={[{ required: true, message: 'En az bir izin seçilmeli!' }]}
                    >
                        <Checkbox.Group>
                            <Space direction="vertical">
                                <Checkbox value="system">Sistem Yönetimi</Checkbox>
                                <Checkbox value="service">Servis Yönetimi</Checkbox>
                                <Checkbox value="database">Veritabanı Yönetimi</Checkbox>
                                <Checkbox value="user">Kullanıcı Yönetimi</Checkbox>
                                <Checkbox value="deployment">Deployment</Checkbox>
                            </Space>
                        </Checkbox.Group>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default RolesPage; 