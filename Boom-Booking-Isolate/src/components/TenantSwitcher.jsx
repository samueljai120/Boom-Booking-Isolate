import React, { useState } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { ChevronDown, Building2, Check } from 'lucide-react';

const TenantSwitcher = () => {
  const { currentTenant, tenants, switchTenant, isMultiTenant } = useTenant();
  const [isOpen, setIsOpen] = useState(false);

  if (!isMultiTenant()) {
    return null; // Don't show switcher if only one tenant
  }

  const handleTenantSelect = (tenant) => {
    switchTenant(tenant);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Building2 className="w-4 h-4" />
        <span className="truncate max-w-32">
          {currentTenant?.name || 'Select Tenant'}
        </span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Switch Tenant
            </div>
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => handleTenantSelect(tenant)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <div className="text-left">
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-xs text-gray-500">{tenant.slug}</div>
                  </div>
                </div>
                {currentTenant?.id === tenant.id && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantSwitcher;