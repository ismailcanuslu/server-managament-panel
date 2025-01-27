import { Form, Input, Button, Card, message } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './LoginPage.css';
import { useState } from 'react';

function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/dashboard";
    const [loading, setLoading] = useState(false);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const success = await login(values.username, values.password);
            if (success) {
                message.success('Giriş başarılı');
                navigate(from, { replace: true });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="background-animation">
                <img src="/contact_globe.svg" alt="Globe Animation" className="globe-animation" />
            </div>
            <Card className="login-card">
                <div className="logo-container">
                    <img src="/logo_cd.webp" alt="Logo" className="login-logo" />
                </div>
                <h2>Sunucu Yönetim Paneli</h2>
                <Form
                    name="login"
                    onFinish={onFinish}
                    autoComplete="off"
                    layout="vertical"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Kullanıcı adı gerekli!' }]}
                    >
                        <Input placeholder="Kullanıcı Adı" prefix={<i className="fas fa-user" />} />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Şifre gerekli!' }]}
                    >
                        <Input.Password placeholder="Şifre" prefix={<i className="fas fa-lock" />} />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Giriş Yap
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}

export default LoginPage; 