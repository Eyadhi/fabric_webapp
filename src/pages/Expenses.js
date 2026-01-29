import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { ExpenseAPI } from '../services/api';
import toast from 'react-hot-toast';

const Expense = () => {
    const [expenses, setExpenses] = useState([]);
    const [expenseTypes, setExpenseTypes] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const [filterError, setFilterError] = useState('');

    const [filters, setFilters] = useState({
        year: '',
        month: '',
        startDate: '',
        endDate: ''
    });

    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        loadExpenses();
        loadExpenseTypes();
    }, []);

    const loadExpenses = async (filterParams = {}) => {
        try {
            const params = {
                year: filterParams.year || null,
                month: filterParams.month || null,
                startDate: filterParams.startDate || null,
                endDate: filterParams.endDate || null
            };

            const res = await ExpenseAPI.getAllExpenses(params);

            setExpenses(res.data?.data?.expenses || []);
            setTotalAmount(res.data?.data?.totalAmount || 0);
        } catch (err) {
            toast.error("Failed to load expenses");
        }
    };

    const loadExpenseTypes = async () => {
        try {
            const res = await ExpenseAPI.getExpenseTypes();
            setExpenseTypes(res.data.data || []);
        } catch {
            toast.error("Failed to load expense types");
        }
    };

    const onSubmit = async (data) => {
        try {
            setSubmitting(true);

            const payload = {
                expensePurpose: data.expensePurpose,
                price: Number(data.price),
                typeId: Number(data.typeId),
                expenseDate: data.expenseDate
            };

            await ExpenseAPI.addExpense(payload);

            toast.success("Expense added successfully");
            reset();
            loadExpenses(filters);
            setShowForm(false);
        } catch {
            toast.error("Failed to add expense");
        } finally {
            setSubmitting(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        setFilterError('');

        const { year, month, startDate, endDate } = filters;

        // Month without year ❌
        if (month && !year) {
            setFilterError('Please select year first');
            return;
        }

        // Start date without year ❌
        if (startDate && !year) {
            setFilterError('Please select year first');
            return;
        }

        // End date without start date ❌
        if (endDate && !startDate) {
            setFilterError('Please select start date first');
            return;
        }

        // Start + End date year validation
        if (startDate && endDate && year) {
            const startYear = new Date(startDate).getFullYear();
            const endYear = new Date(endDate).getFullYear();

            if (startYear !== Number(year) || endYear !== Number(year)) {
                setFilterError(`Dates must be within year ${year}`);
                return;
            }

            if (new Date(endDate) < new Date(startDate)) {
                setFilterError('End date must be after start date');
                return;
            }
        }

        // Normal valid case
        loadExpenses(filters);
    };


    const clearFilters = () => {
        setFilters({
            year: '',
            month: '',
            startDate: '',
            endDate: ''
        });
        setFilterError('');
        loadExpenses();
    };

    return (
        <div className="container">

            <div className="flex justify-between items-center mb-20">
                <h1>Expense Management</h1>
                <button
                    className="btn btn-primary flex items-center gap-10"
                    onClick={() => setShowForm(!showForm)}
                >
                    <Plus size={16} />
                    Add Expense
                </button>
            </div>

            {showForm && (
                <div className="card mb-20">
                    <h3>Add New Expense</h3>

                    <form onSubmit={handleSubmit(onSubmit)} className="mt-20">
                        <div className="grid grid-2">

                            <div className="form-group">
                                <label>Expense Purpose</label>
                                <input
                                    className="form-control"
                                    {...register('expensePurpose', { required: true })}
                                />
                                {errors.expensePurpose && <span className="error">Required</span>}
                            </div>

                            <div className="form-group">
                                <label>Expense Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    {...register('expenseDate', { required: true })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Amount</label>
                            <input
                                type="number"
                                className="form-control"
                                {...register('price', { required: true })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Expense Type</label>
                            <select
                                className="form-control"
                                {...register('typeId', { required: true })}
                            >
                                <option value="">Select Type</option>
                                {expenseTypes.map(type => (
                                    <option key={type.id} value={type.id}>
                                        {type.typeName || type.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-10 mt-20">
                            <button className="btn btn-primary" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setShowForm(false);
                                    reset();
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
            <div className="card mb-20">
                <h3>Filter Expenses</h3>

                <div className="flex gap-10 mt-10">
                    <select
                        name="year"
                        className="form-control"
                        value={filters.year}
                        onChange={handleFilterChange}
                    >
                        <option value="">All Years</option>
                        {Array.from(
                            { length: new Date().getFullYear() - 2025 + 1 },
                            (_, i) => {
                                const year = 2025 + i;
                                return (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                );
                            }
                        )}
                    </select>

                    <select
                        name="month"
                        className="form-control"
                        value={filters.month}
                        onChange={handleFilterChange}
                    >
                        <option value="">All Months</option>
                        {[
                            "January", "February", "March", "April",
                            "May", "June", "July", "August",
                            "September", "October", "November", "December"
                        ].map((month, index) => (
                            <option key={index + 1} value={index + 1}>
                                {month}
                            </option>
                        ))}
                    </select>
                    <input
                        type="date"
                        name="startDate"
                        className="form-control"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                    />

                    <input
                        type="date"
                        name="endDate"
                        className="form-control"
                        value={filters.endDate}
                        onChange={handleFilterChange}
                    />
                </div>
                {filterError && (
                    <div style={{ color: 'red', marginTop: '10px' }}>
                        {filterError}
                    </div>
                )}

                <div className="flex gap-10 mt-10">
                    <button className="btn btn-primary" onClick={applyFilters}>
                        Apply
                    </button>
                    <button className="btn btn-secondary" onClick={clearFilters}>
                        Clear
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="flex justify-between mb-10">
                    <h3>Expenses</h3>
                    <strong>Total: ₹ {totalAmount}</strong>
                </div>

                {expenses.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        No expenses found
                    </p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Purpose</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map(exp => (
                                <tr key={exp.id}>
                                    <td>{exp.expensePurpose}</td>
                                    <td>{exp.price}</td>
                                    <td>{exp.expenseDate}</td>
                                    <td>{exp.typeName}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Expense;
