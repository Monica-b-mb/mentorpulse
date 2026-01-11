import React from 'react';
import { Card, ProgressBar } from 'react-bootstrap';

const SkillProgress = () => {
  const skills = [
    { name: 'React.js', progress: 85 },
    { name: 'JavaScript', progress: 90 },
    { name: 'Node.js', progress: 70 },
    { name: 'CSS', progress: 80 },
    { name: 'MongoDB', progress: 60 }
  ];

  // Color scheme matching your analytics
  const getVariant = (progress) => {
    if (progress >= 80) return 'success';
    if (progress >= 60) return 'warning';
    return 'danger';
  };

  const getColor = (progress) => {
    if (progress >= 80) return '#10B981'; // success green
    if (progress >= 60) return '#F59E0B'; // warning orange
    return '#EF4444'; // danger red
  };

  return (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Header className="bg-white border-0 py-3">
        <h6 className="mb-0 fw-semibold">Skill Progress</h6>
      </Card.Header>
      <Card.Body className="p-4">
        {skills.map((skill, index) => (
          <div key={index} className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small fw-medium">{skill.name}</span>
              <span 
                className="small fw-bold" 
                style={{ color: getColor(skill.progress) }}
              >
                {skill.progress}%
              </span>
            </div>
            <ProgressBar 
              now={skill.progress} 
              variant={getVariant(skill.progress)}
              style={{ height: '8px' }}
              className="rounded-pill"
            />
          </div>
        ))}
      </Card.Body>
    </Card>
  );
};

export default SkillProgress;

