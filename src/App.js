import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import WorkerDetail from './pages/WorkerDetail';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Meters from './pages/Meters';
import MachineDetail from './pages/MachineDetail';
import StoredFiles from './pages/StoredFiles';
import ShiftAssignment from './pages/ShiftAssignment';
import SalaryCalculation from './pages/SalaryCalculation';
import Roles from './pages/Roles';
import AdminUsers from './pages/AdminUsers';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/workers" element={
              <ProtectedRoute>
                <Layout>
                  <Workers />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/worker/:workerId" element={
              <ProtectedRoute>
                <Layout>
                  <WorkerDetail />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute>
                <Layout>
                  <Products />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/product-detail/:productId" element={
              <ProtectedRoute>
                <Layout>
                  <ProductDetail />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/meters" element={
              <ProtectedRoute>
                <Layout>
                  <Meters />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/machine/:machineId" element={
              <ProtectedRoute>
                <Layout>
                  <MachineDetail />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/stored-files" element={
              <ProtectedRoute>
                <Layout>
                  <StoredFiles />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/shift-assignment" element={
              <ProtectedRoute>
                <Layout>
                  <ShiftAssignment />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/salary-calculation" element={
              <ProtectedRoute>
                <Layout>
                  <SalaryCalculation />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/roles" element={
              <ProtectedRoute>
                <Layout>
                  <Roles />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute>
                <Layout>
                  <AdminUsers />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;