import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import ReactECharts from 'echarts-for-react';

const { 
  FiBuilding, FiUsers, FiDollarSign, FiCalendar, 
  FiTrendingUp, FiAlertCircle, FiCheckCircle, FiClock 
} = FiIcons;

const Dashboard = () => {
  const { properties, tenants, payments } = useData();
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const currencies = ['USD', 'EUR', 'EGP'];
  const currencySymbols = { USD: '$', EUR: '€', EGP: 'E£' };

  // Calculate metrics
  const totalProperties = properties.length;
  const totalTenants = tenants.length;
  const occupiedProperties = tenants.filter(tenant => 
    new Date(tenant.leaseEnd) > new Date()
  ).length;
  const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;

  // Monthly income calculation
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  
  const monthlyPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.dueDate);
    return isWithinInterval(paymentDate, { start: monthStart, end: monthEnd }) &&
           payment.currency === selectedCurrency &&
           payment.status === 'paid';
  });

  const monthlyIncome = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);

  // Payment status overview
  const paidPayments = payments.filter(p => p.status === 'paid' && p.currency === selectedCurrency);
  const pendingPayments = payments.filter(p => p.status === 'pending' && p.currency === selectedCurrency);
  const overduePayments = payments.filter(p => p.status === 'overdue' && p.currency === selectedCurrency);

  // Chart data for income trends
  const getIncomeChartData = () => {
    const months = [];
    const incomeData = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.dueDate);
        return isWithinInterval(paymentDate, { start: monthStart, end: monthEnd }) &&
               payment.currency === selectedCurrency &&
               payment.status === 'paid';
      });
      
      months.push(format(date, 'MMM yyyy'));
      incomeData.push(monthPayments.reduce((sum, payment) => sum + payment.amount, 0));
    }
    
    return { months, incomeData };
  };

  const { months, incomeData } = getIncomeChartData();

  const chartOptions = {
    title: {
      text: `Income Trends (${selectedCurrency})`,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 600,
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        return `${params[0].name}<br/>${currencySymbols[selectedCurrency]}${params[0].value.toLocaleString()}`;
      }
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: {
        fontSize: 12,
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: function(value) {
          return currencySymbols[selectedCurrency] + value.toLocaleString();
        },
        fontSize: 12,
      }
    },
    series: [{
      data: incomeData,
      type: 'line',
      smooth: true,
      itemStyle: {
        color: '#0ea5e9'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0, color: 'rgba(14, 165, 233, 0.3)'
          }, {
            offset: 1, color: 'rgba(14, 165, 233, 0.1)'
          }]
        }
      }
    }],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    }
  };

  const stats = [
    {
      title: 'Total Properties',
      value: totalProperties,
      icon: FiBuilding,
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Tenants',
      value: totalTenants,
      icon: FiUsers,
      color: 'bg-green-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Monthly Income',
      value: `${currencySymbols[selectedCurrency]}${monthlyIncome.toLocaleString()}`,
      icon: FiDollarSign,
      color: 'bg-purple-500',
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Occupancy Rate',
      value: `${occupancyRate.toFixed(1)}%`,
      icon: FiTrendingUp,
      color: 'bg-orange-500',
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Overview of your rental properties</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {currencies.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
            
            <input
              type="month"
              value={format(selectedMonth, 'yyyy-MM')}
              onChange={(e) => setSelectedMonth(new Date(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.bgColor} rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.textColor} mt-1`}>{stat.value}</p>
              </div>
              <div className={`${stat.color} rounded-lg p-3`}>
                <SafeIcon icon={stat.icon} className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
        >
          <ReactECharts option={chartOptions} style={{ height: '300px' }} />
        </motion.div>

        {/* Payment Status Overview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Status Overview</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <SafeIcon icon={FiCheckCircle} className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Paid</span>
              </div>
              <span className="text-green-700 font-semibold">{paidPayments.length}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <SafeIcon icon={FiClock} className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Pending</span>
              </div>
              <span className="text-yellow-700 font-semibold">{pendingPayments.length}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <SafeIcon icon={FiAlertCircle} className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">Overdue</span>
              </div>
              <span className="text-red-700 font-semibold">{overduePayments.length}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mt-8"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
        
        {payments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <SafeIcon icon={FiCalendar} className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No recent activity to display</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.slice(0, 5).map((payment) => {
              const property = properties.find(p => p.id === payment.propertyId);
              const tenant = tenants.find(t => t.id === payment.tenantId);
              
              return (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      payment.status === 'paid' ? 'bg-green-500' : 
                      payment.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {property?.name || 'Unknown Property'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {tenant?.fullName || 'Unknown Tenant'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {currencySymbols[payment.currency]}{payment.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(payment.dueDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;