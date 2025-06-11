import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [secretIdentifyText, setSecretIdentifyText] = useState(
    localStorage.getItem('SECRET_IDENTIFY_TEXT') || ''
  );

  useEffect(() => {
    if (secretIdentifyText) {
      localStorage.setItem('SECRET_IDENTIFY_TEXT', secretIdentifyText);
    } else {
      localStorage.removeItem('SECRET_IDENTIFY_TEXT');
    }
  }, [secretIdentifyText]);

  const login = (text) => {
    setSecretIdentifyText(text);
  };

  const logout = () => {
    setSecretIdentifyText('');
  };

  return (
    <AuthContext.Provider value={{ secretIdentifyText, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
