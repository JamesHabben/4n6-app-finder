import React, { useState, useContext, useEffect  } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { AuthContext  } from 'AuthContext';
import { DataContext } from 'services/DataContext';
//import { AuthLogin } from './AuthLogin';
import AuthLoginButton from 'AuthLoginButton';
import AppsListContent from 'components/adminComponents/AppsListContent'
import ToolsListContent from 'components/adminComponents/ToolsListContent'
import ToolsArtifactsListContent from 'components/adminComponents/ToolsArtifactsListContent';
import GitHubFunctionsContent from 'components/adminComponents/GitHubFunctionsContent'


  

function PageAdmin() {
  //const { apps, tools } = useContext(DataContext);
  const [selectedItem, setSelectedItem] = useState(null);
  const { authState} = useContext(AuthContext);

  const items = [
    { path: 'tools', name: 'Tools List' },
    { path: 'apps', name: 'Core Apps List' },
    { path: 'artifacts', name: 'Tools Artifacts List' },
    { path: 'github', name: '[Priv] GitHub Functions', needPriv: true },
  ];

  const filteredItems = items.filter(item => {
    //console.log(authState)
    return !item.needPriv || (item.needPriv && authState && authState.level !== 'public');
  });

  const onItemClick = (item) => {
    setSelectedItem(item);
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <h1 className='pageTitle'>Admin</h1>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginRight: '30px', marginBottom: '10px' }}>
            <AuthLoginButton/>
        </div>
        <div style={{ display: 'flex', border: '1px solid #ccc', textAlign: 'left', flex: 1 }}>
            {/* Left column for items */}
            <div style={{ flex: '0 0 15%', padding: '1rem', borderRight: '1px solid #ccc' }}>
                <h2>Pages</h2>
                <ul>
                    {filteredItems.map((item) => (
                        <li key={item.path}>
                            <Link to={`/admin/${item.path}`}>{item.name}</Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Right column for content */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1rem' }}>
                <Outlet />
            </div>
        </div>
    </div>
  );
}

export default PageAdmin;
