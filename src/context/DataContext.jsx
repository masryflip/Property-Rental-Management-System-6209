import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../lib/supabase';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Authentication
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load data from Supabase
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      // Load from localStorage if not authenticated
      loadLocalData();
    }
  }, [user]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      const [propertiesRes, tenantsRes, paymentsRes, checklistsRes, commentsRes] = await Promise.all([
        supabase.from('properties_rm2024').select('*').eq('user_id', user.id),
        supabase.from('tenants_rm2024').select('*').eq('user_id', user.id),
        supabase.from('payments_rm2024').select('*').eq('user_id', user.id),
        supabase.from('checklists_rm2024').select('*').eq('user_id', user.id),
        supabase.from('comments_rm2024').select('*').eq('user_id', user.id)
      ]);

      if (propertiesRes.data) setProperties(propertiesRes.data);
      if (tenantsRes.data) setTenants(tenantsRes.data);
      if (paymentsRes.data) setPayments(paymentsRes.data);
      if (checklistsRes.data) setChecklists(checklistsRes.data);
      if (commentsRes.data) setComments(commentsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to localStorage
      loadLocalData();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalData = () => {
    const savedProperties = localStorage.getItem('rental-properties');
    const savedTenants = localStorage.getItem('rental-tenants');
    const savedPayments = localStorage.getItem('rental-payments');
    const savedChecklists = localStorage.getItem('rental-checklists');
    const savedComments = localStorage.getItem('rental-comments');

    if (savedProperties) setProperties(JSON.parse(savedProperties));
    if (savedTenants) setTenants(JSON.parse(savedTenants));
    if (savedPayments) setPayments(JSON.parse(savedPayments));
    if (savedChecklists) setChecklists(JSON.parse(savedChecklists));
    if (savedComments) setComments(JSON.parse(savedComments));
    
    setLoading(false);
  };

  // Save to both Supabase and localStorage
  const saveToSupabase = async (table, data, operation = 'insert') => {
    if (!user) return null;

    try {
      const dataWithUser = { ...data, user_id: user.id };
      let result;

      if (operation === 'insert') {
        result = await supabase.from(table).insert(dataWithUser).select().single();
      } else if (operation === 'update') {
        result = await supabase.from(table).update(dataWithUser).eq('id', data.id).eq('user_id', user.id).select().single();
      } else if (operation === 'delete') {
        result = await supabase.from(table).delete().eq('id', data.id).eq('user_id', user.id);
      }

      return result;
    } catch (error) {
      console.error(`Error with ${operation} on ${table}:`, error);
      return null;
    }
  };

  // Property functions
  const addProperty = async (property) => {
    const newProperty = {
      ...property,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };

    if (user) {
      const result = await saveToSupabase('properties_rm2024', newProperty);
      if (result?.data) {
        setProperties(prev => [...prev, result.data]);
        return result.data;
      }
    }

    // Fallback to local storage
    setProperties(prev => [...prev, newProperty]);
    localStorage.setItem('rental-properties', JSON.stringify([...properties, newProperty]));
    return newProperty;
  };

  const updateProperty = async (id, updates) => {
    const updatedProperty = { ...updates, id };
    
    if (user) {
      const result = await saveToSupabase('properties_rm2024', updatedProperty, 'update');
      if (result?.data) {
        setProperties(prev => prev.map(prop => prop.id === id ? result.data : prop));
        return;
      }
    }

    // Fallback to local storage
    const newProperties = properties.map(prop => prop.id === id ? { ...prop, ...updates } : prop);
    setProperties(newProperties);
    localStorage.setItem('rental-properties', JSON.stringify(newProperties));
  };

  const deleteProperty = async (id) => {
    if (user) {
      const result = await saveToSupabase('properties_rm2024', { id }, 'delete');
      if (result) {
        setProperties(prev => prev.filter(prop => prop.id !== id));
        return;
      }
    }

    // Fallback to local storage
    const newProperties = properties.filter(prop => prop.id !== id);
    setProperties(newProperties);
    localStorage.setItem('rental-properties', JSON.stringify(newProperties));
  };

  // Tenant functions
  const addTenant = async (tenant) => {
    const newTenant = {
      ...tenant,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };

    if (user) {
      const result = await saveToSupabase('tenants_rm2024', newTenant);
      if (result?.data) {
        setTenants(prev => [...prev, result.data]);
        return result.data;
      }
    }

    setTenants(prev => [...prev, newTenant]);
    localStorage.setItem('rental-tenants', JSON.stringify([...tenants, newTenant]));
    return newTenant;
  };

  const updateTenant = async (id, updates) => {
    const updatedTenant = { ...updates, id };
    
    if (user) {
      const result = await saveToSupabase('tenants_rm2024', updatedTenant, 'update');
      if (result?.data) {
        setTenants(prev => prev.map(tenant => tenant.id === id ? result.data : tenant));
        return;
      }
    }

    const newTenants = tenants.map(tenant => tenant.id === id ? { ...tenant, ...updates } : tenant);
    setTenants(newTenants);
    localStorage.setItem('rental-tenants', JSON.stringify(newTenants));
  };

  const deleteTenant = async (id) => {
    if (user) {
      const result = await saveToSupabase('tenants_rm2024', { id }, 'delete');
      if (result) {
        setTenants(prev => prev.filter(tenant => tenant.id !== id));
        return;
      }
    }

    const newTenants = tenants.filter(tenant => tenant.id !== id);
    setTenants(newTenants);
    localStorage.setItem('rental-tenants', JSON.stringify(newTenants));
  };

  // Payment functions
  const addPayment = async (payment) => {
    const newPayment = {
      ...payment,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };

    if (user) {
      const result = await saveToSupabase('payments_rm2024', newPayment);
      if (result?.data) {
        setPayments(prev => [...prev, result.data]);
        return result.data;
      }
    }

    setPayments(prev => [...prev, newPayment]);
    localStorage.setItem('rental-payments', JSON.stringify([...payments, newPayment]));
    return newPayment;
  };

  const updatePayment = async (id, updates) => {
    const updatedPayment = { ...updates, id };
    
    if (user) {
      const result = await saveToSupabase('payments_rm2024', updatedPayment, 'update');
      if (result?.data) {
        setPayments(prev => prev.map(payment => payment.id === id ? result.data : payment));
        return;
      }
    }

    const newPayments = payments.map(payment => payment.id === id ? { ...payment, ...updates } : payment);
    setPayments(newPayments);
    localStorage.setItem('rental-payments', JSON.stringify(newPayments));
  };

  const deletePayment = async (id) => {
    if (user) {
      const result = await saveToSupabase('payments_rm2024', { id }, 'delete');
      if (result) {
        setPayments(prev => prev.filter(payment => payment.id !== id));
        return;
      }
    }

    const newPayments = payments.filter(payment => payment.id !== id);
    setPayments(newPayments);
    localStorage.setItem('rental-payments', JSON.stringify(newPayments));
  };

  // Checklist functions
  const addChecklist = async (checklist) => {
    const newChecklist = {
      ...checklist,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };

    if (user) {
      const result = await saveToSupabase('checklists_rm2024', newChecklist);
      if (result?.data) {
        setChecklists(prev => [...prev, result.data]);
        return result.data;
      }
    }

    setChecklists(prev => [...prev, newChecklist]);
    localStorage.setItem('rental-checklists', JSON.stringify([...checklists, newChecklist]));
    return newChecklist;
  };

  const updateChecklist = async (id, updates) => {
    const updatedChecklist = { ...updates, id };
    
    if (user) {
      const result = await saveToSupabase('checklists_rm2024', updatedChecklist, 'update');
      if (result?.data) {
        setChecklists(prev => prev.map(checklist => checklist.id === id ? result.data : checklist));
        return;
      }
    }

    const newChecklists = checklists.map(checklist => checklist.id === id ? { ...checklist, ...updates } : checklist);
    setChecklists(newChecklists);
    localStorage.setItem('rental-checklists', JSON.stringify(newChecklists));
  };

  const deleteChecklist = async (id) => {
    if (user) {
      const result = await saveToSupabase('checklists_rm2024', { id }, 'delete');
      if (result) {
        setChecklists(prev => prev.filter(checklist => checklist.id !== id));
        return;
      }
    }

    const newChecklists = checklists.filter(checklist => checklist.id !== id);
    setChecklists(newChecklists);
    localStorage.setItem('rental-checklists', JSON.stringify(newChecklists));
  };

  // Comment functions
  const addComment = async (comment) => {
    const newComment = {
      ...comment,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };

    if (user) {
      const result = await saveToSupabase('comments_rm2024', newComment);
      if (result?.data) {
        setComments(prev => [...prev, result.data]);
        return result.data;
      }
    }

    setComments(prev => [...prev, newComment]);
    localStorage.setItem('rental-comments', JSON.stringify([...comments, newComment]));
    return newComment;
  };

  const updateComment = async (id, updates) => {
    const updatedComment = { ...updates, id };
    
    if (user) {
      const result = await saveToSupabase('comments_rm2024', updatedComment, 'update');
      if (result?.data) {
        setComments(prev => prev.map(comment => comment.id === id ? result.data : comment));
        return;
      }
    }

    const newComments = comments.map(comment => comment.id === id ? { ...comment, ...updates } : comment);
    setComments(newComments);
    localStorage.setItem('rental-comments', JSON.stringify(newComments));
  };

  const deleteComment = async (id) => {
    if (user) {
      const result = await saveToSupabase('comments_rm2024', { id }, 'delete');
      if (result) {
        setComments(prev => prev.filter(comment => comment.id !== id));
        return;
      }
    }

    const newComments = comments.filter(comment => comment.id !== id);
    setComments(newComments);
    localStorage.setItem('rental-comments', JSON.stringify(newComments));
  };

  // Authentication functions
  const signUp = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local data
      setProperties([]);
      setTenants([]);
      setPayments([]);
      setChecklists([]);
      setComments([]);
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    // Data
    properties,
    tenants,
    payments,
    checklists,
    comments,
    loading,
    user,
    
    // Property functions
    addProperty,
    updateProperty,
    deleteProperty,
    
    // Tenant functions
    addTenant,
    updateTenant,
    deleteTenant,
    
    // Payment functions
    addPayment,
    updatePayment,
    deletePayment,
    
    // Checklist functions
    addChecklist,
    updateChecklist,
    deleteChecklist,
    
    // Comment functions
    addComment,
    updateComment,
    deleteComment,
    
    // Auth functions
    signUp,
    signIn,
    signOut,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};