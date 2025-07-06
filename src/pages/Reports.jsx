import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const { 
  FiDownload, FiFileText, FiFilter, FiCalendar, 
  FiDollarSign, FiUsers, FiHome, FiMessageSquare 
} = FiIcons;

const Reports = () => {
  const { properties, tenants, payments, comments } = useData();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [reportType, setReportType] = useState('summary');

  const currencies = ['USD', 'EUR', 'EGP'];
  const currencySymbols = { USD: '$', EUR: '€', EGP: 'E£' };

  // Calculate report data
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  
  const monthlyPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.dueDate);
    return isWithinInterval(paymentDate, { start: monthStart, end: monthEnd }) &&
           payment.currency === selectedCurrency;
  });

  const paidPayments = monthlyPayments.filter(p => p.status === 'paid');
  const overduePayments = monthlyPayments.filter(p => p.status === 'overdue');
  const totalIncome = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalOverdue = overduePayments.reduce((sum, payment) => sum + payment.amount, 0);

  const activeTenants = tenants.filter(tenant => 
    new Date(tenant.leaseEnd) > new Date()
  );

  const occupancyRate = properties.length > 0 ? 
    (activeTenants.length / properties.length) * 100 : 0;

  const monthlyComments = comments.filter(comment => {
    const commentDate = new Date(comment.createdAt);
    return isWithinInterval(commentDate, { start: monthStart, end: monthEnd });
  });

  const generatePDFReport = () => {
    const doc = new jsPDF();
    const monthYear = format(selectedMonth, 'MMMM yyyy');
    
    // Title
    doc.setFontSize(20);
    doc.text('Property Rental Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Period: ${monthYear}`, 20, 30);
    doc.text(`Currency: ${selectedCurrency}`, 20, 40);
    doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy')}`, 20, 50);

    // Summary Section
    doc.setFontSize(16);
    doc.text('Summary', 20, 70);
    doc.setFontSize(12);
    doc.text(`Total Properties: ${properties.length}`, 20, 85);
    doc.text(`Active Tenants: ${activeTenants.length}`, 20, 95);
    doc.text(`Occupancy Rate: ${occupancyRate.toFixed(1)}%`, 20, 105);
    doc.text(`Monthly Income: ${currencySymbols[selectedCurrency]}${totalIncome.toLocaleString()}`, 20, 115);
    doc.text(`Overdue Amount: ${currencySymbols[selectedCurrency]}${totalOverdue.toLocaleString()}`, 20, 125);

    // Payments Table
    if (monthlyPayments.length > 0) {
      const paymentData = monthlyPayments.map(payment => {
        const property = properties.find(p => p.id === payment.propertyId);
        const tenant = tenants.find(t => t.id === payment.tenantId);
        return [
          property?.name || 'Unknown',
          tenant?.fullName || 'Unknown',
          `${currencySymbols[selectedCurrency]}${payment.amount.toLocaleString()}`,
          format(new Date(payment.dueDate), 'MMM dd'),
          payment.status.charAt(0).toUpperCase() + payment.status.slice(1)
        ];
      });

      doc.autoTable({
        startY: 140,
        head: [['Property', 'Tenant', 'Amount', 'Due Date', 'Status']],
        body: paymentData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [14, 165, 233] }
      });
    }

    // Comments Section
    if (monthlyComments.length > 0) {
      const finalY = doc.lastAutoTable?.finalY || 140;
      doc.setFontSize(16);
      doc.text('Comments & Notes', 20, finalY + 20);
      
      const commentData = monthlyComments.map(comment => {
        const tenant = tenants.find(t => t.id === comment.tenantId);
        return [
          tenant?.fullName || 'Unknown',
          format(new Date(comment.createdAt), 'MMM dd'),
          comment.text
        ];
      });

      doc.autoTable({
        startY: finalY + 30,
        head: [['Tenant', 'Date', 'Comment']],
        body: commentData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [14, 165, 233] }
      });
    }

    doc.save(`property-report-${format(selectedMonth, 'yyyy-MM')}.pdf`);
  };

  const generateExcelReport = () => {
    const monthYear = format(selectedMonth, 'yyyy-MM');
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Property Rental Report'],
      [`Period: ${format(selectedMonth, 'MMMM yyyy')}`],
      [`Currency: ${selectedCurrency}`],
      [`Generated: ${format(new Date(), 'MMM dd, yyyy')}`],
      [''],
      ['SUMMARY'],
      ['Total Properties', properties.length],
      ['Active Tenants', activeTenants.length],
      ['Occupancy Rate', `${occupancyRate.toFixed(1)}%`],
      ['Monthly Income', `${currencySymbols[selectedCurrency]}${totalIncome.toLocaleString()}`],
      ['Overdue Amount', `${currencySymbols[selectedCurrency]}${totalOverdue.toLocaleString()}`]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Payments Sheet
    if (monthlyPayments.length > 0) {
      const paymentsData = [
        ['Property', 'Tenant', 'Amount', 'Currency', 'Due Date', 'Status', 'Notes'],
        ...monthlyPayments.map(payment => {
          const property = properties.find(p => p.id === payment.propertyId);
          const tenant = tenants.find(t => t.id === payment.tenantId);
          return [
            property?.name || 'Unknown',
            tenant?.fullName || 'Unknown',
            payment.amount,
            payment.currency,
            format(new Date(payment.dueDate), 'yyyy-MM-dd'),
            payment.status,
            payment.notes || ''
          ];
        })
      ];

      const paymentsSheet = XLSX.utils.aoa_to_sheet(paymentsData);
      XLSX.utils.book_append_sheet(workbook, paymentsSheet, 'Payments');
    }

    // Properties Sheet
    if (properties.length > 0) {
      const propertiesData = [
        ['Name', 'Location', 'City', 'Type', 'Bedrooms', 'Bathrooms', 'Monthly Rent', 'Currency'],
        ...properties.map(property => [
          property.name,
          property.location,
          property.city,
          property.type,
          property.bedrooms,
          property.bathrooms,
          property.rent,
          property.currency
        ])
      ];

      const propertiesSheet = XLSX.utils.aoa_to_sheet(propertiesData);
      XLSX.utils.book_append_sheet(workbook, propertiesSheet, 'Properties');
    }

    // Tenants Sheet
    if (tenants.length > 0) {
      const tenantsData = [
        ['Name', 'Email', 'Phone', 'Property', 'Lease Start', 'Lease End', 'Door Code', 'Special Requests'],
        ...tenants.map(tenant => {
          const property = properties.find(p => p.id === tenant.propertyId);
          return [
            tenant.fullName,
            tenant.email,
            tenant.phone,
            property?.name || 'Unknown',
            tenant.leaseStart,
            tenant.leaseEnd,
            tenant.doorCode || '',
            tenant.specialRequests || ''
          ];
        })
      ];

      const tenantsSheet = XLSX.utils.aoa_to_sheet(tenantsData);
      XLSX.utils.book_append_sheet(workbook, tenantsSheet, 'Tenants');
    }

    // Comments Sheet
    if (monthlyComments.length > 0) {
      const commentsData = [
        ['Date', 'Tenant', 'Property', 'Comment'],
        ...monthlyComments.map(comment => {
          const tenant = tenants.find(t => t.id === comment.tenantId);
          const property = properties.find(p => p.id === comment.propertyId);
          return [
            format(new Date(comment.createdAt), 'yyyy-MM-dd'),
            tenant?.fullName || 'Unknown',
            property?.name || 'Unknown',
            comment.text
          ];
        })
      ];

      const commentsSheet = XLSX.utils.aoa_to_sheet(commentsData);
      XLSX.utils.book_append_sheet(workbook, commentsSheet, 'Comments');
    }

    XLSX.writeFile(workbook, `property-report-${monthYear}.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600 mt-1">Generate and export detailed reports</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={generatePDFReport}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <SafeIcon icon={FiDownload} className="w-4 h-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={generateExcelReport}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <SafeIcon icon={FiDownload} className="w-4 h-4" />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Report Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-8"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Period
            </label>
            <input
              type="month"
              value={format(selectedMonth, 'yyyy-MM')}
              onChange={(e) => setSelectedMonth(new Date(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {currencies.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Report Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-8"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Report Summary - {format(selectedMonth, 'MMMM yyyy')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiHome} className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">Total Properties</p>
                <p className="text-2xl font-bold text-blue-900">{properties.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiUsers} className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Active Tenants</p>
                <p className="text-2xl font-bold text-green-900">{activeTenants.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiDollarSign} className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-800">Monthly Income</p>
                <p className="text-2xl font-bold text-purple-900">
                  {currencySymbols[selectedCurrency]}{totalIncome.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiCalendar} className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-800">Occupancy Rate</p>
                <p className="text-2xl font-bold text-orange-900">{occupancyRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Payment Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Details</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyPayments.map((payment) => {
                  const property = properties.find(p => p.id === payment.propertyId);
                  const tenant = tenants.find(t => t.id === payment.tenantId);
                  
                  return (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {property?.name || 'Unknown Property'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tenant?.fullName || 'Unknown Tenant'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {currencySymbols[payment.currency]}{payment.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(payment.dueDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {monthlyPayments.length === 0 && (
            <div className="text-center py-8">
              <SafeIcon icon={FiFileText} className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No payments found for this period</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Comments Section */}
      {monthlyComments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Comments & Notes</h3>
            
            <div className="space-y-4">
              {monthlyComments.map((comment) => {
                const tenant = tenants.find(t => t.id === comment.tenantId);
                const property = properties.find(p => p.id === comment.propertyId);
                
                return (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <SafeIcon icon={FiMessageSquare} className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900">
                          {tenant?.fullName || 'Unknown Tenant'}
                        </span>
                        <span className="text-sm text-gray-500">
                          - {property?.name || 'Unknown Property'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(new Date(comment.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Reports;