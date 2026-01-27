import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Package, Edit, CheckCircle, Clock, Plus, Calendar, Ruler, Download, BarChart3, TrendingUp } from 'lucide-react';
import { productAPI, machineAPI, pieceAPI, fileAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const chartRef = useRef();
  
  const [product, setProduct] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [machines, setMachines] = useState([]);
  const [pieceStatistics, setPieceStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddPieceForm, setShowAddPieceForm] = useState(false);
  const [showExcelUploadModal, setShowExcelUploadModal] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showMachineCompletionModal, setShowMachineCompletionModal] = useState(false);
  const [selectedCompletionMachines, setSelectedCompletionMachines] = useState([]);
  const [endDate, setEndDate] = useState('');
  const [selectedUpdateMachines, setSelectedUpdateMachines] = useState([]);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const { register: registerPiece, handleSubmit: handleSubmitPiece, reset: resetPiece, formState: { errors: pieceErrors } } = useForm();

  useEffect(() => {
    fetchProductDetail();
    fetchMachines();
    fetchPieces();
    fetchPieceStatistics();
  }, [productId]);

  const fetchProductDetail = async () => {
    try {
      const response = await productAPI.getById(productId);
      const productData = response.data?.data || response.data;
      
      if (Array.isArray(productData) && productData.length > 0) {
        setProduct(productData[0]);
        populateEditForm(productData[0]);
      } else {
        toast.error('Product not found');
        navigate('/products');
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Failed to fetch product details');
      navigate('/products');
    }
  };

  const fetchMachines = async () => {
    try {
      const response = await machineAPI.getAll();
      const machineData = response.data?.data || response.data;
      if (Array.isArray(machineData)) {
        setMachines(machineData);
      }
    } catch (error) {
      console.error('Failed to fetch machines:', error);
    }
  };

  const fetchPieces = async () => {
    try {
      const response = await pieceAPI.getByProductId(productId);
      const pieceData = response.data?.data || response.data;
      if (Array.isArray(pieceData)) {
        setPieces(pieceData);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch pieces:', error);
      setLoading(false);
    }
  };

  const fetchPieceStatistics = async () => {
    try {
      const response = await pieceAPI.getStatistics(productId);
      const statisticsData = response.data?.data || response.data;
      setPieceStatistics(statisticsData);
    } catch (error) {
      console.error('Failed to fetch piece statistics:', error);
    }
  };

  const populateEditForm = (productData) => {
    setValue('productCode', productData.productCode || '');
    setValue('productName', productData.productName || '');
    setValue('description', productData.description || '');
    setValue('meters', productData.meters || '');
    setValue('costin', productData.costin || '');
    setValue('costout', productData.costout || '');
    setValue('startDate', productData.startDate || '');
    setValue('pointDecrease', productData.pointDecrease || '');
    
    // Set selected machines if product has machines
    if (productData.machines) {
      setSelectedUpdateMachines(productData.machines.map(m => m.machineId));
    } else if (productData.machineId) {
      setSelectedUpdateMachines([productData.machineId]);
    }
  };

  const handleEditSubmit = async (data) => {
    try {
      if (selectedUpdateMachines.length === 0) {
        toast.error('Please select at least one machine');
        return;
      }

      const updateData = {
        id: parseInt(productId),
        productCode: data.productCode,
        productName: data.productName,
        description: data.description,
        meters: parseInt(data.meters),
        costin: parseInt(data.costin),
        costout: parseInt(data.costout),
        startDate: data.startDate,
        pointDecrease: data.pointDecrease ? parseFloat(data.pointDecrease) : 0,
        machineIds: selectedUpdateMachines.map(id => parseInt(id))
      };

      await productAPI.update(updateData);
      toast.success('Product updated successfully!');
      setShowEditForm(false);
      fetchProductDetail();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update product';
      toast.error(message);
    }
  };

  const handleAddPiece = async (data) => {
    try {
      const pieceData = {
        productId: parseInt(productId),
        exportDate: data.exportDate,
        meters: parseFloat(data.meters)
      };

      await pieceAPI.create(pieceData);
      toast.success('Piece added successfully!');
      setShowAddPieceForm(false);
      resetPiece();
      fetchPieces();
      fetchPieceStatistics(); // Refresh statistics after adding piece
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add piece';
      toast.error(message);
    }
  };

  // Prepare chart data from statistics
  const getChartData = () => {
    if (!pieceStatistics?.dateWiseMeters) return null;

    const dateWiseMeters = pieceStatistics.dateWiseMeters;
    const sortedDates = Object.keys(dateWiseMeters).sort();
    
    return {
      labels: sortedDates,
      datasets: [
        {
          label: 'Meters per Date',
          data: sortedDates.map(date => parseFloat(dateWiseMeters[date])),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Date-wise Piece Production (Meters)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Meters'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
  };

  const downloadPieceListSummary = async () => {
    // Create a canvas with detailed piece list
    const canvas = document.createElement('canvas');
    const lineHeight = 25;
    const headerHeight = 80;
    const footerHeight = 60;
    const padding = 20;
    
    // Calculate canvas height based on number of pieces
    const contentHeight = pieces.length * lineHeight + headerHeight + footerHeight + (padding * 2);
    canvas.width = 600;
    canvas.height = Math.max(contentHeight, 300);
    
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Border
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    let yPosition = 40;
    
    // Title
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Piece Production Summary', canvas.width / 2, yPosition);
    yPosition += 30;
    
    // Product info
    ctx.font = '14px Arial';
    ctx.fillText(`Product: ${product?.productName || 'N/A'}`, canvas.width / 2, yPosition);
    yPosition += 20;
    ctx.fillText(`Product Code: ${product?.productCode || 'N/A'}`, canvas.width / 2, yPosition);
    yPosition += 35;
    
    // Table headers
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#007bff';
    ctx.fillText('Piece ID', 30, yPosition);
    ctx.fillText('Export Date', 150, yPosition);
    ctx.fillText('Meters', 300, yPosition);
    yPosition += 5;
    
    // Header underline
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, yPosition);
    ctx.lineTo(canvas.width - 30, yPosition);
    ctx.stroke();
    yPosition += 20;
    
    // Piece list
    ctx.font = '12px Arial';
    ctx.fillStyle = '#333333';
    
    // Sort pieces by date
    const sortedPieces = [...pieces].sort((a, b) => new Date(a.exporDate) - new Date(b.exporDate));
    
    // Calculate total meters from actual pieces data
    const totalMeters = pieces.reduce((sum, piece) => sum + parseFloat(piece.meters || 0), 0);
    
    sortedPieces.forEach((piece, index) => {
      // Alternate row background
      if (index % 2 === 0) {
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(25, yPosition - 15, canvas.width - 50, 20);
      }
      
      ctx.fillStyle = '#333333';
      ctx.fillText(`#${piece.id}`, 30, yPosition);
      ctx.fillText(piece.exporDate, 150, yPosition);
      ctx.fillText(`${parseFloat(piece.meters).toFixed(2)}`, 300, yPosition);
      yPosition += lineHeight;
    });
    
    // Total section
    yPosition += 20;
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, yPosition);
    ctx.lineTo(canvas.width - 30, yPosition);
    ctx.stroke();
    yPosition += 25;
    
    // Total meters - using calculated total from pieces
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#007bff';
    ctx.textAlign = 'right';
    ctx.fillText(`Total Meters: ${totalMeters.toFixed(2)}`, canvas.width - 30, yPosition);
    yPosition += 25;
    
    // Date and piece count
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'center';
    ctx.fillText(`Total Pieces: ${pieces.length} | Generated on: ${new Date().toLocaleDateString()}`, canvas.width / 2, yPosition);
    
    // Convert canvas to base64 image data
    const imageData = canvas.toDataURL('image/png');
    
    try {
      // Store image in backend using storeBill method with appropriate parameters
      const fileName = `piece_summary_${product?.productName || 'product'}_${new Date().toISOString().split('T')[0]}`;
      const currentDate = new Date().toISOString().split('T')[0];
      await fileAPI.storeBill(imageData, fileName, currentDate, productId);
      
      // Also download to user's browser
      const link = document.createElement('a');
      link.download = `piece_list_summary_product_${productId}.png`;
      link.href = imageData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Piece list summary downloaded and stored successfully!');
    } catch (error) {
      console.error('Error storing image:', error);
      // Fallback to just download if storage fails
      const link = document.createElement('a');
      link.download = `piece_list_summary_product_${productId}.png`;
      link.href = imageData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Piece list summary downloaded!');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('Please select a valid Excel file (.xlsx or .xls)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleExcelUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      const response = await pieceAPI.uploadExcel(selectedFile);
      const result = response.data?.data || response.data;
      
      if (result.failedRows === 0) {
        toast.success(`Successfully uploaded ${result.successfulRows} pieces!`);
      } else {
        toast.success(`Uploaded ${result.successfulRows} pieces. ${result.failedRows} failed.`);
        if (result.errors && result.errors.length > 0) {
          console.log('Upload errors:', result.errors);
          // Show first few errors
          result.errors.slice(0, 3).forEach(error => {
            toast.error(error, { duration: 5000 });
          });
        }
      }
      
      setShowExcelUploadModal(false);
      setSelectedFile(null);
      fetchPieces();
      fetchPieceStatistics(); // Refresh statistics after upload
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to upload Excel file';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await pieceAPI.downloadExcel(productId);
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pieces_product_${productId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Excel file downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download Excel file');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await pieceAPI.downloadTemplate();
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'piece_upload_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const handleMarkComplete = () => {
    if (product.machines && product.machines.length > 1) {
      setSelectedCompletionMachines([]);
      setShowMachineCompletionModal(true);
    } else {
      // Single machine completion
      handleSingleMachineCompletion();
    }
  };

  const handleSingleMachineCompletion = async () => {
    try {
      const machineIds = product.machines ? [product.machines[0].machineId] : [product.machineId];
      const completionData = {
        productId: parseInt(productId),
        machineIds: machineIds,
        endDate: endDate || null,
        isComplete: 2
      };
      
      await productAPI.updateMachineCompletion(completionData);
      toast.success('Product marked as completed!');
      fetchProductDetail();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to mark product complete';
      toast.error(message);
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

  const confirmMachineCompletion = async () => {
    if (selectedCompletionMachines.length > 0) {
      try {
        const completionData = {
          productId: parseInt(productId),
          machineIds: selectedCompletionMachines,
          endDate: endDate || null,
          isComplete: 2
        };
        
        await productAPI.updateMachineCompletion(completionData);
        toast.success(`Marked ${selectedCompletionMachines.length} machine(s) as completed!`);
        setShowMachineCompletionModal(false);
        setSelectedCompletionMachines([]);
        setEndDate('');
        fetchProductDetail();
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to update machine completion';
        toast.error(message);
      }
    } else {
      toast.error('Please select at least one machine to mark as completed');
    }
  };

  const handleMachineSelection = (machineId) => {
    setSelectedUpdateMachines(prev => {
      if (prev.includes(machineId)) {
        return prev.filter(id => id !== machineId);
      } else {
        return [...prev, machineId];
      }
    });
  };

  if (loading) {
    return <div className="loading">Loading product details...</div>;
  }

  if (!product) {
    return <div className="error">Product not found</div>;
  }

  const totalPieceMeters = pieces.reduce((sum, piece) => sum + parseFloat(piece.meters || 0), 0);

  return (
    <div className="container">
      <div className="flex items-center gap-10 mb-20">
        <button 
          onClick={() => navigate('/products')}
          className="btn btn-secondary flex items-center gap-5"
        >
          <ArrowLeft size={16} />
        </button>
        <h1>Product Details</h1>
      </div>

      {/* Product Information Card */}
      <div className="card mb-20">
        <div className="flex justify-between items-start mb-20">
          <div className="flex items-center gap-10">
            <Package size={24} />
            <div>
              <h2>{product.productName}</h2>
              <p style={{ color: '#666', margin: '5px 0' }}>
                Code: {product.productCode || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            {product.isComplete === 2 ? (
              <>
                <CheckCircle size={20} color="#28a745" />
                <span style={{ color: '#28a745', fontWeight: 'bold' }}>Completed</span>
              </>
            ) : (
              <>
                <Clock size={20} color="#ffc107" />
                <span style={{ color: '#ffc107', fontWeight: 'bold' }}>In Progress</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-3 gap-20">
          <div>
            <h4>Basic Information</h4>
            <p><strong>Description:</strong> {product.description || 'N/A'}</p>
            <p><strong>Target Meters:</strong> {product.meters}</p>
            <p><strong>Cost In/Out:</strong> ₹{product.costin} / ₹{product.costout}</p>
            <p><strong>Point Decrease:</strong> {product.pointDecrease ? `${parseFloat(product.pointDecrease).toFixed(1)}%` : '0.0%'}</p>
          </div>
          
          <div>
            <h4>Timeline</h4>
            <p><strong>Start Date:</strong> {product.startDate}</p>
            <p><strong>End Date:</strong> {product.endDate || 'Not completed'}</p>
          </div>
          
          <div>
            <h4>Machines</h4>
            {product.machines && product.machines.length > 1 ? (
              <div>
                <p><strong>{product.machines.length} Machines:</strong></p>
                {product.machines.map(machine => (
                  <div key={machine.machineId} style={{ marginBottom: '5px' }}>
                    {machine.machineCode && ` (${machine.machineCode})`}
                    <span style={{ 
                      marginLeft: '10px', 
                      fontSize: '12px',
                      color: machine.isComplete === 2 ? '#28a745' : '#ffc107'
                    }}>
                      {machine.isComplete === 2 ? 'Completed' : 'Running'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p>
                Machine #{product.machineId}
                {product.machines && product.machines[0]?.machineCode && 
                  ` (${product.machines[0].machineCode})`
                }
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-10 mt-20">
          <button 
            onClick={() => setShowEditForm(true)}
            className="btn btn-secondary flex items-center gap-5"
          >
            <Edit size={16} />
            Edit Product
          </button>
          
          {product.isComplete === 1 && (
            <button 
              onClick={handleMarkComplete}
              className="btn btn-primary flex items-center gap-5"
            >
              <CheckCircle size={16} />
              Mark Complete
            </button>
          )}
          
        </div>
      </div>

      {/* Pieces Section */}
      <div className="card">
        <div className="flex justify-between items-center mb-20">
          <h3>Pieces ({pieces.length})</h3>
          <div className="flex items-center gap-10">
            <div style={{ fontSize: '14px', color: '#666' }}>
              Total Meters: <strong>{totalPieceMeters.toFixed(2)}</strong>
            </div>
            <button 
              onClick={() => setShowStatisticsModal(true)}
              className="btn btn-info flex items-center gap-5"
              style={{ fontSize: '12px', padding: '6px 12px' }}
              disabled={pieces.length === 0}
            >
              <BarChart3 size={14} />
              View Analytics
            </button>
            <button 
              onClick={handleDownloadExcel}
              className="btn btn-secondary flex items-center gap-5"
              style={{ fontSize: '12px', padding: '6px 12px' }}
              disabled={pieces.length === 0}
            >
              <Download size={14} />
              Download Excel
            </button>
            <button 
              onClick={() => setShowAddPieceForm(true)}
              className="btn btn-success flex items-center gap-5"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <Plus size={14} />
              Add Piece
            </button>
            <button 
              onClick={() => setShowExcelUploadModal(true)}
              className="btn btn-info flex items-center gap-5"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <Plus size={14} />
              Upload Excel
            </button>
          </div>
        </div>

        {pieces.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No pieces added yet. Click "Add Piece" to add the first piece.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Export Date</th>
                <th>Meters</th>
              </tr>
            </thead>
            <tbody>
              {pieces.map((piece) => (
                <tr key={piece.id}>
                  <td>{piece.id}</td>
                  <td>
                    <div className="flex items-center gap-5">
                      <Calendar size={14} />
                      {piece.exporDate}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-5">
                      <Ruler size={14} />
                      {parseFloat(piece.meters).toFixed(2)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Product Modal */}
      {showEditForm && (
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
            <h3>Edit Product</h3>
            <form onSubmit={handleSubmit(handleEditSubmit)} style={{ marginTop: '20px' }}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Product Code</label>
                  <input
                    type="text"
                    className="form-control"
                    {...register('productCode')}
                  />
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
                <label className="form-label">Select Machines</label>
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '4px', 
                  padding: '10px',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  backgroundColor: '#f9f9f9'
                }}>
                  {machines.map(machine => (
                    <div key={machine.id} style={{ marginBottom: '8px' }}>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        padding: '8px',
                        backgroundColor: selectedUpdateMachines.includes(machine.id) ? '#e7f3ff' : 'white',
                        borderRadius: '4px',
                        border: '1px solid #ddd'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedUpdateMachines.includes(machine.id)}
                          onChange={() => handleMachineSelection(machine.id)}
                          style={{ marginRight: '8px' }}
                        />
                        <div>
                          <div style={{ fontWeight: 'bold' }}>
                            {machine.machineCode || `Machine ${machine.id}`}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {machine.machine}
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-3">
                <div className="form-group">
                  <label className="form-label">Target Meters</label>
                  <input
                    type="number"
                    className="form-control"
                    {...register('meters', { required: 'Meters is required' })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost In</label>
                  <input
                    type="number"
                    className="form-control"
                    {...register('costin', { required: 'Cost in is required' })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost Out</label>
                  <input
                    type="number"
                    className="form-control"
                    {...register('costout', { required: 'Cost out is required' })}
                  />
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    {...register('startDate')}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Point Decrease (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    {...register('pointDecrease')}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  {...register('description')}
                />
              </div>

              <div className="flex gap-10 mt-20">
                <button type="submit" className="btn btn-primary">
                  Update Product
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowEditForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Piece Modal */}
      {showAddPieceForm && (
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
          <div className="card" style={{ width: '400px', margin: '20px' }}>
            <h3>Add New Piece</h3>
            <form onSubmit={handleSubmitPiece(handleAddPiece)} style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">Export Date</label>
                <input
                  type="date"
                  className="form-control"
                  {...registerPiece('exportDate', { required: 'Export date is required' })}
                />
                {pieceErrors.exportDate && (
                  <div className="error">{pieceErrors.exportDate.message}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Meters</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  {...registerPiece('meters', { 
                    required: 'Meters is required',
                    min: { value: 0.01, message: 'Meters must be greater than 0' }
                  })}
                />
                {pieceErrors.meters && (
                  <div className="error">{pieceErrors.meters.message}</div>
                )}
              </div>

              <div className="flex gap-10 mt-20">
                <button type="submit" className="btn btn-primary">
                  Add Piece
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddPieceForm(false);
                    resetPiece();
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

      {/* Excel Upload Modal */}
      {showExcelUploadModal && (
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
            <h3>Upload Pieces from Excel</h3>
            
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <div className="flex justify-between items-start mb-10">
                <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>Excel Format Required:</h4>
                <button 
                  onClick={handleDownloadTemplate}
                  className="btn btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                >
                  <Download size={12} style={{ marginRight: '4px' }} />
                  Download Template
                </button>
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                <p><strong>Column A:</strong> Product Code (e.g., P001, BLUE_FABRIC)</p>
                <p><strong>Column B:</strong> Export Date (YYYY-MM-DD or DD/MM/YYYY)</p>
                <p><strong>Column C:</strong> Meters (number)</p>
                <p style={{ marginTop: '10px', fontStyle: 'italic' }}>
                  First row can be headers (will be automatically detected and skipped)
                </p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Select Excel File</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="form-control"
              />
              {selectedFile && (
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                  Selected: {selectedFile.name}
                </div>
              )}
            </div>

            <div className="flex gap-10 mt-20">
              <button 
                onClick={handleExcelUpload}
                className="btn btn-primary"
                disabled={!selectedFile || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Pieces'}
              </button>
              <button 
                onClick={() => {
                  setShowExcelUploadModal(false);
                  setSelectedFile(null);
                }}
                className="btn btn-secondary"
                disabled={uploading}
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
              Select which machines to mark as completed for "{product.productName}"
            </p>
            
            <div className="form-group">
              <label className="form-label">Select Machines to Complete</label>
              <div style={{ 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                padding: '10px',
                maxHeight: '200px',
                overflowY: 'auto',
                backgroundColor: '#f9f9f9'
              }}>
                {product.machines?.map(machine => (
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
            </div>

            <div className="flex gap-10 mt-20">
              <button 
                onClick={confirmMachineCompletion}
                className="btn btn-primary"
                disabled={selectedCompletionMachines.length === 0}
              >
                Mark Selected Complete
              </button>
              <button 
                onClick={() => {
                  setShowMachineCompletionModal(false);
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

      {/* Piece Statistics Modal */}
      {showStatisticsModal && (
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
          <div className="card" style={{ width: '800px', margin: '20px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="flex justify-between items-center mb-20">
              <h3>Piece Analytics - {product?.productName}</h3>
              <button 
                onClick={() => setShowStatisticsModal(false)}
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                Close
              </button>
            </div>

            {pieceStatistics && (
              <div>
                {/* Summary Cards */}
                <div className="grid grid-3 gap-20 mb-30">
                  <div className="card" style={{ padding: '15px', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                      {parseFloat(pieceStatistics.totalMeters || 0).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Total Meters</div>
                  </div>
                  <div className="card" style={{ padding: '15px', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                      {Object.keys(pieceStatistics.dateWiseMeters || {}).length}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Production Days</div>
                  </div>
                  <div className="card" style={{ padding: '15px', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
                      {pieces.length}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Total Pieces</div>
                  </div>
                </div>

                {/* Chart Section */}
                {Object.keys(pieceStatistics.dateWiseMeters || {}).length > 0 ? (
                  <div>
                    <div className="flex justify-between items-center mb-20">
                      <h4>Date-wise Production Chart</h4>
                      <div className="flex gap-10">
                        <button 
                          onClick={downloadPieceListSummary}
                          className="btn btn-success flex items-center gap-5"
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          <TrendingUp size={14} />
                          Download Summary
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ height: '400px', marginBottom: '20px' }}>
                      <Bar 
                        ref={chartRef}
                        data={getChartData()} 
                        options={chartOptions}
                      />
                    </div>

                    {/* Date-wise Table */}
                    <div>
                      <h4 style={{ marginBottom: '15px' }}>Date-wise Breakdown</h4>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Meters</th>
                            <th>Percentage of Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(pieceStatistics.dateWiseMeters)
                            .sort(([a], [b]) => new Date(a) - new Date(b))
                            .map(([date, meters]) => {
                              const percentage = ((parseFloat(meters) / parseFloat(pieceStatistics.totalMeters)) * 100).toFixed(1);
                              return (
                                <tr key={date}>
                                  <td>
                                    <div className="flex items-center gap-5">
                                      <Calendar size={14} />
                                      {date}
                                    </div>
                                  </td>
                                  <td>
                                    <div className="flex items-center gap-5">
                                      <Ruler size={14} />
                                      {parseFloat(meters).toFixed(2)}
                                    </div>
                                  </td>
                                  <td>{percentage}%</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <BarChart3 size={48} style={{ margin: '0 auto 20px' }} />
                    <p>No production data available for chart visualization.</p>
                    <p>Add some pieces to see the analytics.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;