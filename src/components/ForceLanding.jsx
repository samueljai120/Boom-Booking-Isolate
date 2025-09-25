import React from 'react';

const ForceLanding = () => {
  // Clear any stored authentication
  React.useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f0f9ff',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ 
          fontSize: '4rem', 
          color: '#1e40af', 
          marginBottom: '1rem',
          fontWeight: 'bold'
        }}>
          🎤 Boom Karaoke
        </h1>
        <p style={{ 
          fontSize: '1.5rem', 
          color: '#374151', 
          marginBottom: '2rem' 
        }}>
          Staff Booking System
        </p>
        <div style={{ 
          backgroundColor: '#dcfce7', 
          border: '2px solid #16a34a', 
          color: '#166534',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          ✅ Landing Page is Working!
        </div>
        <div style={{ 
          fontSize: '0.875rem', 
          color: '#6b7280',
          marginTop: '1rem'
        }}>
          Current URL: {window.location.href}
        </div>
        <div style={{ 
          fontSize: '0.875rem', 
          color: '#6b7280',
          marginTop: '0.5rem'
        }}>
          Timestamp: {new Date().toLocaleString()}
        </div>
        <div style={{ 
          fontSize: '0.875rem', 
          color: '#6b7280',
          marginTop: '0.5rem'
        }}>
          Auth cleared: {localStorage.length === 0 ? 'Yes' : 'No'}
        </div>
      </div>
    </div>
  );
};

export default ForceLanding;
