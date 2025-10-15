import React from 'react';
import SushiSwapReact from './SushiSwapReact';
import AlexAdmin from './components/AlexAdmin';
import './SushiSwapReact.css';

function App() {
  // Перевіряємо чи поточний шлях /alex
  const isAlexRoute = window.location.pathname === '/alex';
  
  console.log('App.js: Current path:', window.location.pathname);
  console.log('App.js: Is Alex route:', isAlexRoute);
  
  return (
    <div className="App">
      {isAlexRoute ? <AlexAdmin /> : <SushiSwapReact />}
    </div>
  );
}

export default App;
