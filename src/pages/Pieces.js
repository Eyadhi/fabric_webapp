import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Layers } from 'lucide-react';
import { pieceAPI } from '../services/api';
import toast from 'react-hot-toast';

const Pieces = () => {
  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchPieces();
  }, []);

  const fetchPieces = async () => {
    try {
      const response = await pieceAPI.getAll();
      setPieces(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch pieces');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await pieceAPI.create(data);
      toast.success('Piece added successfully!');
      reset();
      setShowForm(false);
      fetchPieces();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add piece';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading pieces...</div>;
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-20">
        <h1>Pieces Management</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center gap-10"
        >
          <Plus size={16} />
          Add Piece
        </button>
      </div>

      {showForm && (
        <div className="card mb-20">
          <h3>Add New Piece</h3>
          <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label className="form-label">Piece Name</label>
              <input
                type="text"
                className="form-control"
                {...register('pieceName', { required: 'Piece name is required' })}
              />
              {errors.pieceName && (
                <div className="error">{errors.pieceName.message}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea
                className="form-control"
                rows="3"
                {...register('description')}
              />
            </div>

            <div className="flex gap-10 mt-20">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Adding...' : 'Add Piece'}
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
        <h3>Pieces List</h3>
        {pieces.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No pieces found. Add your first piece using the button above.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Piece Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pieces.map((piece) => (
                <tr key={piece.id}>
                  <td>{piece.id}</td>
                  <td>
                    <div className="flex items-center gap-10">
                      <Layers size={16} />
                      {piece.pieceName}
                    </div>
                  </td>
                  <td>{piece.description || '-'}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '5px 10px' }}>
                      Edit
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

export default Pieces;