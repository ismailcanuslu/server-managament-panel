import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spin } from 'antd';

export default function ProtectedRoute({ children, type = "private" }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (type === "guest") {
        return !user ? children : <Navigate to="/dashboard" replace />;
    }

    return user ? children : <Navigate to="/login" state={{ from: location }} replace />;
} 