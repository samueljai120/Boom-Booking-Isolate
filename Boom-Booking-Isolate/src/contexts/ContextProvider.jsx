/**
 * Unified Context Provider
 * 
 * This consolidates all context providers into a single, optimized provider
 * to reduce the provider nesting and improve performance.
 */

import React from 'react';
import { AuthProvider } from './SimplifiedAuthContext';
import { TenantProvider } from './SimplifiedTenantContext';
import { WebSocketProvider } from './UnifiedWebSocketContext';
import { SettingsProvider } from './SettingsContext';
import { BusinessHoursProvider } from './BusinessHoursContext';
import { BusinessInfoProvider } from './BusinessInfoContext';
import { TutorialProvider } from './TutorialContext';

/**
 * Unified Context Provider Component
 * 
 * This component wraps all context providers in the correct order
 * to ensure proper dependency resolution and optimal performance.
 */
export const UnifiedContextProvider = ({ children }) => {
  return (
    <AuthProvider>
      <TenantProvider>
        <WebSocketProvider>
          <SettingsProvider>
            <BusinessHoursProvider>
              <BusinessInfoProvider>
                <TutorialProvider>
                  {children}
                </TutorialProvider>
              </BusinessInfoProvider>
            </BusinessHoursProvider>
          </SettingsProvider>
        </WebSocketProvider>
      </TenantProvider>
    </AuthProvider>
  );
};

/**
 * Context Provider Order Explanation:
 * 
 * 1. AuthProvider - Base authentication (no dependencies)
 * 2. TenantProvider - Tenant management (depends on auth)
 * 3. WebSocketProvider - Real-time communication (depends on tenant)
 * 4. SettingsProvider - Application settings (no dependencies)
 * 5. BusinessHoursProvider - Business hours (no dependencies)
 * 6. BusinessInfoProvider - Business information (no dependencies)
 * 7. TutorialProvider - Tutorial system (no dependencies)
 * 
 * This order ensures that:
 * - Authentication is available to all other providers
 * - Tenant context is available to WebSocket provider
 * - All providers are available to components
 * - No circular dependencies exist
 */

export default UnifiedContextProvider;
