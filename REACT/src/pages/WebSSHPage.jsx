import { Card, Tabs, Button, Space, Tag, Modal, Form, Input, Select, Upload, message, Spin } from 'antd';
import { PoweroffOutlined, UploadOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import axios from 'axios';

const { TextArea } = Input;

// Terminal tema seçenekleri
const terminalThemes = {
    ubuntu: {
        background: '#300a24',
        text: '#eeeeec',
        prompt: '#838781',
        error: '#cc0000',
        selection: '#4a3636'
    },
    dracula: {
        background: '#282a36',
        text: '#f8f8f2',
        prompt: '#50fa7b',
        error: '#ff5555',
        selection: '#44475a'
    },
    matrix: {
        background: '#000',
        text: '#00ff00',
        prompt: '#00ff00',
        error: '#ff0000',
        selection: '#003300'
    },
    nord: {
        background: '#2e3440',
        text: '#d8dee9',
        prompt: '#88c0d0',
        error: '#bf616a',
        selection: '#3b4252'
    },
    monokai: {
        background: '#272822',
        text: '#f8f8f2',
        prompt: '#a6e22e',
        error: '#f92672',
        selection: '#49483e'
    },
    synthwave: {
        background: '#2a2139',
        text: '#f92aad',
        prompt: '#72f1b8',
        error: '#fe4450',
        selection: '#34294f'
    },
    light: {
        background: '#fff',
        text: '#000',
        prompt: '#0066ff',
        error: '#ff0000',
        selection: '#f0f0f0'
    },
    classic: {
        background: '#000',
        text: '#fff',
        prompt: '#0f0',
        error: '#ff0000',
        selection: '#333'
    }
};

function WebSSHPage() {
    const [activeKey, setActiveKey] = useState('1');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [authType, setAuthType] = useState('password');
    const [form] = Form.useForm();
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTheme, setCurrentTheme] = useState(() => {
        return localStorage.getItem('terminal-theme') || 'classic';
    });
    const [commandHistory, setCommandHistory] = useState(() => {
        return JSON.parse(localStorage.getItem('command-history') || '[]');
    });
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [currentCommand, setCurrentCommand] = useState('');
    const [terminalHeight, setTerminalHeight] = useState(() => {
        return localStorage.getItem('terminal-height') || 500;
    });

    useEffect(() => {
        loadConnections();
    }, []);

    useEffect(() => {
        localStorage.setItem('command-history', JSON.stringify(commandHistory));
    }, [commandHistory]);

    useEffect(() => {
        localStorage.setItem('terminal-height', terminalHeight);
    }, [terminalHeight]);

    const loadConnections = async () => {
        try {
            setLoading(true);
            const defaultConn = await axios.get('/api/WebSsh/default-connection');

            if (defaultConn.data) {
                try {
                    await axios.post('/api/WebSsh/use-default');
                    const welcomeMessage = [
                        `Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-92-generic x86_64)`,
                        '',
                        ' * Documentation:  https://help.ubuntu.com',
                        ' * Management:     https://landscape.canonical.com',
                        ' * Support:        https://ubuntu.com/advantage',
                        '',
                        `System information as of ${new Date().toLocaleString('tr-TR')}`,
                        '',
                        `Last login: ${new Date().toLocaleString('tr-TR')} from ${defaultConn.data.lastLoginIp || 'local'}`
                    ].join('\n');

                    setConnections([{
                        ...defaultConn.data,
                        status: 'connected',
                        output: welcomeMessage
                    }]);
                    setActiveKey(defaultConn.data.id);
                } catch (error) {
                    setConnections([{
                        ...defaultConn.data,
                        status: 'error',
                        error: error.response?.data?.error || 'Bağlantı hatası'
                    }]);
                    message.error('Varsayılan bağlantı başlatılamadı');
                }
            }

            if (!defaultConn.data || defaultConn.data.status === 'error') {
                const activeConns = await axios.get('/api/WebSsh/connections');
                if (activeConns.data?.length > 0) {
                    setConnections(prev => [
                        ...prev,
                        ...activeConns.data.map(conn => ({ ...conn, status: 'connecting' }))
                    ]);
                }
            }
        } catch (error) {
            console.error("Bağlantılar yüklenirken hata:", error);
            message.error('Bağlantılar yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleNewConnection = async (values) => {
        try {
            setLoading(true);
            const formData = new FormData();

            const connectionData = {
                name: values.alias,
                host: values.host,
                port: values.port,
                username: values.username,
                authType: values.authType
            };

            if (values.authType === 'password') {
                connectionData.password = values.password;
            } else {
                const sshKeyFile = values.sshKey[0].originFileObj;
                formData.append('sshKey', sshKeyFile);
                if (values.passphrase) {
                    connectionData.passphrase = values.passphrase;
                }
            }

            const response = await axios.post('/api/WebSsh/connect', connectionData);

            if (response.data?.connectionId) {
                setConnections(prev => [...prev, {
                    id: response.data.connectionId,
                    name: values.alias,
                    host: values.host,
                    status: 'connected'
                }]);
                message.success('Bağlantı başarıyla oluşturuldu');
                setIsModalVisible(false);
                form.resetFields();
                setActiveKey(response.data.connectionId);
            }
        } catch (error) {
            console.error('Bağlantı hatası:', error);
            message.error('Bağlantı oluşturulurken hata: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const executeCommand = async (connectionId, command) => {
        try {
            const response = await axios.post(`/api/WebSsh/${connectionId}/execute`, JSON.stringify(command), {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            setCommandHistory(prev => [...prev.slice(-50), command]);

            if (!response.data?.output || response.data.output === '') {
                const errorMessage = [
                    '┌──────────────────────────────────────┐',
                    '│           Komut Bulunamadı           │',
                    '├──────────────────────────────────────┤',
                    `│ Şu komutta hata: ${command}${' '.repeat(Math.max(0, 34 - command.length - 16))}│`,
                    '└──────────────────────────────────────┘'
                ].join('\n');

                setConnections(prev => prev.map(conn =>
                    conn.id === connectionId
                        ? {
                            ...conn,
                            lastCommand: command,
                            output: (conn.output || '') + `root@localhost:~$ ${command}\n${errorMessage}\n`
                        }
                        : conn
                ));
            } else {
                setConnections(prev => prev.map(conn =>
                    conn.id === connectionId
                        ? {
                            ...conn,
                            lastCommand: command,
                            output: (conn.output || '') + `root@localhost:~$ ${command}\n${response.data.output}\n`
                        }
                        : conn
                ));
            }
        } catch (error) {
            const errorBox = [
                '┌──────────────────────────────────────┐',
                '│              Hata Oluştu              │',
                '├──────────────────────────────────────┤',
                `│ ${error.response?.data?.error || error.message.slice(0, 30).padEnd(34)}│`,
                '└──────────────────────────────────────┘'
            ].join('\n');

            setConnections(prev => prev.map(conn =>
                conn.id === connectionId
                    ? {
                        ...conn,
                        lastCommand: command,
                        output: (conn.output || '') + errorBox + '\n',
                        error: true
                    }
                    : conn
            ));
        }
    };

    const handleDisconnect = async (connectionId) => {
        try {
            const defaultConn = await axios.get('/api/WebSsh/default-connection');

            if (connectionId === defaultConn.data.id) {
                Modal.confirm({
                    title: 'Varsayılan Bağlantı Kapatılamaz',
                    content: 'Varsayılan SSH bağlantısı sistem servisleri için gereklidir ve kapatılamaz.',
                    okText: 'Tamam',
                    cancelButtonProps: { style: { display: 'none' } },
                    centered: true,
                });
                return;
            }

            await axios.post(`/api/WebSsh/disconnect/${connectionId}`);
            setConnections(prev => prev.filter(conn => conn.id !== connectionId));
            message.success('Bağlantı kapatıldı');

            if (activeKey === connectionId) {
                const remainingConnections = connections.filter(conn => conn.id !== connectionId);
                if (remainingConnections.length > 0) {
                    setActiveKey(remainingConnections[0].id);
                }
            }
        } catch (error) {
            console.error('Bağlantı kapatma hatası:', error);
            message.error('Bağlantı kapatılırken hata oluştu');
        }
    };

    const handleAuthTypeChange = (value) => {
        setAuthType(value);
        form.setFieldsValue({ sshKey: undefined, password: undefined });
    };

    const normFile = (e) => {
        if (Array.isArray(e)) {
            return e;
        }
        return e?.fileList;
    };

    const beforeUpload = (file) => {
        const isValidSize = file.size / 1024 / 1024 < 1; // 1MB'dan küçük olmalı
        if (!isValidSize) {
            message.error('SSH key dosyası 1MB\'dan küçük olmalıdır!');
        }
        return false; // Otomatik upload'ı engelle
    };

    const handleCommand = (e, conn) => {
        const command = e.target.value.trim();
        if (command) {
            // Komut geçmişine ekle
            setCommandHistory(prev => [...prev.slice(-50), command]); // Son 50 komutu tut
            setHistoryIndex(-1);
            executeCommand(conn.id, command);
            e.target.value = '';
            setCurrentCommand('');
        }
    };

    const handleKeyDown = (e, conn) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                const command = commandHistory[commandHistory.length - 1 - newIndex];
                e.target.value = command;
                setCurrentCommand(command);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                const command = commandHistory[commandHistory.length - 1 - newIndex];
                e.target.value = command;
                setCurrentCommand(command);
            } else {
                setHistoryIndex(-1);
                e.target.value = '';
                setCurrentCommand('');
            }
        }
    };

    const renderTerminal = (conn) => {
        const theme = terminalThemes[currentTheme];

        return (
            <div
                style={{
                    background: theme.background,
                    padding: '20px',
                    height: `${terminalHeight}px`,
                    color: theme.text,
                    fontFamily: 'monospace',
                    position: 'relative',
                    resize: 'vertical',
                    overflow: 'auto',
                    minHeight: '300px',
                    maxHeight: '1000px'
                }}
                onMouseUp={(e) => {
                    const height = e.currentTarget.offsetHeight;
                    setTerminalHeight(height);
                }}
            >
                <div style={{ marginBottom: '10px' }}>
                    {conn.output && (
                        <pre style={{
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            color: conn.error ? theme.error : theme.text
                        }}>
                            {conn.output}
                        </pre>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: theme.prompt, marginRight: '8px' }}>
                        {`${conn.username || 'root'}@${conn.host || 'localhost'}:~$`}
                    </span>
                    <Input
                        autoFocus
                        bordered={false}
                        value={currentCommand}
                        onChange={(e) => setCurrentCommand(e.target.value)}
                        onPressEnter={(e) => handleCommand(e, conn)}
                        onKeyDown={(e) => handleKeyDown(e, conn)}
                        style={{
                            background: 'transparent',
                            color: theme.text,
                            flex: 1,
                            caretColor: theme.text
                        }}
                    />
                </div>
            </div>
        );
    };

    // Tema değişikliğini localStorage'a kaydet
    const handleThemeChange = (value) => {
        setCurrentTheme(value);
        localStorage.setItem('terminal-theme', value);
    };

    return (
        <div className="page-container">
            <Card
                title={
                    <Space>
                        <i className="fas fa-terminal"></i>
                        Web SSH Terminal
                    </Space>
                }
                extra={
                    <Space size="middle">
                        <Select
                            value={currentTheme}
                            onChange={handleThemeChange}
                            style={{ width: 130 }}
                            dropdownMatchSelectWidth={false}
                        >
                            <Select.Option value="ubuntu">
                                <Space>
                                    <i className="fab fa-ubuntu"></i>
                                    Ubuntu
                                </Space>
                            </Select.Option>
                            <Select.Option value="dracula">
                                <Space>
                                    <i className="fas fa-ghost"></i>
                                    Dracula
                                </Space>
                            </Select.Option>
                            <Select.Option value="matrix">
                                <Space>
                                    <i className="fas fa-stream"></i>
                                    Matrix
                                </Space>
                            </Select.Option>
                            <Select.Option value="nord">
                                <Space>
                                    <i className="far fa-snowflake"></i>
                                    Nord
                                </Space>
                            </Select.Option>
                            <Select.Option value="monokai">
                                <Space>
                                    <i className="fas fa-code"></i>
                                    Monokai
                                </Space>
                            </Select.Option>
                            <Select.Option value="synthwave">
                                <Space>
                                    <i className="fas fa-wave-square"></i>
                                    Synthwave
                                </Space>
                            </Select.Option>
                            <Select.Option value="light">
                                <Space>
                                    <i className="far fa-sun"></i>
                                    Light
                                </Space>
                            </Select.Option>
                            <Select.Option value="classic">
                                <Space>
                                    <i className="fas fa-terminal"></i>
                                    Classic
                                </Space>
                            </Select.Option>
                        </Select>
                        <Button type="primary" onClick={() => setIsModalVisible(true)}>
                            <Space>
                                <i className="fas fa-plus-circle"></i>
                                Yeni SSH
                            </Space>
                        </Button>
                    </Space>
                }
            >
                <Spin spinning={loading}>
                    <Tabs
                        type="editable-card"
                        activeKey={activeKey}
                        onChange={setActiveKey}
                        onEdit={(targetKey, action) => {
                            if (action === 'add') {
                                setIsModalVisible(true);
                            } else if (action === 'remove') {
                                handleDisconnect(targetKey);
                            }
                        }}
                        items={connections.map(conn => ({
                            key: conn.id,
                            label: (
                                <Space>
                                    <i className="fas fa-terminal"></i>
                                    {conn.name || conn.host}
                                    <Tag color={
                                        conn.status === 'connected' ? 'success' :
                                            conn.status === 'error' ? 'error' :
                                                'default'
                                    }>
                                        {conn.status === 'connected' ? 'Bağlı' :
                                            conn.status === 'error' ? 'Hata' :
                                                'Bağlanıyor...'}
                                    </Tag>
                                </Space>
                            ),
                            children: renderTerminal(conn)
                        }))}
                    />
                </Spin>
            </Card>

            <Modal
                title="Yeni SSH Bağlantısı"
                open={isModalVisible}
                onOk={() => form.submit()}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                    setAuthType('password');
                }}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleNewConnection}
                    initialValues={{ authType: 'password' }}
                >
                    <Form.Item
                        name="alias"
                        label="Sunucu Takma Adı"
                        rules={[{ required: true, message: 'Lütfen bir takma ad girin!' }]}
                    >
                        <Input prefix={<i className="fas fa-tag"></i>} placeholder="örn: Web Sunucusu" />
                    </Form.Item>

                    <Form.Item
                        name="host"
                        label="IP Adresi / Hostname"
                        rules={[{ required: true, message: 'Lütfen IP adresi veya hostname girin!' }]}
                    >
                        <Input prefix={<i className="fas fa-server"></i>} placeholder="örn: 192.168.1.100 veya server.example.com" />
                    </Form.Item>

                    <Form.Item
                        name="port"
                        label="Port"
                        initialValue="22"
                        rules={[{ required: true, message: 'Port numarası gerekli!' }]}
                    >
                        <Input prefix={<i className="fas fa-plug"></i>} placeholder="örn: 22" />
                    </Form.Item>

                    <Form.Item
                        name="username"
                        label="Kullanıcı Adı"
                        rules={[{ required: true, message: 'Kullanıcı adı gerekli!' }]}
                    >
                        <Input prefix={<i className="fas fa-user"></i>} placeholder="örn: root" />
                    </Form.Item>

                    <Form.Item
                        name="authType"
                        label="Oturum Açma Türü"
                        rules={[{ required: true }]}
                    >
                        <Select onChange={handleAuthTypeChange}>
                            <Select.Option value="password">Şifre ile</Select.Option>
                            <Select.Option value="sshKey">SSH Key ile</Select.Option>
                        </Select>
                    </Form.Item>

                    {authType === 'password' ? (
                        <Form.Item
                            name="password"
                            label="Şifre"
                            rules={[{ required: true, message: 'Şifre gerekli!' }]}
                        >
                            <Input.Password prefix={<i className="fas fa-lock"></i>} />
                        </Form.Item>
                    ) : (
                        <Form.Item
                            name="sshKey"
                            label="SSH Key"
                            valuePropName="fileList"
                            getValueFromEvent={normFile}
                            rules={[{ required: true, message: 'SSH key gerekli!' }]}
                        >
                            <Upload.Dragger
                                name="sshKey"
                                beforeUpload={beforeUpload}
                                maxCount={1}
                            >
                                <p className="ant-upload-drag-icon">
                                    <i className="fas fa-key fa-2x"></i>
                                </p>
                                <p className="ant-upload-text">SSH key dosyasını sürükleyin veya tıklayarak seçin</p>
                                <p className="ant-upload-hint">
                                    Sadece özel SSH key dosyaları desteklenir
                                </p>
                            </Upload.Dragger>
                        </Form.Item>
                    )}
                </Form>
            </Modal>
        </div>
    );
}

export default WebSSHPage; 