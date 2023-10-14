// AuthLoginButton.js
import React, { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { Button, Avatar } from 'antd';
import { GithubOutlined } from '@ant-design/icons';
//import 'antd/dist/antd.css';


function AuthLoginButton() {
    const { authState, initiateOAuth, logout } = useContext(AuthContext);
  
    if (!authState) {
      return (
        <Button 
          type="primary" 
          icon={<GithubOutlined />} 
          onClick={initiateOAuth}
        >
          GitHub OAuth Login
        </Button>
      );  
    }
  
    return (
        <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GithubOutlined style={{ fontSize: '24px' }} />
            {authState.username} ({authState.level})
            <Button onClick={logout}>Logout</Button>
        </div>
    );
  }
  
  export default AuthLoginButton;
  