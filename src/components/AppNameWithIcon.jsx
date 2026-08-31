import React from 'react';

export function CatalogAppIcon({ icon }) {
  if (icon) {
    return (
      <img
        className="catalog-app-icon"
        src={`/app-icons/${icon}`}
        alt=""
      />
    );
  }
  return <span className="catalog-app-icon-slot" aria-hidden />;
}

function AppNameWithIcon({ icon, children }) {
  return (
    <span className="app-name-with-icon">
      <CatalogAppIcon icon={icon} />
      {children}
    </span>
  );
}

export default AppNameWithIcon;
