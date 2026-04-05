import React, { useState, useEffect, useRef } from 'react';
import { FaCalendarAlt, FaTimes, FaCheck } from 'react-icons/fa';
import './CustomDatePicker.css';

const CustomDatePicker = ({ isOpen, onClose, onApply, initialStartDate, initialEndDate }) => {
  const [startDate, setStartDate] = useState(initialStartDate || '');
  const [endDate, setEndDate] = useState(initialEndDate || '');
  const [error, setError] = useState('');
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  const handleApply = () => {
    setError('');
    
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      setError('Start date must be before end date');
      return;
    }

    if (start > new Date()) {
      setError('Start date cannot be in the future');
      return;
    }

    // Calculate the difference in days
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 365) {
      setError('Date range cannot exceed 365 days');
      return;
    }

    onApply(startDate, endDate);
    onClose();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setError('');
  };

  const formatDateInput = (dateString) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  const getMaxDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMinEndDate = () => {
    if (!startDate) return '';
    return startDate;
  };

  const getMaxEndDate = () => {
    if (!startDate) return getMaxDate();
    
    // Calculate max end date (365 days from start date)
    const start = new Date(startDate);
    const maxEnd = new Date(start);
    maxEnd.setDate(start.getDate() + 365);
    
    const today = new Date();
    return maxEnd < today ? maxEnd.toISOString().split('T')[0] : getMaxDate();
  };

  // Quick date range options
  const quickRanges = [
    {
      label: 'Last 7 days',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 7);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    },
    {
      label: 'Last 30 days',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    },
    {
      label: 'Last 90 days',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 90);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    },
    {
      label: 'This month',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date();
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    },
    {
      label: 'Last month',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    }
  ];

  const handleQuickRange = (range) => {
    const { start, end } = range.getValue();
    setStartDate(start);
    setEndDate(end);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="custom-datepicker-overlay">
      <div className="custom-datepicker-modal" ref={modalRef} tabIndex="-1">
        <div className="custom-datepicker-header">
          <h3 className="custom-datepicker-title">
            <FaCalendarAlt className="title-icon" />
            Custom Date Range
          </h3>
          <button 
            className="custom-datepicker-close"
            onClick={onClose}
            aria-label="Close date picker"
          >
            <FaTimes />
          </button>
        </div>

        <div className="custom-datepicker-content">
          {/* Quick Range Buttons */}
          <div className="quick-ranges">
            <h4>Quick Ranges</h4>
            <div className="quick-range-buttons">
              {quickRanges.map((range, index) => (
                <button
                  key={index}
                  className="quick-range-btn"
                  onClick={() => handleQuickRange(range)}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Inputs */}
          <div className="date-inputs">
            <div className="date-input-group">
              <label htmlFor="start-date">Start Date</label>
              <input
                id="start-date"
                type="date"
                value={formatDateInput(startDate)}
                onChange={(e) => setStartDate(e.target.value)}
                max={getMaxDate()}
                className="date-input"
              />
            </div>

            <div className="date-input-group">
              <label htmlFor="end-date">End Date</label>
              <input
                id="end-date"
                type="date"
                value={formatDateInput(endDate)}
                onChange={(e) => setEndDate(e.target.value)}
                min={getMinEndDate()}
                max={getMaxEndDate()}
                className="date-input"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="date-picker-error">
              {error}
            </div>
          )}

          {/* Selected Range Preview */}
          {startDate && endDate && !error && (
            <div className="date-range-preview">
              <strong>Selected Range:</strong> {' '}
              {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
              <span className="range-days">
                ({Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} days)
              </span>
            </div>
          )}
        </div>

        <div className="custom-datepicker-footer">
          <button 
            className="datepicker-btn datepicker-btn-secondary"
            onClick={handleReset}
          >
            Reset
          </button>
          <button 
            className="datepicker-btn datepicker-btn-primary"
            onClick={handleApply}
            disabled={!startDate || !endDate}
          >
            <FaCheck />
            Apply Range
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomDatePicker;