import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Calendar, DollarSign, Activity } from 'lucide-react';
import { workerAPI } from '../services/api';
import toast from 'react-hot-toast';

const WorkerDetail = () => {
  const { workerId } = useParams();
  const navigate = useNavigate();
  
  const [worker, setWorker] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  
  // Analytics filters
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.

  useEffect(() => {
    fetchWorkerDetails();
    fetchAnalytics();
  }, [workerId]);

  useEffect(() => {
    if (selectedPeriod !== 'custom') {
      fetchAnalytics();
    }
  }, [selectedPeriod, selectedMonth, selectedYear, weekOffset]);

  const fetchWorkerDetails = async () => {
    try {
      const response = await workerAPI.getById(workerId);
      const workerData = response.data?.[0];
      if (workerData) {
        setWorker(workerData);
        setEditData({
          id: workerData.id,
          workerCode: workerData.workerCode || '',
          workerName: workerData.workerName || '',
          mobile: workerData.mobile || ''
        });
      }
    } catch (error) {
      toast.error('Failed to fetch worker details');
      navigate('/workers');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      let startDate = null;
      let endDate = null;
      
      // Calculate dates based on period
      if (selectedPeriod === 'monthly') {
        // Calculate first and last day of selected month/year
        const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
        const lastDay = new Date(selectedYear, selectedMonth, 0);
        startDate = firstDay.toISOString().split('T')[0];
        endDate = lastDay.toISOString().split('T')[0];
      } else if (selectedPeriod === 'weekly') {
        // Calculate Saturday to Friday for the selected week (with offset)
        const today = new Date();
        const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const daysFromSaturday = currentDay === 0 ? 1 : (7 - currentDay + 6) % 7; // Days to go back to Saturday
        
        // Get the Saturday of current week, then apply week offset
        const currentWeekSaturday = new Date(today);
        currentWeekSaturday.setDate(today.getDate() - daysFromSaturday + (weekOffset * 7));
        
        // Calculate Friday of that week
        const weekFriday = new Date(currentWeekSaturday);
        weekFriday.setDate(currentWeekSaturday.getDate() + 6);
        
        startDate = currentWeekSaturday.toISOString().split('T')[0];
        endDate = weekFriday.toISOString().split('T')[0];
      } else if (selectedPeriod === 'custom') {
        startDate = customStartDate;
        endDate = customEndDate;
      }
      
      const response = await workerAPI.getAnalytics(
        workerId, 
        selectedPeriod,
        startDate,
        endDate
      );
      setAnalytics(response.data?.data);
    } catch (error) {
      toast.error('Failed to fetch analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleCustomDateSubmit = () => {
    if (!customStartDate || !customEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    fetchAnalytics();
  };

  const handleUpdateWorker = async () => {
    try {
      await workerAPI.update(editData);
      toast.success('Worker updated successfully!');
      setEditMode(false);
      fetchWorkerDetails();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update worker';
      toast.error(message);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(amount || 0);
  };

  const formatMeters = (meters) => {
    return `${(meters || 0).toFixed(1)} m`;
  };

  const formatPeriodDisplay = (period, startDate, endDate) => {
    if (period === 'weekly') {
      const weekLabel = weekOffset === 0 ? 'Current Week' : 
                       weekOffset === -1 ? 'Last Week' : 
                       weekOffset < -1 ? `${Math.abs(weekOffset)} weeks ago` :
                       weekOffset === 1 ? 'Next Week' :
                       `${weekOffset} weeks ahead`;
      return `${startDate} (Saturday) to ${endDate} (Friday) - ${weekLabel}`;
    } else if (period === 'monthly') {
      const date = new Date(startDate);
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return `${monthName}`;
    }
    return `${startDate} to ${endDate}`;
  };

  const goToPreviousWeek = () => {
    setWeekOffset(prev => prev - 1);
  };

  const goToNextWeek = () => {
    setWeekOffset(prev => prev + 1);
  };

  const goToCurrentWeek = () => {
    setWeekOffset(0);
  };

  const resetPeriodSelection = (period) => {
    setSelectedPeriod(period);
    if (period === 'weekly') {
      setWeekOffset(0); // Reset to current week when switching to weekly
    }
  };

  if (loading) {
    return <div className="loading">Loading worker details...</div>;
  }

  if (!worker) {
    return <div className="error">Worker not found</div>;
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="flex items-center gap-15 mb-20">
        <button 
          onClick={() => navigate('/workers')}
          className="btn btn-secondary flex items-center gap-5"
        >
          <ArrowLeft size={16} />
          Back to Workers
        </button>
        <h1>Worker Details</h1>
      </div>

      {/* Worker Information Card */}
      <div className="card mb-20">
        <div className="flex justify-between items-start mb-15">
          <h3>Worker Information</h3>
          <button 
            onClick={() => setEditMode(!editMode)}
            className="btn btn-secondary"
          >
            {editMode ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editMode ? (
          <div className="grid grid-3 gap-15">
            <div className="form-group">
              <label className="form-label">Worker Code</label>
              <input
                type="text"
                className="form-control"
                value={editData.workerCode}
                onChange={(e) => setEditData({...editData, workerCode: e.target.value})}
                placeholder="e.g., W001"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Worker Name</label>
              <input
                type="text"
                className="form-control"
                value={editData.workerName}
                onChange={(e) => setEditData({...editData, workerName: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                type="tel"
                className="form-control"
                value={editData.mobile}
                onChange={(e) => setEditData({...editData, mobile: e.target.value})}
              />
            </div>
            <div className="flex gap-10 mt-10">
              <button 
                onClick={handleUpdateWorker}
                className="btn btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-3 gap-20">
            <div className="flex items-center gap-10">
              <User size={20} style={{ color: '#666' }} />
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>Worker Code</div>
                <div style={{ fontWeight: '500' }}>
                  {worker.workerCode || 'Not set'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-10">
              <User size={20} style={{ color: '#666' }} />
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>Name</div>
                <div style={{ fontWeight: '500' }}>{worker.workerName}</div>
              </div>
            </div>
            <div className="flex items-center gap-10">
              <Phone size={20} style={{ color: '#666' }} />
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>Mobile</div>
                <div style={{ fontWeight: '500' }}>{worker.mobile}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Section */}
      <div className="card">
        <h3 className="mb-15">Performance Analytics</h3>
        
        {/* Period Selection */}
        <div className="flex items-center gap-15 mb-20">
          <div className="flex gap-10">
            {['weekly', 'monthly', 'yearly'].map(period => (
              <button
                key={period}
                onClick={() => resetPeriodSelection(period)}
                className={`btn ${selectedPeriod === period ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '12px', padding: '5px 10px' }}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
            <button
              onClick={() => resetPeriodSelection('custom')}
              className={`btn ${selectedPeriod === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '12px', padding: '5px 10px' }}
            >
              Custom
            </button>
          </div>
        </div>

        {/* Weekly Navigation */}
        {selectedPeriod === 'weekly' && (
          <div className="flex items-center gap-10 mb-20">
            <button 
              onClick={goToPreviousWeek}
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '5px 10px' }}
            >
              ← Previous Week
            </button>
            <button 
              onClick={goToCurrentWeek}
              className={`btn ${weekOffset === 0 ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '12px', padding: '5px 10px' }}
            >
              Current Week
            </button>
            <button 
              onClick={goToNextWeek}
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '5px 10px' }}
            >
              Next Week →
            </button>
            {weekOffset !== 0 && (
              <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>
                {weekOffset < 0 ? `${Math.abs(weekOffset)} week${Math.abs(weekOffset) > 1 ? 's' : ''} ago` : 
                 `${weekOffset} week${weekOffset > 1 ? 's' : ''} ahead`}
              </span>
            )}
          </div>
        )}

        {/* Monthly Selection */}
        {selectedPeriod === 'monthly' && (
          <div className="flex items-center gap-10 mb-20">
            <label style={{ fontSize: '14px', fontWeight: '500' }}>Select Month & Year:</label>
            <select
              className="form-control"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              style={{ width: 'auto' }}
            >
              {[
                { value: 1, label: 'January' },
                { value: 2, label: 'February' },
                { value: 3, label: 'March' },
                { value: 4, label: 'April' },
                { value: 5, label: 'May' },
                { value: 6, label: 'June' },
                { value: 7, label: 'July' },
                { value: 8, label: 'August' },
                { value: 9, label: 'September' },
                { value: 10, label: 'October' },
                { value: 11, label: 'November' },
                { value: 12, label: 'December' }
              ].map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <select
              className="form-control"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{ width: 'auto' }}
            >
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Custom Date Range */}
        {selectedPeriod === 'custom' && (
          <div className="flex items-center gap-10 mb-20">
            <input
              type="date"
              className="form-control"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              style={{ width: 'auto' }}
            />
            <span>to</span>
            <input
              type="date"
              className="form-control"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              style={{ width: 'auto' }}
            />
            <button 
              onClick={handleCustomDateSubmit}
              className="btn btn-primary"
              style={{ fontSize: '12px', padding: '5px 15px' }}
            >
              Apply
            </button>
          </div>
        )}

        {/* Analytics Data */}
        {analyticsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            Loading analytics...
          </div>
        ) : analytics ? (
          <div>
            {/* Period Info */}
            <div className="mb-20" style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '10px 15px', 
              borderRadius: '5px',
              fontSize: '14px',
              color: '#666'
            }}>
              <Calendar size={16} style={{ display: 'inline', marginRight: '5px' }} />
              Period: {formatPeriodDisplay(analytics.period, analytics.startDate, analytics.endDate)} ({analytics.period})
            </div>

            {/* Summary Cards */}
            <div className="grid grid-2 gap-20 mb-20">
              <div style={{ 
                backgroundColor: '#e7f3ff', 
                padding: '20px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <Activity size={24} style={{ color: '#0066cc', marginBottom: '10px' }} />
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0066cc' }}>
                  {formatMeters(analytics.analytics?.grandTotalMeters)}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Total Meters</div>
              </div>
              
              <div style={{ 
                backgroundColor: '#e7f7e7', 
                padding: '20px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <DollarSign size={24} style={{ color: '#00aa00', marginBottom: '10px' }} />
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00aa00' }}>
                  {formatCurrency(analytics.analytics?.grandTotalCost)}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Total Earnings</div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            {analytics.analytics?.data && analytics.analytics.data.length > 0 && (
              <div>
                <h4 className="mb-15">Detailed Breakdown</h4>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Machine</th>
                      <th>Product</th>
                      <th>Meters</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.analytics.data.map((item, index) => (
                      <tr key={index}>
                        <td>Machine {item.machine_id}</td>
                        <td>{item.product_name}</td>
                        <td>{formatMeters(item.totalmeters)}</td>
                        <td>{formatCurrency(item.totalcost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No analytics data available for the selected period.
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerDetail;