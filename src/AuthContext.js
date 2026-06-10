import React, { createContext, useCallback, useState } from 'react';
import { githubService } from 'services/githubService';

export const AuthContext = createContext();
const oauthStateKey = 'github-oauth-state';

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState(null);

    // useEffect(() => {
    //     console.log('auth state (useEffect):', authState);
    // }, [authState]); 

    const initiateOAuth = () => {
        const clientId = process.env.REACT_APP_GITHUB_CLIENT_ID;
        if (!clientId) {
            console.error('GitHub OAuth client ID is not configured.');
            return;
        }

        const redirectUri = `${window.location.origin}/auth/callback`;
        const state = crypto.randomUUID();
        sessionStorage.setItem(oauthStateKey, state);

        const authUrl = new URL('https://github.com/login/oauth/authorize');
        authUrl.search = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            state,
        }).toString();

        window.location.href = authUrl.toString();
    };
      
    const login = useCallback(async (token) => {
        // Fetch user data
        //console.log("token: " + token)
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
        //console.log("auth state (login): " + authState)
    }, []);

  const logout = () => {
    setAuthState(null);
  };

  return (
    <AuthContext.Provider value={{ authState, initiateOAuth, login, logout, oauthStateKey }}>
      {children}
    </AuthContext.Provider>
  );
};
