import { useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthCallbackHandler = () => {
  const location = useLocation();
  const navigate = useNavigate(); 
  const { login, oauthStateKey } = useContext(AuthContext);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const expectedState = sessionStorage.getItem(oauthStateKey);

    if (!code || !state || state !== expectedState) {
      console.error('GitHub OAuth callback state validation failed.');
      navigate('/admin', { replace: true });
      return;
    }

    sessionStorage.removeItem(oauthStateKey);

    fetch('/api/github/oauth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirectUri: `${window.location.origin}/auth/callback`,
      }),
    })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'GitHub token exchange failed');
        }
        return data;
      })
      .then(data => login(data.accessToken))
      .then(() => navigate('/admin', { replace: true }))
      .catch(error => {
        console.error('GitHub login failed:', error);
        navigate('/admin', { replace: true });
      });
  }, [location.search, login, navigate, oauthStateKey]);

  return null;
};

export default AuthCallbackHandler;
