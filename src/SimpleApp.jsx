import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ForceLanding from './components/ForceLanding';

const SimpleApp = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ForceLanding />} />
        <Route path="*" element={<ForceLanding />} />
      </Routes>
    </Router>
  );
};

export default SimpleApp;
