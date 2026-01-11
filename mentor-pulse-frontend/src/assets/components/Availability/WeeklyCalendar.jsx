// src/assets/components/Availability/WeeklyCalendar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { FaSpinner, FaSave, FaPlus, FaTrash, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';

const WeeklyCalendar = ({ timezone: initialTimezone, onAvailabilityChange }) => {
  const [availability, setAvailability] = useState({});
  const [specificDates, setSpecificDates] = useState({});
  const [timezone, setTimezone] = useState(initialTimezone || 'UTC');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [dateSlots, setDateSlots] = useState([]);

  const daysOfWeek = [
    { id: 0, name: 'Sunday' },
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' }
  ];

  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeString);
    }
  }

  const loadAvailability = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('https://mentorpulse.onrender.com/api/availability/my-availability', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setAvailability(data.weeklySlots || {});
        setTimezone(data.timezone || timezone);
        
        if (data.exceptions && data.exceptions.length > 0) {
          const dates = {};
          data.exceptions.forEach(exception => {
            const dateStr = new Date(exception.date).toISOString().split('T')[0];
            dates[dateStr] = exception.slots || [];
          });
          setSpecificDates(dates);
        }
        
        toast.success('Availability loaded successfully');
      }
    } catch  {
      console.log('No existing availability found');
    } finally {
      setLoading(false);
    }
  }, [timezone]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const addTimeSlot = (dayId) => {
    const newSlots = [...(availability[dayId] || []), { startTime: '09:00', endTime: '10:00', isAvailable: true }];
    setAvailability(prev => ({ ...prev, [dayId]: newSlots }));
  };

  const removeTimeSlot = (dayId, index) => {
    const newSlots = availability[dayId].filter((_, i) => i !== index);
    setAvailability(prev => ({ ...prev, [dayId]: newSlots }));
  };

  const updateTimeSlot = (dayId, index, field, value) => {
    const newSlots = [...availability[dayId]];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setAvailability(prev => ({ ...prev, [dayId]: newSlots }));
  };

  const handleSave = async () => {
  try {
    setSaving(true);
    const token = localStorage.getItem('token');
    
    // Convert availability to the proper format for MongoDB Map
    // MongoDB expects Map keys to be strings representing days (0-6)
    const weeklySlotsMap = {};
    for (let day = 0; day < 7; day++) {
      weeklySlotsMap[day] = availability[day] || [];
    }

    // Convert specific dates to the format expected by the backend
    const exceptions = Object.keys(specificDates).map(date => ({
      date: new Date(date),
      slots: specificDates[date]
    }));

    console.log('Saving availability:', { weeklySlots: weeklySlotsMap, exceptions, timezone });

    const response = await axios.post(
      'https://mentorpulse.onrender.com/api/availability',
      {
        weeklySlots: weeklySlotsMap,
        exceptions,
        timezone
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.success) {
      toast.success('Availability saved successfully');
      if (onAvailabilityChange) {
        onAvailabilityChange();
      }
    } else {
      toast.error('Failed to save availability');
    }
  } catch (error) {
    console.error('Error saving availability:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    toast.error('Error saving availability');
  } finally {
    setSaving(false);
  }
};

  const handleDateSelect = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    
    if (date) {
      setDateSlots(specificDates[date] || []);
    } else {
      setDateSlots([]);
    }
  };

  const addDateSlot = () => {
    setDateSlots(prev => [...prev, { startTime: '09:00', endTime: '10:00', isAvailable: true }]);
  };

  const removeDateSlot = (index) => {
    setDateSlots(prev => prev.filter((_, i) => i !== index));
  };

  const updateDateSlot = (index, field, value) => {
    const newSlots = [...dateSlots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setDateSlots(newSlots);
  };

  const saveDateSlots = () => {
    if (!selectedDate) return;
    
    setSpecificDates(prev => ({ ...prev, [selectedDate]: dateSlots }));
    toast.success('Date-specific availability saved');
    setSelectedDate('');
    setDateSlots([]);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '40px',
        gap: '15px',
        color: '#7f8c8d'
      }}>
        <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Loading availability...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          .spinner {
            animation: spin 1s linear infinite;
          }
        `}
      </style>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>Weekly Availability</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontWeight: '600' }}>Timezone: </label>
          <select 
            value={timezone} 
            onChange={(e) => setTimezone(e.target.value)}
            style={{ 
              padding: '8px 12px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="UTC">UTC</option>
            <option value="EST">Eastern Time (EST)</option>
            <option value="PST">Pacific Time (PST)</option>
            <option value="CST">Central Time (CST)</option>
            <option value="GMT">Greenwich Mean Time (GMT)</option>
          </select>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        {daysOfWeek.map(day => (
          <div key={day.id} style={{ 
            background: 'white', 
            border: '1px solid #e0e0e0', 
            borderRadius: '8px', 
            padding: '15px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: '15px', 
              color: '#2c3e50', 
              textAlign: 'center', 
              paddingBottom: '10px', 
              borderBottom: '1px solid #eee',
              fontSize: '16px'
            }}>{day.name}</h3>
            <div>
              {(availability[day.id] || []).map((slot, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px', 
                  marginBottom: '10px', 
                  flexWrap: 'wrap' 
                }}>
                  <select
                    value={slot.startTime}
                    onChange={(e) => updateTimeSlot(day.id, index, 'startTime', e.target.value)}
                    style={{ 
                      flex: 1, 
                      minWidth: '80px', 
                      padding: '5px', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: '12px' }}> to </span>
                  <select
                    value={slot.endTime}
                    onChange={(e) => updateTimeSlot(day.id, index, 'endTime', e.target.value)}
                    style={{ 
                      flex: 1, 
                      minWidth: '80px', 
                      padding: '5px', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                  <button
                    style={{ 
                      background: '#e74c3c', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      padding: '5px 8px', 
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                    onClick={() => removeTimeSlot(day.id, index)}
                    title="Remove time slot"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button 
                style={{ 
                  background: '#2ecc71', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px', 
                  marginTop: '10px', 
                  width: '100%', 
                  justifyContent: 'center',
                  fontSize: '13px'
                }}
                onClick={() => addTimeSlot(day.id)}
              >
                <FaPlus /> Add Time Slot
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        background: 'white', 
        border: '1px solid #e0e0e0', 
        borderRadius: '8px', 
        padding: '20px', 
        marginBottom: '20px' 
      }}>
        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Date-Specific Availability</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateSelect}
            min={new Date().toISOString().split('T')[0]}
            style={{ 
              padding: '8px 12px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <button 
            style={{ 
              background: '#2ecc71', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              padding: '8px 12px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px',
              fontSize: '13px'
            }}
            onClick={addDateSlot} 
            disabled={!selectedDate}
          >
            <FaPlus /> Add Time Slot
          </button>
        </div>

        {selectedDate && (
          <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
            {dateSlots.map((slot, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px', 
                marginBottom: '10px', 
                flexWrap: 'wrap' 
              }}>
                <select
                  value={slot.startTime}
                  onChange={(e) => updateDateSlot(index, 'startTime', e.target.value)}
                  style={{ 
                    flex: 1, 
                    minWidth: '80px', 
                    padding: '5px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                >
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                <span style={{ fontSize: '12px' }}> to </span>
                <select
                  value={slot.endTime}
                  onChange={(e) => updateDateSlot(index, 'endTime', e.target.value)}
                  style={{ 
                    flex: 1, 
                    minWidth: '80px', 
                    padding: '5px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                >
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                <button
                  style={{ 
                    background: '#e74c3c', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    padding: '5px 8px', 
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  onClick={() => removeDateSlot(index)}
                  title="Remove time slot"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            <button 
              style={{ 
                background: '#3498db', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                padding: '8px 16px', 
                cursor: 'pointer',
                fontSize: '14px'
              }}
              onClick={saveDateSlots}
            >
              Save for this Date
            </button>
          </div>
        )}
      </div>

      <div style={{ 
        background: '#f9f9f9', 
        borderRadius: '8px', 
        padding: '20px', 
        margin: '20px 0' 
      }}>
        <h3 style={{ color: '#2c3e50', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaInfoCircle /> How it works:
        </h3>
        <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
          <li style={{ marginBottom: '8px' }}>Click time slots to mark availability</li>
          <li style={{ marginBottom: '8px' }}>Green indicates available times</li>
          <li style={{ marginBottom: '8px' }}>Set consistent weekly patterns</li>
          <li style={{ marginBottom: '8px' }}>Remember to save changes</li>
        </ul>

        <h3>Best Practices:</h3>
        <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
          <li style={{ marginBottom: '8px' }}>Set buffer time between sessions</li>
          <li style={{ marginBottom: '8px' }}>Consider your timezone differences</li>
          <li style={{ marginBottom: '8px' }}>Update exceptions for holidays/vacations</li>
          <li style={{ marginBottom: '8px' }}>Keep availability up-to-date</li>
        </ul>

        <p style={{ 
          background: '#fff3cd', 
          borderLeft: '4px solid #ffc107', 
          padding: '12px', 
          borderRadius: '4px', 
          marginTop: '15px',
          fontSize: '14px'
        }}>
          <strong>Note:</strong> Your availability will be visible to mentees looking to book sessions with you. 
          Changes take effect immediately.
        </p>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button 
          style={{ 
            background: '#2ecc71', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            padding: '12px 24px', 
            cursor: 'pointer', 
            fontSize: '1rem', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}
          onClick={handleSave} 
          disabled={saving}
        >
          {saving ? <FaSpinner className="spinner" /> : <FaSave />}
          {saving ? 'Saving...' : 'Save Availability'}
        </button>
      </div>
    </div>
  );
};

export default WeeklyCalendar;
