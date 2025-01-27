import { useState, useEffect } from 'react';
import { Steps, Card, Form, Input, Select, InputNumber, Space, Button, Alert, Typography, Modal, Radio, message } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Step } = Steps;
const { TextArea } = Input;
const { Option } = Select;
const { Paragraph } = Typography;

function PM2WizardPage() {
    const navigate = useNavigate();
    const [current, setCurrent] = useState(0);
    const [form] = Form.useForm();
    const [finalCommand, setFinalCommand] = useState('');
    const [previewVisible, setPreviewVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    // Component mount olduğunda localStorage'dan verileri kontrol et
    useEffect(() => {
        const savedData = localStorage.getItem('pm2WizardData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);

            // 15 dakika kontrolü (15 * 60 * 1000 = 900000 milisaniye)
            const isDataValid = parsedData.timestamp &&
                (Date.now() - parsedData.timestamp) < 900000;

            if (isDataValid) {
                // Timestamp'i form verilerine dahil etme
                const { timestamp, ...formData } = parsedData;
                form.setFieldsValue(formData);
                console.log('Yüklenen veriler:', formData);
            } else {
                // Süresi dolmuş verileri temizle
                localStorage.removeItem('pm2WizardData');
            }
        }
    }, []);

    const steps = [
        {
            title: 'Temel Ayarlar',
            content: (
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Form.Item
                        name="appName"
                        label="Uygulama Adı"
                        rules={[{ required: true, message: 'Uygulama adı gerekli!' }]}
                        extra={
                            <Alert
                                message="Uygulama Adı Nasıl Olmalı?"
                                description={
                                    <>
                                        <Paragraph>
                                            - Benzersiz bir isim olmalı
                                        </Paragraph>
                                        <Paragraph>
                                            - Boşluk ve özel karakter içermemeli
                                        </Paragraph>
                                    </>
                                }
                                type="info"
                                showIcon
                                icon={<InfoCircleOutlined />}
                            />
                        }
                    >
                        <Input placeholder="my-app" />
                    </Form.Item>

                    <Form.Item
                        name="script"
                        label="Başlangıç Dosyası"
                        rules={[{ required: true, message: 'Başlangıç dosyası gerekli!' }]}
                        extra={
                            <Alert
                                message="Başlangıç Dosyası"
                                description="Node.js uygulamanızın giriş noktası (örn: app.js, server.js, index.js)"
                                type="info"
                                showIcon
                                icon={<InfoCircleOutlined />}
                            />
                        }
                    >
                        <Input placeholder="app.js" />
                    </Form.Item>
                </Space>
            )
        },
        {
            title: 'Çalışma Modu',
            content: (
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Form.Item
                        name="instances"
                        label="Çalışma Modu"
                        rules={[{ required: true }]}
                        extra={
                            <Alert
                                message="Çalışma Modu Nedir?"
                                description={
                                    <>
                                        <Paragraph>
                                            - Tek Çekirdek: Uygulama tek bir process olarak çalışır
                                        </Paragraph>
                                        <Paragraph>
                                            - Tüm Çekirdekler: CPU çekirdek sayısı kadar process başlatır
                                        </Paragraph>
                                        <Paragraph>
                                            - Özel: Belirttiğiniz sayıda process başlatır
                                        </Paragraph>
                                    </>
                                }
                                type="info"
                                showIcon
                                icon={<InfoCircleOutlined />}
                            />
                        }
                    >
                        <Radio.Group>
                            <Space direction="vertical">
                                <Radio value="single">Tek Çekirdek</Radio>
                                <Radio value="max">Tüm Çekirdekler</Radio>
                                <Radio value="custom">Özel Çekirdek Sayısı</Radio>
                            </Space>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) =>
                            prevValues.instances !== currentValues.instances
                        }
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('instances') === 'custom' && (
                                <Form.Item
                                    name="customInstances"
                                    label="Çekirdek Sayısı"
                                    rules={[{ required: true, message: 'Çekirdek sayısı gerekli!' }]}
                                >
                                    <InputNumber min={1} max={32} />
                                </Form.Item>
                            )
                        }
                    </Form.Item>
                </Space>
            )
        },
        {
            title: 'Ortam Ayarları',
            content: (
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Form.Item
                        name="environment"
                        label="Çalışma Ortamı"
                        rules={[{ required: true }]}
                        extra={
                            <Alert
                                message="Çalışma Ortamı"
                                description="Uygulamanızın çalışacağı ortamı seçin. Bu seçim NODE_ENV değerini belirler."
                                type="info"
                                showIcon
                                icon={<InfoCircleOutlined />}
                            />
                        }
                    >
                        <Select>
                            <Option value="default">Varsayılan</Option>
                            <Option value="production">Production</Option>
                            <Option value="development">Development</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="customCommand"
                        label="Özel Başlatma Komutları"
                        extra={
                            <Alert
                                message="Özel Komutlar"
                                description="Her satıra bir komut yazın. Örnek: --port 3000, --watch"
                                type="info"
                                showIcon
                                icon={<InfoCircleOutlined />}
                            />
                        }
                    >
                        <TextArea
                            placeholder="--port 3000&#10;--watch&#10;--ignore-watch='node_modules'"
                            autoSize={{ minRows: 3, maxRows: 6 }}
                        />
                    </Form.Item>
                </Space>
            )
        }
    ];

    const next = async () => {
        try {
            const values = await form.validateFields();
            const currentValues = form.getFieldsValue();
            const savedData = localStorage.getItem('pm2WizardData');
            const previousValues = savedData ? JSON.parse(savedData) : {};

            // Timestamp ekleyerek verileri kaydet
            const updatedValues = {
                ...previousValues,
                ...currentValues,
                timestamp: Date.now()
            };

            localStorage.setItem('pm2WizardData', JSON.stringify(updatedValues));

            if (current === steps.length - 1) {
                generateCommand();
                setPreviewVisible(true);
            } else {
                setCurrent(current + 1);
            }
        } catch (error) {
            console.error('Form doğrulama hatası:', error);
        }
    };

    const prev = () => {
        const currentValues = form.getFieldsValue();
        const savedData = localStorage.getItem('pm2WizardData');
        const previousValues = savedData ? JSON.parse(savedData) : {};

        // Timestamp'i güncelle
        const updatedValues = {
            ...previousValues,
            ...currentValues,
            timestamp: Date.now()
        };

        localStorage.setItem('pm2WizardData', JSON.stringify(updatedValues));
        setCurrent(current - 1);
    };

    const generateCommand = () => {
        // localStorage'dan verileri al
        const savedData = localStorage.getItem('pm2WizardData');
        const values = savedData ? JSON.parse(savedData) : form.getFieldsValue();

        // timestamp'i çıkar
        const { timestamp, ...formValues } = values;

        let command = `pm2 start ${formValues.script} --name ${formValues.appName}`;

        // Çekirdek sayısı ayarı
        if (formValues.instances === 'max') {
            command += ' -i max';
        } else if (formValues.instances === 'custom' && formValues.customInstances) {
            command += ` -i ${formValues.customInstances}`;
        }

        // Ortam ayarı
        if (formValues.environment && formValues.environment !== 'default') {
            command += ` --env ${formValues.environment}`;
        }

        // Özel komutlar
        if (formValues.customCommand) {
            command += ' ' + formValues.customCommand.split('\n').join(' ');
        }

        console.log('Oluşturulan komut için kullanılan veriler:', formValues);
        setFinalCommand(command);
    };

    const handleSaveAndApply = async () => {
        try {
            setIsSaving(true);
            setErrorMessage(null); // Her denemede hata mesajını temizle

            const response = await fetch('/api/pm2/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(finalCommand)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Uygulama başlatılamadı');
            }

            message.success('Uygulama başarıyla başlatıldı!');
            localStorage.removeItem('pm2WizardData');
            navigate('/dashboard/system-services/pm2');
        } catch (error) {
            console.error('PM2 başlatma hatası:', error);
            setErrorMessage(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleModalClose = () => {
        setPreviewVisible(false);
        setErrorMessage(null); // Modal kapanınca hata mesajını temizle
    };

    return (
        <div className="page-container">
            <Card title="PM2 Uygulama Sihirbazı">
                <Steps current={current} style={{ marginBottom: 24 }}>
                    {steps.map(item => (
                        <Step key={item.title} title={item.title} />
                    ))}
                </Steps>

                <Form
                    form={form}
                    layout="vertical"
                    style={{ maxWidth: 600, margin: '0 auto' }}
                >
                    {steps[current].content}
                </Form>

                <div style={{ marginTop: 24, textAlign: 'right' }}>
                    <Space>
                        {current > 0 && (
                            <Button onClick={prev}>
                                Geri
                            </Button>
                        )}
                        <Button type="primary" onClick={next}>
                            {current === steps.length - 1 ? 'Önizle' : 'İleri'}
                        </Button>
                    </Space>
                </div>
            </Card>

            <Modal
                title="Komut Önizleme"
                open={previewVisible}
                onCancel={handleModalClose}
                width={800}
                footer={[
                    <Button key="back" onClick={handleModalClose}>
                        Düzenle
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={handleSaveAndApply}
                        loading={isSaving}
                    >
                        {isSaving ? 'Başlatılıyor...' : 'Başlat'}
                    </Button>
                ]}
            >
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <pre style={{
                        backgroundColor: '#f5f5f5',
                        padding: 16,
                        borderRadius: 4,
                        maxHeight: '30vh',
                        overflow: 'auto',
                        fontSize: '14px'
                    }}>
                        {finalCommand}
                    </pre>

                    {errorMessage && (
                        <Alert
                            message="Hata"
                            description={errorMessage}
                            type="error"
                            showIcon
                            style={{
                                marginBottom: 16,
                                whiteSpace: 'pre-wrap'
                            }}
                        />
                    )}
                </Space>
            </Modal>
        </div>
    );
}

export default PM2WizardPage; 