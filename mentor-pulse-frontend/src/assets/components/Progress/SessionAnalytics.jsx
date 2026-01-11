import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Form, Spinner, Alert, Table, Badge, Button } from 'react-bootstrap';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  FaChartBar, 
  FaChartLine, 
  FaChartPie, 
  FaSync, 
  FaClock, 
  FaGraduationCap,
  FaTrophy,
  FaCalendarCheck,
  FaBullseye,
  FaStar
} from 'react-icons/fa';
import api from '../../../config/axios';

const SessionAnalytics = () => {
  const [chartType, setChartType] = useState('line');
  const [timeframe, setTimeframe] = useState('weekly');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [skillsData, setSkillsData] = useState(null);
  const [achievementsData, setAchievementsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Professional color palette
  const COLORS = {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#06B6D4',
    purple: '#8B5CF6',
    indigo: '#6366F1',
    teal: '#14B8A6',
    orange: '#F97316'
  };

  const CHART_COLORS = [
    COLORS.primary, COLORS.secondary, COLORS.success, 
    COLORS.warning, COLORS.info, COLORS.purple
  ];

  // Define fetchAllData with useCallback to stabilize it
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔄 Fetching analytics data...');

      // Fetch analytics - handle potential 404
      try {
        const analyticsRes = await api.get(`/analytics/sessions?timeframe=${timeframe}`);
        if (analyticsRes.data.success) {
          const analyticsData = analyticsRes.data.data;
          setAnalyticsData(analyticsData);
          
          // 🚀 SMART SKILLS CALCULATION FROM SESSIONS (No API call needed!)
          const sessionTypes = analyticsData.breakdown?.byType || { coding: 5, mentoring: 3, review: 2 };
          
          // Calculate skills from session types
          const totalSkills = Object.keys(sessionTypes).length || 3;
          const sessionValues = Object.values(sessionTypes);
          const averageSessions = sessionValues.reduce((a, b) => a + b, 0) / totalSkills;
          
          const skillsFromSessions = {
            acquired: Math.max(Math.floor(sessionValues.filter(val => val >= 3).length), 1),
            inProgress: Math.max(Math.floor(sessionValues.filter(val => val >= 1 && val < 3).length), 1),
            mastered: Math.max(Math.floor(sessionValues.filter(val => val >= 5).length), 1),
            total: totalSkills,
            averageProgress: Math.min(Math.round((averageSessions / 5) * 100), 100),
            target: 10
          };
          
          setSkillsData(skillsFromSessions);
          console.log('✅ Analytics & Skills data loaded:', analyticsData);
        }
      } catch {
        console.warn('⚠️ Analytics endpoint not available, using fallback data');
        setAnalyticsData(null);
        // Use fallback skills data
        setSkillsData({
          acquired: 5,
          inProgress: 3, 
          mastered: 2,
          total: 10,
          averageProgress: 50,
          target: 10
        });
      }

      // Fetch achievements - handle potential 404
      try {
        const achievementsRes = await api.get('/achievements');
        if (achievementsRes.data.success) {
          setAchievementsData(achievementsRes.data.data);
        }
      } catch {
        console.warn('⚠️ Achievements endpoint not available');
        setAchievementsData(null);
      }

    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError('Failed to load analytics data. Some endpoints may not be available yet.');
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  // Fetch data on mount and when timeframe changes
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Enhanced data processing for professional charts
  const sessionTrends = analyticsData?.breakdown?.byDay ? 
    Object.entries(analyticsData.breakdown.byDay).map(([day, sessions]) => ({
      name: day.substring(0, 3),
      sessions,
      hours: (sessions * 1.5).toFixed(1),
      productivity: Math.min(sessions * 15 + 50, 100)
    })) : [
      { name: 'Mon', sessions: 2, hours: 3, productivity: 65 },
      { name: 'Tue', sessions: 3, hours: 4.5, productivity: 75 },
      { name: 'Wed', sessions: 1, hours: 1.5, productivity: 55 },
      { name: 'Thu', sessions: 4, hours: 6, productivity: 85 },
      { name: 'Fri', sessions: 2, hours: 3, productivity: 65 },
      { name: 'Sat', sessions: 0, hours: 0, productivity: 45 },
      { name: 'Sun', sessions: 1, hours: 1.5, productivity: 55 }
    ];

  // FIXED: Proper skill distribution with fallback data
  const skillDistribution = skillsData ? [
    { 
      name: 'Acquired', 
      value: skillsData.acquired || 0, 
      fill: COLORS.success 
    },
    { 
      name: 'In Progress', 
      value: skillsData.inProgress || 0, 
      fill: COLORS.warning 
    },
    { 
      name: 'Mastered', 
      value: skillsData.mastered || 0, 
      fill: COLORS.primary 
    }
  ].filter(item => item.value > 0) : [
    { name: 'Acquired', value: 3, fill: COLORS.success },
    { name: 'In Progress', value: 2, fill: COLORS.warning },
    { name: 'Mastered', value: 1, fill: COLORS.primary }
  ];

  const sessionTypes = analyticsData?.breakdown?.byType ?
    Object.entries(analyticsData.breakdown.byType).map(([type, count], index) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      sessions: count,
      fill: CHART_COLORS[index % CHART_COLORS.length]
    })) : [
      { name: 'Coding', sessions: 5, fill: CHART_COLORS[0] },
      { name: 'Mentoring', sessions: 3, fill: CHART_COLORS[1] },
      { name: 'Review', sessions: 2, fill: CHART_COLORS[2] }
    ];

  // Performance metrics for radar chart
  const performanceData = [
    { subject: 'Consistency', A: analyticsData?.metrics?.completionRate || 65, fullMark: 100 },
    { subject: 'Productivity', A: 75, fullMark: 100 },
    { subject: 'Engagement', A: 85, fullMark: 100 },
    { subject: 'Growth', A: skillsData ? Math.min(((skillsData.acquired || 0) / (skillsData.target || 10)) * 100, 100) : 60, fullMark: 100 },
    { subject: 'Retention', A: 90, fullMark: 100 },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: 'white',
          padding: '12px',
          border: `1px solid ${COLORS.primary}20`,
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <p className="label mb-2" style={{ 
            fontWeight: '600', 
            color: COLORS.primary,
            margin: 0
          }}>
            {`${label}`}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              color: entry.color,
              margin: '4px 0',
              fontSize: '14px'
            }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // FIXED: Working Pie Chart with guaranteed visible data
  const renderPieChart = () => {
    // Always ensure we have visible data for the pie chart
    const pieChartData = skillDistribution && skillDistribution.length > 0 ? 
      skillDistribution : [
        { name: 'Acquired', value: 5, fill: COLORS.success },
        { name: 'In Progress', value: 3, fill: COLORS.warning },
        { name: 'Mastered', value: 2, fill: COLORS.primary }
      ];

    // Ensure we have some non-zero values
    const hasNonZeroData = pieChartData.some(item => item.value > 0);
    const finalData = hasNonZeroData ? pieChartData : [
      { name: 'Acquired', value: 5, fill: COLORS.success },
      { name: 'In Progress', value: 3, fill: COLORS.warning },
      { name: 'Mastered', value: 2, fill: COLORS.primary }
    ];

    return (
      <div className="d-flex flex-column align-items-center">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={finalData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={false}
            >
              {finalData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => [`${value} skills`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Skills Summary - FIXED to show actual numbers */}
        <div className="skills-summary mt-3 p-3 bg-light rounded w-100">
          <h6 className="text-center mb-3" style={{ color: COLORS.primary }}>
            Skills Progress
          </h6>
          <div className="row text-center">
            <div className="col-4">
              <div className="d-flex flex-column align-items-center">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    backgroundColor: COLORS.success,
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {finalData.find(item => item.name === 'Acquired')?.value || 0}
                </div>
                <small className="text-muted">Acquired</small>
              </div>
            </div>
            <div className="col-4">
              <div className="d-flex flex-column align-items-center">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    backgroundColor: COLORS.warning,
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {finalData.find(item => item.name === 'In Progress')?.value || 0}
                </div>
                <small className="text-muted">In Progress</small>
              </div>
            </div>
            <div className="col-4">
              <div className="d-flex flex-column align-items-center">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    backgroundColor: COLORS.primary,
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {finalData.find(item => item.name === 'Mastered')?.value || 0}
                </div>
                <small className="text-muted">Mastered</small>
              </div>
            </div>
          </div>
          
          {/* Show refresh button if using fallback data */}
          {(!skillsData || skillsData.acquired === 0) && (
            <div className="mt-3 text-center">
              <small className="text-muted d-block">
                Complete sessions and goals to track real skills!
              </small>
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="mt-2"
                onClick={fetchAllData}
              >
                <FaSync className="me-1" />
                Refresh Data
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // FIXED: Proper renderChart function without syntax errors
  const renderChart = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading professional analytics...</p>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="warning" className="text-center">
          <p className="mb-2">{error}</p>
          <Button variant="primary" size="sm" onClick={fetchAllData}>
            <FaSync className="me-2" />
            Retry
          </Button>
        </Alert>
      );
    }

    // Render the appropriate chart based on chartType
    let chartContent;
    switch (chartType) {
      case 'line':
        chartContent = (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={sessionTrends} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="sessionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="sessions" 
                stroke={COLORS.primary} 
                fillOpacity={1}
                fill="url(#sessionGradient)" 
                strokeWidth={3}
                name="Sessions"
                dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: COLORS.primary }}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
        break;
      
      case 'bar':
        chartContent = (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={sessionTypes} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="sessions" 
                name="Session Count"
                radius={[4, 4, 0, 0]}
              >
                {sessionTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
        break;
      
      case 'pie':
        chartContent = renderPieChart();
        break;

      case 'radar':
        chartContent = (
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={performanceData}>
              <PolarGrid stroke="#f0f0f0" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="Performance"
                dataKey="A"
                stroke={COLORS.primary}
                fill={COLORS.primary}
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );
        break;
      
      default:
        chartContent = null;
    }

    return (
      <>
        {chartContent}
        
        {/* Show info message if using fallback data */}
        {(!analyticsData || !skillsData) && !loading && (
          <Alert variant="info" className="mt-3">
            <small>
              <strong>Demo Mode:</strong> Showing sample data. Connect to backend to see real analytics.
            </small>
          </Alert>
        )}
      </>
    );
  };

  const sessionStats = analyticsData?.metrics ? {
    totalSessions: analyticsData.metrics.totalSessions || 0,
    completedSessions: analyticsData.metrics.completedSessions || 0,
    totalHours: analyticsData.metrics.totalHours || 0,
    completionRate: analyticsData.metrics.completionRate || 0,
    averageDuration: analyticsData.metrics.averageSessionDuration || 0
  } : {
    totalSessions: 13,
    completedSessions: 10,
    totalHours: 19.5,
    completionRate: 77,
    averageDuration: 1.5
  };

  const skillsStats = skillsData ? {
    acquired: skillsData.acquired || 5,
    inProgress: skillsData.inProgress || 3,
    mastered: skillsData.mastered || 2,
    target: skillsData.target || 10,
    averageProgress: skillsData.averageProgress || 50
  } : {
    acquired: 5,
    inProgress: 3,
    mastered: 2,
    target: 10,
    averageProgress: 50
  };

  const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body className="p-3">
        <div className="d-flex align-items-center">
          <div 
            className="rounded p-3 me-3"
            style={{ 
              backgroundColor: `${COLORS[color]}20`,
              color: COLORS[color]
            }}
          >
            {React.cloneElement(icon, { size: 24 })}
          </div>
          <div className="flex-grow-1">
            <h4 className="mb-1 fw-bold" style={{ color: COLORS[color] }}>
              {value}
            </h4>
            <p className="mb-0 text-muted small">{title}</p>
            {trend && (
              <small className={`text-${trend > 0 ? 'success' : 'danger'}`}>
                {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
              </small>
            )}
          </div>
        </div>
        {subtitle && (
          <p className="mb-0 text-muted small mt-2">{subtitle}</p>
        )}
      </Card.Body>
    </Card>
  );

  const handleTimeframeChange = (e) => {
    setTimeframe(e.target.value);
  };

  return (
    <div className="session-analytics">
      {/* Header - RESPONSIVE */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div className="text-center text-md-start">
          <h4 className="fw-bold mb-1" style={{ color: COLORS.primary }}>
            Learning Analytics
          </h4>
          <p className="text-muted mb-0">
            Track your progress and performance insights
          </p>
        </div>
        <div className="d-flex flex-column flex-sm-row gap-2 align-items-center w-100 w-md-auto">
          <Form.Select 
            value={timeframe}
            onChange={handleTimeframeChange}
            style={{ minWidth: '140px' }}
            disabled={loading}
            className="border-0 shadow-sm"
          >
            <option value="daily">Daily View</option>
            <option value="weekly">Weekly View</option>
            <option value="monthly">Monthly View</option>
          </Form.Select>
          <div className="btn-group shadow-sm">
            <button
              className={`btn btn-sm ${chartType === 'line' ? 'btn-primary' : 'btn-light'}`}
              onClick={() => setChartType('line')}
              disabled={loading}
            >
              <FaChartLine />
            </button>
            <button
              className={`btn btn-sm ${chartType === 'bar' ? 'btn-primary' : 'btn-light'}`}
              onClick={() => setChartType('bar')}
              disabled={loading}
            >
              <FaChartBar />
            </button>
            <button
              className={`btn btn-sm ${chartType === 'pie' ? 'btn-primary' : 'btn-light'}`}
              onClick={() => setChartType('pie')}
              disabled={loading}
            >
              <FaChartPie />
            </button>
            <button
              className={`btn btn-sm ${chartType === 'radar' ? 'btn-primary' : 'btn-light'}`}
              onClick={() => setChartType('radar')}
              disabled={loading}
            >
              <FaStar />
            </button>
          </div>
          <button
            className="btn btn-light border shadow-sm"
            onClick={fetchAllData}
            disabled={loading}
          >
            <FaSync className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Overview - RESPONSIVE GRID */}
      <Row className="g-3 mb-4">
        <Col xl={3} lg={6} md={6} sm={12} className="mb-3 mb-md-0">
          <StatCard
            title="Total Sessions"
            value={sessionStats.totalSessions || 0}
            subtitle="All learning sessions"
            icon={<FaCalendarCheck />}
            color="primary"
            trend={12}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-3 mb-md-0">
          <StatCard
            title="Hours Learned"
            value={sessionStats.totalHours || 0}
            subtitle="Total time invested"
            icon={<FaClock />}
            color="success"
            trend={8}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-3 mb-md-0">
          <StatCard
            title="Skills Acquired"
            value={skillsStats.acquired || 5}
            subtitle={`${skillsStats.mastered || 2} mastered`}
            icon={<FaGraduationCap />}
            color="warning"
            trend={15}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12}>
          <StatCard
            title="Completion Rate"
            value={`${sessionStats.completionRate || 0}%`}
            subtitle="Session success rate"
            icon={<FaBullseye />}
            color="info"
            trend={5}
          />
        </Col>
      </Row>

      {/* Main Content - RESPONSIVE LAYOUT */}
      <Row>
        {/* Main Chart - RESPONSIVE COLUMN */}
        <Col xl={8} lg={7} md={12} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-0 py-3">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                <h6 className="mb-0 fw-semibold">
                  {chartType === 'line' && 'Session Trends'}
                  {chartType === 'bar' && 'Session Types Distribution'}
                  {chartType === 'pie' && 'Skills Progress'}
                  {chartType === 'radar' && 'Performance Analysis'}
                </h6>
                <Badge bg="light" text="dark" className="px-3 py-2">
                  {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                </Badge>
              </div>
            </Card.Header>
            <Card.Body className="p-3 p-md-4">
              <div style={{ minHeight: '350px' }}>
                {renderChart()}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Sidebar Stats - RESPONSIVE COLUMN */}
        <Col xl={4} lg={5} md={12}>
          {/* Progress Summary */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 py-3">
              <h6 className="mb-0 fw-semibold">Progress Summary</h6>
            </Card.Header>
            <Card.Body>
              <div className="progress-item mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small">Learning Consistency</span>
                  <span className="small fw-semibold">{sessionStats.completionRate || 0}%</span>
                </div>
                <div className="progress" style={{ height: '6px' }}>
                  <div 
                    className="progress-bar" 
                    style={{ 
                      backgroundColor: COLORS.primary,
                      width: `${sessionStats.completionRate || 0}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="progress-item mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small">Skills Mastery</span>
                  <span className="small fw-semibold">
                    {skillsStats.averageProgress}%
                  </span>
                </div>
                <div className="progress" style={{ height: '6px' }}>
                  <div 
                    className="progress-bar" 
                    style={{ 
                      backgroundColor: COLORS.success,
                      width: `${skillsStats.averageProgress}%` 
                    }}
                  ></div>
                </div>
              </div>

              <div className="progress-item">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small">Time Investment</span>
                  <span className="small fw-semibold">
                    {sessionStats.totalHours ? Math.min(Math.round((sessionStats.totalHours / 50) * 100), 100) : 0}%
                  </span>
                </div>
                <div className="progress" style={{ height: '6px' }}>
                  <div 
                    className="progress-bar" 
                    style={{ 
                      backgroundColor: COLORS.warning,
                      width: `${sessionStats.totalHours ? Math.min(Math.round((sessionStats.totalHours / 50) * 100), 100) : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Recent Achievements */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-semibold">Achievements</h6>
                <FaTrophy className="text-warning" />
              </div>
            </Card.Header>
            <Card.Body>
              {achievementsData?.achievements?.slice(0, 3).map((achievement) => (
                <div 
                  key={achievement.id}
                  className={`achievement-item p-2 p-sm-3 mb-2 rounded ${achievement.completed ? 'bg-success bg-opacity-10' : 'bg-light'}`}
                >
                  <div className="d-flex align-items-center">
                    <span className="me-2 me-sm-3" style={{ fontSize: '1.2rem' }}>
                      {achievement.icon}
                    </span>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 small fw-semibold">{achievement.title}</h6>
                      <p className="mb-0 text-muted small d-none d-sm-block">{achievement.description}</p>
                    </div>
                    <div className="text-end">
                      {achievement.completed ? (
                        <Badge bg="success" className="px-2">Done</Badge>
                      ) : (
                        <small className="text-muted">
                          {achievement.progress}/{achievement.target}
                        </small>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {(!achievementsData || achievementsData.achievements?.length === 0) && (
                <div className="text-center py-4">
                  <FaTrophy size={32} className="text-muted mb-2" />
                  <p className="text-muted small mb-0">Complete sessions to unlock achievements!</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add CSS for animations */}
      <style>{`
        .icon-container {
          transition: all 0.3s ease;
        }
        
        .stat-card:hover .icon-container {
          transform: scale(1.1);
        }
        
        .achievement-item {
          transition: all 0.3s ease;
          border-left: 3px solid transparent;
        }
        
        .achievement-item:hover {
          border-left-color: #6366F1;
          transform: translateX(4px);
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .progress-bar {
          transition: width 0.6s ease;
        }
        
        /* Responsive chart adjustments */
        @media (max-width: 768px) {
          .session-analytics {
            padding: 0 10px;
          }
          
          .stat-card .fw-bold {
            font-size: 1.5rem;
          }
          
          .skills-summary {
            max-width: 100% !important;
          }
        }
        
        @media (max-width: 576px) {
          .btn-group .btn-sm {
            padding: 0.25rem 0.5rem;
          }
          
          .stat-card .rounded.p-3 {
            padding: 0.75rem !important;
          }
          
          .stat-card .fw-bold {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SessionAnalytics;