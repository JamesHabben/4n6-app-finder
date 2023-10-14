import React, { createContext, useState, useEffect  } from 'react';
import { githubService } from 'services/githubService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState(null);

    useEffect(() => {
        console.log('auth state (useEffect):', authState);
    }, [authState]); 

    const initiateOAuth = () => {
        const redirectUri = encodeURIComponent(
            process.env.NODE_ENV === 'development'
                ? 'http://localhost:3000/auth/callback'
                : 'https://4n6appfinder.habben.net/auth/callback'
        );
    
        let authUrl = '';
        if (process.env.NODE_ENV === 'development') {
            authUrl = `https://github.com/login/oauth/authorize?client_id=Iv1.d6703f6d45b020d7&scope=user&response_type=code&redirect_uri=${redirectUri}`;
        } else {
            authUrl = `https://github.com/login/oauth/authorize?client_id=Iv1.0b83354237060759&scope=user&response_type=code&redirect_uri=${redirectUri}`;
        }
    
        window.location.href = authUrl;  // This will redirect the user to GitHub's OAuth authorization page
    };
      
    const login = async (token) => {
        // Fetch user data
        console.log("token: " + token)
        const response = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await response.json();

        const ghservice = githubService(token);
        const userLevel = await ghservice.checkUserElevation(userData.login);

        // Update auth state with token and user data
        setAuthState({
            token,
            username: userData.login,
            avatarUrl: userData.avatar_url,
            level: userLevel
        });
        console.log("auth state (login): " + authState)
    };

  const logout = () => {
    setAuthState(null);
  };

  return (
    <AuthContext.Provider value={{ authState, initiateOAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
