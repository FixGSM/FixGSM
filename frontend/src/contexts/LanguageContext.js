import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import roTranslations from '../translations/ro.json';
import enTranslations from '../translations/en.json';

const LanguageContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const translations = {
  ro: roTranslations,
  en: enTranslations
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('ro'); // Default Romanian
  const [loading, setLoading] = useState(true);

  // Fetch tenant language preference on mount
  useEffect(() => {
    const fetchLanguage = async () => {
      const token = localStorage.getItem('fixgsm_token');
      const userType = localStorage.getItem('fixgsm_user_type');
      
      // Only fetch for tenant/employee, not admin
      if (token && userType !== 'admin') {
        try {
          const response = await axios.get(`${BACKEND_URL}/api/tenant/language`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setLanguage(response.data.language || 'ro');
        } catch (error) {
          console.error('Error fetching language:', error);
          // Keep default 'ro'
        }
      }
      setLoading(false);
    };

    fetchLanguage();
  }, []);

  const changeLanguage = async (newLanguage) => {
    const token = localStorage.getItem('fixgsm_token');
    const userType = localStorage.getItem('fixgsm_user_type');
    
    if (token && userType !== 'admin') {
      try {
        await axios.put(
          `${BACKEND_URL}/api/tenant/language`,
          { language: newLanguage },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLanguage(newLanguage);
      } catch (error) {
        console.error('Error changing language:', error);
        throw error;
      }
    } else {
      // For admin or no token, just change locally
      setLanguage(newLanguage);
    }
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, loading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

