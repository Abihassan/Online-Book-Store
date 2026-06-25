import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { db } from './lib/database'; // 👈 ADD THIS

db.initializeDatabase(); // 👈 INITIALIZE DATABASE ON APP START

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
