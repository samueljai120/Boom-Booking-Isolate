/**
 * Simplified Tenant Context
 * 
 * This provides clean tenant management without complex fallback systems.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const TenantContext = createContext();

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

export const TenantProvider = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Default demo tenant for development
  const DEFAULT_TENANT = {
    id: '5ba3b120-e288-450d-97f2-cfc236e0894f',
    name: 'Demo Company',
    subdomain: 'demo',
    domain: 'demo.boombooking.com',
    plan_type: 'premium',
    status: 'active',
    settings: {
      timezone: 'America/New_York',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h'
    }
  };

  // Initialize tenant context
  useEffect(() => {
    const initTenant = () => {
      try {
        setLoading(true);
        
        // Try to get tenant from localStorage
        const storedTenant = localStorage.getItem('currentTenant');
        
        if (storedTenant) {
          const tenant = JSON.parse(storedTenant);
          setCurrentTenant(tenant);
        } else {
          // Use default tenant for demo
          setCurrentTenant(DEFAULT_TENANT);
          localStorage.setItem('currentTenant', JSON.stringify(DEFAULT_TENANT));
        }
      } catch (error) {
        console.error('Error initializing tenant:', error);
        // Fallback to default tenant
        setCurrentTenant(DEFAULT_TENANT);
        localStorage.setItem('currentTenant', JSON.stringify(DEFAULT_TENANT));
      } finally {
        setLoading(false);
      }
    };

    initTenant();
  }, []);

  const switchTenant = (tenant) => {
    try {
      setCurrentTenant(tenant);
      localStorage.setItem('currentTenant', JSON.stringify(tenant));
      console.log('✅ Tenant switched to:', tenant.name);
    } catch (error) {
      console.error('Error switching tenant:', error);
    }
  };

  const clearTenant = () => {
    setCurrentTenant(null);
    localStorage.removeItem('currentTenant');
  };

  const value = {
    // State
    currentTenant,
    loading,
    isTenantSelected: !!currentTenant,
    
    // Actions
    switchTenant,
    clearTenant,
    
    // Computed
    tenantId: currentTenant?.id,
    tenantName: currentTenant?.name,
    tenantSettings: currentTenant?.settings || {}
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};