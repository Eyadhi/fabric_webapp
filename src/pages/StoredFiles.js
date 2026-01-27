import { useState, useEffect } from 'react';
import { Download, FileText, Image, Trash2, Calendar, User } from 'lucide-react';
import { fileAPI, workerAPI } from '../services/api';
import toast from 'react-hot-toast';

const StoredFiles = () => {
  const [bills, setBills] = useState([]);
  const [excelUploads, setExcelUploads] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bills');
  const [filterWorker, setFilterWorker] = useState('');
  const [filterWeek, setFilterWeek] = useState('');

  useEffect(() => {
    fetchData();
    fetchWorkers();
  }, []);

  const fetchData = async () => {
    try {
      const [billsResponse, excelResponse] = await Promise.all([
        fileAPI.getAllBills(),
        fileAPI.getAllExcelUploads()
      ]);
      
      setBills(billsResponse.data?.data || billsResponse.data || []);
      setExcelUploads(excelResponse.data?.data || excelResponse.data || []);
    } catch (error) {
      toast.error('Failed to fetch stored files');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await workerAPI.getAll();
      setWorkers(response.data?.data || response.data || []);
    } catch (error) {
      // Error fetching workers
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await fileAPI.downloadFile(fileId);
      
      // Create blob URL and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('File downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async (fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      await fileAPI.deleteFile(fileId);
      toast.success('File deleted successfully!');
      fetchData(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const getWorkerName = (workerId) => {
    const worker = workers.find(w => w.id === workerId);
    return worker ? worker.workerName : `Worker #${workerId}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredBills = bills.filter(bill => {
    const workerMatch = !filterWorker || bill.workerId?.toString() === filterWorker;
    const weekMatch = !filterWeek || bill.weekStartDate === filterWeek;
    return workerMatch && weekMatch;
  });

  if (loading) {
    return <div className="loading">Loading stored files...</div>;
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-20">
        <h1>Stored Files</h1>
        <div className="flex gap-10">
          <button 
            onClick={() => setActiveTab('bills')}
            className={`btn ${activeTab === 'bills' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Image size={16} style={{ marginRight: '5px' }} />
            Bills ({bills.length})
          </button>
          <button 
            onClick={() => setActiveTab('excel')}
            className={`btn ${activeTab === 'excel' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <FileText size={16} style={{ marginRight: '5px' }} />
            Excel Uploads ({excelUploads.length})
          </button>
        </div>
      </div>

      {activeTab === 'bills' && (
        <div className="card">
          <div className="flex justify-between items-center mb-20">
            <h3>Generated Bills</h3>
            <div className="flex gap-10">
              <select
                value={filterWorker}
                onChange={(e) => setFilterWorker(e.target.value)}
                className="form-control"
                style={{ width: '200px' }}
              >
                <option value="">All Workers</option>
                {workers.map(worker => (
                  <option key={worker.id} value={worker.id}>
                    {worker.workerName}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={filterWeek}
                onChange={(e) => setFilterWeek(e.target.value)}
                className="form-control"
                style={{ width: '150px' }}
                placeholder="Filter by week"
              />
              <button 
                onClick={() => {
                  setFilterWorker('');
                  setFilterWeek('');
                }}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {filteredBills.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No bills found. Generate bills from the cost calculator to see them here.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Worker</th>
                  <th>Week</th>
                  <th>Size</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => (
                  <tr key={bill.id}>
                    <td>
                      <div className="flex items-center gap-10">
                        <Image size={16} color="#007bff" />
                        {bill.originalName || bill.fileName}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-5">
                        <User size={14} />
                        {getWorkerName(bill.workerId)}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-5">
                        <Calendar size={14} />
                        {bill.weekStartDate}
                      </div>
                    </td>
                    <td>{formatFileSize(bill.fileSize)}</td>
                    <td style={{ fontSize: '12px' }}>
                      {formatDate(bill.createdAt)}
                    </td>
                    <td>
                      <div className="flex gap-5">
                        <button 
                          onClick={() => handleDownload(bill.id, bill.originalName || bill.fileName)}
                          className="btn btn-primary" 
                          style={{ fontSize: '12px', padding: '5px 10px' }}
                        >
                          <Download size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(bill.id, bill.originalName || bill.fileName)}
                          className="btn btn-danger" 
                          style={{ fontSize: '12px', padding: '5px 10px' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'excel' && (
        <div className="card">
          <h3>Excel Uploads</h3>
          
          {excelUploads.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No Excel uploads found. Upload meter data to see files here.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Original Name</th>
                  <th>Size</th>
                  <th>Description</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {excelUploads.map((upload) => (
                  <tr key={upload.id}>
                    <td>
                      <div className="flex items-center gap-10">
                        <FileText size={16} color="#28a745" />
                        {upload.fileName}
                      </div>
                    </td>
                    <td>{upload.originalName}</td>
                    <td>{formatFileSize(upload.fileSize)}</td>
                    <td style={{ fontSize: '12px', maxWidth: '200px' }}>
                      {upload.description}
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {formatDate(upload.createdAt)}
                    </td>
                    <td>
                      <div className="flex gap-5">
                        <button 
                          onClick={() => handleDownload(upload.id, upload.originalName)}
                          className="btn btn-primary" 
                          style={{ fontSize: '12px', padding: '5px 10px' }}
                        >
                          <Download size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(upload.id, upload.originalName)}
                          className="btn btn-danger" 
                          style={{ fontSize: '12px', padding: '5px 10px' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="card mt-20" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
        <h4 style={{ color: '#495057', marginBottom: '10px' }}>File Storage Information:</h4>
        <ul style={{ color: '#6c757d', fontSize: '14px', lineHeight: '1.6' }}>
          <li><strong>Bills:</strong> Generated production bills are automatically stored on the server when created</li>
          <li><strong>Excel Uploads:</strong> All uploaded meter data files are preserved for future reference</li>
          <li><strong>Download:</strong> Click the download button to get a copy of any stored file</li>
          <li><strong>Delete:</strong> Remove files you no longer need (this action cannot be undone)</li>
          <li><strong>Filters:</strong> Use worker and week filters to quickly find specific bills</li>
        </ul>
      </div>
    </div>
  );
};

export default StoredFiles;