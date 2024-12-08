import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './hooks/useToast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Swap from './pages/Swap';
import Vaults from './pages/Vaults';
import TransactionHistory from './components/TransactionHistory';
import Toast from './components/Toast';
import './styles/responsive.css';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <div className="app">
            <Navbar />
            <main className="container">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/swap" element={<Swap />} />
                <Route path="/vaults" element={<Vaults />} />
                <Route path="/history" element={<TransactionHistory />} />
              </Routes>
            </main>
            <Toast />
          </div>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App; 