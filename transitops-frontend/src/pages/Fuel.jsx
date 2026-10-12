import { useCallback, useEffect, useState } from "react";
import API from "../services/api";
import ExpenseForm from "../components/ExpenseForm";
import FuelForm from "../components/FuelForm";
import PageHeader from "../components/PageHeader";
import { hasRole } from "../data/roles";

function Fuel() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("fuel");
  const [editingRecord, setEditingRecord] = useState(null);
  const canCreateFinancialRecords = hasRole("Fleet Manager", "Financial Analyst");

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const [fuelResponse, expenseResponse] = await Promise.all([
        API.get("/fuel"),
        API.get("/expenses"),
      ]);
      setFuelLogs(fuelResponse.data);
      setExpenses(expenseResponse.data);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to load financial records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return (
    <div className="resource-page">
      <PageHeader title="Fuel & Expenses" subtitle="Review and record operating costs." />
      <div className="tab-list" role="tablist" aria-label="Financial records">
        <button className={activeTab === "fuel" ? "tab-active" : ""} role="tab" aria-selected={activeTab === "fuel"} onClick={() => { setActiveTab("fuel"); setEditingRecord(null); }}>Fuel logs</button>
        <button className={activeTab === "expenses" ? "tab-active" : ""} role="tab" aria-selected={activeTab === "expenses"} onClick={() => { setActiveTab("expenses"); setEditingRecord(null); }}>Expenses</button>
      </div>
      {canCreateFinancialRecords && activeTab === "fuel" && <FuelForm key={editingRecord?.record?._id || "new-fuel"} refresh={fetchRecords} fuelLog={editingRecord?.kind === "fuel" ? editingRecord.record : undefined} onCancel={editingRecord && (() => setEditingRecord(null))} />}
      {canCreateFinancialRecords && activeTab === "expenses" && <ExpenseForm key={editingRecord?.record?._id || "new-expense"} refresh={fetchRecords} expense={editingRecord?.kind === "expense" ? editingRecord.record : undefined} onCancel={editingRecord && (() => setEditingRecord(null))} />}
      {errorMessage && <div className="notice notice-error" role="alert"><span>{errorMessage}</span><button className="ghost-btn" onClick={fetchRecords} disabled={loading}>Retry</button></div>}
      {activeTab === "fuel" ? (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Vehicle</th><th>Liters</th><th>Unit price</th><th>Total cost</th><th>Date</th>{canCreateFinancialRecords && <th>Actions</th>}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={canCreateFinancialRecords ? 6 : 5}>Loading fuel logs...</td></tr> : fuelLogs.length === 0 ? <tr><td colSpan={canCreateFinancialRecords ? 6 : 5} className="empty-table">No fuel logs found.</td></tr> : fuelLogs.map((fuel) => (
                <tr key={fuel._id}>
                  <td>{fuel.vehicle?.vehicleName || "—"}</td>
                  <td>{fuel.liters}</td>
                  <td>₹{Number(fuel.pricePerLiter || 0).toLocaleString("en-IN")}</td>
                  <td>₹{Number(fuel.cost || 0).toLocaleString("en-IN")}</td>
                  <td>{fuel.date ? new Date(fuel.date).toLocaleDateString() : "—"}</td>
                  {canCreateFinancialRecords && <td className="row-actions"><button type="button" className="edit-btn" onClick={() => setEditingRecord({ kind: "fuel", record: fuel })}>Edit</button><button type="button" className="delete-btn" onClick={async () => { if (!window.confirm("Delete this fuel record?")) return; try { await API.delete(`/fuel/${fuel._id}`); await fetchRecords(); } catch (error) { setErrorMessage(error.response?.data?.message || "Unable to delete fuel record."); } }}>Delete</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Vehicle</th><th>Type</th><th>Description</th><th>Amount</th><th>Date</th>{canCreateFinancialRecords && <th>Actions</th>}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={canCreateFinancialRecords ? 6 : 5}>Loading expenses...</td></tr> : expenses.length === 0 ? <tr><td colSpan={canCreateFinancialRecords ? 6 : 5} className="empty-table">No expenses found.</td></tr> : expenses.map((expense) => (
                <tr key={expense._id}>
                  <td>{expense.vehicle?.vehicleName || "—"}</td>
                  <td>{expense.expenseType}</td>
                  <td>{expense.description || "—"}</td>
                  <td>₹{Number(expense.amount || 0).toLocaleString("en-IN")}</td>
                  <td>{expense.date ? new Date(expense.date).toLocaleDateString() : "—"}</td>
                  {canCreateFinancialRecords && <td className="row-actions"><button type="button" className="edit-btn" onClick={() => setEditingRecord({ kind: "expense", record: expense })}>Edit</button><button type="button" className="delete-btn" onClick={async () => { if (!window.confirm("Delete this expense?")) return; try { await API.delete(`/expenses/${expense._id}`); await fetchRecords(); } catch (error) { setErrorMessage(error.response?.data?.message || "Unable to delete expense."); } }}>Delete</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Fuel;
