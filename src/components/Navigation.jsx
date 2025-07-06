import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { 
  FiHome, FiBuilding, FiUsers, FiCreditCard, 
  FiCalendar, FiCheckSquare, FiFileText, FiMenu, FiX, FiLogOut 
} = FiIcons;

const Navigation = () => {
  const location = useLocation();
  const { user, signOut } = useData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { path: '/', icon: FiHome, label: 'Dashboard' },
    { path: '/properties', icon: FiBuilding, label: 'Properties' },
    { path: '/tenants', icon: FiUsers, label: 'Tenants' },
    { path: '/payments', icon: FiCreditCard, label: 'Payments' },
    { path: '/calendar', icon: FiCalendar, label: 'Calendar' },
    { path: '/checklists', icon: FiCheckSquare, label: 'Checklists' },
    { path: '/reports', icon: FiFileText, label: 'Reports' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiBuilding} className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Property Manager</span>
              </motion.div>
            </div>
            
            <div className="flex items-center space-x-1">
              {navigationItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      location.pathname === item.path
                        ? 'bg-primary-100 text-primary-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <SafeIcon icon={item.icon} className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                </motion.div>
              ))}
              
              <div className="ml-4 pl-4 border-l border-gray-200">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">{user?.email}</span>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <SafeIcon icon={FiLogOut} className="w-4 h-4" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <SafeIcon icon={FiBuilding} className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Property Manager</span>
            </div>
            
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <SafeIcon icon={isMobileMenuOpen ? FiX : FiMenu} className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={toggleMobileMenu}
          />
        )}

        {/* Mobile Menu */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: isMobileMenuOpen ? 0 : '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiBuilding} className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Property Manager</span>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <SafeIcon icon={FiX} className="w-6 h-6" />
              </button>
            </div>
            
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={toggleMobileMenu}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-primary-100 text-primary-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <SafeIcon icon={item.icon} className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="px-4 py-2 text-sm text-gray-600 mb-2">
                Signed in as: {user?.email}
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors w-full"
              >
                <SafeIcon icon={FiLogOut} className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </motion.div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navigationItems.slice(0, 4).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center space-y-1 py-2 px-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                location.pathname === item.path
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <SafeIcon icon={item.icon} className="w-5 h-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default Navigation;