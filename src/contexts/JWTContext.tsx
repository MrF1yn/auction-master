import React, { createContext, useEffect, useReducer } from 'react';

// third-party
import { jwtDecode } from 'jwt-decode';

// reducer - state management
import { LOGIN, LOGOUT } from 'contexts/auth-reducer/actions';
import authReducer from 'contexts/auth-reducer/auth';

// project imports
import Loader from 'components/Loader';
import axios from 'utils/axios';
import { KeyedObject } from 'types/root';
import { AuthProps, JWTContextType } from 'types/auth';

// constant
const initialState: AuthProps = {
  isLoggedIn: false,
  isInitialized: false,
  user: null
};

const verifyToken: (st: string) => boolean = (serviceToken) => {
  if (!serviceToken) {
    return false;
  }
  try {
    const decoded: KeyedObject = jwtDecode(serviceToken);
    // Check if token is expired
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

// ==============================|| JWT CONTEXT & PROVIDER ||============================== //

const JWTContext = createContext<JWTContextType | null>(null);

export const JWTProvider = ({ children }: { children: React.ReactElement }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const init = async () => {
      try {
        const serviceToken = window.localStorage.getItem('serviceToken');
        if (serviceToken && verifyToken(serviceToken)) {
          setSession(serviceToken);

          // Fetch current user profile from backend
          const response = await axios.get('/api/account/me');

          if (response.data.success) {
            const { user } = response.data.data;
            dispatch({
              type: LOGIN,
              payload: {
                isLoggedIn: true,
                user
              }
            });
          } else {
            // Token valid but user fetch failed - logout
            setSession(null);
            dispatch({ type: LOGOUT });
          }
        } else {
          // No token or invalid token
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

  // Login with email and password
  const login = async (email: string, password: string) => {
    const response = await axios.post('/api/account/login', { email, password });

    if (!response.data.success) {
      throw new Error(response.data.errorMessage || 'Login failed');
    }

    const { serviceToken, user } = response.data.data;
    setSession(serviceToken);

    dispatch({
      type: LOGIN,
      payload: {
        isLoggedIn: true,
        user
      }
    });
  };

  // Register new user (params: email, password, username, fullName)
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

    // Registration successful - user needs to login
    // We don't auto-login after registration for security reasons
    return response.data;
  };

  // Logout user
  const logout = async () => {
    try {
      // Call backend logout to blacklist the token
      await axios.post('/api/account/logout');
    } catch (err) {
      // Even if backend logout fails, clear local session
      console.error('Logout API error:', err);
    }

    setSession(null);
    dispatch({ type: LOGOUT });
  };

  // Reset password placeholder
  const resetPassword = async (email: string) => {
    // TODO: Implement password reset functionality
    console.log('Password reset requested for:', email);
  };

  // Update profile placeholder
  const updateProfile = () => {
    // TODO: Implement profile update functionality
  };

  if (state.isInitialized !== undefined && !state.isInitialized) {
    return <Loader />;
  }

  return <JWTContext value={{ ...state, login, logout, register, resetPassword, updateProfile }}>{children}</JWTContext>;
};

export default JWTContext;
