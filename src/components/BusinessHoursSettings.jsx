import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { useBusinessHours } from '../contexts/BusinessHoursContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import CustomSelect from './ui/CustomSelect';
import { Clock, Save, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const BusinessHoursSettings = () => {
  const { businessHours, loading, updateBusinessHours } = useBusinessHours();
  const [localBusinessHours, setLocalBusinessHours] = useState([]);
  const [saving, setSaving] = useState(false);

  const daysOfWeek = [
    { id: 0, name: 'Sunday', short: 'Sun' },
    { id: 1, name: 'Monday', short: 'Mon' },
    { id: 2, name: 'Tuesday', short: 'Tue' },
    { id: 3, name: 'Wednesday', short: 'Wed' },
    { id: 4, name: 'Thursday', short: 'Thu' },
    { id: 5, name: 'Friday', short: 'Fri' },
    { id: 6, name: 'Saturday', short: 'Sat' }
  ];

  useEffect(() => {
    if (businessHours.length > 0) {
      setLocalBusinessHours([...businessHours]);
    }
  }, [businessHours]);

  const updateBusinessHour = (weekday, field, value) => {
    setLocalBusinessHours(prev => prev.map(bh => 
      bh.weekday === weekday 
        ? { ...bh, [field]: value }
        : bh
    ));
  };

  const toggleClosed = (weekday) => {
    setLocalBusinessHours(prev => prev.map(bh => 
      bh.weekday === weekday 
        ? { ...bh, isClosed: !bh.isClosed }
        : bh
    ));
  };

  const saveBusinessHours = async () => {
    try {
      setSaving(true);
      const success = await updateBusinessHours(localBusinessHours);
      if (success) {
        // Context will handle the success toast
      }
    } catch (error) {
      console.error('Error saving business hours:', error);
      toast.error('Failed to save business hours');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    const defaultHours = daysOfWeek.map(day => ({
      weekday: day.id,
      openTime: day.id === 0 || day.id === 6 ? '12:00' : '16:00', // Sunday/Saturday: 12:00, others: 16:00
      closeTime: day.id === 5 || day.id === 6 ? '23:59' : '23:00', // Friday/Saturday: 23:59, others: 23:00
      isClosed: false
    }));
    setLocalBusinessHours(defaultHours);
  };

  const applyLateNightPreset = () => {
    const lateNightHours = daysOfWeek.map(day => ({
      weekday: day.id,
      openTime: day.id === 0 || day.id === 6 ? '18:00' : '18:00', // 6:00 PM
      closeTime: day.id === 5 || day.id === 6 ? '03:00' : '02:00', // Friday/Saturday: 3:00 AM, others: 2:00 AM
      isClosed: false
    }));
    setLocalBusinessHours(lateNightHours);
  };

  const applyExtendedLateNightPreset = () => {
    const extendedLateNightHours = daysOfWeek.map(day => ({
      weekday: day.id,
      openTime: day.id === 0 || day.id === 6 ? '20:00' : '20:00', // 8:00 PM
      closeTime: day.id === 5 || day.id === 6 ? '05:00' : '04:00', // Friday/Saturday: 5:00 AM, others: 4:00 AM
      isClosed: false
    }));
    setLocalBusinessHours(extendedLateNightHours);
  };

  const generateTimeOptions = () => {
    const options = [];
    
    // Generate options for current day (00:00 to 23:59)
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = moment(timeString, 'HH:mm').format('h:mm A');
        options.push({
          value: timeString,
          label: `${displayTime} (${timeString})`,
          key: `current-${timeString}`
        });
      }
    }
    
    // Generate options for next day (00:00 to 05:59) for late-night businesses
    for (let hour = 0; hour < 6; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = moment(timeString, 'HH:mm').format('h:mm A');
        options.push({
          value: timeString,
          label: `${displayTime} (${timeString}) - Next Day`,
          key: `next-${timeString}`
        });
      }
    }
    
    return options;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading business hours...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Business Hours</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            className="flex items-center space-x-1"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={applyLateNightPreset}
            className="flex items-center space-x-1"
          >
            <Clock className="w-4 h-4" />
            <span>Late Night (6PM-2AM)</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={applyExtendedLateNightPreset}
            className="flex items-center space-x-1"
          >
            <Clock className="w-4 h-4" />
            <span>Extended (8PM-4AM)</span>
          </Button>
          <Button
            size="sm"
            onClick={saveBusinessHours}
            disabled={saving}
            className="flex items-center space-x-1"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {daysOfWeek.map(day => {
          const dayHours = (localBusinessHours && Array.isArray(localBusinessHours) ? localBusinessHours.find(bh => bh.weekday === day.id) : null) || {
            weekday: day.id,
            openTime: '16:00',
            closeTime: '23:00',
            isClosed: false
          };

          return (
            <Card key={day.id} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={!dayHours.isClosed}
                      onChange={() => toggleClosed(day.id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="font-medium text-gray-900">{day.name}</span>
                  </div>
                  {dayHours.isClosed && (
                    <span className="text-sm text-red-600 font-medium">CLOSED</span>
                  )}
                </div>

                {!dayHours.isClosed && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Open Time
                      </label>
                      <CustomSelect
                        value={dayHours.openTime}
                        onChange={(value) => updateBusinessHour(day.id, 'openTime', value)}
                        options={generateTimeOptions()}
                        placeholder="Select open time"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Close Time
                      </label>
                      <CustomSelect
                        value={dayHours.closeTime}
                        onChange={(value) => updateBusinessHour(day.id, 'closeTime', value)}
                        options={generateTimeOptions()}
                        placeholder="Select close time"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 text-blue-600 mt-0.5">ℹ️</div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Business Hours Information:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Bookings can only be made during open hours</li>
              <li>• Times are displayed in your local timezone</li>
              <li>• <strong>Late-night hours</strong> (e.g., 2:00 AM, 3:00 AM) will display on the same day schedule</li>
              <li>• Use presets for common karaoke business hours</li>
              <li>• Closed days will not accept any bookings</li>
              <li>• Changes are saved when you click Save</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessHoursSettings;
