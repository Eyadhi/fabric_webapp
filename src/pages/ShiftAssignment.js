import React, { useState, useEffect } from 'react';
import { flexibleShiftAPI, shiftAPI, workerAPI, machineAPI } from '../services/api';
import { Plus, Calendar, User, Factory, Clock, Save, X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { createPortal } from "react-dom";

const ShiftAssignment = () => {
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
    loadCurrentWeekAssignments();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');

      const [workersRes, machinesRes, shiftsRes] = await Promise.all([
        workerAPI.getAll(),
        machineAPI.getAll(),
        shiftAPI.getAll()
      ]);

      const workersData = Array.isArray(workersRes.data) ? workersRes.data : (workersRes.data?.data || []);
      const machinesData = machinesRes.data?.data || machinesRes.data || [];
      const shiftsData = shiftsRes.data?.data || shiftsRes.data || [];

      setWorkers(workersData);
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

      // Calculate current week (Sat–Fri)
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

      const startDate = startOfWeek.toISOString().split('T')[0];
      const endDate = endOfWeek.toISOString().split('T')[0];

      console.log('Fetching assignments for:', startDate, endDate);

      const response = await flexibleShiftAPI.getWorkerAssignments(
        startDate,
        endDate
      );

      const assignments = response.data?.data || [];
      setCurrentWeekAssignments(assignments);

    } catch (err) {
      console.error(err);
      setError('Failed to load current week assignments');
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

        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Loading assignments...
          </div>
        ) : currentWeekAssignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p>No shift assignments found for this week.</p>
            <p className="text-sm">Click "Assign Shift" to create new assignments.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left border whitespace-nowrap">Worker</th>
                  <th className="px-4 py-2 text-left border whitespace-nowrap">Machine</th>
                  <th className="px-4 py-2 text-left border whitespace-nowrap">Shift</th>
                  <th className="px-4 py-2 text-left border whitespace-nowrap">Type</th>
                  <th className="px-4 py-2 text-left border whitespace-nowrap">Period</th>
                  <th className="px-4 py-2 text-left border whitespace-nowrap">Status</th>
                </tr>
              </thead>

              <tbody>
                {currentWeekAssignments.map((assignment, index) => (
                  <tr
                    key={`${assignment.workerId}-${assignment.machineId}-${index}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-2 border whitespace-nowrap font-medium">
                      {assignment.workerName}
                    </td>

                    <td className="px-4 py-2 border whitespace-nowrap">
                      {assignment.machineCode}
                    </td>

                    <td className="px-4 py-2 border whitespace-nowrap">
                      {assignment.shiftName}
                    </td>

                    <td className="px-4 py-2 border whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs ${getAssignmentTypeStyle(
                          assignment.assignmentType
                        )}`}
                      >
                        {getAssignmentTypeLabel(assignment.assignmentType)}
                      </span>
                    </td>

                    <td className="px-4 py-2 border whitespace-nowrap">
                      {new Date(assignment.periodStartDate).toLocaleDateString()} to{' '}
                      {new Date(assignment.periodEndDate).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-2 border whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs ${assignment.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {assignment.isActive ? 'Active' : 'Inactive'}
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
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }} onClick={() => setShowAssignmentModal(false)}>
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              maxWidth: '700px',
              width: '100%',
              margin: '0 16px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }} onClick={(e) => e.stopPropagation()}>
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

const getAssignmentTypeLabel = (type) => {
  return type === 1 ? 'WEEKLY' : 'CUSTOM';
};

const getAssignmentTypeStyle = (type) => {
  return type === 1
    ? 'bg-blue-100 text-blue-800'
    : 'bg-purple-100 text-purple-800';
};


export default ShiftAssignment;