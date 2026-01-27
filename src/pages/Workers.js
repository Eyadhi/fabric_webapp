import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Plus, User } from 'lucide-react';
import { workerAPI } from '../services/api';
import toast from 'react-hot-toast';

const Workers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const response = await workerAPI.getAll();
      setWorkers(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch workers');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await workerAPI.create(data);
      toast.success('Worker added successfully!');
      reset();
      setShowForm(false);
      fetchWorkers();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add worker';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading workers...</div>;
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-20">
        <h1>Workers Management</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center gap-10"
        >
          <Plus size={16} />
          Add Worker
        </button>
      </div>

      {showForm && (
        <div className="card mb-20">
          <h3>Add New Worker</h3>
          <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '20px' }}>
            <div className="grid grid-3">
              <div className="form-group">
                <label className="form-label">Worker Code</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., W001, JOHN"
                  {...register('workerCode', { required: 'Worker code is required' })}
                />
                {errors.workerCode && (
                  <div className="error">{errors.workerCode.message}</div>
                )}
                <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                  Unique code for Excel uploads
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Worker Name</label>
                <input
                  type="text"
                  className="form-control"
                  {...register('name', { required: 'Worker name is required' })}
                />
                {errors.name && (
                  <div className="error">{errors.name.message}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input
                  type="tel"
                  className="form-control"
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

            <div className="flex gap-10 mt-20">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Adding...' : 'Add Worker'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Workers List</h3>
        {workers.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No workers found. Add your first worker using the button above.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Code</th>
                <th>Name</th>
                <th>Mobile</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker) => (
                <tr key={worker.id}>
                  <td>{worker.id}</td>
                  <td>
                    <span style={{ 
                      backgroundColor: '#e7f3ff', 
                      padding: '2px 6px', 
                      borderRadius: '3px', 
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}>
                      {worker.workerCode || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-10">
                      <User size={16} />
                      {worker.workerName}
                    </div>
                  </td>
                  <td>{worker.mobile}</td>
                  <td>
                    <button 
                      onClick={() => navigate(`/worker/${worker.id}`)}
                      className="btn btn-secondary" 
                      style={{ fontSize: '12px', padding: '5px 10px' }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Workers;