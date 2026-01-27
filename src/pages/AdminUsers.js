import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, User, Shield, Eye, EyeOff } from 'lucide-react';
import { adminAPI, roleAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { isAdmin } = useAuth();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (!isAdmin()) {
      toast.error('Access denied. Admin privileges required.');
      return;
    }
    fetchRoles();
    setLoading(false);
  }, [isAdmin]);

  const fetchRoles = async () => {
    try {
      const response = await roleAPI.getAll();
      setRoles(response.data?.data || response.data || []);
    } catch (error) {
      toast.error('Failed to fetch roles');
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await adminAPI.register({
        username: data.username,
        password: data.password,
        mobile: data.mobile,
        roleId: parseInt(data.roleId)
      });
      toast.success('User created successfully!');
      reset();
      setShowForm(false);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create user';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="container">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Shield size={48} color="#ff6b6b" />
            <h2 style={{ color: '#ff6b6b', marginTop: '20px' }}>Access Denied</h2>
            <p>You need administrator privileges to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-20">
        <div>
          <h1>User Management</h1>
          <p style={{ color: '#666', marginTop: '5px' }}>Create and manage system users</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center gap-10"
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      {showForm && (
        <div className="card mb-20">
          <h3>Create New User</h3>
          <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '20px' }}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter username"
                  {...register('username', { 
                    required: 'Username is required',
                    minLength: { value: 3, message: 'Username must be at least 3 characters' }
                  })}
                />
                {errors.username && (
                  <div className="error">{errors.username.message}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Enter mobile number"
                  {...register('mobile', { 
                    required: 'Mobile number is required',
                    pattern: { 
                      value: /^[0-9]{10}$/, 
                      message: 'Please enter a valid 10-digit mobile number' 
                    }
                  })}
                />
                {errors.mobile && (
                  <div className="error">{errors.mobile.message}</div>
                )}
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Enter password"
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <div className="error">{errors.password.message}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-control"
                  {...register('roleId', { required: 'Role is required' })}
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.roleName}
                    </option>
                  ))}
                </select>
                {errors.roleId && (
                  <div className="error">{errors.roleId.message}</div>
                )}
              </div>
            </div>

            <div className="flex gap-10 mt-20">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create User'}
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
        <h3>System Information</h3>
        <div style={{ marginTop: '20px' }}>
          <div className="grid grid-2" style={{ gap: '20px' }}>
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <div className="flex items-center gap-10 mb-10">
                <User size={20} color="#007bff" />
                <h4 style={{ margin: 0 }}>User Roles</h4>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li><strong>Admin (Role ID: 1)</strong> - Full system access, can create users, roles, and shifts</li>
                <li><strong>User (Role ID: 2)</strong> - Standard access, can view and manage production data</li>
              </ul>
            </div>

            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <div className="flex items-center gap-10 mb-10">
                <Shield size={20} color="#28a745" />
                <h4 style={{ margin: 0 }}>Available Roles</h4>
              </div>
              {roles.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {roles.map((role) => (
                    <li key={role.id}>
                      <strong>{role.roleName}</strong> (ID: {role.id})
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, color: '#666' }}>No roles configured</p>
              )}
            </div>
          </div>

          <div style={{ 
            marginTop: '20px',
            padding: '15px', 
            backgroundColor: '#e7f3ff', 
            borderRadius: '8px',
            border: '1px solid #b3d9ff'
          }}>
            <h5 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>Admin Notes:</h5>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#0066cc' }}>
              <li>Only administrators can create new users and assign roles</li>
              <li>Users can view all data but cannot create roles, shifts, or other users</li>
              <li>Make sure to assign appropriate roles based on user responsibilities</li>
              <li>Default password policy requires minimum 6 characters</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;