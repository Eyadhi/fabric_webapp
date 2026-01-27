import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Plus, Settings, Activity, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { machineAPI, workerAPI, meterAPI } from '../services/api';
import toast from 'react-hot-toast';

const MachineDetail = () => {
  const { machineId } = useParams();
  const [machine, setMachine] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [meters, setMeters] = useState([]);
  const [runningProduct, setRunningProduct] = useState(null);
  const [machineProducts, setMachineProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMeterForm, setShowMeterForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  
  const { register: registerMeter, handleSubmit: handleSubmitMeter, reset: resetMeter, formState: { errors: meterErrors } } = useForm();

  // Helper function to get the start of the week (Saturday)
  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) - 1; // Adjust to Saturday
    const saturday = new Date(d.setDate(diff));
    saturday.setHours(0, 0, 0, 0);
    return saturday.toISOString().split('T')[0];
  }

  useEffect(() => {
    fetchMachineData();
    fetchFormData();
    fetchMachineProducts();
    fetchWeeklyMeters();
  }, [machineId, currentWeekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMachineData = async () => {
    try {
      const [machineRes, productRes] = await Promise.all([
        machineAPI.getById(machineId),
        machineAPI.getRunningProduct(machineId)
      ]);
      
      const machineData = machineRes.data?.data || machineRes.data || [];
      setMachine(Array.isArray(machineData) ? machineData[0] : machineData);
      
      if (productRes.data?.data) {
        setRunningProduct(productRes.data.data);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch machine data');
      }
    }
  };

  const fetchFormData = async () => {
    try {
      const workersRes = await workerAPI.getAll();
      // Handle different response structures
      const workersData = Array.isArray(workersRes.data) ? workersRes.data : (workersRes.data?.data || []);
      setWorkers(workersData);
    } catch (error) {
      toast.error('Failed to fetch form data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMachineMeters = async () => {
    try {
      const response = await machineAPI.getMeters(machineId);
      setMeters(response.data?.data || response.data || []);
    } catch (error) {
      setMeters([]);
    }
  };

  const fetchWeeklyMeters = async () => {
    try {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const response = await machineAPI.getMeters(
        machineId, 
        currentWeekStart, 
        weekEnd.toISOString().split('T')[0]
      );
      setMeters(response.data?.data || response.data || []);
    } catch (error) {
      setMeters([]);
    }
  };

  const fetchMachineProducts = async () => {
    try {
      const response = await machineAPI.getProducts(machineId);
      setMachineProducts(response.data?.data || response.data || []);
    } catch (error) {
      setMachineProducts([]);
    }
  };

  const onSubmitMeter = async (data) => {
    setSubmitting(true);
    try {
      const meterData = {
        workerId: parseInt(data.workerId),
        machineId: parseInt(machineId),
        productId: data.productId ? parseInt(data.productId) : null, // Allow manual product selection
        meters: parseFloat(data.meters),
        productionDate: data.productionDate,
        // shiftId is automatically determined by backend based on date and worker assignment
      };
      
      await meterAPI.create(meterData);
      toast.success('Production meter recorded successfully!');
      resetMeter();
      setShowMeterForm(false);
      fetchWeeklyMeters();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to record meter';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const navigateWeek = (direction) => {
    const currentDate = new Date(currentWeekStart);
    currentDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentWeekStart(currentDate.toISOString().split('T')[0]);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const formatWeekRange = (weekStart) => {
    const start = new Date(weekStart);
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    
    const options = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  // Group meters by worker and shift for display
  const groupMetersByWorkerAndShift = (meters) => {
    const grouped = {};
    meters.forEach(meter => {
      const workerId = meter.worker?.id || 'unknown';
      const workerName = meter.worker?.workerName || 'Unknown Worker';
      const shiftId = meter.shiftId || 'unknown';
      
      if (!grouped[workerId]) {
        grouped[workerId] = {
          workerName,
          shifts: {}
        };
      }
      
      if (!grouped[workerId].shifts[shiftId]) {
        grouped[workerId].shifts[shiftId] = [];
      }
      
      grouped[workerId].shifts[shiftId].push(meter);
    });
    return grouped;
  };

  if (loading) {
    return <div className="loading">Loading machine details...</div>;
  }

  if (!machine) {
    return (
      <div className="container">
        <div className="card">
          <h3>Machine Not Found</h3>
          <p>The requested machine could not be found.</p>
          <Link to="/meters" className="btn btn-primary">
            <ArrowLeft size={16} style={{ marginRight: '5px' }} />
            Back to Machines
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="container">
      {/* Header */}
      <div className="flex justify-between items-center mb-20">
        <div className="flex items-center gap-15">
          <Link to="/meters" className="btn btn-secondary">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="flex items-center gap-10">
              <Settings size={24} />
              {machine.machineName || `Machine #${machine.id}`}
            </h1>
            <p style={{ color: '#666', margin: 0 }}>
              Machine ID: {machine.id} | 
              {runningProduct ? (
                <span style={{ color: '#28a745', marginLeft: '5px' }}>
                  Running: {runningProduct.productName}
                </span>
              ) : (
                <span style={{ color: '#dc3545', marginLeft: '5px' }}>
                  No active product
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Production Meters Section */}
      <div className="flex justify-between items-center mb-20">
        <h3 className="flex items-center gap-10">
          <Activity size={20} />
          Weekly Production Meters
        </h3>
        <button 
          onClick={() => setShowMeterForm(!showMeterForm)}
          className="btn btn-primary flex items-center gap-10"
          disabled={machineProducts.length === 0}
        >
          <Plus size={16} />
          Record Production
        </button>
      </div>

      {/* Week Navigation */}
      <div className="card mb-20">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => navigateWeek(-1)}
            className="btn btn-secondary flex items-center gap-5"
          >
            <ChevronLeft size={16} />
            Previous Week
          </button>
          
          <div className="flex items-center gap-15">
            <Calendar size={20} color="#007bff" />
            <div className="text-center">
              <h4 style={{ margin: 0 }}>{formatWeekRange(currentWeekStart)}</h4>
              <small style={{ color: '#666' }}>Saturday to Friday</small>
            </div>
          </div>
          
          <div className="flex gap-10">
            <button 
              onClick={goToCurrentWeek}
              className="btn btn-outline"
            >
              Current Week
            </button>
            <button 
              onClick={() => navigateWeek(1)}
              className="btn btn-secondary flex items-center gap-5"
            >
              Next Week
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {machineProducts.length === 0 && (
        <div className="card mb-20" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
          <p style={{ color: '#856404', margin: 0 }}>
            <strong>No Products Found:</strong> This machine doesn't have any products assigned. 
            Please assign a product to this machine before recording production meters.
          </p>
        </div>
      )}

      {showMeterForm && (
        <div className="card mb-20">
          <h4>Record Production Meter</h4>
          {runningProduct && (
            <div style={{ backgroundColor: '#e7f3ff', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
              <strong>Current Running Product:</strong> {runningProduct.productName}
            </div>
          )}
          <form onSubmit={handleSubmitMeter(onSubmitMeter)} style={{ marginTop: '20px' }}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Worker</label>
                <select
                  className="form-control"
                  {...registerMeter('workerId', { required: 'Worker is required' })}
                >
                  <option value="">Select Worker</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.workerName}
                    </option>
                  ))}
                </select>
                {meterErrors.workerId && (
                  <div className="error">{meterErrors.workerId.message}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Product</label>
                <select
                  className="form-control"
                  {...registerMeter('productId', { required: 'Product is required' })}
                  defaultValue={runningProduct?.id || ''}
                >
                  <option value="">Select Product</option>
                  {machineProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.productName} 
                      {product.isComplete === 1 ? ' (Running)' : ' (Completed)'}
                      {product.startDate && ` - Started: ${product.startDate}`}
                    </option>
                  ))}
                </select>
                {meterErrors.productId && (
                  <div className="error">{meterErrors.productId.message}</div>
                )}
                <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                  You can record meters for any product that has been on this machine
                </small>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Production Date</label>
                <input
                  type="date"
                  className="form-control"
                  {...registerMeter('productionDate', { required: 'Production date is required' })}
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
                {meterErrors.productionDate && (
                  <div className="error">{meterErrors.productionDate.message}</div>
                )}
                <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                  Shift is automatically determined based on worker assignment
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Meters Produced</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  {...registerMeter('meters', { 
                    required: 'Meters is required',
                    min: { value: 0.01, message: 'Meters must be greater than 0' }
                  })}
                />
                {meterErrors.meters && (
                  <div className="error">{meterErrors.meters.message}</div>
                )}
              </div>
            </div>

            <div className="flex gap-10 mt-20">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Recording...' : 'Record Production'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowMeterForm(false);
                  resetMeter();
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
        <h4>Production Records - {formatWeekRange(currentWeekStart)}</h4>
        {meters.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No production records found for this week.
          </p>
        ) : (
          <div style={{ marginTop: '20px' }}>
            {Object.entries(groupMetersByWorkerAndShift(meters)).map(([workerId, workerData]) => (
              <div key={workerId} className="card" style={{ marginBottom: '15px', backgroundColor: '#f8f9fa' }}>
                <h5 className="flex items-center gap-10">
                  <Activity size={18} />
                  {workerData.workerName}
                </h5>
                
                {Object.entries(workerData.shifts).map(([shiftId, shiftMeters]) => {
                  // Since we're using simplified shifts, we can determine shift name from shift type
                  const shiftName = `Shift ${shiftId}`;
                  const totalMeters = shiftMeters.reduce((sum, meter) => sum + parseFloat(meter.meters || 0), 0);
                  
                  return (
                    <div key={shiftId} style={{ marginTop: '10px', marginLeft: '20px' }}>
                      <h6 className="flex items-center gap-10">
                        <Activity size={16} />
                        {shiftName} - Total: {totalMeters.toFixed(2)} meters
                      </h6>
                      <table className="table" style={{ fontSize: '12px', marginTop: '10px' }}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Meters</th>
                            <th>Product</th>
                            <th>Recorded At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shiftMeters.map((meter) => (
                            <tr key={meter.id}>
                              <td>{meter.productionDate}</td>
                              <td>{parseFloat(meter.meters || 0).toFixed(2)}</td>
                              <td>{meter.product?.productName || 'Unknown'}</td>
                              <td>{new Date(meter.createdAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MachineDetail;