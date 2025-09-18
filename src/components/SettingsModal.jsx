import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { useSettings } from '../contexts/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import CustomSelect from './ui/CustomSelect';
import RoomManagement from './RoomManagement';
import BookingManagement from './BookingManagement';
import BusinessHoursSettings from './BusinessHoursSettings';
import { 
  X, 
  RotateCcw, 
  Layout, 
  Clock, 
  Palette, 
  Calendar,
  Monitor,
  Smartphone,
  Settings as SettingsIcon,
  Home,
  Users,
  BookOpen,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

const SettingsModal = ({ isOpen, onClose }) => {
  // Always call hooks in the same order
  const { settings, updateSetting, toggleLayoutOrientation, resetSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('layout');
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  // Close on Escape key (attach only when open)
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // Reset dragging state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsDraggingSlider(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'layout', label: 'Layout', icon: Layout },
    { id: 'business-hours', label: 'Business Hours', icon: Clock },
    { id: 'rooms', label: 'Rooms', icon: Home },
    { id: 'bookings', label: 'Bookings', icon: BookOpen },
    { id: 'form', label: 'Form Fields', icon: SettingsIcon },
    { id: 'display', label: 'Display', icon: Palette },
  ];

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-300 ${
        isDraggingSlider 
          ? 'bg-black bg-opacity-20' 
          : 'bg-black bg-opacity-50'
      }`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <Card 
        className={`w-full max-w-6xl max-h-[90vh] relative transition-all duration-300 ${
          isDraggingSlider 
            ? 'bg-white bg-opacity-20 backdrop-blur-sm border-opacity-30' 
            : 'bg-white'
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Exit Button - Top Right Corner */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className={`absolute top-4 right-4 h-12 w-12 z-10 border border-gray-200 shadow-lg transition-all duration-300 ${
            isDraggingSlider 
              ? 'bg-white bg-opacity-30 hover:bg-gray-100 hover:bg-opacity-50' 
              : 'bg-white hover:bg-gray-100'
          }`}
        >
          <X className="h-8 w-8 font-bold text-gray-700" />
        </Button>
        <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-4 transition-all duration-300 ${
          isDraggingSlider ? 'opacity-30' : 'opacity-100'
        }`}>
          <CardTitle className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5" />
            <span>Settings</span>
          </CardTitle>
        </CardHeader>

        <div className={`flex h-[70vh] transition-all duration-300 ${
          isDraggingSlider ? 'opacity-30' : 'opacity-100'
        }`}>
          {/* Sidebar */}
          <div className={`w-64 border-r border-gray-200 p-4 transition-all duration-300 ${
            isDraggingSlider ? 'bg-gray-50 bg-opacity-30' : 'bg-gray-50'
          }`}>
            <nav className="space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className={`flex-1 overflow-y-auto transition-all duration-300 ${
            isDraggingSlider ? 'opacity-30' : 'opacity-100'
          }`}>
            <CardContent className={`p-6 transition-all duration-300 ${
              isDraggingSlider ? 'bg-white bg-opacity-20' : 'bg-white'
            }`}>
              {activeTab === 'layout' && <LayoutSettings currentLayout={settings.layoutOrientation} setIsDraggingSlider={setIsDraggingSlider} />}
              {activeTab === 'business-hours' && <BusinessHoursSettings />}
              {activeTab === 'rooms' && <RoomManagement />}
              {activeTab === 'bookings' && <BookingManagement />}
              {activeTab === 'form' && <BookingFormSettings />}
              {activeTab === 'display' && <DisplaySettings />}
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Layout Settings Component
const LayoutSettings = ({ currentLayout, setIsDraggingSlider }) => {
  const { settings, updateSetting, toggleLayoutOrientation, updateLayoutSlotSetting, resetSettings } = useSettings();
  const notifyApplied = () => toast.success('Settings applied', { id: 'settings-applied', duration: 900 });

  // Calculate exact slot dimensions matching the actual schedule grid logic
  const getActualSlotDimensions = () => {
    // Use the exact same logic as TraditionalSchedule.jsx
    const widthMap = {
      'tiny': 20,
      'small': 40,
      'medium': 60,
      'large': 80,
      'huge': 100
    };
    const heightMap = {
      'tiny': 50,
      'small': 70,
      'medium': 90,
      'large': 130,
      'huge': 160
    };
    
  // Use custom width if available, otherwise fall back to preset width
  const customWidth = settings?.horizontalLayoutSlots?.customWidth;
  const baseSlotWidth = customWidth || 60;
  
  // Use custom height if available, otherwise fall back to mapped height
  const customHeight = settings?.horizontalLayoutSlots?.customHeight;
  const baseSlotHeight = customHeight || heightMap[settings?.horizontalLayoutSlots?.slotHeight] || 90;
  
  // When using custom width, don't apply scale factor - use the custom value directly
  const widthScaleFactor = customWidth ? 1.0 : (settings?.horizontalLayoutSlots?.widthScaleFactor || 0.4);
  // When using custom height, don't apply scale factor - use the custom value directly
  const heightScaleFactor = customHeight ? 1.0 : (settings?.horizontalLayoutSlots?.heightScaleFactor || 1.0);
    
    // Calculate responsive slot width (exact copy from TraditionalSchedule)
    const getResponsiveSlotWidth = () => {
      const minWidth = Math.max(1, baseSlotWidth * widthScaleFactor);
      
      // Calculate available width for time slots
      const availableWidth = (typeof window !== 'undefined' ? window.innerWidth : 1200) - 200; // Account for room column and padding
      const timeInterval = settings.timeInterval || 15;
      
      // Use actual business hours calculation (same as TraditionalSchedule)
      // Default to 12 hours if business hours not available
      const businessHours = settings.businessHours?.openTime && settings.businessHours?.closeTime ? 
        (() => {
          const [openHour, openMinute] = settings.businessHours.openTime.split(':').map(Number);
          const [closeHour, closeMinute] = settings.businessHours.closeTime.split(':').map(Number);
          
          // Handle late night hours (close time is next day)
          const isLateNight = closeHour < openHour || (closeHour === openHour && closeMinute < openMinute);
          
          if (isLateNight) {
            // Late night: from open time to close time next day
            return (24 - openHour) + closeHour + ((60 - openMinute + closeMinute) / 60);
          } else {
            // Normal hours: from open time to close time same day
            return closeHour - openHour + ((closeMinute - openMinute) / 60);
          }
        })() : 12; // Fallback to 12 hours
      
      const timeSlotsCount = Math.ceil((businessHours * 60) / timeInterval);
      
      if (timeSlotsCount === 0) {
        return minWidth;
      }
      
      // Calculate optimal width based on available space
      const optimalWidth = availableWidth / timeSlotsCount;
      
      // For tiny/small settings, allow more compression
      // Also consider custom width - use much less compression for custom values
      const compressionThreshold = customWidth ? 
        0.95 : // Use 95% of custom width (much less compression)
        (settings.horizontalLayoutSlots?.slotWidth === 'tiny' ? 0.6 : 
         settings.horizontalLayoutSlots?.slotWidth === 'small' ? 0.7 : 0.8);
      
      // Use the larger of: user preference or calculated optimal width (with compression)
      const finalWidth = Math.max(
        minWidth, 
        Math.round(optimalWidth * compressionThreshold)
      );
      
      return finalWidth;
    };

    // Calculate responsive slot height (exact copy from TraditionalSchedule)
    const getResponsiveSlotHeight = () => {
      // If custom height is set, use it directly (respect user's choice)
      if (customHeight) {
        return Math.max(1, customHeight);
      }
      
      const minHeight = Math.max(1, baseSlotHeight * heightScaleFactor);
      
      // Calculate available height for room rows
      const availableHeight = (typeof window !== 'undefined' ? window.innerHeight : 800) - 200; // Account for headers and padding
      const roomsCount = 4; // Simulate 4 rooms for preview
      
      if (roomsCount === 0) {
        return minHeight;
      }
      
      // Calculate optimal height based on available space
      const optimalHeight = availableHeight / roomsCount;
      
      // For smaller heights, allow more compression
      const compressionThreshold = baseSlotHeight <= 50 ? 0.6 : 
                                  baseSlotHeight <= 80 ? 0.7 : 0.8;
      
      // Use the larger of: user preference or calculated optimal height (with compression)
      const finalHeight = Math.max(
        minHeight, 
        Math.round(optimalHeight * compressionThreshold)
      );
      
      return finalHeight;
    };

    return {
      width: getResponsiveSlotWidth(),
      height: getResponsiveSlotHeight()
    };
  };

  // Get actual dimensions for preview
  const actualDimensions = getActualSlotDimensions();

  return (
    <div className="space-y-8">
      {/* Layout Orientation */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Monitor className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Layout Orientation</h3>
        </div>
        <p className="text-sm text-gray-600">
          Choose how rooms and time are arranged in the schedule view.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vertical */}
          <div 
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              settings.layoutOrientation === 'rooms-x-time-y' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => { updateSetting('layoutOrientation', 'rooms-x-time-y'); notifyApplied(); }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Layout className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="font-medium">Vertical</h4>
              </div>
              {settings.layoutOrientation === 'rooms-x-time-y' && (
                <Badge className="bg-blue-500">Active</Badge>
              )}
            </div>
          </div>

          {/* Horizontal */}
          <div 
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              settings.layoutOrientation === 'rooms-y-time-x' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => { updateSetting('layoutOrientation', 'rooms-y-time-x'); notifyApplied(); }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-green-600" />
                </div>
                <h4 className="font-medium">Horizontal</h4>
              </div>
              {settings.layoutOrientation === 'rooms-y-time-x' && (
                <Badge className="bg-green-500">Active</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Default orientation selector */}
        <div className="mt-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Default orientation</label>
          <CustomSelect
            value={settings.defaultLayoutOrientation}
            onChange={(value) => { updateSetting('defaultLayoutOrientation', value); notifyApplied(); }}
            options={[
              { value: 'rooms-x-time-y', label: 'Vertical' },
              { value: 'rooms-y-time-x', label: 'Horizontal' }
            ]}
            placeholder="Select orientation"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { toggleLayoutOrientation(); notifyApplied(); }}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Switch Layout</span>
          </Button>
        </div>
      </div>

      {/* Time Format & Business Hours */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Time Format</h3>
        </div>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="timeFormat"
              value="12h"
              checked={settings.timeFormat === '12h'}
              onChange={(e) => { updateSetting('timeFormat', e.target.value); notifyApplied(); }}
              className="text-blue-600"
            />
            <span>12-hour (9:00 AM)</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="timeFormat"
              value="24h"
              checked={settings.timeFormat === '24h'}
              onChange={(e) => { updateSetting('timeFormat', e.target.value); notifyApplied(); }}
              className="text-blue-600"
            />
            <span>24-hour (09:00)</span>
          </label>
        </div>

        {/* Layout-Specific Slot Settings - Only show for current layout */}
        <div className="mt-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Slot Sizes for Current Layout</label>
          
          {/* Vertical Layout (rooms-x-time-y) - Only show if current layout is vertical */}
          {currentLayout === 'rooms-x-time-y' && (
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-800 mb-3">Vertical Layout (Rooms × Time)</h4>
              <p className="text-xs text-gray-600 mb-4">Control the size of time slots in the vertical schedule view. Height affects how much vertical space each time slot takes up.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">Time Slot Height</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { value: 'tiny', label: 'Tiny', description: '20px', color: 'bg-gray-100' },
                      { value: 'small', label: 'Small', description: '40px', color: 'bg-gray-200' },
                      { value: 'medium', label: 'Medium', description: '60px', color: 'bg-gray-300' },
                      { value: 'large', label: 'Large', description: '80px', color: 'bg-gray-400' },
                      { value: 'huge', label: 'Huge', description: '100px', color: 'bg-gray-500' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { updateLayoutSlotSetting('vertical', 'slotHeight', opt.value); notifyApplied(); }}
                        className={`p-3 border-2 rounded-lg text-center transition-all ${
                          settings.verticalLayoutSlots?.slotHeight === opt.value 
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                        type="button"
                      >
                        <div className={`w-full h-4 ${opt.color} rounded mb-2`}></div>
                        <div className="text-xs font-medium text-gray-700">{opt.label}</div>
                        <div className="text-xs text-gray-500">{opt.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Current Setting Display */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-gray-800">Current Setting</h5>
                      <p className="text-xs text-gray-600">
                        {settings.verticalLayoutSlots?.slotHeight === 'tiny' && 'Tiny (48px base)'}
                        {settings.verticalLayoutSlots?.slotHeight === 'small' && 'Small (72px base)'}
                        {settings.verticalLayoutSlots?.slotHeight === 'medium' && 'Medium (96px base)'}
                        {settings.verticalLayoutSlots?.slotHeight === 'large' && 'Large (112px base)'}
                        {settings.verticalLayoutSlots?.slotHeight === 'huge' && 'Huge (128px base)'}
                        {!settings.verticalLayoutSlots?.slotHeight && 'Medium (96px base)'}
                        <span className="text-gray-400 ml-1">• Auto-adjusts to screen</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Auto-adjusts to screen size</div>
                      <div className="text-xs text-gray-400">Changes apply immediately</div>
                    </div>
                  </div>
                </div>


                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 text-blue-600 mt-0.5">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-blue-800">Slot Height Tips</h5>
                      <ul className="text-xs text-blue-700 mt-1 space-y-1">
                        <li>• <strong>Tiny/Small:</strong> More time slots visible, compact view</li>
                        <li>• <strong>Medium:</strong> Balanced view, good for most use cases</li>
                        <li>• <strong>Large/Huge:</strong> Easier to read, better for touch interfaces</li>
                        <li>• Height automatically adjusts based on available screen space</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Horizontal Layout (rooms-y-time-x) - Only show if current layout is horizontal */}
          {currentLayout === 'rooms-y-time-x' && (
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-800 mb-3">Horizontal Layout (Time × Rooms)</h4>
              <p className="text-xs text-gray-600 mb-4">Control the size of time slots in the horizontal schedule view. Width affects how much horizontal space each time slot takes up.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">Time Slot Width</label>
                  <div className="space-y-4">
                    
                    {/* Custom Width Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Custom Width: {settings.horizontalLayoutSlots?.customWidth || 140}px → Actual: {actualDimensions.width}px</span>
                        <div className="flex space-x-2">
                          <button
                            onMouseDown={() => setIsDraggingSlider(true)}
                            onMouseUp={() => setIsDraggingSlider(false)}
                            onTouchStart={() => setIsDraggingSlider(true)}
                            onTouchEnd={() => setIsDraggingSlider(false)}
                            onClick={() => {
                              const newWidth = Math.max(1, (settings.horizontalLayoutSlots?.customWidth || 140) - 10);
                              updateLayoutSlotSetting('horizontal', 'customWidth', newWidth);
                              notifyApplied();
                            }}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
                            type="button"
                          >
                            -10px
                          </button>
                          <button
                            onMouseDown={() => setIsDraggingSlider(true)}
                            onMouseUp={() => setIsDraggingSlider(false)}
                            onTouchStart={() => setIsDraggingSlider(true)}
                            onTouchEnd={() => setIsDraggingSlider(false)}
                            onClick={() => {
                              const newWidth = Math.min(200, (settings.horizontalLayoutSlots?.customWidth || 140) + 10);
                              updateLayoutSlotSetting('horizontal', 'customWidth', newWidth);
                              notifyApplied();
                            }}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
                            type="button"
                          >
                            +10px
                          </button>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min="1"
                          max="200"
                          value={settings.horizontalLayoutSlots?.customWidth || 140}
                          onMouseDown={() => setIsDraggingSlider(true)}
                          onMouseUp={() => setIsDraggingSlider(false)}
                          onTouchStart={() => setIsDraggingSlider(true)}
                          onTouchEnd={() => setIsDraggingSlider(false)}
                          onChange={(e) => {
                            updateLayoutSlotSetting('horizontal', 'customWidth', parseInt(e.target.value));
                            notifyApplied();
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, #10b981 0%, #10b981 ${((settings.horizontalLayoutSlots?.customWidth || 140) - 1) / 199 * 100}%, #e5e7eb ${((settings.horizontalLayoutSlots?.customWidth || 140) - 1) / 199 * 100}%, #e5e7eb 100%)`
                          }}
                        />
                        {/* Live value indicator on slider */}
                        <div 
                          className="absolute top-0 transform -translate-x-1/2 pointer-events-none"
                          style={{
                            left: `${((settings.horizontalLayoutSlots?.customWidth || 140) - 1) / 199 * 100}%`,
                            top: '-8px'
                          }}
                        >
                          <div className="bg-green-600 text-white text-xs px-2 py-1 rounded shadow-sm whitespace-nowrap">
                            {actualDimensions.width}px
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>10px</span>
                        <span>200px</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">Time Slot Height</label>
                  <div className="space-y-4">
                    {/* Height Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Height: {settings.horizontalLayoutSlots?.customHeight || 90}px → Actual: {actualDimensions.height}px</span>
                        <div className="flex space-x-2">
                          <button
                            onMouseDown={() => setIsDraggingSlider(true)}
                            onMouseUp={() => setIsDraggingSlider(false)}
                            onTouchStart={() => setIsDraggingSlider(true)}
                            onTouchEnd={() => setIsDraggingSlider(false)}
                            onClick={() => {
                              const newHeight = Math.max(1, (settings.horizontalLayoutSlots?.customHeight || 90) - 10);
                              updateLayoutSlotSetting('horizontal', 'customHeight', newHeight);
                              notifyApplied();
                            }}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
                            type="button"
                          >
                            -10px
                          </button>
                          <button
                            onMouseDown={() => setIsDraggingSlider(true)}
                            onMouseUp={() => setIsDraggingSlider(false)}
                            onTouchStart={() => setIsDraggingSlider(true)}
                            onTouchEnd={() => setIsDraggingSlider(false)}
                            onClick={() => {
                              const newHeight = Math.min(200, (settings.horizontalLayoutSlots?.customHeight || 90) + 10);
                              updateLayoutSlotSetting('horizontal', 'customHeight', newHeight);
                              notifyApplied();
                            }}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
                            type="button"
                          >
                            +10px
                          </button>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min="1"
                          max="200"
                          value={settings.horizontalLayoutSlots?.customHeight || 90}
                          onMouseDown={() => setIsDraggingSlider(true)}
                          onMouseUp={() => setIsDraggingSlider(false)}
                          onTouchStart={() => setIsDraggingSlider(true)}
                          onTouchEnd={() => setIsDraggingSlider(false)}
                          onChange={(e) => {
                            updateLayoutSlotSetting('horizontal', 'customHeight', parseInt(e.target.value));
                            notifyApplied();
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((settings.horizontalLayoutSlots?.customHeight || 90) - 1) / 199 * 100}%, #e5e7eb ${((settings.horizontalLayoutSlots?.customHeight || 90) - 1) / 199 * 100}%, #e5e7eb 100%)`
                          }}
                        />
                        {/* Live value indicator on slider */}
                        <div 
                          className="absolute top-0 transform -translate-x-1/2 pointer-events-none"
                          style={{
                            left: `${((settings.horizontalLayoutSlots?.customHeight || 90) - 1) / 199 * 100}%`,
                            top: '-8px'
                          }}
                        >
                          <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-sm whitespace-nowrap">
                            {actualDimensions.height}px
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>20px</span>
                        <span>200px</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Auto-adjusts to screen size</div>
                      <div className="text-xs text-gray-400">Changes apply immediately</div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 text-blue-600 mt-0.5">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-blue-800">Horizontal Layout Tips</h5>
                      <ul className="text-xs text-blue-700 mt-1 space-y-1">
                        <li>• <strong>Width:</strong> Controls how much horizontal space each time slot takes</li>
                        <li>• <strong>Height:</strong> Controls the vertical space for each room row</li>
                        <li>• <strong>Tiny/Small:</strong> More time slots visible, compact view</li>
                        <li>• <strong>Medium:</strong> Balanced view, good for most use cases</li>
                        <li>• <strong>Large/Huge:</strong> Easier to read, better for touch interfaces</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Display Settings Component
const DisplaySettings = () => {
  const { settings, updateSetting, updateBookingSourceColor } = useSettings();
  const notifyApplied = () => toast.success('Settings applied', { id: 'settings-applied', duration: 900 });

  return (
    <div className="space-y-8">
      {/* Display Options */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Palette className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Display Options</h3>
        </div>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <div>
              <div className="font-medium">Show Business Hours</div>
              <div className="text-sm text-gray-600">Highlight business hours in the schedule</div>
            </div>
            <input
              type="checkbox"
              checked={settings.showBusinessHours}
              onChange={(e) => { updateSetting('showBusinessHours', e.target.checked); notifyApplied(); }}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <div className="font-medium">Color by Room Type</div>
              <div className="text-sm text-gray-600">Use different colors for Medium/Large/Party rooms</div>
            </div>
            <input
              type="checkbox"
              checked={settings.colorByRoomType}
              onChange={(e) => { updateSetting('colorByRoomType', e.target.checked); notifyApplied(); }}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <div className="font-medium">Color by Booking Source</div>
              <div className="text-sm text-gray-600">Walk-in, Phone, Email, Message, Online</div>
            </div>
            <input
              type="checkbox"
              checked={settings.colorByBookingSource}
              onChange={(e) => { updateSetting('colorByBookingSource', e.target.checked); notifyApplied(); }}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>
        </div>
      </div>

      {/* Booking Source Colors */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Palette className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Booking Source Colors</h3>
        </div>
        <p className="text-sm text-gray-600">Customize colors for each booking source.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(settings.bookingSourceColors || {}).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="capitalize text-sm font-medium text-gray-700">{key}</span>
                <span className="w-4 h-4 rounded" style={{ backgroundColor: value }} />
              </div>
              <input
                type="color"
                value={value}
                onChange={(e) => { updateBookingSourceColor(key, e.target.value); notifyApplied(); }}
                className="w-10 h-6 p-0 border border-gray-300 rounded"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Booking Form Settings Component
const BookingFormSettings = () => {
  const { settings, updateBookingFormField } = useSettings();

  const fieldGroups = [
    {
      title: 'Customer Information',
      fields: [
        { key: 'customerName', label: 'Customer Name', required: true },
        { key: 'phone', label: 'Phone Number', required: true },
        { key: 'email', label: 'Email Address', required: false },
        { key: 'partySize', label: 'Party Size', required: false },
      ]
    },
    {
      title: 'Booking Details',
      fields: [
        { key: 'room', label: 'Room Selection', required: true },
        { key: 'source', label: 'Booking Source', required: false },
        { key: 'timeIn', label: 'Start Time', required: true },
        { key: 'timeOut', label: 'End Time', required: true },
        { key: 'status', label: 'Status', required: false },
        { key: 'priority', label: 'Priority', required: false },
      ]
    },
    {
      title: 'Pricing',
      fields: [
        { key: 'basePrice', label: 'Base Price', required: false },
        { key: 'additionalFees', label: 'Additional Fees', required: false },
        { key: 'discount', label: 'Discount', required: false },
        { key: 'totalPrice', label: 'Total Price', required: false },
      ]
    },
    {
      title: 'Additional Information',
      fields: [
        { key: 'notes', label: 'Notes', required: false },
        { key: 'specialRequests', label: 'Special Requests', required: false },
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <SettingsIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Booking Form Fields</h3>
        </div>
        <p className="text-sm text-gray-600">
          Choose which fields to show or hide in the booking edit form. Required fields cannot be hidden.
        </p>
      </div>

      {fieldGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-4">
          <h4 className="text-md font-medium text-gray-800 border-b border-gray-200 pb-2">
            {group.title}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.fields.map((field) => (
              <div key={field.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">{field.label}</span>
                    {field.required && (
                      <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                        Required
                      </Badge>
                    )}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.bookingFormFields[field.key] || false}
                    onChange={(e) => updateBookingFormField(field.key, e.target.checked)}
                    disabled={field.required}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${field.required ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 text-blue-600 mt-0.5">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-800">Note</h4>
            <p className="text-sm text-blue-700 mt-1">
              Required fields cannot be hidden as they are essential for booking creation. 
              Changes will be applied immediately to all booking forms in the application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;