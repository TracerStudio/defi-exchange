import React from 'react';
import AdminPanel from './AdminPanel';
import '../SushiSwapReact.css';

const AlexAdmin = () => {
  console.log('AlexAdmin: Component rendered');
  
  return (
    <div className="alex-admin">
      <AdminPanel />
    </div>
  );
};

export default AlexAdmin;
