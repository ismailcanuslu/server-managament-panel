import { useState, useEffect } from 'react';
import { Steps, Card, Form, Input, Switch, Space, Button, Alert, Typography, Modal, Divider, Radio, message } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Step } = Steps;
const { Text, Paragraph } = Typography;

function Apache2WizardPage() {
    const navigate = useNavigate();
    const [current, setCurrent] = useState(0);
    const [form] = Form.useForm();
    const [finalConfig, setFinalConfig] = useState('');
    const [previewVisible, setPreviewVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedConfig, setEditedConfig] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Component mount olduğunda localStorage'dan verileri kontrol et
    useEffect(() => {
        const savedData = localStorage.getItem('apache2WizardData');
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
                localStorage.removeItem('apache2WizardData');
            }
        }
    }, []);

    // Timeline için özel stil
    const stepsStyle = {
        '.ant-steps': {
            width: '100%',
            marginBottom: '24px',
        },
        '.ant-steps-item-title': {
            display: 'inline-block'
        },
        '.ant-steps-item-wait .ant-steps-item-icon': {
            backgroundColor: '#f0f0f0',
            borderColor: '#d9d9d9',
        },
        '.ant-steps-item-finish .ant-steps-item-icon': {
            backgroundColor: '#52c41a',
            borderColor: '#52c41a',
        },
        '.ant-steps-item-finish .ant-steps-item-icon > .ant-steps-icon': {
            color: '#fff',
        }
    };

    const steps = [
        {
            title: 'Domain Adı',
            content: (
                <Form.Item
                    name="domain"
                    label="Domain Adı"
                    rules={[{ required: true, message: 'Domain adı gerekli!' }]}
                    extra={
                        <Alert
                            message="Domain Adı Nasıl Yazılmalı?"
                            description={
                                <>
                                    <Paragraph>
                                        - www olmadan yazın (örn: anadoluyazilim.com.tr)
                                    </Paragraph>
                                    <Paragraph>
                                        - Alt domain kullanıyorsanız direkt yazabilirsiniz (örn: panel.anadoluyazilim.com.tr)
                                    </Paragraph>
                                </>
                            }
                            type="info"
                            showIcon
                        />
                    }
                >
                    <Input placeholder="ornek.com" />
                </Form.Item>
            )
        },
        {
            title: 'İletişim',
            content: (
                <Form.Item
                    name="adminEmail"
                    label="Sunucu Yöneticisi E-posta"
                    rules={[
                        { required: true, message: 'E-posta adresi gerekli!' },
                        { type: 'email', message: 'Geçerli bir e-posta adresi girin!' }
                    ]}
                    extra={
                        <Alert
                            message="Bu e-posta adresi nerede kullanılır?"
                            description="Apache sunucusunda bir hata oluştuğunda veya SSL sertifikası yenilenme zamanı geldiğinde bu adrese bilgilendirme gönderilir."
                            type="info"
                            showIcon
                        />
                    }
                >
                    <Input placeholder="webmaster@ornek.com" />
                </Form.Item>
            )
        },
        {
            title: 'HTTP',
            content: (
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Card className="special-card">
                        <Form.Item
                            name="enableHttp"
                            label="HTTP Aktif"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>
                    </Card>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.enableHttp !== currentValues.enableHttp}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('enableHttp') && (
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Form.Item
                                        name="forceHttps"
                                        label="HTTP -> HTTPS Zorunlu Yönlendirme"
                                        valuePropName="checked"
                                    >
                                        <Switch />
                                    </Form.Item>

                                    <Form.Item
                                        name="useHttpAlias"
                                        label="Alias Ekle"
                                        valuePropName="checked"
                                    >
                                        <Switch />
                                    </Form.Item>

                                    <Form.Item
                                        noStyle
                                        shouldUpdate={(prevValues, currentValues) => prevValues.useHttpAlias !== currentValues.useHttpAlias}
                                    >
                                        {({ getFieldValue }) =>
                                            getFieldValue('useHttpAlias') && (
                                                <Form.Item
                                                    name="httpDocumentRoot"
                                                    label="Dosya Konumu"
                                                    rules={[{ required: true, message: 'Dosya konumu gerekli!' }]}
                                                >
                                                    <Input placeholder="/etc/www-sites/domain.com" />
                                                </Form.Item>
                                            )
                                        }
                                    </Form.Item>

                                    <Form.Item
                                        name="useHttpProxy"
                                        label="Proxy Yönlendirmesi"
                                        valuePropName="checked"
                                    >
                                        <Switch />
                                    </Form.Item>

                                    <Form.Item
                                        noStyle
                                        shouldUpdate={(prevValues, currentValues) => prevValues.useHttpProxy !== currentValues.useHttpProxy}
                                    >
                                        {({ getFieldValue }) =>
                                            getFieldValue('useHttpProxy') && (
                                                <Form.Item
                                                    name="httpProxyPass"
                                                    label="Proxy Hedef URL"
                                                    rules={[{ required: true, message: 'Proxy hedef URL gerekli!' }]}
                                                >
                                                    <Input placeholder="http://127.0.0.1:3000" />
                                                </Form.Item>
                                            )
                                        }
                                    </Form.Item>
                                </Space>
                            )
                        }
                    </Form.Item>
                </Space>
            )
        },
        {
            title: 'HTTPS',
            content: (
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Card className="special-card">
                        <Form.Item
                            name="enableHttps"
                            label="HTTPS Aktif"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>
                    </Card>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.enableHttps !== currentValues.enableHttps}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('enableHttps') && (
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Alert
                                        message="SSL Zorunluluğu"
                                        description="HTTPS protokolü için SSL sertifikası zorunludur."
                                        type="warning"
                                        showIcon
                                    />

                                    <Form.Item
                                        name="useHttpsAlias"
                                        label="Alias Ekle"
                                        valuePropName="checked"
                                    >
                                        <Switch />
                                    </Form.Item>

                                    <Form.Item
                                        noStyle
                                        shouldUpdate={(prevValues, currentValues) => prevValues.useHttpsAlias !== currentValues.useHttpsAlias}
                                    >
                                        {({ getFieldValue }) =>
                                            getFieldValue('useHttpsAlias') && (
                                                <Form.Item
                                                    name="httpsDocumentRoot"
                                                    label="Dosya Konumu"
                                                    rules={[{ required: true, message: 'Dosya konumu gerekli!' }]}
                                                >
                                                    <Input placeholder="/etc/www-sites/domain.com" />
                                                </Form.Item>
                                            )
                                        }
                                    </Form.Item>

                                    <Form.Item
                                        name="useHttpsProxy"
                                        label="Proxy Yönlendirmesi"
                                        valuePropName="checked"
                                    >
                                        <Switch />
                                    </Form.Item>

                                    <Form.Item
                                        noStyle
                                        shouldUpdate={(prevValues, currentValues) => prevValues.useHttpsProxy !== currentValues.useHttpsProxy}
                                    >
                                        {({ getFieldValue }) =>
                                            getFieldValue('useHttpsProxy') && (
                                                <Form.Item
                                                    name="httpsProxyPass"
                                                    label="Proxy Hedef URL"
                                                    rules={[{ required: true, message: 'Proxy hedef URL gerekli!' }]}
                                                >
                                                    <Input placeholder="http://127.0.0.1:3000" />
                                                </Form.Item>
                                            )
                                        }
                                    </Form.Item>

                                    <Form.Item
                                        name="sslType"
                                        label="SSL Kaynağı"
                                        rules={[{ required: true, message: 'SSL kaynağı seçilmeli!' }]}
                                    >
                                        <Radio.Group>
                                            <Radio value="file">Sunucudaki Dosya</Radio>
                                            <Radio value="proxy">Reverse Proxy Host</Radio>
                                        </Radio.Group>
                                    </Form.Item>

                                    <Form.Item
                                        noStyle
                                        shouldUpdate={(prevValues, currentValues) => prevValues.sslType !== currentValues.sslType}
                                    >
                                        {({ getFieldValue }) =>
                                            getFieldValue('sslType') === 'file' && (
                                                <>
                                                    <Form.Item
                                                        name="sslCertFile"
                                                        label="SSL Sertifika Dosyası"
                                                        rules={[{ required: true, message: 'Sertifika dosyası gerekli!' }]}
                                                    >
                                                        <Input placeholder="/etc/www-certificates/domain.com/sectigo.crt" />
                                                    </Form.Item>

                                                    <Form.Item
                                                        name="sslKeyFile"
                                                        label="SSL Anahtar Dosyası"
                                                        rules={[{ required: true, message: 'Anahtar dosyası gerekli!' }]}
                                                    >
                                                        <Input placeholder="/etc/www-certificates/domain.com/private.key" />
                                                    </Form.Item>

                                                    <Form.Item
                                                        name="sslChainFile"
                                                        label="SSL Zincir Dosyası (Opsiyonel)"
                                                        extra={
                                                            <Alert
                                                                message="Zincir Dosyası Hakkında"
                                                                description="Bu dosya eklenmezse bazı tarayıcılar sitenizi güvensiz olarak işaretleyebilir."
                                                                type="info"
                                                                showIcon
                                                            />
                                                        }
                                                    >
                                                        <Input placeholder="/etc/www-certificates/domain.com/fullchain.crt" />
                                                    </Form.Item>
                                                </>
                                            )
                                        }
                                    </Form.Item>

                                    <Divider>Ek Seçenekler</Divider>

                                    <Form.Item
                                        name="enableLogging"
                                        label="Loglama Aktif"
                                        valuePropName="checked"
                                    >
                                        <Switch />
                                    </Form.Item>

                                    <Form.Item
                                        name="enableHttp2"
                                        label="HTTP/2 Protokolü"
                                        valuePropName="checked"
                                        extra={
                                            <Alert
                                                message="HTTP/2 Protokolü Hakkında"
                                                description={
                                                    <>
                                                        <Paragraph>
                                                            HTTP/2, web sayfalarının yükleme hızını artıran modern bir protokoldür.
                                                        </Paragraph>
                                                        <Paragraph>
                                                            <Text strong>Avantajları:</Text>
                                                            <ul>
                                                                <li>Daha hızlı sayfa yükleme</li>
                                                                <li>Tek bir bağlantı üzerinden çoklu istek</li>
                                                                <li>Sunucu kaynaklarının daha verimli kullanımı</li>
                                                            </ul>
                                                        </Paragraph>
                                                    </>
                                                }
                                                type="info"
                                                showIcon
                                            />
                                        }
                                    >
                                        <Switch />
                                    </Form.Item>
                                </Space>
                            )
                        }
                    </Form.Item>
                </Space>
            )
        }
    ];

    const next = async () => {
        try {
            const values = await form.validateFields();
            const currentValues = form.getFieldsValue();
            const savedData = localStorage.getItem('apache2WizardData');
            const previousValues = savedData ? JSON.parse(savedData) : {};

            // Timestamp ekleyerek verileri kaydet
            const updatedValues = {
                ...previousValues,
                ...currentValues,
                timestamp: Date.now()
            };

            localStorage.setItem('apache2WizardData', JSON.stringify(updatedValues));
            console.log('Kaydedilen veriler:', updatedValues);

            if (current === steps.length - 1) {
                generateConfig();
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
        const savedData = localStorage.getItem('apache2WizardData');
        const previousValues = savedData ? JSON.parse(savedData) : {};

        // Timestamp'i güncelle
        const updatedValues = {
            ...previousValues,
            ...currentValues,
            timestamp: Date.now()
        };

        localStorage.setItem('apache2WizardData', JSON.stringify(updatedValues));
        setCurrent(current - 1);
    };

    const generateConfig = () => {
        const savedData = localStorage.getItem('apache2WizardData');
        const values = savedData ? JSON.parse(savedData) : {};

        console.log('Konfig için kullanılan veriler:', values);

        if (!values.domain || !values.adminEmail) {
            message.error('Gerekli form alanları eksik!');
            return;
        }

        let config = '';

        // HTTP (80) Konfigürasyonu
        if (values.enableHttp) {
            config += `<VirtualHost *:80>
    ServerName ${values.domain}
    ServerAlias www.${values.domain}${values.useHttpAlias ? `
    DocumentRoot ${values.httpDocumentRoot}` : ''}

    # Web yöneticisi bilgisi
    ServerAdmin ${values.adminEmail}${values.useHttpProxy ? `

    # Proxy ayarları
    ProxyPreserveHost On
    ProxyTimeout 300
    ProxyRequests Off
    ProxyPass / ${values.httpProxyPass}/
    ProxyPassReverse / ${values.httpProxyPass}/` : ''}${values.enableLogging ? `

    # Log ayarları
    ErrorLog \${APACHE_LOG_DIR}/${values.domain}_error.log
    CustomLog \${APACHE_LOG_DIR}/${values.domain}_access.log combined` : ''}${values.forceHttps ? `

    # HTTP'den HTTPS'e Yönlendirme
    Redirect permanent / https://${values.domain}/` : ''}
</VirtualHost>

`;
        }

        // HTTPS (443) Konfigürasyonu
        if (values.enableHttps) {
            config += `<VirtualHost *:443>
    ServerName ${values.domain}
    ServerAlias www.${values.domain}${values.useHttpsAlias ? `
    DocumentRoot ${values.httpsDocumentRoot}` : ''}

    # Web yöneticisi bilgisi
    ServerAdmin ${values.adminEmail}${values.useHttpsProxy ? `

    # Proxy ayarları
    ProxyPreserveHost On
    ProxyTimeout 300
    ProxyRequests Off
    ProxyPass / ${values.httpsProxyPass}/
    ProxyPassReverse / ${values.httpsProxyPass}/` : ''}${values.enableHttp2 ? `

    # HTTP/2 Protokolü
    Protocols h2 http/1.1` : ''}${values.enableLogging ? `

    # Log ayarları
    ErrorLog \${APACHE_LOG_DIR}/${values.domain}_error.log
    CustomLog \${APACHE_LOG_DIR}/${values.domain}_access.log combined` : ''}

    # SSL Ayarları
    SSLEngine on${values.sslType === 'file' ? `
    SSLCertificateFile ${values.sslCertFile}
    SSLCertificateKeyFile ${values.sslKeyFile}${values.sslChainFile ? `
    SSLCertificateChainFile ${values.sslChainFile}` : ''}` : ''}
</VirtualHost>`;
        }

        setFinalConfig(config);
        setEditedConfig(config);
    };

    // Modal kapanırken localStorage'ı temizleme
    const handleModalClose = () => {
        // Artık localStorage'ı temizlemiyoruz
        setPreviewVisible(false);
    };

    // Kaydet ve Uygula butonuna basıldığında
    const handleSaveAndApply = async () => {
        try {
            setIsSaving(true); // İşlem başladığında loading'i aktif et
            const savedData = localStorage.getItem('apache2WizardData');
            const values = savedData ? JSON.parse(savedData) : {};

            // Dosya adını domain'den oluştur
            const filename = `${values.domain}.conf`;

            // Dosya içeriğini Blob'a çevir
            const fileContent = new Blob([finalConfig], { type: 'text/plain' });

            // FormData oluştur ve backend'in beklediği formatta gönder
            const formData = new FormData();
            formData.append('path', '/etc/apache2/sites-available');
            formData.append('file', fileContent, filename);

            // Dosyayı yükle
            const response = await fetch('/api/ftp/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || 'Dosya yüklenemedi');
            }

            message.success('Konfigürasyon başarıyla kaydedildi!');
            localStorage.removeItem('apache2WizardData');
            setPreviewVisible(false);
            navigate('/dashboard/system-services/apache2');

        } catch (error) {
            console.error('Konfigürasyon kaydedilirken hata:', error);
            message.error('Konfigürasyon kaydedilemedi: ' + error.message);
        } finally {
            setIsSaving(false); // İşlem bittiğinde loading'i kapat
        }
    };

    // Manuel düzenleme için yeni fonksiyon
    const handleManualEdit = () => {
        setIsEditing(true);
        setEditedConfig(finalConfig);
    };

    // Düzenlemeyi kaydet
    const handleSaveEdit = () => {
        setFinalConfig(editedConfig);
        setIsEditing(false);
    };

    // Düzenlemeyi iptal et
    const handleCancelEdit = () => {
        setEditedConfig(finalConfig);
        setIsEditing(false);
    };

    return (
        <div className="page-container">
            <Card title="Apache2 Konfigürasyon Sihirbazı">
                <Steps
                    current={current}
                    onChange={setCurrent}
                    style={{ marginBottom: 24 }}
                    items={steps.map((item, index) => ({
                        title: current === index ? item.title : '',
                        description: ''
                    }))}
                />

                <div style={{ marginTop: 24 }}>
                    <Form
                        form={form}
                        layout="vertical"
                        requiredMark="optional"
                    >
                        {steps[current].content}
                    </Form>
                </div>

                <div style={{ marginTop: 24 }}>
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

            <style>
                {Object.entries(stepsStyle).map(([selector, styles]) =>
                    `${selector} { ${Object.entries(styles).map(([prop, value]) =>
                        `${prop}: ${value};`
                    ).join(' ')} }`
                ).join('\n')}
            </style>

            <Modal
                title="Konfigürasyon Önizleme"
                open={previewVisible}
                onCancel={handleModalClose}
                width={800}
                footer={[
                    !isEditing ? (
                        <>
                            <Button
                                key="edit"
                                onClick={handleManualEdit}
                                disabled={isSaving}
                            >
                                Manuel Ayar
                            </Button>
                            <Button
                                key="back"
                                onClick={handleModalClose}
                                disabled={isSaving}
                            >
                                Düzenle
                            </Button>
                            <Button
                                key="submit"
                                type="primary"
                                onClick={handleSaveAndApply}
                                loading={isSaving}
                                disabled={isSaving}
                            >
                                Kaydet ve Uygula
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                key="cancel"
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                            >
                                İptal
                            </Button>
                            <Button
                                key="save"
                                type="primary"
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                            >
                                Kaydet
                            </Button>
                        </>
                    )
                ]}
            >
                {isEditing ? (
                    <Input.TextArea
                        value={editedConfig}
                        onChange={(e) => setEditedConfig(e.target.value)}
                        autoSize={{ minRows: 10, maxRows: 20 }}
                        style={{
                            fontFamily: 'monospace',
                            backgroundColor: '#f5f5f5',
                            padding: 16,
                            borderRadius: 4
                        }}
                    />
                ) : (
                    <pre style={{
                        backgroundColor: '#f5f5f5',
                        padding: 16,
                        borderRadius: 4,
                        maxHeight: '60vh',
                        overflow: 'auto'
                    }}>
                        {finalConfig}
                    </pre>
                )}
            </Modal>
        </div>
    );
}

export default Apache2WizardPage; 