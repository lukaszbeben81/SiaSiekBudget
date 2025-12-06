import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login/Login';
import FirstRun from './components/FirstRun/FirstRun';
import Dashboard from './pages/Dashboard/Dashboard';
import DeveloperBar from './components/DeveloperBar/DeveloperBar';
import './styles/global.css';

const AppContent: React.FC = () => {
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null);
  const [passwordEnabled, setPasswordEnabled] = useState(true);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{latestVersion: string; releaseUrl: string} | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    checkFirstRun();
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      if (!window.electronAPI?.checkForUpdates) return;
      
      const result = await window.electronAPI.checkForUpdates();
      if (result.success && result.hasUpdate && result.latestVersion && result.releaseUrl) {
        setUpdateInfo({
          latestVersion: result.latestVersion,
          releaseUrl: result.releaseUrl
        });
        setUpdateModalOpen(true);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const checkFirstRun = async () => {
    try {
      console.log('Checking first run...');
      console.log('electronAPI available:', !!window.electronAPI);
      
      if (!window.electronAPI) {
        console.error('electronAPI is not available!');
        setIsFirstRun(false);
        return;
      }

      const firstRun = await window.electronAPI.isFirstRun();
      console.log('First run result:', firstRun);
      setIsFirstRun(firstRun);

      if (!firstRun) {
        const settings = await window.electronAPI.getSettings();
        console.log('Settings:', settings);
        setPasswordEnabled(settings.password_enabled === 1);
      }
    } catch (error) {
      console.error('Error checking first run:', error);
      setIsFirstRun(false);
    }
  };

  const handleFirstRunComplete = () => {
    setIsFirstRun(false);
    checkFirstRun();
  };

  if (isFirstRun === null) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (isFirstRun) {
    return <FirstRun onComplete={handleFirstRunComplete} />;
  }

  if (passwordEnabled && !isAuthenticated) {
    return <Login />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Update Modal */}
      {updateModalOpen && updateInfo && (
        <div className="update-modal-overlay" onClick={() => setUpdateModalOpen(false)}>
          <div className="update-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="update-modal-header">
              <span className="update-emoji">🎉</span>
              <h2>Nowa wersja dostępna!</h2>
            </div>
            <div className="update-modal-body">
              <p>Dostępna jest nowa wersja <strong>v{updateInfo.latestVersion}</strong></p>
              <p>Czy chcesz przejść do strony pobierania?</p>
            </div>
            <div className="update-modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setUpdateModalOpen(false)}
              >
                Później
              </button>
              <a 
                href={updateInfo.releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                onClick={() => setUpdateModalOpen(false)}
              >
                Pobierz aktualizację
              </a>
            </div>
          </div>
        </div>
      )}
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DeveloperBar />
      <AppContent />
    </AuthProvider>
  );
};

export default App;
