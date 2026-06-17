import axios from 'axios';

// Environment-based API URL configuration
const getApiBaseUrl = () => {
  // Production environment variable
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Development fallback
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8080';
  }

  // Production fallback - replace with your actual backend URL
  return 'https://fabric-backend-api.onrender.com';
  // return 'https://your-backend-url.railway.app';
};

const API_BASE_URL = getApiBaseUrl();

// Utility function to check if token exists and is valid
const getValidToken = () => {
  const token = localStorage.getItem('token');
  if (!token || token === 'undefined' || token === 'null') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }
  return token;
};

// Utility function to check if JWT is expired
const isJWTExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return false; // If we can't decode, assume it's invalid rather than expired
  }
};

// Function to handle token-related redirects with specific messages
const handleTokenError = (isExpired = false) => {
  // Clear all auth data
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  // Show specific error message
  const message = isExpired ? 'Token expired. Please log in again.' : 'Invalid token. Please log in again.';

  // Only show message if not already on login page
  if (window.location.pathname !== '/login') {
    alert(message);
  }

  // Redirect to login page
  window.location.href = '/login';
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout to prevent cancellations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = getValidToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized (invalid/expired token)
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');
      let isExpired = false;

      // Check backend response for specific error type
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || '';
      const errorType = errorData?.errorType;

      // Determine if token is expired or invalid based on backend response
      if (errorType === 'EXPIRED' || errorMessage.toLowerCase().includes('expired')) {
        isExpired = true;
      } else if (errorType === 'INVALID' || errorMessage.toLowerCase().includes('invalid')) {
        isExpired = false;
      } else {
        // Fallback: check token locally if backend doesn't specify
        if (token && token !== 'undefined' && token !== 'null') {
          try {
            isExpired = isJWTExpired(token);
          } catch (e) {
            // Error checking token expiration
          }
        }
      }

      handleTokenError(isExpired);

      return Promise.reject(error);
    }

    // Handle 403 Forbidden (insufficient permissions)
    if (error.response?.status === 403) {
      const message = error.response?.data?.message || 'Access denied. You do not have permission to perform this action.';
      alert(message);
    }

    return Promise.reject(error);
  }
);


// Auth API
export const authAPI = {
  login: (credentials) => api.post('/login/login', credentials),
};

// Admin APIs
export const workerAPI = {
  getAll: () => api.get('/users/getWorker'),
  getById: (id) => api.get(`/users/getWorker?id=${id}`),
  create: (data) => api.post('/users/addWorker', data),
  update: (data) => api.post('/users/updateWorker', data),
  getAnalytics: (workerId, period, startDate = null, endDate = null) => {
    const params = new URLSearchParams({
      workerId: workerId.toString(),
      period: period
    });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get(`/users/getWorkerAnalytics?${params.toString()}`);
  },
};

export const productAPI = {
  getAll: () => api.get('/users/getProduct'),
  getById: (id) => api.get(`/users/getProduct?id=${id}`),
  getRunning: () => api.get('/users/getRunningProducts'),
  getCompleted: () => api.get('/users/getCompletedProducts'),
  getStats: () => api.get('/users/getProductStats'),
  checkMachineAvailability: (machineId) => api.get(`/users/checkMachineAvailability?machineId=${machineId}`),
  create: (data) => api.post('/users/addProducts', data),
  createMultiMachine: (data) => api.post('/users/addProductsToMultipleMachines', data),
  update: (data) => api.post('/users/updateProduct', data),
  updateStatus: (productId, isComplete, endDate = null) => {
    const params = new URLSearchParams({
      productId: productId.toString(),
      isComplete: isComplete.toString()
    });
    if (endDate) {
      params.append('endDate', endDate);
    }
    return api.post(`/users/updateProductStatus?${params.toString()}`);
  },
  updateStatusDto: (data) => api.post('/users/updateProductStatusDto', data),
  // Convenience method for completing a product with custom end date
  completeProduct: (productId, endDate = null) => {
    return api.post('/users/updateProductStatusDto', {
      productId,
      isComplete: 2,
      endDate
    });
  },
  // Convenience method for reopening a product
  reopenProduct: (productId) => {
    return api.post('/users/updateProductStatusDto', {
      productId,
      isComplete: 1,
      endDate: null
    });
  },
  // Update completion status for specific machines of a product
  updateMachineCompletion: (data) => api.post('/users/updateProductMachineCompletion', data)
};

export const pieceAPI = {
  getAll: () => api.get('/users/getPiece'),
  getById: (id) => api.get(`/users/getPiece?id=${id}`),
  getByProductId: (productId) => api.get(`/users/getPiece?productId=${productId}`),
  create: (data) => api.post('/users/addPieces', data),
  uploadExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/uploadPieceExcel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  downloadExcel: (productId = null) => {
    const url = productId
      ? `/users/downloadPieceExcel?productId=${productId}`
      : '/users/downloadPieceExcel';
    return api.get(url, { responseType: 'blob' });
  },
  downloadTemplate: () => api.get('/users/downloadPieceTemplate', { responseType: 'blob' }),
  getStatistics: (productId) => api.get(`/users/getPieceStatistics?productId=${productId}`)
};

export const meterAPI = {
  create: (data) => api.post('/users/savemeter', data),
  getTotalCost: (workerId, weekStart) =>
    api.get(`/users/gettotalcost?workerId=${workerId}&weekStart=${weekStart}`),
  uploadExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/uploadMetersExcel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const fileAPI = {
  storeBill: (imageData, workerName, weekStartDate, workerId) =>
    api.post('/users/storeBill', {
      imageData,
      workerName,
      weekStartDate,
      workerId
    }),
  getAllBills: () => api.get('/users/bills'),
  getBillsByWorker: (workerId) => api.get(`/users/bills/worker/${workerId}`),
  getBillsByWeek: (weekStartDate) => api.get(`/users/bills/week/${weekStartDate}`),
  getAllExcelUploads: () => api.get('/users/excel-uploads'),
  downloadFile: (fileId) => api.get(`/users/download/${fileId}`, { responseType: 'blob' }),
  deleteFile: (fileId) => api.delete(`/users/${fileId}`)
};



// New Flexible Shift Assignment API
export const flexibleShiftAPI = {
  // Create flexible assignment (weekly or custom range)
  createFlexibleAssignment: (data) => api.post('/user/shifts/assign', data),

  // Create weekly assignment (Saturday to Friday)
  createWeeklyAssignment: (workerId, machineId, shiftId, weekStartDate, calculationWeeks = 1) => {
    const params = new URLSearchParams({
      workerId: workerId.toString(),
      machineId: machineId.toString(),
      shiftId: shiftId.toString(),
      weekStartDate: weekStartDate,
      calculationWeeks: calculationWeeks.toString()
    });
    return api.post(`/users/shifts/assign-weekly?${params.toString()}`);
  },

  // Create custom range assignment
  createCustomRangeAssignment: (workerId, machineId, shiftId, startDate, endDate, calculationWeeks = 1) => {
    const params = new URLSearchParams({
      workerId: workerId.toString(),
      machineId: machineId.toString(),
      shiftId: shiftId.toString(),
      startDate: startDate,
      endDate: endDate,
      calculationWeeks: calculationWeeks.toString()
    });
    return api.post(`/users/shifts/assign-custom?${params.toString()}`);
  },

  // Get worker assignments for a period
  getWorkerAssignments: (startDate, endDate) => {
    const params = new URLSearchParams({
      startDate: startDate,
      endDate: endDate
    });
    return api.get(`/users/shifts/all-worker-assignments?${params.toString()}`);
  },

  // Calculate weekly salary (Saturday to Friday)
  calculateWeeklySalary: (weekEndDate) => {
    const params = new URLSearchParams({
      weekEndDate: weekEndDate
    });
    return api.post(`/users/calculate-weekly-salary?${params.toString()}`);
  },

  // Calculate bi-weekly salary (2 weeks) - using custom period with 2 weeks
  calculateBiWeeklySalary: (periodEndDate) => {
    const startDate = new Date(periodEndDate);
    startDate.setDate(startDate.getDate() - 13); // 2 weeks = 14 days - 1
    const params = new URLSearchParams({
      startDate: startDate.toISOString().split('T')[0],
      endDate: periodEndDate
    });
    return api.post(`/users/calculate-custom-salary?${params.toString()}`);
  },

  // Calculate custom period salary
  calculateCustomPeriodSalary: (startDate, endDate) => {
    const params = new URLSearchParams({
      startDate: startDate,
      endDate: endDate
    });
    return api.post(`/users/calculate-custom-salary?${params.toString()}`);
  }
};

// Shift Management API
export const shiftAPI = {
  getAll: () => api.get('/all/shifts'),
  getById: (id) => api.get(`/all/shifts?id=${id}`),
  create: (data) => api.post('/admin/createshift', data),
  update: (id, data) => api.put(`/admin/shifts/${id}`, data),
  delete: (id) => api.delete(`/admin/shifts/${id}`)
};

export const machineAPI = {
  getAll: () => api.get('/users/getMachine'),
  getById: (id) => api.get(`/users/getMachine?id=${id}`),
  create: (data) => api.post('/users/addMachine', data),
  getMeters: (machineId, startDate = null, endDate = null) => {
    let url = `/users/getMachineMeters?machineId=${machineId}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    return api.get(url);
  },
  getRunningProduct: (machineId) => api.get(`/users/getMachineRunningProduct?machineId=${machineId}`),
  getProducts: (machineId) => api.get(`/users/getMachineProducts?machineId=${machineId}`),
  uploadExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/uploadMetersExcel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Role Management API
export const roleAPI = {
  getAll: () => api.get('/admin/getrole'),
  getById: (id) => api.get(`/admin/getrole?id=${id}`),
  create: (data) => api.post('/admin/roles', data)
};

export const ExpenseAPI = {
  getAllExpenses: ({ year, month, startDate, endDate } = {}) => {
    const params = new URLSearchParams();

    if (year !== null && year !== '') params.append('year', year);
    if (month !== null && month !== '') params.append('month', month);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const url = queryString
      ? `/users/getExpenses?${queryString}`
      : `/users/getExpenses`;

    return api.get(url);
  },

  getExpenseTypes: () => api.get('/users/expenseType'),
  addExpense: (data) => api.post('/users/addExpenses', data)
};

// Admin Registration API
export const adminAPI = {
  register: (data) => api.post('/admin/register', data)
};

export default api;