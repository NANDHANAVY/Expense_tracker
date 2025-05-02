// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react'
import api from '../services/axios'
import Navbar from '../components/Navbar'
import AddExpenseForm from '../components/AddExpenseForm'
import ExpenseList from '../components/ExpenseList'
import SetBudgetForm from '../components/SetBudgetForm'
import EditExpenseModal from '../components/EditExpenseModal'
import '../app.css'

function BudgetAlert({ alert }) {
  return (
    <div className="alert alert-warning">
      {alert.message}
    </div>
  )
}

export default function Dashboard() {
  const [expenses, setExpenses] = useState([])
  const [alertData, setAlertData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshFlag, setRefreshFlag] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [lastBudget, setLastBudget] = useState(null)

  // Calculate total expenses
  const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)

  // Prepare budget comparison if lastBudget exists
  const budgetComparison = lastBudget
    ? {
        exceeded: totalSpent > lastBudget.budget,
        totalSpent,
        budgetLimit: lastBudget.budget,
        category: lastBudget.category,
      }
    : null

  const email = localStorage.getItem('email_address')

  if (!email) {
    return <div className="p-4 alert alert-warning">No email found. Please log in.</div>
  }

  const fetchExpenses = async () => {
    const res = await api.post('records/list/', { email_address: email })
    setExpenses(res.data)
  }

  const fetchLastBudget = () =>
    api
      .get('budgets/last-update/', { params: { email_address: email } })
      .then((r) => setLastBudget(r.data))
      .catch(() => setLastBudget(null))

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        await Promise.all([fetchExpenses(), fetchLastBudget()])
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    })()
  }, [refreshFlag])

  const triggerRefresh = () => setRefreshFlag((f) => !f)

  const handleEditClick = (expense) => {
    setSelectedExpense(expense)
    setEditModalVisible(true)
  }

  const handleDeleteClick = async (expenseId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this expense?')
    if (!confirmDelete) return

    try {
      await api.post('records/delete/', { id: expenseId, email_address: email })
      alert('Expense deleted successfully')
      triggerRefresh()
    } catch (err) {
      alert('Failed to delete expense')
      console.error(err)
    }
  }

  if (loading) return <div className="p-4">Loading…</div>
  if (error)
    return (
      <div className="p-4 alert alert-danger">
        <h5>Failed to load dashboard</h5>
        <pre>{error.message}</pre>
      </div>
    )

  return (
    <div className="container my-4">
      <Navbar />
      {alertData && <BudgetAlert alert={alertData} />}

      <div className="mb-4 font-size-50">
        <h4>
          {lastBudget && (
            <div className="alert alert-info">
              Last Budget Updated :&nbsp;
              <strong></strong> ₹{lastBudget.budget}
              &nbsp;on&nbsp;
              {new Date(lastBudget.updated_at).toLocaleString()}
            </div>
          )}
        </h4>
      </div>

      {/* Budget comparison alert */}
      {budgetComparison && (
        <div
          className={`alert ${
            budgetComparison.exceeded ? `alert-danger${(alert("budget exceeded"))}` : `alert-success`
          } text-center`}
        >
          {budgetComparison.exceeded
            ? `⚠ Exceeded  budget: ₹${budgetComparison.totalSpent} of ₹${budgetComparison.budgetLimit }`
            : `✅ Within  budget: ₹${budgetComparison.totalSpent} of ₹${budgetComparison.budgetLimit}`}
        </div>
      )}

      <div className="row ">
        <div className="row mb-4">
          <div className="col-md-6">
            <AddExpenseForm onRecordAdded={triggerRefresh} />
          </div>
          <div className="col-md-6 mt-5">
            <SetBudgetForm onBudgetAdded={triggerRefresh} />
          </div>
        </div>
        <div className="col-md-12">
          <ExpenseList
            expenses={expenses}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        </div>
      </div>

      <EditExpenseModal
        show={editModalVisible}
        expense={selectedExpense}
        onClose={() => setEditModalVisible(false)}
        onUpdate={triggerRefresh}
      />
    </div>
  )
}
