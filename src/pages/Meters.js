import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Plus, Settings, Activity, Package, Upload } from 'lucide-react';
import { machineAPI, workerAPI } from '../services/api';
import toast from 'react-hot-toast';

const Meters = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await machineAPI.getAll();
      setMachines(response.data?.data || response.data || []);
    } catch (error) {
      toast.error('Failed to fetch machines');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitMachine = async (data) => {
    setSubmitting(true);
    try {
      await machineAPI.create(data);
      toast.success('Machine added successfully!');
      reset();
      setShowAddMachine(false);
      fetchMachines();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add machine';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExcelUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      toast.error('Please select an Excel file (.xlsx)');
      return;
    }

    setUploading(true);
    try {
      const response = await machineAPI.uploadExcel(file);
      const result = response.data?.data || response.data;
      
      if (result.failedRows === 0) {
        toast.success(`Successfully uploaded ${result.successfulRows} meters!`);
      } else {
        toast.success(`Uploaded ${result.successfulRows} meters. ${result.failedRows} failed.`);
        
        // Show errors if any
        if (result.errors && result.errors.length > 0) {
          console.log('Upload errors:', result.errors);
        }
      }
      
      setShowExcelUpload(false);
      
      // Reset file input
      event.target.value = '';
      
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to upload Excel file';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const downloadExcelTemplate = () => {
    // Create a simple CSV template that can be opened in Excel
    const csvContent = `Worker Code,Machine Code,Production Date,Meters Produced,Product Code`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meter_upload_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded! Save as .xlsx format before uploading.');
  };

  if (loading) {
    return <div className="loading">Loading machines...</div>;
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-20">
        <h1>Machines Management</h1>
        <div className="flex gap-10">
          <button 
            onClick={() => setShowExcelUpload(!showExcelUpload)}
            className="btn btn-secondary flex items-center gap-10"
          >
            <Upload size={16} />
            Upload Meters Excel
          </button>
          <button 
            onClick={() => setShowAddMachine(!showAddMachine)}
            className="btn btn-primary flex items-center gap-10"
          >
            <Plus size={16} />
            Add Machine
          </button>
        </div>
      </div>

      {showAddMachine && (
        <div className="card mb-20">
          <h3>Add New Machine</h3>
          <form onSubmit={handleSubmit(onSubmitMachine)} style={{ marginTop: '20px' }}>
            <div className="grid grid-3">
              <div className="form-group">
                <label className="form-label">Machine Code</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., M001, LOOM1"
                  {...register('machineCode', { required: 'Machine code is required' })}
                />
                {errors.machineCode && (
                  <div className="error">{errors.machineCode.message}</div>
                )}
                <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                  Unique code for Excel uploads
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Machine Name</label>
                <input
                  type="text"
                  className="form-control"
                  {...register('machineName', { required: 'Machine name is required' })}
                />
                {errors.machineName && (
                  <div className="error">{errors.machineName.message}</div>
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
            </div>

            <div className="flex gap-10 mt-20">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Adding...' : 'Add Machine'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowAddMachine(false);
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

      {showExcelUpload && (
        <div className="card mb-20">
          <h3>Upload Meters from Excel</h3>
          <div style={{ backgroundColor: '#e7f3ff', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Excel Format Requirements:</h4>
            <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666' }}>
              Shift will be automatically assigned based on worker's shift assignment and date.
            </p>
            <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px', marginTop: '10px' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold' }}>Code Examples:</p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '11px' }}>
                <li><strong>Worker Codes:</strong> Use codes like "W001", "JOHN", "EMP123"</li>
                <li><strong>Machine Codes:</strong> Use codes like "M001", "LOOM1", "MACHINE_A"</li>
                <li><strong>Product Codes:</strong> Use codes like "P001", "BLUE_FABRIC", "COTTON_001"</li>
                <li>Leave Product Code empty to use current running product for that machine</li>
              </ul>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Select Excel File (.xlsx)</label>
            <input
              type="file"
              accept=".xlsx"
              onChange={handleExcelUpload}
              className="form-control"
              disabled={uploading}
            />
            {uploading && (
              <div style={{ marginTop: '10px', color: '#007bff' }}>
                <span>Uploading and processing Excel file...</span>
              </div>
            )}
          </div>

          <div className="flex gap-10 mt-20">
            <button 
              type="button" 
              onClick={() => downloadExcelTemplate()}
              className="btn btn-outline"
              disabled={uploading}
            >
              Download Template
            </button>
            <button 
              type="button" 
              onClick={() => setShowExcelUpload(false)}
              className="btn btn-secondary"
              disabled={uploading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Machines List</h3>
        
        {machines.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No machines found. Add your first machine using the button above.
          </p>
        ) : (
          <div className="grid grid-3" style={{ marginTop: '20px', gap: '20px' }}>
            {machines.map((machine) => (
              <Link 
                key={machine.id} 
                to={`/machine/${machine.id}`}
                className="machine-card"
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                <div className="card" style={{ 
                  height: '100%', 
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}>
                  <div className="flex items-center gap-10 mb-15">
                    <Settings size={24} color="#007bff" />
                    <h4 style={{ margin: 0, color: '#333' }}>
                      {machine.machineName || `Machine #${machine.id}`}
                    </h4>
                  </div>
                  
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                    <div className="flex items-center gap-5 mb-5">
                      <Activity size={14} />
                      <span>Machine ID: {machine.id}</span>
                    </div>
                    {machine.description && (
                      <div style={{ marginTop: '10px' }}>
                        <Package size={14} style={{ display: 'inline', marginRight: '5px' }} />
                        {machine.description}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#28a745',
                      fontWeight: 'bold'
                    }}>
                      Click to manage →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Meters;