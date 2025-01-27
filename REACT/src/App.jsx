import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import trTR from 'antd/locale/tr_TR';
import { useState, useEffect } from 'react';
import UsersPage from './pages/UsersPage';
import Apache2Page from './pages/services/Apache2Page';
import PM2Page from './pages/services/PM2Page';
import DockerPage from './pages/services/DockerPage';
import ElasticSearchPage from './pages/services/ElasticSearchPage';
import RedisPage from './pages/databases/RedisPage';
import MongoDBPage from './pages/databases/MongoDBPage';
import MariaDBPage from './pages/databases/MariaDBPage';
import FilesPage from './pages/FilesPage';
import SSLPage from './pages/services/SSLPage';
import SystemServicesPage from './pages/services/SystemServicesPage';
import WebServicesPage from './pages/services/WebServicesPage';
import DatabasesPage from './pages/databases/DatabasesPage';
import Apache2WizardPage from './pages/services/Apache2WizardPage';
import PM2WizardPage from './pages/services/PM2WizardPage';
import PM2LogsPage from './pages/services/PM2LogsPage';
import RolesPage from './pages/RolesPage';
import WebSSHPage from './pages/WebSSHPage';
import UserServicesPage from './pages/services/UserServicesPage';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('dark-mode') === 'true';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('dark-mode', isDarkMode);
  }, [isDarkMode]);

  return (
    <AuthProvider>
      <ConfigProvider
        locale={trTR}
        theme={{
          algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorBgContainer: isDarkMode ? '#1f1f1f' : '#ffffff',
            colorBgElevated: isDarkMode ? '#1f1f1f' : '#ffffff',
            colorBorder: isDarkMode ? '#303030' : '#f0f0f0',
          }
        }}
      >
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<ProtectedRoute type="guest"><LoginPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} /></ProtectedRoute>}>
              <Route path="system-services" element={<SystemServicesPage />} />
              <Route path="web-services" element={<WebServicesPage />} />
              <Route path="databases" element={<DatabasesPage />} />
              <Route path="system-services/apache2" element={<Apache2Page />} />
              <Route path="system-services/apache2/wizard" element={<Apache2WizardPage />} title="Yeni Konfigürasyon" />
              <Route path="system-services/pm2" element={<PM2Page />} />
              <Route path="system-services/docker" element={<DockerPage />} />
              <Route path="system-services/elastic" element={<ElasticSearchPage />} />
              <Route path="web-services/ssl" element={<SSLPage />} />
              <Route path="databases/mariadb" element={<MariaDBPage />} />
              <Route path="databases/redis" element={<RedisPage />} />
              <Route path="databases/mongodb" element={<MongoDBPage />} />
              <Route path="files" element={<FilesPage isDarkMode={isDarkMode} />} />
              <Route path="system-services/pm2/new" element={<PM2WizardPage />} title="Yeni Konfigürasyon" />
              <Route path="system-services/pm2/logs/:appName" element={<PM2LogsPage />} />
              <Route path="user-services" element={<UserServicesPage />} />
              <Route path="user-services/users" element={<UsersPage />} />
              <Route path="user-services/roles" element={<RolesPage />} />
              <Route path="webssh" element={<WebSSHPage />} />
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </AuthProvider>
  );
}

export default App;
