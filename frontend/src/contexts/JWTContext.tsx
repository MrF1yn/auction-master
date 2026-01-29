import React, { createContext, useEffect, useReducer } from 'react';
import { jwtDecode } from 'jwt-decode';

import { LOGIN, LOGOUT } from 'contexts/auth-reducer/actions';
import authReducer from 'contexts/auth-reducer/auth';

import BackendWakeupLoader from 'components/BackendWakeupLoader';
import axios from 'utils/axios';
import { KeyedObject } from 'types/root';
import { AuthProps, JWTContextType } from 'types/auth';

const initialState: AuthProps = {
  isLoggedIn: false,
  isInitialized: false,
  user: null
};

const verifyToken: (st: string) => boolean = (serviceToken) => {
  if (!serviceToken) return false;
  try {
    const decoded: KeyedObject = jwtDecode(serviceToken);
    return decoded.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};

const setSession = (serviceToken?: string | null) => {
  if (serviceToken) {
    localStorage.setItem('serviceToken', serviceToken);
    axios.defaults.headers.common.Authorization = `Bearer ${serviceToken}`;
  } else {
    localStorage.removeItem('serviceToken');
    delete axios.defaults.headers.common.Authorization;
  }
};

const JWTContext = createContext<JWTContextType | null>(null);

export const JWTProvider = ({ children }: { children: React.ReactElement }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const init = async () => {
      try {
        const serviceToken = window.localStorage.getItem('serviceToken');
        if (serviceToken && verifyToken(serviceToken)) {
          setSession(serviceToken);

          const response = await axios.get('/api/account/me');

          if (response.data.success) {
            const { user } = response.data.data;
            dispatch({
              type: LOGIN,
              payload: { isLoggedIn: true, user }
            });
          } else {
            setSession(null);
            dispatch({ type: LOGOUT });
          }
        } else {
          setSession(null);
          dispatch({ type: LOGOUT });
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setSession(null);
        dispatch({ type: LOGOUT });
      }
    };

    init();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await axios.post('/api/account/login', { email, password });

    if (!response.data.success) {
      throw new Error(response.data.errorMessage || 'Login failed');
    }

    const { serviceToken, user } = response.data.data;
    setSession(serviceToken);

    dispatch({
      type: LOGIN,
      payload: { isLoggedIn: true, user }
    });
  };

  const register = async (email: string, password: string, username: string, fullName: string) => {
    const response = await axios.post('/api/account/register', {
      email,
      password,
      username,
      fullName
    });

    if (!response.data.success) {
      throw new Error(response.data.errorMessage || 'Registration failed');
    }

    // Auto-login after successful registration
    const { serviceToken, user } = response.data.data;
    setSession(serviceToken);

    dispatch({
      type: LOGIN,
      payload: { isLoggedIn: true, user }
    });

    return response.data;
  };

  const logout = async () => {
    try {
      await axios.post('/api/account/logout');
    } catch (err) {
      console.error('Logout API error:', err);
    }

    setSession(null);
    dispatch({ type: LOGOUT });
  };

  const resetPassword = async (email: string) => {
    console.log('Password reset requested for:', email);
  };

  const updateProfile = () => {};

  if (state.isInitialized !== undefined && !state.isInitialized) {
    return <BackendWakeupLoader />;
  }

  return <JWTContext value={{ ...state, login, logout, register, resetPassword, updateProfile }}>{children}</JWTContext>;
};

export default JWTContext;
