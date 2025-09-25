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
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize tenant context
  useEffect(() => {
    const initTenant = async () => {
      try {
        // Check if tenant is stored in localStorage
        const storedTenant = localStorage.getItem('currentTenant');
        const storedTenantId = localStorage.getItem('currentTenantId');
        
        if (storedTenant && storedTenantId) {
          try {
            const tenant = JSON.parse(storedTenant);
            setCurrentTenant(tenant);
            console.log('🏢 Loaded tenant from storage:', tenant.name);
          } catch (error) {
            console.error('Error parsing stored tenant:', error);
            localStorage.removeItem('currentTenant');
            localStorage.removeItem('currentTenantId');
          }
        }

        // Fetch available tenants
        await fetchTenants();
      } catch (error) {
        console.error('Error initializing tenant context:', error);
      } finally {
        setLoading(false);
      }
    };

    initTenant();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/tenants');
      const result = await response.json();
      
      if (result.success) {
        setTenants(result.data);
        console.log('🏢 Loaded tenants:', result.data.length);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const switchTenant = async (tenant) => {
    try {
      setCurrentTenant(tenant);
      
      // Store tenant in localStorage for persistence
      localStorage.setItem('currentTenant', JSON.stringify(tenant));
      localStorage.setItem('currentTenantId', tenant.id);
      
      console.log('🏢 Switched to tenant:', tenant.name);
      
      // Reload the page to apply new tenant context
      window.location.reload();
    } catch (error) {
      console.error('Error switching tenant:', error);
    }
  };

  const getTenantId = () => {
    return currentTenant?.id || 'demo';
  };

  const getTenantSlug = () => {
    return currentTenant?.slug || 'demo';
  };

  const isMultiTenant = () => {
    return tenants.length > 1;
  };

  const value = {
    currentTenant,
    tenants,
    loading,
    switchTenant,
    getTenantId,
    getTenantSlug,
    isMultiTenant,
    fetchTenants
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};
