import React, { useState, useEffect } from 'react';
import { flexibleShiftAPI, shiftAPI, workerAPI, machineAPI } from '../services/api';
import { Plus, Calendar, User, Factory, Clock, Save, X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { createPortal } from "react-dom";

const ShiftAssignment = () => {
  const [isWorkersLoaded, setIsWorkersLoaded] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [currentWeekAssignments, setCurrentWeekAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  // Assignment form state
  const [assignmentForm, setAssignmentForm] = useState({
    workerId: '',
    machineIds: [],
    shiftId: '',
    assignmentType: 'WEEKLY',
    periodStartDate: '',
    periodEndDate: '',
    calculationPeriodWeeks: 1
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    console.log('Workers loaded:', workers.length);
    if (workers.length > 0) {
      loadCurrentWeekAssignments();
    }
  }, [isWorkersLoaded]); 

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [workersRes, machinesRes, shiftsRes] = await Promise.all([
        workerAPI.getAll(),
        machineAPI.getAll(),
        shiftAPI.getAll()
      ]);

      // Handle different response structures
      // Workers API returns data directly, others use ResponseUtil wrapper
      const workersData = Array.isArray(workersRes.data) ? workersRes.data : (workersRes.data?.data || []);
      const machinesData = machinesRes.data?.data || machinesRes.data || [];
      const shiftsData = shiftsRes.data?.data || shiftsRes.data || [];

      setWorkers(workersData);
      if(workersData.length > 0) {
        setIsWorkersLoaded(true);
      }

      setMachines(machinesData);
      setShifts(shiftsData);

    } catch (err) {
      const errorMessage = 'Failed to load initial data: ' + (err.response?.data?.data?.error || err.message);
      setError(errorMessage);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentWeekAssignments = async () => {
    try {
      setLoading(true);
      setError('');

      if (workers.length === 0) {
        console.log('No workers loaded yet');
        return;
      }

      // Get current week range (Saturday to Friday)
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      // Calculate this week's Saturday (start of week)
      let startOfWeek = new Date(today);
      if (currentDay === 0) { // Sunday
        startOfWeek.setDate(today.getDate() - 1); // Go to Saturday
      } else {
        startOfWeek.setDate(today.getDate() - currentDay + 6); // Go to Saturday
        if (currentDay < 6) { // If not Saturday, go to previous Saturday
          startOfWeek.setDate(startOfWeek.getDate() - 7);
        }
      }
      
      // Calculate this week's Friday (end of week)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Friday

      console.log('=== LOADING CURRENT WEEK ASSIGNMENTS ===');
      console.log('Today:', today.toISOString().split('T')[0], '(Day:', currentDay, ')');
      console.log('Current week range:', startOfWeek.toISOString().split('T')[0], 'to', endOfWeek.toISOString().split('T')[0]);
      console.log('Workers to check:', workers.length);

      // Get all assignments that overlap with current week
      const allAssignments = [];
      for (const worker of workers) {
        try {
          console.log(`Checking worker: ${worker.workerName} (ID: ${worker.id})`);
          
          const response = await flexibleShiftAPI.getWorkerAssignments(
            worker.id,
            startOfWeek.toISOString().split('T')[0],
            endOfWeek.toISOString().split('T')[0]
          );
          
          const assignments = response.data.data || [];
          console.log(`Found ${assignments.length} assignments for worker ${worker.workerName}:`, assignments);
          
          allAssignments.push(...assignments);
        } catch (err) {
          console.warn(`Failed to load assignments for worker ${worker.workerName}:`, err);
        }
      }
      
      console.log('Total assignments found:', allAssignments.length);
      console.log('All assignments:', allAssignments);
      setCurrentWeekAssignments(allAssignments);
      
    } catch (err) {
      console.error('Error loading current week assignments:', err);
      setError('Failed to load current week assignments: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    
    if (!assignmentForm.workerId) {
      toast.error('Please select a worker');
      return;
    }

    if (assignmentForm.machineIds.length === 0) {
      toast.error('Please select at least one machine');
      return;
    }

    if (!assignmentForm.shiftId) {
      toast.error('Please select a shift');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Create assignments for each selected machine
      const promises = assignmentForm.machineIds.map(machineId => {
        if (assignmentForm.assignmentType === 'WEEKLY') {
          return flexibleShiftAPI.createWeeklyAssignment(
            assignmentForm.workerId,
            machineId,
            assignmentForm.shiftId,
            assignmentForm.periodStartDate,
            assignmentForm.calculationPeriodWeeks
          );
        } else {
          return flexibleShiftAPI.createCustomRangeAssignment(
            assignmentForm.workerId,
            machineId,
            assignmentForm.shiftId,
            assignmentForm.periodStartDate,
            assignmentForm.periodEndDate,
            assignmentForm.calculationPeriodWeeks
          );
        }
      });

      await Promise.all(promises);
      
      toast.success(`Assignments created successfully for ${assignmentForm.machineIds.length} machine(s)`);
      
      // Reset form and close modal
      setAssignmentForm({
        workerId: '',
        machineIds: [],
        shiftId: '',
        assignmentType: 'WEEKLY',
        periodStartDate: '',
        periodEndDate: '',
        calculationPeriodWeeks: 1
      });
      setShowAssignmentModal(false);

      // Refresh assignments
      loadCurrentWeekAssignments();

    } catch (err) {
      const errorMessage = 'Failed to create assignments: ' + (err.response?.data?.data?.error || err.message);
      setError(errorMessage);
      toast.error('Failed to create assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleMachineToggle = (machineId) => {
    setAssignmentForm(prev => ({
      ...prev,
      machineIds: prev.machineIds.includes(machineId)
        ? prev.machineIds.filter(id => id !== machineId)
        : [...prev.machineIds, machineId]
    }));
  };

  const getSaturday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) - 1;
    const saturday = new Date(d.setDate(diff));
    saturday.setDate(saturday.getDate() + (6 - saturday.getDay()));
    return saturday.toISOString().split('T')[0];
  };

  const handleStartDateChange = (date) => {
    setAssignmentForm(prev => {
      const newForm = { ...prev, periodStartDate: date };
      if (prev.assignmentType === 'WEEKLY') {
        const saturday = getSaturday(date);
        newForm.periodStartDate = saturday;
        newForm.periodEndDate = new Date(new Date(saturday).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }
      return newForm;
    });
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header with Assignment Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Clock className="mr-3" size={32} />
          Shift Assignment
        </h1>
        <button
          onClick={() => setShowAssignmentModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus size={20} />
          Assign Shift
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Current Week Assignments */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Calendar className="mr-2" size={20} />
            Current Week Assignments
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={loadCurrentWeekAssignments}
              disabled={loading}
              className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <div className="text-sm text-gray-600">
              {(() => {
                const today = new Date();
                const currentDay = today.getDay();
                let startOfWeek = new Date(today);
                if (currentDay === 0) {
                  startOfWeek.setDate(today.getDate() - 1);
                } else {
                  startOfWeek.setDate(today.getDate() - currentDay + 6);
                  if (currentDay < 6) {
                    startOfWeek.setDate(startOfWeek.getDate() - 7);
                  }
                }
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                
                return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()} (Sat-Fri)`;
              })()}
            </div>
          </div>
        </div>
        
        {currentWeekAssignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p>No shift assignments found for this week.</p>
            <p className="text-sm">Click "Assign Shift" to create new assignments.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Worker</th>
                  <th className="px-4 py-2 text-left">Machine</th>
                  <th className="px-4 py-2 text-left">Shift</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Period</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {currentWeekAssignments.map((assignment, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{assignment.workerName}</td>
                    <td className="px-4 py-2">{assignment.machineCode}</td>
                    <td className="px-4 py-2">{assignment.shiftName}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        assignment.assignmentType === 'WEEKLY' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {assignment.assignmentType}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {assignment.periodStartDate} to {assignment.periodEndDate}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        assignment.salaryCalculated 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {assignment.salaryCalculated ? 'Salary Calculated' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && 
      createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Plus className="mr-2" size={20} />
                  Create Shift Assignment
                </h2>
              <button
                onClick={() => setShowAssignmentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAssignmentSubmit}>
              {/* Worker Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  <User className="inline mr-1" size={16} />
                  Select Worker
                </label>
                <select
                  value={assignmentForm.workerId}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, workerId: e.target.value }))}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Choose a worker...</option>
                  {workers.map(worker => (
                    <option key={worker.id} value={worker.id}>
                      {worker.workerName} ({worker.workerCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Machine Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  <Factory className="inline mr-1" size={16} />
                  Select Machines
                </label>
                <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                  {machines.map(machine => (
                    <label key={machine.id} className="flex items-center p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={assignmentForm.machineIds.includes(machine.id)}
                        onChange={() => handleMachineToggle(machine.id)}
                        className="mr-2"
                      />
                      <span>{machine.machineCode} - {machine.machineName}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Shift Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  <Clock className="inline mr-1" size={16} />
                  Select Shift
                </label>
                <select
                  value={assignmentForm.shiftId}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, shiftId: e.target.value }))}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Choose shift...</option>
                  {shifts.map(shift => (
                    <option key={shift.id} value={shift.id}>
                      {shift.shiftName} ({shift.startTime} - {shift.endTime})
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignment Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Assignment Type</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="WEEKLY"
                      checked={assignmentForm.assignmentType === 'WEEKLY'}
                      onChange={(e) => setAssignmentForm(prev => ({ ...prev, assignmentType: e.target.value }))}
                      className="mr-2"
                    />
                    Weekly (Saturday to Friday)
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="CUSTOM_RANGE"
                      checked={assignmentForm.assignmentType === 'CUSTOM_RANGE'}
                      onChange={(e) => setAssignmentForm(prev => ({ ...prev, assignmentType: e.target.value }))}
                      className="mr-2"
                    />
                    Custom Range
                  </label>
                </div>
              </div>

              {/* Date Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="inline mr-1" size={16} />
                  {assignmentForm.assignmentType === 'WEEKLY' ? 'Week Start Date' : 'Start Date'}
                </label>
                <input
                  type="date"
                  value={assignmentForm.periodStartDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              {assignmentForm.assignmentType === 'CUSTOM_RANGE' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    value={assignmentForm.periodEndDate}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, periodEndDate: e.target.value }))}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              )}

              {/* Calculation Period */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Calculation Period</label>
                <select
                  value={assignmentForm.calculationPeriodWeeks}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, calculationPeriodWeeks: parseInt(e.target.value) }))}
                  className="w-full p-2 border rounded"
                >
                  <option value={1}>1 Week</option>
                  <option value={2}>2 Weeks (Bi-weekly)</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center"
                >
                  <Save className="mr-2" size={16} />
                  {loading ? 'Creating...' : 'Create Assignment'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-center">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftAssignment;