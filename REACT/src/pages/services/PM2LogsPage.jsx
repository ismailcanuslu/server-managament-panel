import { useState, useEffect } from 'react';
import { Card, Spin, Typography, Alert } from 'antd';
import { useParams } from 'react-router-dom';

const { Text } = Typography;

function PM2LogsPage() {
    const { appName } = useParams();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLogs();
    }, [appName]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/pm2/logs/${appName}`);

            if (!response.ok) {
                throw new Error('Loglar alınamadı');
            }

            const data = await response.json();
            setLogs(data.logs);
        } catch (error) {
            console.error('Log alma hatası:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert
                message="Hata"
                description={error}
                type="error"
                showIcon
            />
        );
    }

    return (
        <div className="page-container">
            <Card title={`${appName} Logları`}>
                <pre style={{
                    backgroundColor: '#f5f5f5',
                    padding: 16,
                    borderRadius: 4,
                    maxHeight: '70vh',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace'
                }}>
                    {logs.map((log, index) => (
                        <Text key={index} type={log.includes('error') ? 'danger' : undefined}>
                            {log}
                            {'\n'}
                        </Text>
                    ))}
                </pre>
            </Card>
        </div>
    );
}

export default PM2LogsPage; 