import React, { useState, useEffect } from 'react';
import './DeveloperBar.css';

const DeveloperBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkDeveloperMode = async () => {
      try {
        const settings = await window.electronAPI.getSettings();
        const devMode = settings.developer_mode === 1;
        setIsVisible(devMode);
        
        // Add/remove class from body for padding
        if (devMode) {
          document.body.classList.add('developer-mode');
        } else {
          document.body.classList.remove('developer-mode');
        }
      } catch (error) {
        console.error('Error checking developer mode:', error);
      }
    };

    checkDeveloperMode();
    
    // Check periodically for changes
    const interval = setInterval(checkDeveloperMode, 2000);
    return () => {
      clearInterval(interval);
      document.body.classList.remove('developer-mode');
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="developer-bar">
      <span className="developer-text">🛠️ Pracujesz w trybie developera</span>
    </div>
  );
};

export default DeveloperBar;
