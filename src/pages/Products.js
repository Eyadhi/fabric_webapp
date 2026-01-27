import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Package, CheckCircle, Clock, Edit } from 'lucide-react';
import { productAPI, machineAPI } from '../services/api';
import toast from 'react-hot-toast';

const Products = () => {
  const [runningProducts, setRunningProducts] = useState([]);
  const [completedProducts, setCompletedProducts] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showEndDateModal, setShowEndDateModal] = useState(false);
  const [showMachineCompletionModal, setShowMachineCompletionModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [selectedUpdateMachines, setSelectedUpdateMachines] = useState([]);
  const [selectedCompletionMachines, setSelectedCompletionMachines] = useState([]);
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('running'); // 'running' or 'completed'
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: registerUpdate, handleSubmit: handleSubmitUpdate, reset: resetUpdate, setValue: setUpdateValue, formState: { errors: updateErrors } } = useForm();

  useEffect(() => {
    fetchProducts();
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await machineAPI.getAll();
      // Handle ResponseUtil wrapper structure
      const machineData = response.data?.data || response.data;
      if (Array.isArray(machineData)) {
        setMachines(machineData);
      } else {
        console.warn('Machine API returned non-array data:', machineData);
        setMachines([]);
      }
    } catch (error) {
      console.error('Failed to fetch machines:', error);
      toast.error('Failed to fetch machines');
      setMachines([]); // Set empty array as fallback
    }
  };

  const fetchProducts = async () => {
    try {
      const [runningResponse, completedResponse] = await Promise.all([
        productAPI.getRunning(),
        productAPI.getCompleted()
      ]);
      
      setRunningProducts(runningResponse.data?.data || runningResponse.data || []);
      setCompletedProducts(completedResponse.data?.data || completedResponse.data || []);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (selectedMachines.length === 0) {
        toast.error('Please select at least one machine');
        setSubmitting(false);
        return;
      }

      const productData = {
        productCode: data.productCode,
        productName: data.productName,
        description: data.description,
        meters: parseInt(data.meters),
        costin: parseInt(data.costin),
        costout: parseInt(data.costout),
        machineIds: selectedMachines.map(id => parseInt(id)),
        startDate: data.startDate,
        pointDecrease: data.pointDecrease ? parseFloat(data.pointDecrease) : 0
      };
      
      const response = await productAPI.createMultiMachine(productData);
      const result = response.data?.data || response.data;
      
      toast.success(`Product created successfully on ${result.successCount} out of ${result.totalRequested} machines!`);
      reset();
      setSelectedMachines([]);
      setShowForm(false);
      fetchProducts();
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to add product';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const onUpdateSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (selectedUpdateMachines.length === 0) {
        toast.error('Please select at least one machine');
        setSubmitting(false);
        return;
      }

      const updateData = {
        id: selectedProduct.id,
        productCode: data.productCode,
        productName: data.productName,
        description: data.description,
        meters: parseInt(data.meters),
        costin: parseInt(data.costin),
        costout: parseInt(data.costout),
        startDate: data.startDate,
        pointDecrease: data.pointDecrease ? parseFloat(data.pointDecrease) : 0,
        machineIds: selectedUpdateMachines.map(id => parseInt(id)) // Support multiple machines
      };
      
      const response = await productAPI.update(updateData);
      const result = response.data?.data || response.data;
      
      toast.success(`Product updated successfully on ${result.successCount} out of ${result.totalRequested} machines!`);
      resetUpdate();
      setShowUpdateForm(false);
      setSelectedProduct(null);
      setSelectedUpdateMachines([]);
      fetchProducts();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update product';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMachineSelection = (machineId) => {
    setSelectedMachines(prev => {
      if (prev.includes(machineId)) {
        return prev.filter(id => id !== machineId);
      } else {
        return [...prev, machineId];
      }
    });
  };

  const handleSelectAllMachines = () => {
    if (selectedMachines.length === safeMachines.length) {
      // Deselect all
      setSelectedMachines([]);
    } else {
      // Select all
      setSelectedMachines(safeMachines.map(machine => machine.id));
    }
  };

  const handleSelectAllUpdateMachines = () => {
    if (selectedUpdateMachines.length === safeMachines.length) {
      // Deselect all
      setSelectedUpdateMachines([]);
    } else {
      // Select all
      setSelectedUpdateMachines(safeMachines.map(machine => machine.id));
    }
  };

  const handleUpdateMachineSelection = (machineId) => {
    setSelectedUpdateMachines(prev => {
      if (prev.includes(machineId)) {
        return prev.filter(id => id !== machineId);
      } else {
        return [...prev, machineId];
      }
    });
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setSelectedUpdateMachines([product.machineId]); // Initialize with current machine
    // Use setValue from the update form
    setUpdateValue('productCode', product.productCode || '');
    setUpdateValue('productName', product.productName || '');
    setUpdateValue('description', product.description || '');
    setUpdateValue('meters', product.meters || '');
    setUpdateValue('costin', product.costin || '');
    setUpdateValue('costout', product.costout || '');
    setUpdateValue('startDate', product.startDate || '');
    setUpdateValue('pointDecrease', product.pointDecrease || '');
    setShowUpdateForm(true);
  };

  const updateProductStatus = async (productId, newStatus, customEndDate = null) => {
    try {
      await productAPI.updateStatus(productId, newStatus, customEndDate);
      toast.success(`Product ${newStatus === 2 ? 'completed' : 'marked as in progress'}!`);
      fetchProducts();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update product status';
      toast.error(message);
    }
  };

  const handleMarkComplete = (product) => {
    setSelectedProduct(product);
    setEndDate('');
    
    // If product runs on multiple machines, show machine selection modal
    if (product.machines && product.machines.length > 1) {
      setSelectedCompletionMachines([]); // Start with no machines selected
      setShowMachineCompletionModal(true);
    } else {
      // Single machine, show end date modal directly
      setShowEndDateModal(true);
    }
  };

  const confirmMarkComplete = async () => {
    if (selectedProduct) {
      await updateProductStatus(selectedProduct.id, 2, endDate || null);
      setShowEndDateModal(false);
      setSelectedProduct(null);
      setEndDate('');
    }
  };

  const handleMachineCompletionSelection = (machineId) => {
    setSelectedCompletionMachines(prev => {
      if (prev.includes(machineId)) {
        return prev.filter(id => id !== machineId);
      } else {
        return [...prev, machineId];
      }
    });
  };

  const handleSelectAllCompletionMachines = () => {
    if (selectedProduct && selectedProduct.machines) {
      if (selectedCompletionMachines.length === selectedProduct.machines.length) {
        // Deselect all
        setSelectedCompletionMachines([]);
      } else {
        // Select all
        setSelectedCompletionMachines(selectedProduct.machines.map(machine => machine.machineId));
      }
    }
  };

  const confirmMachineCompletion = async () => {
    if (selectedProduct && selectedCompletionMachines.length > 0) {
      try {
        const completionData = {
          productId: selectedProduct.id,
          machineIds: selectedCompletionMachines,
          endDate: endDate || null,
          isComplete: 2
        };
        
        await productAPI.updateMachineCompletion(completionData);
        toast.success(`Marked ${selectedCompletionMachines.length} machine(s) as completed!`);
        fetchProducts();
        
        setShowMachineCompletionModal(false);
        setSelectedProduct(null);
        setSelectedCompletionMachines([]);
        setEndDate('');
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to update machine completion';
        toast.error(message);
      }
    } else {
      toast.error('Please select at least one machine to mark as completed');
    }
  };

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  // Safety check to ensure machines is always an array
  const safeMachines = Array.isArray(machines) ? machines : [];

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-20">
        <h1>Products Management</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center gap-10"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {showForm && (
        <div className="card mb-20">
          <h3>Add New Product</h3>
          <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '20px' }}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Product Code</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., P001, BLUE_FABRIC"
                  {...register('productCode', { required: 'Product code is required' })}
                />
                {errors.productCode && (
                  <div className="error">{errors.productCode.message}</div>
                )}
                <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                  Unique code for Excel uploads
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  className="form-control"
                  {...register('productName', { required: 'Product name is required' })}
                />
                {errors.productName && (
                  <div className="error">{errors.productName.message}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <div className="flex justify-between items-center mb-10">
                <label className="form-label">Select Machines *</label>
                <button
                  type="button"
                  onClick={handleSelectAllMachines}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                >
                  {selectedMachines.length === safeMachines.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div style={{ 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                padding: '10px',
                maxHeight: '150px',
                overflowY: 'auto',
                backgroundColor: '#f9f9f9'
              }}>
                {!Array.isArray(safeMachines) || safeMachines.length === 0 ? (
                  <div style={{ color: '#666', fontSize: '14px' }}>No machines available</div>
                ) : (
                  safeMachines.map(machine => (
                    <div key={machine.id} style={{ marginBottom: '8px' }}>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedMachines.includes(machine.id)}
                          onChange={() => handleMachineSelection(machine.id)}
                          style={{ marginRight: '8px' }}
                        />
                        <span>
                          <strong>{machine.machineCode || `Machine #${machine.id}`}</strong>
                          {machine.machine && (
                            <span style={{ 
                              color: '#666', 
                              fontSize: '12px',
                              marginLeft: '5px'
                            }}>
                              - {machine.machine}
                            </span>
                          )}
                        </span>
                      </label>
                    </div>
                  ))
                )}
              </div>
              {selectedMachines.length === 0 && (
                <div className="error">Please select at least one machine</div>
              )}
              <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                Selected: {selectedMachines.length} out of {safeMachines.length} available
              </small>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div className="form-group">
                <label className="form-label">Target Meters</label>
                <input
                  type="number"
                  className="form-control"
                  {...register('meters', { 
                    required: 'Target meters is required',
                    min: { value: 1, message: 'Meters must be positive' }
                  })}
                />
                {errors.meters && (
                  <div className="error">{errors.meters.message}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Cost In</label>
                <input
                  type="number"
                  className="form-control"
                  {...register('costin', { 
                    required: 'Cost in is required',
                    min: { value: 0, message: 'Cost must be non-negative' }
                  })}
                />
                {errors.costin && (
                  <div className="error">{errors.costin.message}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Cost Out</label>
                <input
                  type="number"
                  className="form-control"
                  {...register('costout', { 
                    required: 'Cost out is required',
                    min: { value: 0, message: 'Cost must be non-negative' }
                  })}
                />
                {errors.costout && (
                  <div className="error">{errors.costout.message}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Point Decrease (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  placeholder="e.g., 5.5"
                  {...register('pointDecrease', { 
                    min: { value: 0, message: 'Point decrease must be non-negative' },
                    max: { value: 100, message: 'Point decrease cannot exceed 100%' }
                  })}
                />
                {errors.pointDecrease && (
                  <div className="error">{errors.pointDecrease.message}</div>
                )}
                <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                  Percentage to decrease from total meters
                </small>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  {...register('startDate', { required: 'Start date is required' })}
                />
                {errors.startDate && (
                  <div className="error">{errors.startDate.message}</div>
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
                {submitting ? 'Adding...' : 'Add Product'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowForm(false);
                  setSelectedMachines([]);
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
        <div className="flex justify-between items-center mb-20">
          <h3>Products List</h3>
          <div className="flex gap-10">
            <button 
              onClick={() => setActiveTab('running')}
              className={`btn ${activeTab === 'running' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                fontSize: '14px', 
                padding: '8px 16px',
                border: activeTab === 'running' ? '2px solid #007bff' : '1px solid #ccc',
                fontWeight: activeTab === 'running' ? 'bold' : 'normal'
              }}
            >
              <Clock size={16} style={{ marginRight: '5px' }} />
              Running ({runningProducts.length})
            </button>
            <button 
              onClick={() => setActiveTab('completed')}
              className={`btn ${activeTab === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                fontSize: '14px', 
                padding: '8px 16px',
                border: activeTab === 'completed' ? '2px solid #007bff' : '1px solid #ccc',
                fontWeight: activeTab === 'completed' ? 'bold' : 'normal'
              }}
            >
              <CheckCircle size={16} style={{ marginRight: '5px' }} />
              Completed ({completedProducts.length})
            </button>
          </div>
        </div>

        {(() => {
          const currentProducts = activeTab === 'running' ? runningProducts : completedProducts;
          const emptyMessage = activeTab === 'running' 
            ? 'No running products found. Add your first product using the button above.'
            : 'No completed products found.';

          return currentProducts.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              {emptyMessage}
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Code</th>
                  <th>Product Name</th>
                  <th>Machine</th>
                  <th>Target Meters</th>
                  <th>Cost In/Out</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>
                    <span style={{ 
                      backgroundColor: '#e7f3ff', 
                      padding: '2px 6px', 
                      borderRadius: '3px', 
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}>
                      {product.productCode || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-10">
                      <Package size={16} />
                      {product.productName}
                    </div>
                  </td>
                  <td>
                    {product.machines && product.machines.length > 1 ? (
                      <div style={{ fontSize: '12px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          {product.machines.length} Machines:
                        </div>
                        {product.machines.map((machine, index) => (
                          <div key={machine.machineId} style={{ marginBottom: '2px' }}>
                            Machine #{machine.machineId}
                            {machine.machineCode && ` (${machine.machineCode})`}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        {product.machines && product.machines[0]?.machineCode && 
                          ` (${product.machines[0].machineCode})`
                        }
                      </div>
                    )}
                  </td>
                  <td>{product.meters}</td>
                  <td>₹{product.costin} / ₹{product.costout}</td>
                  <td>
                    <div style={{ fontSize: '12px' }}>
                      <div>Start: {product.startDate}</div>
                      {product.endDate && <div>End: {product.endDate}</div>}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-5">
                      {product.isComplete === 2 ? (
                        <>
                          <CheckCircle size={16} color="#28a745" />
                          <span style={{ color: '#28a745', fontSize: '12px' }}>Completed</span>
                        </>
                      ) : (
                        <>
                          <Clock size={16} color="#ffc107" />
                          <span style={{ color: '#ffc107', fontSize: '12px' }}>In Progress</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-5">
                      <button 
                        onClick={() => window.location.href = `/product-detail/${product.id}`}
                        className="btn btn-primary" 
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                      >
                        View Product
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
        })()}
      </div>

      {/* End Date Modal */}
      {showEndDateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '400px', margin: 0 }}>
            <h3>Mark Product as Complete</h3>
            <p style={{ marginTop: '10px', color: '#666' }}>
              Product: <strong>{selectedProduct?.productName}</strong>
            </p>
            
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">End Date (Optional)</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Leave empty to use today's date"
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Leave empty to automatically set today's date
              </small>
            </div>

            <div className="flex gap-10 mt-20">
              <button 
                onClick={confirmMarkComplete}
                className="btn btn-primary"
              >
                Confirm Complete
              </button>
              <button 
                onClick={() => {
                  setShowEndDateModal(false);
                  setSelectedProduct(null);
                  setEndDate('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Machine Completion Modal */}
      {showMachineCompletionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '500px', margin: '20px' }}>
            <h3>Mark Machines Complete</h3>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Select which machines to mark as completed for "{selectedProduct?.productName}"
            </p>
            
            <div className="form-group">
              <div className="flex justify-between items-center mb-10">
                <label className="form-label">Select Machines to Complete</label>
                <button
                  type="button"
                  onClick={handleSelectAllCompletionMachines}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                >
                  {selectedCompletionMachines.length === selectedProduct?.machines?.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div style={{ 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                padding: '10px',
                maxHeight: '200px',
                overflowY: 'auto',
                backgroundColor: '#f9f9f9'
              }}>
                {selectedProduct?.machines?.map(machine => (
                  <div key={machine.machineId} style={{ marginBottom: '8px' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      padding: '8px',
                      backgroundColor: selectedCompletionMachines.includes(machine.machineId) ? '#e7f3ff' : 'white',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedCompletionMachines.includes(machine.machineId)}
                        onChange={() => handleMachineCompletionSelection(machine.machineId)}
                        style={{ marginRight: '8px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          Machine #{machine.machineId}
                          {machine.machineCode && ` (${machine.machineCode})`}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Status: {machine.isComplete === 2 ? 'Completed' : 'Running'}
                          {machine.startDate && ` • Started: ${machine.startDate}`}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">End Date (Optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-control"
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Leave empty to use today's date
              </small>
            </div>

            <div className="flex gap-10 mt-20">
              <button 
                onClick={confirmMachineCompletion}
                className="btn btn-primary"
                disabled={selectedCompletionMachines.length === 0}
              >
                Mark Selected Machines Complete
              </button>
              <button 
                onClick={() => {
                  setShowMachineCompletionModal(false);
                  setSelectedProduct(null);
                  setSelectedCompletionMachines([]);
                  setEndDate('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Product Modal */}
      {showUpdateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          overflow: 'auto'
        }}>
          <div className="card" style={{ width: '600px', margin: '20px', maxHeight: '90vh', overflow: 'auto' }}>
            <h3>Update Product</h3>
            <form onSubmit={handleSubmitUpdate(onUpdateSubmit)} style={{ marginTop: '20px' }}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Product Code</label>
                  <input
                    type="text"
                    className="form-control"
                    {...registerUpdate('productCode', { required: 'Product code is required' })}
                  />
                  {updateErrors.productCode && (
                    <div className="error">{updateErrors.productCode.message}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    className="form-control"
                    {...registerUpdate('productName', { required: 'Product name is required' })}
                  />
                  {updateErrors.productName && (
                    <div className="error">{updateErrors.productName.message}</div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <div className="flex justify-between items-center mb-10">
                  <label className="form-label">Select Machines *</label>
                  <button
                    type="button"
                    onClick={handleSelectAllUpdateMachines}
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  >
                    {selectedUpdateMachines.length === safeMachines.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '4px', 
                  padding: '10px',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  backgroundColor: '#f9f9f9'
                }}>
                  {!Array.isArray(safeMachines) || safeMachines.length === 0 ? (
                    <div style={{ color: '#666', fontSize: '14px' }}>No machines available</div>
                  ) : (
                    safeMachines.map(machine => (
                      <div key={machine.id} style={{ marginBottom: '8px' }}>
                        <label style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}>
                          <input
                            type="checkbox"
                            checked={selectedUpdateMachines.includes(machine.id)}
                            onChange={() => handleUpdateMachineSelection(machine.id)}
                            style={{ marginRight: '8px' }}
                          />
                          <span>
                            <strong>{machine.machineCode || `Machine #${machine.id}`}</strong>
                            {machine.machine && (
                              <span style={{ 
                                color: '#666', 
                                fontSize: '12px',
                                marginLeft: '5px'
                              }}>
                                - {machine.machine}
                              </span>
                            )}
                          </span>
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {selectedUpdateMachines.length === 0 && (
                  <div className="error">Please select at least one machine</div>
                )}
                <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                  Selected: {selectedUpdateMachines.length} out of {safeMachines.length} available
                </small>
              </div>

              <div className="grid grid-3">
                <div className="form-group">
                  <label className="form-label">Target Meters</label>
                  <input
                    type="number"
                    className="form-control"
                    {...registerUpdate('meters', { 
                      required: 'Target meters is required',
                      min: { value: 1, message: 'Meters must be positive' }
                    })}
                  />
                  {updateErrors.meters && (
                    <div className="error">{updateErrors.meters.message}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Cost In</label>
                  <input
                    type="number"
                    className="form-control"
                    {...registerUpdate('costin', { 
                      required: 'Cost in is required',
                      min: { value: 0, message: 'Cost must be non-negative' }
                    })}
                  />
                  {updateErrors.costin && (
                    <div className="error">{updateErrors.costin.message}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Cost Out</label>
                  <input
                    type="number"
                    className="form-control"
                    {...registerUpdate('costout', { 
                      required: 'Cost out is required',
                      min: { value: 0, message: 'Cost must be non-negative' }
                    })}
                  />
                  {updateErrors.costout && (
                    <div className="error">{updateErrors.costout.message}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Point Decrease (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    {...registerUpdate('pointDecrease', { 
                      min: { value: 0, message: 'Point decrease must be non-negative' },
                      max: { value: 100, message: 'Point decrease cannot exceed 100%' }
                    })}
                  />
                  {updateErrors.pointDecrease && (
                    <div className="error">{updateErrors.pointDecrease.message}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    {...registerUpdate('startDate', { required: 'Start date is required' })}
                  />
                  {updateErrors.startDate && (
                    <div className="error">{updateErrors.startDate.message}</div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-control"
                  rows="3"
                  {...registerUpdate('description')}
                />
              </div>

              <div className="flex gap-10 mt-20">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'Update Product'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowUpdateForm(false);
                    setSelectedProduct(null);
                    setSelectedUpdateMachines([]);
                    resetUpdate();
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;