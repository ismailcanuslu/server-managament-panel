import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, Tabs, message, Tooltip, Popconfirm, List } from 'antd';
import { ReloadOutlined, DatabaseOutlined, UserOutlined, DeleteOutlined, PlusOutlined, KeyOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;

function MariaDBPage() {
    const [databases, setDatabases] = useState([]);
    const [users, setUsers] = useState([]);
    const [databasesLoading, setDatabasesLoading] = useState(true);
    const [usersLoading, setUsersLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [form] = Form.useForm();
    const [tables, setTables] = useState([]);
    const [tablesModalVisible, setTablesModalVisible] = useState(false);
    const [privilegesModalVisible, setPrivilegesModalVisible] = useState(false);

    // Her iki verinin de yüklenme durumunu kontrol eden computed value
    const isLoading = databasesLoading || usersLoading;

    // Table loading durumları için
    const tableLoading = {
        databases: databasesLoading,
        users: usersLoading
    };

    // Yenile butonlarındaki loading durumları için
    const refreshLoading = {
        databases: databasesLoading,
        users: usersLoading
    };

    useEffect(() => {
        fetchDatabases();
        fetchUsers();
    }, []);

    // Veritabanlarını getir
    const fetchDatabases = async () => {
        try {
            setDatabasesLoading(true);
            const response = await fetch('/api/mariadb/databases');
            const data = await response.json();
            setDatabases(data);
        } catch (error) {
            message.error('Veritabanları yüklenemedi');
        } finally {
            setDatabasesLoading(false);
        }
    };

    // Kullanıcıları getir
    const fetchUsers = async () => {
        try {
            setUsersLoading(true);
            const response = await fetch('/api/mariadb/users');
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            message.error('Kullanıcılar yüklenemedi');
        } finally {
            setUsersLoading(false);
        }
    };

    // Veritabanı oluştur
    const createDatabase = async (values) => {
        try {
            setActionLoading(prev => ({ ...prev, createDb: true }));
            const response = await fetch('/api/mariadb/databases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
            });

            if (!response.ok) throw new Error('Veritabanı oluşturulamadı');

            message.success('Veritabanı başarıyla oluşturuldu');
            setModalVisible(false);
            form.resetFields();
            fetchDatabases();
        } catch (error) {
            message.error('Veritabanı oluşturulurken hata oluştu');
        } finally {
            setActionLoading(prev => ({ ...prev, createDb: false }));
        }
    };

    // Kullanıcı oluştur
    const createUser = async (values) => {
        try {
            setActionLoading(prev => ({ ...prev, createUser: true }));

            // Kullanıcı oluşturma isteği
            const response = await fetch('/api/mariadb/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: values.username,
                    password: values.password,
                    host: values.host,
                    // database ve privileges bilgilerini çıkarıyoruz
                })
            });

            if (!response.ok) throw new Error('Kullanıcı oluşturulamadı');

            // Kullanıcı başarıyla oluşturulduktan sonra yetkileri verelim
            if (values.database && values.database !== '*' && values.privileges?.length > 0) {
                await fetch(`/api/mariadb/users/${values.username}/grant`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        database: values.database,
                        privileges: values.privileges
                    })
                });
            }

            message.success('Kullanıcı başarıyla oluşturuldu');
            setModalVisible(false);
            form.resetFields();
            fetchUsers();
        } catch (error) {
            message.error('Kullanıcı oluşturulurken hata oluştu');
        } finally {
            setActionLoading(prev => ({ ...prev, createUser: false }));
        }
    };

    // Veritabanı sil
    const deleteDatabase = async (name) => {
        try {
            setActionLoading(prev => ({ ...prev, [name]: true }));
            const response = await fetch(`/api/mariadb/databases/${name}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Veritabanı silinemedi');

            message.success('Veritabanı başarıyla silindi');
            fetchDatabases();
        } catch (error) {
            message.error('Veritabanı silinirken hata oluştu');
        } finally {
            setActionLoading(prev => ({ ...prev, [name]: false }));
        }
    };

    // Kullanıcı sil
    const deleteUser = async (username) => {
        try {
            setActionLoading(prev => ({ ...prev, [username]: true }));
            const response = await fetch(`/api/mariadb/users/${username}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Kullanıcı silinemedi');

            message.success('Kullanıcı başarıyla silindi');
            fetchUsers();
        } catch (error) {
            message.error('Kullanıcı silinirken hata oluştu');
        } finally {
            setActionLoading(prev => ({ ...prev, [username]: false }));
        }
    };

    // Yetki ver/al
    const handlePrivileges = async (username, database, privileges, action) => {
        try {
            setActionLoading(prev => ({ ...prev, [`${username}_${action}`]: true }));
            const response = await fetch(`/api/mariadb/users/${username}/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ database, privileges })
            });

            if (!response.ok) throw new Error(`Yetki ${action === 'grant' ? 'verilemedi' : 'alınamadı'}`);

            message.success(`Yetki başarıyla ${action === 'grant' ? 'verildi' : 'alındı'}`);
            fetchUsers();
        } catch (error) {
            message.error(`Yetki ${action === 'grant' ? 'verilirken' : 'alınırken'} hata oluştu`);
        } finally {
            setActionLoading(prev => ({ ...prev, [`${username}_${action}`]: false }));
        }
    };

    // Tabloları getir
    const showTables = async (dbName) => {
        try {
            setActionLoading(prev => ({ ...prev, [`${dbName}_tables`]: true }));
            const response = await fetch(`/api/mariadb/databases/${dbName}/tables`);
            const data = await response.json();
            setTables(data);
            setSelectedRecord({ name: dbName });
            setTablesModalVisible(true);
        } catch (error) {
            message.error('Tablolar yüklenemedi');
        } finally {
            setActionLoading(prev => ({ ...prev, [`${dbName}_tables`]: false }));
        }
    };

    // Yetki modalını göster
    const showPrivilegesModal = (user) => {
        setSelectedRecord(user);
        setPrivilegesModalVisible(true);
    };

    // Modal içeriğini belirle
    const getModalContent = () => {
        switch (modalType) {
            case 'database':
                return (
                    <Form form={form} onFinish={createDatabase} layout="vertical">
                        <Form.Item
                            name="name"
                            label="Veritabanı Adı"
                            rules={[{ required: true, message: 'Veritabanı adı gerekli!' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="charset"
                            label="Karakter Seti"
                            initialValue="utf8mb4"
                        >
                            <Select>
                                <Option value="utf8mb4">UTF-8 (utf8mb4)</Option>
                                <Option value="utf8">UTF-8</Option>
                                <Option value="latin1">Latin1</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="collation"
                            label="Karşılaştırma"
                            initialValue="utf8mb4_general_ci"
                        >
                            <Select>
                                <Option value="utf8mb4_general_ci">utf8mb4_general_ci</Option>
                                <Option value="utf8mb4_unicode_ci">utf8mb4_unicode_ci</Option>
                                <Option value="utf8_general_ci">utf8_general_ci</Option>
                            </Select>
                        </Form.Item>
                    </Form>
                );
            case 'user':
                return (
                    <Form form={form} onFinish={createUser} layout="vertical">
                        <Form.Item
                            name="username"
                            label="Kullanıcı Adı"
                            rules={[{ required: true, message: 'Kullanıcı adı gerekli!' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="password"
                            label="Şifre"
                            rules={[{ required: true, message: 'Şifre gerekli!' }]}
                        >
                            <Input.Password />
                        </Form.Item>
                        <Form.Item
                            name="host"
                            label="Host"
                            initialValue="localhost"
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="database"
                            label="Veritabanı"
                            rules={[{ required: true, message: 'Veritabanı seçimi gerekli!' }]}
                        >
                            <Select>
                                {databases.map(db => (
                                    <Option key={db.name} value={db.name}>{db.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="privileges"
                            label="Yetkiler"
                            rules={[{ required: true, message: 'En az bir yetki seçilmeli!' }]}
                            initialValue={['SELECT']}
                        >
                            <Select mode="multiple">
                                <Option value="SELECT">SELECT</Option>
                                <Option value="INSERT">INSERT</Option>
                                <Option value="UPDATE">UPDATE</Option>
                                <Option value="DELETE">DELETE</Option>
                                <Option value="CREATE">CREATE</Option>
                                <Option value="DROP">DROP</Option>
                                <Option value="INDEX">INDEX</Option>
                                <Option value="ALTER">ALTER</Option>
                            </Select>
                        </Form.Item>
                    </Form>
                );
            default:
                return null;
        }
    };

    const databaseColumns = [
        {
            title: 'Veritabanı Adı',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Tablo Sayısı',
            dataIndex: 'tables',
            key: 'tables',
        },
        {
            title: 'Boyut',
            dataIndex: 'size',
            key: 'size',
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: (_, record) => {
                const isLoading = actionLoading[record.name];
                return (
                    <Space>
                        <Button
                            icon={<DatabaseOutlined />}
                            size="small"
                            onClick={() => showTables(record.name)}
                            loading={isLoading}
                            disabled={isLoading}
                        >
                            Tablolar
                        </Button>
                        <Popconfirm
                            title="Veritabanını silmek istediğinize emin misiniz?"
                            onConfirm={() => deleteDatabase(record.name)}
                            okText="Evet"
                            cancelText="Hayır"
                        >
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                                loading={isLoading}
                                disabled={isLoading}
                            >
                                Sil
                            </Button>
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];

    const userColumns = [
        {
            title: 'Kullanıcı Adı',
            dataIndex: 'username',
            key: 'username',
            sorter: (a, b) => a.username.localeCompare(b.username),
        },
        {
            title: 'Host',
            dataIndex: 'host',
            key: 'host',
        },
        {
            title: 'Global Yetkiler',
            dataIndex: 'globalPrivileges',
            key: 'globalPrivileges',
            render: privileges => {
                if (!privileges || privileges[0] === 'NULL\n') {
                    return <Tag color="warning">YETKİ YOK</Tag>;
                }
                return (
                    <Space wrap>
                        {privileges.map(priv => (
                            <Tag key={priv} color="blue">{priv}</Tag>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: 'Veritabanı Yetkileri',
            dataIndex: 'databasePrivileges',
            key: 'databasePrivileges',
            render: privileges => {
                if (!privileges || Object.keys(privileges).length === 0) {
                    return <Tag color="warning">YETKİ YOK</Tag>;
                }
                return (
                    <Space direction="vertical">
                        {Object.entries(privileges).map(([db, privs]) => (
                            <div key={db}>
                                <strong>{db}:</strong>
                                <Space wrap style={{ marginLeft: 8 }}>
                                    {privs.map(priv => (
                                        <Tag key={`${db}-${priv}`} color="blue">{priv}</Tag>
                                    ))}
                                </Space>
                            </div>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: (_, record) => {
                const isLoading = actionLoading[record.username];
                const isSystemUser = ['mysql', 'root', 'mariadb.sys'].includes(record.username);

                return (
                    <Space>
                        <Button
                            icon={<KeyOutlined />}
                            size="small"
                            onClick={() => showPrivilegesModal(record)}
                            loading={isLoading}
                            disabled={isLoading || isSystemUser}
                        >
                            Yetkiler
                        </Button>
                        <Popconfirm
                            title="Kullanıcıyı silmek istediğinize emin misiniz?"
                            onConfirm={() => deleteUser(record.username)}
                            okText="Evet"
                            cancelText="Hayır"
                            disabled={isSystemUser}
                        >
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                                loading={isLoading}
                                disabled={isLoading || isSystemUser}
                            >
                                Sil
                            </Button>
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];

    return (
        <div className="page-container">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {isLoading ? (
                    <>
                        <Card loading={true} />
                        <Card loading={true} />
                    </>
                ) : (
                    <>
                        <Tabs defaultActiveKey="1">
                            <TabPane tab="Veritabanları" key="1">
                                <Card
                                    title="MariaDB Veritabanları"
                                    extra={
                                        <Space>
                                            <Button
                                                type="primary"
                                                icon={<PlusOutlined />}
                                                onClick={() => {
                                                    setModalType('database');
                                                    setModalVisible(true);
                                                }}
                                                loading={actionLoading.createDb}
                                            >
                                                Yeni Veritabanı
                                            </Button>
                                            <Button
                                                icon={<ReloadOutlined spin={refreshLoading.databases} />}
                                                onClick={fetchDatabases}
                                                loading={refreshLoading.databases}
                                            >
                                                Yenile
                                            </Button>
                                        </Space>
                                    }
                                >
                                    <Table
                                        columns={databaseColumns}
                                        dataSource={databases}
                                        loading={tableLoading.databases}
                                        rowKey="name"
                                    />
                                </Card>
                            </TabPane>

                            <TabPane tab="Kullanıcılar" key="2">
                                <Card
                                    title="MariaDB Kullanıcıları"
                                    extra={
                                        <Space>
                                            <Button
                                                type="primary"
                                                icon={<PlusOutlined />}
                                                onClick={() => {
                                                    setModalType('user');
                                                    setModalVisible(true);
                                                }}
                                                loading={actionLoading.createUser}
                                            >
                                                Yeni Kullanıcı
                                            </Button>
                                            <Button
                                                icon={<ReloadOutlined spin={refreshLoading.users} />}
                                                onClick={fetchUsers}
                                                loading={refreshLoading.users}
                                            >
                                                Yenile
                                            </Button>
                                        </Space>
                                    }
                                >
                                    <Table
                                        columns={userColumns}
                                        dataSource={users}
                                        loading={tableLoading.users}
                                        rowKey="username"
                                    />
                                </Card>
                            </TabPane>
                        </Tabs>
                    </>
                )}
            </Space>

            {/* Ana Modal */}
            <Modal
                title={modalType === 'database' ? 'Yeni Veritabanı' : 'Yeni Kullanıcı'}
                open={modalVisible}
                onOk={() => form.submit()}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                }}
                confirmLoading={actionLoading.createDb || actionLoading.createUser}
            >
                {getModalContent()}
            </Modal>

            {/* Tablolar Modalı */}
            <Modal
                title={`${selectedRecord?.name} Tabloları`}
                open={tablesModalVisible}
                onCancel={() => setTablesModalVisible(false)}
                footer={null}
            >
                <List
                    dataSource={tables}
                    renderItem={table => (
                        <List.Item>
                            <DatabaseOutlined /> {table}
                        </List.Item>
                    )}
                />
            </Modal>

            {/* Yetkiler Modalı */}
            <Modal
                title={`${selectedRecord?.username} Yetkileri`}
                open={privilegesModalVisible}
                onCancel={() => setPrivilegesModalVisible(false)}
                footer={null}
            >
                <Form layout="vertical">
                    <Form.Item name="database" label="Veritabanı">
                        <Select>
                            {databases.map(db => (
                                <Option key={db.name} value={db.name}>{db.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="privileges" label="Yetkiler">
                        <Select mode="multiple">
                            <Option value="ALL PRIVILEGES">ALL PRIVILEGES</Option>
                            <Option value="SELECT">SELECT</Option>
                            <Option value="INSERT">INSERT</Option>
                            <Option value="UPDATE">UPDATE</Option>
                            <Option value="DELETE">DELETE</Option>
                            <Option value="CREATE">CREATE</Option>
                            <Option value="DROP">DROP</Option>
                            <Option value="GRANT OPTION">GRANT OPTION</Option>
                        </Select>
                    </Form.Item>
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => {
                                const values = form.getFieldsValue();
                                handlePrivileges(selectedRecord.username, values.database, values.privileges, 'grant');
                            }}
                            loading={actionLoading[`${selectedRecord?.username}_grant`]}
                        >
                            Yetki Ver
                        </Button>
                        <Button
                            danger
                            onClick={() => {
                                const values = form.getFieldsValue();
                                handlePrivileges(selectedRecord.username, values.database, values.privileges, 'revoke');
                            }}
                            loading={actionLoading[`${selectedRecord?.username}_revoke`]}
                        >
                            Yetki Al
                        </Button>
                    </Space>
                </Form>
            </Modal>
        </div>
    );
}

export default MariaDBPage; 