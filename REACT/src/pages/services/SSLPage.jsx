import { useState, useEffect } from 'react';
import { Card, Space, Button, Table, Tag, Modal, Form, Input, Switch, message, Alert } from 'antd';
import {
    LockOutlined,
    ReloadOutlined,
    DeleteOutlined,
    WarningOutlined,
    PlusOutlined
} from '@ant-design/icons';

function SSLPage() {
    const [loading, setLoading] = useState(true);
    const [certificates, setCertificates] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [actionLoading, setActionLoading] = useState({});

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/certificate/list');
            const data = await response.json();

            // Sertifikaların son kullanma tarihine göre kalan gün hesaplaması
            const processedData = data.map(cert => {
                const expiryDate = new Date(cert.expiryDate);
                const today = new Date();
                const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

                return {
                    ...cert,
                    daysLeft,
                    key: cert.domain // Table için unique key
                };
            });

            setCertificates(processedData);
        } catch (error) {
            message.error('Sertifikalar yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCertificate = async (values) => {
        try {
            setActionLoading(prev => ({ ...prev, create: true }));
            const response = await fetch('/api/certificate/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    domain: values.domain,
                    enableWww: values.enableWww,
                    enableAutoRenew: values.enableAutoRenew
                })
            });

            if (!response.ok) {
                throw new Error('Sertifika oluşturulamadı');
            }

            message.success('Sertifika başarıyla oluşturuldu');
            setModalVisible(false);
            form.resetFields();
            fetchCertificates();
        } catch (error) {
            message.error(error.message);
        } finally {
            setActionLoading(prev => ({ ...prev, create: false }));
        }
    };

    const handleRevokeCertificate = async (domain) => {
        try {
            setActionLoading(prev => ({ ...prev, [domain]: true }));
            const response = await fetch(`/api/certificate/revoke/${domain}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Sertifika iptal edilemedi');
            }

            message.success('Sertifika başarıyla iptal edildi');
            fetchCertificates();
        } catch (error) {
            message.error(error.message);
        } finally {
            setActionLoading(prev => ({ ...prev, [domain]: false }));
        }
    };

    const handleRenewCertificate = async (domain) => {
        try {
            setActionLoading(prev => ({ ...prev, [`renew_${domain}`]: true }));
            const response = await fetch(`/api/certificate/renew/${domain}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Sertifika yenilenemedi');
            }

            message.success('Sertifika başarıyla yenilendi');
            fetchCertificates();
        } catch (error) {
            message.error(error.message);
        } finally {
            setActionLoading(prev => ({ ...prev, [`renew_${domain}`]: false }));
        }
    };

    const columns = [
        {
            title: 'Domain',
            dataIndex: 'domain',
            key: 'domain',
        },
        {
            title: 'Sertifika Sağlayıcı',
            dataIndex: 'issuer',
            key: 'issuer',
        },
        {
            title: 'Son Kullanma Tarihi',
            dataIndex: 'expiryDate',
            key: 'expiryDate',
            render: (date) => new Date(date).toLocaleDateString('tr-TR'),
        },
        {
            title: 'Durum',
            key: 'status',
            render: (_, record) => {
                let color = 'success';
                let text = record.status;

                if (record.daysLeft <= 15) {
                    color = 'warning';
                    text = `${record.daysLeft} gün kaldı`;
                } else if (record.status.toLowerCase() !== 'valid') {
                    color = 'error';
                }

                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: 'Otomatik Yenileme',
            dataIndex: 'isAutoRenew',
            key: 'isAutoRenew',
            render: (isAutoRenew) => (
                <Tag color={isAutoRenew ? 'blue' : 'default'}>
                    {isAutoRenew ? 'Aktif' : 'Pasif'}
                </Tag>
            ),
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<ReloadOutlined />}
                        size="small"
                        type="primary"
                        onClick={() => handleRenewCertificate(record.domain)}
                        loading={actionLoading[`renew_${record.domain}`]}
                    >
                        Yenile
                    </Button>
                    <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        danger
                        onClick={() => handleRevokeCertificate(record.domain)}
                        loading={actionLoading[record.domain]}
                    >
                        İptal Et
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="page-container">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                {certificates.some(cert => cert.daysLeft <= 15) && (
                    <Alert
                        message="Sertifika Uyarısı"
                        description="Bazı sertifikalarınızın süresi yakında dolacak. Lütfen kontrol edin."
                        type="warning"
                        showIcon
                        icon={<WarningOutlined />}
                    />
                )}

                <Card
                    title="SSL Sertifikaları"
                    extra={
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setModalVisible(true)}
                        >
                            Yeni Sertifika
                        </Button>
                    }
                >
                    <Table
                        columns={columns}
                        dataSource={certificates}
                        loading={loading}
                        pagination={false}
                    />
                </Card>
            </Space>

            <Modal
                title="Yeni SSL Sertifikası"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateCertificate}
                >
                    <Form.Item
                        label="Domain"
                        name="domain"
                        rules={[{ required: true, message: 'Domain gerekli!' }]}
                    >
                        <Input placeholder="örn: example.com" />
                    </Form.Item>

                    <Form.Item
                        name="enableWww"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="www Aktif" unCheckedChildren="www Pasif" />
                    </Form.Item>

                    <Form.Item
                        name="enableAutoRenew"
                        valuePropName="checked"
                        initialValue={true}
                    >
                        <Switch checkedChildren="Otomatik Yenileme Aktif" unCheckedChildren="Otomatik Yenileme Pasif" />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={actionLoading.create}
                        >
                            Oluştur
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default SSLPage;