import React, { useState, useEffect } from 'react';
import { flexibleShiftAPI, fileAPI } from '../services/api';
import { Calculator, Calendar, DollarSign, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const SalaryCalculation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Salary calculation form
  const [salaryForm, setSalaryForm] = useState({
    calculationType: 'weekly',
    weekEndDate: '',
    periodEndDate: '',
    startDate: '',
    endDate: ''
  });

  const [salaryResults, setSalaryResults] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // No need to load workers anymore since we removed the assignments view
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSalaryCalculation = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSalaryResults([]);

      let response;
      if (salaryForm.calculationType === 'weekly') {
        response = await flexibleShiftAPI.calculateWeeklySalary(salaryForm.weekEndDate);
      } else if (salaryForm.calculationType === 'biweekly') {
        response = await flexibleShiftAPI.calculateBiWeeklySalary(salaryForm.periodEndDate);
      } else {
        response = await flexibleShiftAPI.calculateCustomPeriodSalary(salaryForm.startDate, salaryForm.endDate);
      }

      setSalaryResults(response.data.data || []);
      toast.success('Salary calculated successfully!');
    } catch (err) {
      setError('Failed to calculate salary: ' + (err.response?.data?.data?.error || err.message));
      toast.error('Failed to calculate salary');
    } finally {
      setLoading(false);
    }
  };

  const generateSalaryBill = async (salaryResult) => {
    if (!salaryResult) {
      toast.error('No salary data available for bill generation');
      return;
    }

    try {
      // Create a canvas element to generate the salary bill image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Set canvas size - dynamic height based on machine productions
      const machineCount = salaryResult.machineProductions ? salaryResult.machineProductions.length : 0;
      canvas.width = 800;
      canvas.height = 700 + (machineCount * 30); // Dynamic height based on data

      // Set background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header
      ctx.fillStyle = '#2c3e50';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SALARY CALCULATION BILL', canvas.width / 2, 50);

      // Worker and period info
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#34495e';

      ctx.fillText(`Worker: ${salaryResult.workerName}`, 50, 100);
      ctx.fillText(`Period: ${salaryResult.periodStartDate} to ${salaryResult.periodEndDate}`, 50, 130);
      ctx.fillText(`Calculation Weeks: ${salaryResult.calculationWeeks}`, 50, 160);
      ctx.fillText(`Generated: ${new Date().toLocaleDateString()}`, 50, 190);

      // Summary section
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(50, 220, canvas.width - 100, 80);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SALARY SUMMARY', canvas.width / 2, 250);
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`Total Meters: ${salaryResult.adjustedMeters}m (adjusted)`, canvas.width / 2, 275);
      ctx.fillText(`Total Salary: ₹${salaryResult.totalCost}`, canvas.width / 2, 295);

      // Machine-wise breakdown if available
      if (salaryResult.machineProductions && salaryResult.machineProductions.length > 0) {
        // Table header
        ctx.fillStyle = '#3498db';
        ctx.fillRect(50, 330, canvas.width - 100, 40);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Machine', 70, 355);
        ctx.fillText('Product', 200, 355);
        ctx.fillText('Meters', 350, 355);
        ctx.fillText('Adjusted', 450, 355);
        ctx.fillText('Cost', 580, 355);

        // Table rows
        let yPos = 380;
        ctx.fillStyle = '#2c3e50';
        ctx.font = '12px Arial';

        salaryResult.machineProductions.forEach((production, index) => {
          // Alternate row colors
          if (index % 2 === 0) {
            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(50, yPos - 15, canvas.width - 100, 25);
          }

          ctx.fillStyle = '#2c3e50';
          ctx.fillText(production.machineCode || `Machine #${production.machineId}`, 70, yPos);
          ctx.fillText(production.productName || `Product #${production.productId}`, 200, yPos);
          ctx.fillText(`${parseFloat(production.meters || 0).toFixed(1)}`, 350, yPos);
          ctx.fillText(`${parseFloat(production.adjustedMeters || 0).toFixed(1)}`, 450, yPos);
          ctx.fillText(`₹${parseFloat(production.cost || 0).toFixed(1)}`, 580, yPos);

          yPos += 30;
        });

        // Total line
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(50, yPos + 10, canvas.width - 100, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('TOTAL', 70, yPos + 30);
        ctx.fillText(`${parseFloat(salaryResult.adjustedMeters || 0).toFixed(1)}`, 450, yPos + 30);
        ctx.fillText(`₹${parseFloat(salaryResult.totalCost || 0).toFixed(1)}`, 580, yPos + 30);

        yPos += 50;
      }

      // Footer
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      const footerY = canvas.height - 30;
      ctx.fillText('This is a computer generated salary bill', canvas.width / 2, footerY);

      // Convert canvas to base64 and store on server
      const imageDataUrl = canvas.toDataURL('image/png');

      // Store bill on server
      const response = await fileAPI.storeBill(
        imageDataUrl,
        salaryResult.workerName,
        salaryResult.periodStartDate,
        salaryResult.workerId || 0
      );

      if (response.data?.success) {
        toast.success('Salary bill generated and stored successfully!');

        // Also download the bill for immediate use
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `salary_bill_${salaryResult.workerName.replace(/\s+/g, '_')}_${salaryResult.periodStartDate}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 'image/png');
      } else {
        toast.error('Failed to store bill on server, but downloading locally');

        // Fallback to local download
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `salary_bill_${salaryResult.workerName.replace(/\s+/g, '_')}_${salaryResult.periodStartDate}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 'image/png');
      }

    } catch (error) {
      toast.error('Failed to generate salary bill: ' + error.message);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Calculator className="mr-3" size={32} />
        Salary Calculation
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Salary Calculation Form */}
        <form
          onSubmit={handleSalaryCalculation}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Calculator className="text-green-600" />
            Calculate Salary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Calculation Type */}
            <div>
              <label className="text-sm font-medium">Calculation Type</label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={salaryForm.calculationType}
                onChange={(e) =>
                  setSalaryForm({ ...salaryForm, calculationType: e.target.value })
                }
              >
                <option value="weekly">Weekly (Sat – Fri)</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Date Input */}
            <div>
              <label className="text-sm font-medium">
                {salaryForm.calculationType === "weekly"
                  ? "Week End Date (Friday)"
                  : "Period End Date"}
              </label>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={
                  salaryForm.calculationType === "weekly"
                    ? salaryForm.weekEndDate
                    : salaryForm.periodEndDate
                }
                onChange={(e) =>
                  setSalaryForm({
                    ...salaryForm,
                    weekEndDate: e.target.value,
                    periodEndDate: e.target.value
                  })
                }
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold flex justify-center items-center gap-2"
          >
            <Calculator size={18} />
            Calculate Salary
          </button>
        </form>
      </div>

      {/* Salary Results Display */}
      {salaryResults.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <DollarSign className="mr-2" size={20} />
            Salary Calculation Results
          </h2>
          <div className="space-y-4">
            {salaryResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">{result.workerName}</h3>
                      <p className="text-gray-500 text-sm">
                        {result.periodStartDate} → {result.periodEndDate} ({result.calculationWeeks} week)
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-600">
                        ₹{result.totalCost}
                      </p>
                      <p className="text-sm text-gray-500">
                        {result.adjustedMeters} meters (adjusted)
                      </p>
                    </div>
                  </div>
                </div>

                {result.machineProductions && result.machineProductions.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Machine-wise Production</h4>

                    <div className="overflow-x-auto rounded-lg border">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left">Machine</th>
                            <th className="px-4 py-2 text-left">Product</th>
                            <th className="px-4 py-2 text-right">Meters</th>
                            <th className="px-4 py-2 text-right">Adjusted</th>
                            <th className="px-4 py-2 text-right">Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.machineProductions.map((p, i) => (
                            <tr key={i} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-2">{p.machineCode}</td>
                              <td className="px-4 py-2">{p.productName}</td>
                              <td className="px-4 py-2 text-right">{p.meters}</td>
                              <td className="px-4 py-2 text-right">{p.adjustedMeters}</td>
                              <td className="px-4 py-2 text-right font-semibold">
                                ₹{p.cost}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Bill Download Button */}
                <div className="mt-6 text-center">
                  <button
                    onClick={() => generateSalaryBill(result)}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    <Download size={18} />
                    Download Salary Bill
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
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

export default SalaryCalculation;