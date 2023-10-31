import React, { useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthCallbackHandler = () => {
  const location = useLocation();
  const navigate = useNavigate(); 
  const { login } = useContext(AuthContext);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');

    if (code) {
      // Exchange the authorization code for an access token
      // This should be done on your server to keep your client secret secure
      const functionUrl = process.env.NODE_ENV === 'development'
        ? 'https://4af-github-token-swap-dev.azurewebsites.net/api/HttpTrigger1?code=IYronc0gLGwpvbtxYon23sOPjR8eHr1Ax-_EWstzaR07AzFu71G5fQ=='
        : 'https://4af-github-token-swap.azurewebsites.net/api/HttpTrigger1?code=PIRpHF69JbGRhDogNVi65jl3SQoyandkIlbGAHA9J20DAzFuqROwNQ==';

        fetch(functionUrl, {
            method: 'POST', 
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          })
            .then(response => {
                console.log(response);
                if (!response.ok) {
                // Handle HTTP errors
                throw new Error('Network response was not ok ' + response.statusText);
              }
              return response.json();
            })
            .then(data => {
                //console.log('Response data:', data);
                const token = data.accessToken;
                login(token); 
                navigate('/admin');
            })
            .catch(error => {
              console.error('There was a problem with the fetch operation:', error);
            });
        }
      }, [location, login, navigate]);

  return null;
};

export default AuthCallbackHandler;
