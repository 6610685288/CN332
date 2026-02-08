import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Importing components
import LandingPage from './components/LandingPage';
import ElderlyPage from './components/ElderlyPage';
import BookingPage from './components/BookingPage'; // New component

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Routes for each page */}
          <Route path="/" element={<LandingPage />} /> {/* Home page */}
          <Route path="/elderly-dashboard" element={<ElderlyPage />} /> {/* Elderly dashboard */}
          <Route path="/booking" element={<BookingPage />} /> {/* Booking page */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
