// src/components/EditExpenseModal.jsx
import React, { useState, useEffect } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import api from '../services/axios'

export default function EditExpenseModal({ show, onClose, expense, onUpdate}) {
  const [formData, setFormData] = useState({
    id: '',
    amount: '',
    category: '',
    description: '',
    date: '',
  })
  console.log('Expense:', expense)
  console.log('Expense ID:', formData.id)
  useEffect(() => {
    if (expense) {
      setFormData(expense)
    }
  }, [expense])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/records/update/${formData.id}/`, {
        email_address: localStorage.getItem("email_address"),
        recordType: "expense",
        category: formData.category,
        note: formData.note,
        amount: formData.amount,
        time: formData.time,
        date: formData.date,
      });
  
      console.log("Expense updated successfully:", response.data);
      alert("Expense updated successfully");
      onUpdate();
      onClose();
    } catch (err) {
      alert("Failed to update expense");
      console.error(err.response?.data || err.message);
    }
  };
  
  
  

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Expense</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Amount</Form.Label>
            <Form.Control
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Category</Form.Label>
            <Form.Control
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Note</Form.Label>
            <Form.Control
              name="note"
              value={formData.note}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Date</Form.Label>
            <Form.Control
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Update</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
