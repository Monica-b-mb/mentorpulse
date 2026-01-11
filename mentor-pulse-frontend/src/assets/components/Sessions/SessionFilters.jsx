import React from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';


const SessionFilters = ({ show, onHide, filters, onFilterChange }) => {
  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      dateRange: '',
      sessionType: '',
      sortBy: 'date'
    });
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Session Filters</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Date Range</Form.Label>
              <Form.Select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="this_week">This Week</option>
                <option value="next_week">Next Week</option>
                <option value="this_month">This Month</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Session Type</Form.Label>
              <Form.Select
                value={filters.sessionType}
                onChange={(e) => handleFilterChange('sessionType', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="career">Career Guidance</option>
                <option value="technical">Technical Skills</option>
                <option value="interview">Interview Prep</option>
                <option value="project">Project Review</option>
                <option value="general">General Mentoring</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        <Form.Group className="mb-3">
          <Form.Label>Sort By</Form.Label>
          <Form.Select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="date">Date (Newest First)</option>
            <option value="date_asc">Date (Oldest First)</option>
            <option value="price">Price (High to Low)</option>
            <option value="price_asc">Price (Low to High)</option>
            <option value="duration">Duration</option>
          </Form.Select>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={clearFilters}>
          Clear Filters
        </Button>
        <Button variant="primary" onClick={onHide}>
          Apply Filters
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SessionFilters;
