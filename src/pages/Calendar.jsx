import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isWithinInterval,
  addMonths,
  subMonths
} from 'date-fns';

const { 
  FiChevronLeft, FiChevronRight, FiFilter, FiCalendar, FiHome 
} = FiIcons;

const Calendar = () => {
  const { tenants, properties } = useData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => 
      direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  };

  const getOccupiedDays = () => {
    let filteredTenants = tenants;
    
    if (selectedProperty) {
      filteredTenants = filteredTenants.filter(tenant => tenant.propertyId === selectedProperty);
    }
    
    if (selectedLocation) {
      const locationProperties = properties.filter(prop => 
        prop.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
      const locationPropertyIds = locationProperties.map(prop => prop.id);
      filteredTenants = filteredTenants.filter(tenant => 
        locationPropertyIds.includes(tenant.propertyId)
      );
    }

    return filteredTenants.map(tenant => ({
      ...tenant,
      property: properties.find(p => p.id === tenant.propertyId)
    }));
  };

  const getDayStatus = (day) => {
    const occupiedTenants = getOccupiedDays();
    const occupiedCount = occupiedTenants.filter(tenant => {
      const leaseStart = new Date(tenant.leaseStart);
      const leaseEnd = new Date(tenant.leaseEnd);
      return isWithinInterval(day, { start: leaseStart, end: leaseEnd });
    }).length;

    if (occupiedCount === 0) return 'vacant';
    return 'occupied';
  };

  const getDayTenants = (day) => {
    const occupiedTenants = getOccupiedDays();
    return occupiedTenants.filter(tenant => {
      const leaseStart = new Date(tenant.leaseStart);
      const leaseEnd = new Date(tenant.leaseEnd);
      return isWithinInterval(day, { start: leaseStart, end: leaseEnd });
    });
  };

  const uniqueLocations = [...new Set(properties.map(p => p.location))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600 mt-1">View occupancy and rental schedules</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Properties</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>{property.name}</option>
              ))}
            </select>
            
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Locations</option>
              {uniqueLocations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Calendar Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <SafeIcon icon={FiChevronLeft} className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <SafeIcon icon={FiChevronRight} className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center space-x-6 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Occupied</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span className="text-sm text-gray-600">Vacant</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Days of week header */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day, index) => {
              const status = getDayStatus(day);
              const dayTenants = getDayTenants(day);
              const isToday = isSameDay(day, new Date());

              return (
                <motion.div
                  key={day.toString()}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  className={`relative min-h-[80px] p-2 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                    status === 'occupied' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  } ${isToday ? 'ring-2 ring-primary-500' : ''}`}
                  title={`${format(day, 'MMM dd, yyyy')} - ${dayTenants.length} tenant(s)`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      isSameMonth(day, currentMonth) ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {status === 'occupied' && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                  
                  {dayTenants.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {dayTenants.slice(0, 2).map(tenant => (
                        <div
                          key={tenant.id}
                          className="text-xs bg-white px-2 py-1 rounded border border-gray-200 truncate"
                          title={`${tenant.fullName} - ${tenant.property?.name || 'Unknown Property'}`}
                        >
                          {tenant.fullName}
                        </div>
                      ))}
                      {dayTenants.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayTenants.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Monthly Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiCalendar} className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">Occupied Days</p>
                  <p className="text-2xl font-bold text-green-700">
                    {days.filter(day => getDayStatus(day) === 'occupied').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiHome} className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Vacant Days</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {days.filter(day => getDayStatus(day) === 'vacant').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiFilter} className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-800">Occupancy Rate</p>
                  <p className="text-2xl font-bold text-primary-700">
                    {days.length > 0 ? 
                      Math.round((days.filter(day => getDayStatus(day) === 'occupied').length / days.length) * 100) : 0
                    }%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Calendar;