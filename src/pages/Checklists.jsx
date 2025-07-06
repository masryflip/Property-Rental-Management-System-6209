import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { 
  FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiSave, 
  FiCheckSquare, FiSquare, FiSearch, FiFilter, FiCopy 
} = FiIcons;

const Checklists = () => {
  const { checklists, addChecklist, updateChecklist, deleteChecklist, properties } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    propertyId: '',
    tasks: [''],
    isTemplate: false,
  });

  const openModal = (checklist = null) => {
    if (checklist) {
      setEditingChecklist(checklist);
      setFormData({
        ...checklist,
        tasks: checklist.tasks || ['']
      });
    } else {
      setEditingChecklist(null);
      setFormData({
        name: '',
        propertyId: '',
        tasks: [''],
        isTemplate: false,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingChecklist(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const filteredTasks = formData.tasks.filter(task => task.trim() !== '');
    const checklistData = {
      ...formData,
      tasks: filteredTasks.map(task => ({
        id: Date.now() + Math.random(),
        text: task,
        completed: false
      }))
    };

    if (editingChecklist) {
      updateChecklist(editingChecklist.id, checklistData);
    } else {
      addChecklist(checklistData);
    }
    closeModal();
  };

  const handleTaskChange = (index, value) => {
    const newTasks = [...formData.tasks];
    newTasks[index] = value;
    setFormData({...formData, tasks: newTasks});
  };

  const addTask = () => {
    setFormData({
      ...formData,
      tasks: [...formData.tasks, '']
    });
  };

  const removeTask = (index) => {
    const newTasks = formData.tasks.filter((_, i) => i !== index);
    setFormData({...formData, tasks: newTasks});
  };

  const toggleTaskCompletion = (checklistId, taskId) => {
    const checklist = checklists.find(c => c.id === checklistId);
    if (!checklist) return;

    const updatedTasks = checklist.tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );

    updateChecklist(checklistId, { ...checklist, tasks: updatedTasks });
  };

  const duplicateChecklist = (checklist) => {
    const newChecklist = {
      ...checklist,
      name: `${checklist.name} (Copy)`,
      tasks: checklist.tasks.map(task => ({
        ...task,
        id: Date.now() + Math.random(),
        completed: false
      }))
    };
    addChecklist(newChecklist);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this checklist?')) {
      deleteChecklist(id);
    }
  };

  const filteredChecklists = checklists.filter(checklist => {
    const matchesSearch = checklist.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProperty = !propertyFilter || checklist.propertyId === propertyFilter;
    return matchesSearch && matchesProperty;
  });

  const getPropertyName = (propertyId) => {
    if (!propertyId) return 'Template';
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
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
            <h1 className="text-3xl font-bold text-gray-900">Checklists</h1>
            <p className="text-gray-600 mt-1">Manage arrival and preparation checklists</p>
          </div>
          
          <button
            onClick={() => openModal()}
            className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <SafeIcon icon={FiPlus} className="w-5 h-5" />
            <span>Add Checklist</span>
          </button>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-8"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search checklists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div className="relative">
            <SafeIcon icon={FiFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Properties</option>
              <option value="template">Templates Only</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>{property.name}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Checklists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredChecklists.map((checklist, index) => (
          <motion.div
            key={checklist.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{checklist.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{getPropertyName(checklist.propertyId)}</p>
                  {checklist.isTemplate && (
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      Template
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => duplicateChecklist(checklist)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Duplicate checklist"
                  >
                    <SafeIcon icon={FiCopy} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openModal(checklist)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(checklist.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {checklist.tasks && checklist.tasks.length > 0 ? (
                  checklist.tasks.map((task) => (
                    <div key={task.id} className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleTaskCompletion(checklist.id, task.id)}
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          task.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-500'
                        }`}
                      >
                        {task.completed && <SafeIcon icon={FiCheck} className="w-3 h-3" />}
                      </button>
                      <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.text}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No tasks added yet</p>
                )}
              </div>

              {checklist.tasks && checklist.tasks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium text-gray-900">
                      {checklist.tasks.filter(task => task.completed).length} / {checklist.tasks.length}
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(checklist.tasks.filter(task => task.completed).length / checklist.tasks.length) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredChecklists.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <SafeIcon icon={FiCheckSquare} className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">No checklists found</p>
          <p className="text-gray-500 mt-2">Try adjusting your search or add a new checklist</p>
        </motion.div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingChecklist ? 'Edit Checklist' : 'Add New Checklist'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <SafeIcon icon={FiX} className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Checklist Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property
                  </label>
                  <select
                    value={formData.propertyId}
                    onChange={(e) => setFormData({...formData, propertyId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select a property (or leave empty for template)</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>{property.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isTemplate"
                      checked={formData.isTemplate}
                      onChange={(e) => setFormData({...formData, isTemplate: e.target.checked})}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="isTemplate" className="ml-2 text-sm text-gray-600">
                      Save as reusable template
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tasks
                  </label>
                  <div className="space-y-3">
                    {formData.tasks.map((task, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <input
                          type="text"
                          value={task}
                          onChange={(e) => handleTaskChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder={`Task ${index + 1}`}
                        />
                        {formData.tasks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTask(index)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addTask}
                      className="flex items-center space-x-2 text-primary-600 hover:text-primary-800 transition-colors"
                    >
                      <SafeIcon icon={FiPlus} className="w-4 h-4" />
                      <span>Add Task</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <SafeIcon icon={FiSave} className="w-4 h-4" />
                    <span>{editingChecklist ? 'Update' : 'Create'} Checklist</span>
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Checklists;