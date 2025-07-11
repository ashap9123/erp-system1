import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    if (token) {
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setIsAdmin(false);
        return;
      }

      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setUser(response.data);
      setIsAdmin(response.data.role === 'admin');
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      setIsAdmin(user.role === 'admin');

      // Set default axios authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(error.response.data.message || 'Invalid credentials');
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server. Please check your internet connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error('An error occurred. Please try again.');
      }
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        name,
        email,
        password,
        role
      });

      // Don't automatically log in the user
      return response.data.user;
    } catch (error) {
      console.error('Registration failed:', error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Registration failed');
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection.');
      } else {
        throw new Error('An error occurred. Please try again.');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAdmin(false);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    loading,
    isAdmin,
    isAuthenticated: !!user,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 