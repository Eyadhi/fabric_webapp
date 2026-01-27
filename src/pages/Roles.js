import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Shield, Users } from 'lucide-react';
import { roleAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { isAdmin, hasPermission } = useAuth();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await roleAPI.getAll();
      setRoles(response.data?.data || response.data || []);
    } catch (error) {
      toast.error('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!hasPermission('create_role')) {
      toast.error('Access denied. Only admins can create roles.');
      return;
    }

    setSubmitting(true);
    try {
      await roleAPI.create(data);
      toast.success('Role created successfully!');
      reset();
      setShowForm(false);
      fetchRoles();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create role';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading roles...</div>;
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-20">
        <div>
          <h1>Role Management</h1>
          <p style={{ color: '#666', marginTop: '5px' }}>Manage user roles and permissions</p>
        </div>
        {hasPermission('create_role') && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary flex items-center gap-10"
          >
            <Plus size={16} />
            Add Role
          </button>
        )}
      </div>

      {!hasPermission('create_role') && (
        <div className="card mb-20" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
          <div className="flex items-center gap-10">
            <Shield size={20} color="#d63031" />
            <div>
              <h4 style={{ margin: 0, color: '#d63031' }}>View Only Access</h4>
              <p style={{ margin: '5px 0 0 0', color: '#856404' }}>
                You can view roles but cannot create new ones. Contact an administrator for role management.
              </p>
            </div>
          </div>
        </div>
      )}

      {showForm && hasPermission('create_role') && (
        <div className="card mb-20">
          <h3>Create New Role</h3>
          <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label className="form-label">Role Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter role name (e.g., Manager, Supervisor)"
                {...register('roleName', { 
                  required: 'Role name is required',
                  minLength: { value: 2, message: 'Role name must be at least 2 characters' }
                })}
              />
              {errors.roleName && (
                <div className="error">{errors.roleName.message}</div>
              )}
            </div>

            <div className="flex gap-10 mt-20">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Role'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowForm(false);
                  reset();
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3>System Roles</h3>
        
        {roles.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No roles found. {hasPermission('create_role') ? 'Create your first role using the button above.' : 'Contact an administrator to set up roles.'}
          </p>
        ) : (
          <div className="grid grid-2" style={{ marginTop: '20px', gap: '20px' }}>
            {roles.map((role) => (
              <div 
                key={role.id} 
                className="card" 
                style={{ 
                  border: '1px solid #dee2e6',
                  backgroundColor: role.id === 1 ? '#fff5f5' : '#f8f9fa'
                }}
              >
                <div className="flex items-center gap-15 mb-15">
                  <div style={{
                    padding: '10px',
                    borderRadius: '50%',
                    backgroundColor: role.id === 1 ? '#ff6b6b' : '#007bff',
                    color: 'white'
                  }}>
                    {role.id === 1 ? <Shield size={20} /> : <Users size={20} />}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: '#333' }}>
                      {role.roleName}
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#666' }}>
                      Role ID: {role.id}
                    </p>
                  </div>
                </div>
                
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {role.id === 1 ? (
                    <div>
                      <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#ff6b6b' }}>
                        Administrator Role
                      </p>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        <li>Full system access</li>
                        <li>Create and manage users</li>
                        <li>Create and manage roles</li>
                        <li>Create and manage shifts</li>
                        <li>All production management features</li>
                      </ul>
                    </div>
                  ) : role.id === 2 ? (
                    <div>
                      <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#007bff' }}>
                        Standard User Role
                      </p>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        <li>View all system data</li>
                        <li>Manage production records</li>
                        <li>Generate reports and bills</li>
                        <li>Cannot create users or roles</li>
                      </ul>
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#28a745' }}>
                        Custom Role
                      </p>
                      <p style={{ margin: 0 }}>
                        Custom role with specific permissions (contact administrator for details)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Information */}
      <div className="card mt-20" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
        <h4 style={{ color: '#495057', marginBottom: '15px' }}>Role-Based Access Control:</h4>
        <div className="grid grid-2" style={{ gap: '20px' }}>
          <div>
            <h5 style={{ color: '#007bff', marginBottom: '10px' }}>Admin Privileges:</h5>
            <ul style={{ color: '#6c757d', fontSize: '14px', lineHeight: '1.6', margin: 0, paddingLeft: '20px' }}>
              <li>Create and manage user accounts</li>
              <li>Create and manage system roles</li>
              <li>Create and manage work shifts</li>
              <li>Full access to all features</li>
              <li>System configuration access</li>
            </ul>
          </div>
          <div>
            <h5 style={{ color: '#28a745', marginBottom: '10px' }}>User Privileges:</h5>
            <ul style={{ color: '#6c757d', fontSize: '14px', lineHeight: '1.6', margin: 0, paddingLeft: '20px' }}>
              <li>View all production data</li>
              <li>Record production meters</li>
              <li>Generate salary calculations</li>
              <li>Manage worker assignments</li>
              <li>Access reports and analytics</li>
            </ul>
          </div>
        </div>
        {isAdmin() && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: '#e7f3ff', 
            borderRadius: '5px',
            fontSize: '14px',
            color: '#0066cc'
          }}>
            <strong>Admin Note:</strong> You currently have administrator privileges and can manage all aspects of the system.
          </div>
        )}
      </div>
    </div>
  );
};

export default Roles;