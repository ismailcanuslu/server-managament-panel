import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { message } from 'antd';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser({ username: localStorage.getItem('username'), isAdmin: localStorage.getItem('isAdmin') === 'true' });
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await axios.post('/api/auth/login', { username, password });
            const { token } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('username', username);
            localStorage.setItem('isAdmin', username === 'admin');

            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser({ username, isAdmin: username === 'admin' });

            return true;
        } catch (error) {
            if (error.response?.status === 401) {
                message.error('Kullanıcı adı veya şifre hatalı!');
            } else {
                message.error('Giriş yapılırken bir hata oluştu: ' + (error.response?.data?.message || 'Sunucu hatası'));
            }
            return false;
        }
    };

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout');
        } catch (error) {
            console.error('Çıkış hatası:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('isAdmin');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext); 