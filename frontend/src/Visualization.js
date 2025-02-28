import React, { useEffect, useState } from 'react';
import './Visualization.css';
import ExpensePieChart from './PieChart';
import ExpenseBarChart from './BarChart';
import ExpenseLineChart from './LineChart';

/**
 * Visualization component provides a detailed summary of expenses within a specified date range.
 * Users can view the data in various formats: table, pie chart, bar chart, and line chart.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.startDate - The default start date for visualization (optional).
 * @param {string} props.endDate - The default end date for visualization (optional).
 * @returns {JSX.Element} The rendered Visualization component.
 */
const Visualization = ({ startDate, endDate }) => {
    const currentDate = new Date();
    const defaultStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const defaultEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const [error, setError] = useState(null); // Error message state
    const [loading, setLoading] = useState(false); // Loading indicator state
    const [formData, setFormData] = useState({
        startDate: defaultStartDate.toISOString().split('T')[0],
        endDate: defaultEndDate.toISOString().split('T')[0],
    });
    const [loaded, setLoaded] = useState(false); // Data loaded state
    const [expense, setExpense] = useState(null); // Summary of expenses by category
    const [dateExpenses, setDateExpenses] = useState(null); // Daily expense summary
    const [selected, setSelected] = useState({
        table: true,
        pieChart: true,
        barChart: true,
        lineChart: true,
    });

    /**
     * Handles changes to the date range input fields.
     *
     * @param {Object} e - The change event.
     */
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    /**
     * Handles changes to the visualization options checkboxes.
     *
     * @param {Object} e - The change event.
     */
    const handleCheckboxChange = (e) => {
        setSelected({
            ...selected,
            [e.target.name]: e.target.checked,
        });
    };

    /**
     * Fetches expense data for the specified date range from the API.
     *
     * @async
     * @param {Object} e - The submit event.
     */
    const handleSubmit = async (e) => {
        setLoading(true);
        setError(null);
        e.preventDefault();
	console.log("Hello");
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
	endDate.setDate(endDate.getDate() + 1);
	console.log(startDate, endDate);
        try {
            if (localStorage.getItem('token') === null) {
                throw new Error("You have not logged in yet!");
            }
            const response = await fetch(`/api/visualize/?start=${startDate.toISOString().split('T')[0]}&end=${endDate.toISOString().split('T')[0]}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Token ${localStorage.getItem('token')}`,
                    },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'An unknown error occurred');
            }
            const result = await response.json();
	    console.log('visualization result: ', result);
            if (Object.keys(result.summary).length === 0) {
                throw new Error("No expenses in this period of time");
            }
            setError(null);
            setLoaded(true);
            setExpense(result.summary);
            setDateExpenses(result.date_summary);
        } catch (error) {
            setError(error.message);
            setLoaded(false);
            setExpense(null);
            setDateExpenses(null);
        } finally {
            setLoading(false);
            setFormData({ startDate: "", endDate: "" });
        }
    };

    return (
        <div className="visualize">
            <h2>Expense Summary</h2>
            {error && <p className="error">{error}</p>} {/* Error message */}
            <form onSubmit={handleSubmit} className="form">
                {loading && <p>Loading...</p>} {/* Loading indicator */}

                <div className="date-input">
                    <label>
                        Date:
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleInputChange}
                            required
                        />
                    </label>
                    <label>
                        Date:
                        <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleInputChange}
                            required
                        />
                    </label>
                </div>

                <button type="submit" className="submit-button" disabled={loading}>
                    Submit
                </button>
            </form>
            <div className="visual-options">
                <label>
                    <input
                        type="checkbox"
                        name="table"
                        checked={selected.table}
                        onChange={handleCheckboxChange}
                    />
                    Table
                </label>
                <label>
                    <input
                        type="checkbox"
                        name="pieChart"
                        checked={selected.pieChart}
                        onChange={handleCheckboxChange}
                    />
                    Pie Chart
                </label>
                <label>
                    <input
                        type="checkbox"
                        name="barChart"
                        checked={selected.barChart}
                        onChange={handleCheckboxChange}
                    />
                    Bar Chart
                </label>
                <label>
                    <input
                        type="checkbox"
                        name="lineChart"
                        checked={selected.lineChart}
                        onChange={handleCheckboxChange}
                    />
                    Line Chart
                </label>
            </div>
	    {loaded &&
                <>
		 {selected.table &&
                        <table className="table-summary">
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(expense).map(([category, amount]) => (
                                    <tr key={category}>
                                        <td>{category}</td>
                                        <td>${amount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
		 }
		 {selected.pieChart && <ExpensePieChart data={expense}/>}
		 {selected.barChart && <ExpenseBarChart data={expense}/>}
		 {selected.lineChart && <ExpenseLineChart data={dateExpenses}/>}
                </>
	    }
	    
	    
        </div>
    );
};

export default Visualization;
