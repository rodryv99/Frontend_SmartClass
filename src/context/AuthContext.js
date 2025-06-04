import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar si hay un token almacenado
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('access_token');
      const user = localStorage.getItem('user');
      
      if (token && user) {
        try {
          const userData = JSON.parse(user);
          console.log("Usuario recuperado del localStorage:", userData);
          setCurrentUser(userData);
        } catch (err) {
          console.error("Error al parsear los datos de usuario:", err);
          localStorage.removeItem('user');
        }
      }
      
      setLoading(false);
    };
    
    checkLoggedIn();
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      const data = await authService.login(username, password);
      
      // Información de depuración
      console.log("Respuesta de login:", data);
      console.log("Datos de usuario:", data.user);
      
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setCurrentUser(data.user);
      return data.user;
    } catch (err) {
      console.error("Error durante el login:", err);
      setError(err.response?.data?.error || 'Error al iniciar sesión');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const data = await authService.registerStudent(userData);
      
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setCurrentUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};