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

  // Close on Escape key (attach only when open)
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <Card 
        className="w-full max-w-6xl max-h-[90vh] relative"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Exit Button - Top Right Corner */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 h-12 w-12 z-10 bg-white hover:bg-gray-100 border border-gray-200 shadow-lg"
        >
          <X className="h-8 w-8 font-bold text-gray-700" />
        </Button>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5" />
            <span>Settings</span>
          </CardTitle>
        </CardHeader>

        <div className="flex h-[70vh]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
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
          <div className="flex-1 overflow-y-auto">
            <CardContent className="p-6">
              {activeTab === 'layout' && <LayoutSettings />}
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
const LayoutSettings = () => {
  const { settings, updateSetting, toggleLayoutOrientation, updateLayoutSlotSetting, resetSettings } = useSettings();
  const notifyApplied = () => toast.success('Settings applied', { id: 'settings-applied', duration: 900 });

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

        {/* Layout-Specific Slot Settings */}
        <div className="mt-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Slot Sizes by Layout</label>
          
          {/* Vertical Layout (rooms-x-time-y) */}
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-800 mb-3">Vertical Layout (Rooms × Time)</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Slot Width</label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { updateLayoutSlotSetting('vertical', 'slotWidth', opt.value); notifyApplied(); }}
                      className={`px-2 py-1 border rounded text-xs ${settings.verticalLayoutSlots?.slotWidth === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
                      type="button"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Slot Height</label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { updateLayoutSlotSetting('vertical', 'slotHeight', opt.value); notifyApplied(); }}
                      className={`px-2 py-1 border rounded text-xs ${settings.verticalLayoutSlots?.slotHeight === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
                      type="button"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal Layout (rooms-y-time-x) */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-800 mb-3">Horizontal Layout (Time × Rooms)</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Slot Width</label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { updateLayoutSlotSetting('horizontal', 'slotWidth', opt.value); notifyApplied(); }}
                      className={`px-2 py-1 border rounded text-xs ${settings.horizontalLayoutSlots?.slotWidth === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
                      type="button"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Slot Height</label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { updateLayoutSlotSetting('horizontal', 'slotHeight', opt.value); notifyApplied(); }}
                      className={`px-2 py-1 border rounded text-xs ${settings.horizontalLayoutSlots?.slotHeight === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
                      type="button"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* Timezone */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Timezone</h3>
        </div>
        <div className="space-y-2">
          <CustomSelect
            value={settings.timezone || 'America/New_York'}
            onChange={(value) => { updateSetting('timezone', value); notifyApplied(); }}
            options={[
              { value: 'America/New_York', label: 'Eastern Time (ET)' },
              { value: 'America/Chicago', label: 'Central Time (CT)' },
              { value: 'America/Denver', label: 'Mountain Time (MT)' },
              { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
              { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
              { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
              { value: 'UTC', label: 'UTC' },
              { value: 'Europe/London', label: 'London (GMT)' },
              { value: 'Europe/Paris', label: 'Paris (CET)' },
              { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
              { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
              { value: 'Australia/Sydney', label: 'Sydney (AEST)' }
            ]}
            placeholder="Select timezone"
          />
          <p className="text-xs text-gray-500 mt-2">All times will be displayed and calculated in the selected timezone.</p>
        </div>
      </div>

      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <Button 
          variant="outline" 
          onClick={() => { resetSettings(); notifyApplied(); }}
          className="flex items-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset to Defaults</span>
        </Button>
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