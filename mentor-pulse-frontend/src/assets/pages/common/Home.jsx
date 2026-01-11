import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Button,
  Card
} from 'react-bootstrap';
import { 
  FaRocket, 
  FaUsers, 
  FaGraduationCap, 
  FaChartLine, 
  FaStar,
  FaArrowRight,
  FaPlayCircle,
  FaShieldAlt,
  FaCode,
  FaBrain,
  FaNetworkWired
} from 'react-icons/fa';
import { 
  GiProgression,
  GiArtificialIntelligence
} from 'react-icons/gi';
import './Home.css';

const Home = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [counters, setCounters] = useState({
    mentors: 0,
    mentees: 0,
    hours: 0,
    rating: 0
  });

  const statsRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          startCounters();
        }
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const startCounters = () => {
    const targetValues = {
      mentors: 500,
      mentees: 2000,
      hours: 10000,
      rating: 4.9
    };

    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;

    Object.keys(targetValues).forEach(key => {
      let currentStep = 0;
      const increment = targetValues[key] / steps;

      const timer = setInterval(() => {
        currentStep++;
        setCounters(prev => ({
          ...prev,
          [key]: Math.min(
            Math.round(increment * currentStep),
            targetValues[key]
          )
        }));

        if (currentStep >= steps) {
          clearInterval(timer);
        }
      }, stepDuration);
    });
  };

  const features = [
    {
      icon: <FaUsers className="feature-icon" />,
      title: "Expert Mentors",
      description: "Connect with industry professionals and experienced mentors",
      color: "neon-blue"
    },
    {
      icon: <GiArtificialIntelligence className="feature-icon" />,
      title: "AI Matching",
      description: "Smart algorithm matches you with perfect mentors",
      color: "neon-purple"
    },
    {
      icon: <FaGraduationCap className="feature-icon" />,
      title: "Personalized Learning",
      description: "Tailored mentorship programs for your career goals",
      color: "neon-green"
    },
    {
      icon: <FaChartLine className="feature-icon" />,
      title: "Progress Tracking",
      description: "Monitor your growth with detailed analytics and insights",
      color: "neon-pink"
    },
    {
      icon: <FaNetworkWired className="feature-icon" />,
      title: "Global Network",
      description: "Access to worldwide community of professionals",
      color: "neon-orange"
    },
    {
      icon: <FaShieldAlt className="feature-icon" />,
      title: "Secure Platform",
      description: "Your data and conversations are protected and private",
      color: "neon-cyan"
    }
  ];

  const stats = [
    { number: `${counters.mentors}+`, label: "Active Mentors", icon: <FaUsers /> },
    { number: `${counters.mentees}+`, label: "Successful Mentees", icon: <GiProgression /> },
    { number: `${counters.hours}+`, label: "Hours Mentored", icon: <FaChartLine /> },
    { number: counters.rating, label: "Average Rating", icon: <FaStar /> }
  ];

  return (
    <div className="home-container">
      {/* Animated Neon Background */}
      <div className="neon-background">
        <div className="neon-grid">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="grid-line"></div>
          ))}
        </div>
        <div className="floating-neon-elements">
          <div className="neon-orb neon-orb-1"></div>
          <div className="neon-orb neon-orb-2"></div>
          <div className="neon-orb neon-orb-3"></div>
          <div className="neon-pulse"></div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="justify-content-center align-items-center min-vh-100">
            <Col lg={10} className="text-center">
              <div className={`hero-content ${isVisible ? 'neon-fade-in' : ''}`}>
                
                {/* Animated Neon Badge */}
                <div className="neon-badge">
                  <FaRocket className="hero-icon" />
                  <div className="neon-glow"></div>
                </div>

                <h1 className="hero-title">
                  Welcome to <span className="neon-text-gradient">MentorPulse</span>
                </h1>
                
                <p className="hero-subtitle">
                  Where <span className="neon-highlight">ambition meets guidance</span>. Connect with expert mentors, 
                  accelerate your career, and build meaningful professional relationships 
                  that last a lifetime.
                </p>

                {/* Animated CTA Buttons */}
                <div className="hero-actions">
                  <Link to="/register">
                    <Button className="btn-neon-primary btn-hero">
                      <span>Launch Your Journey</span>
                      <FaArrowRight className="ms-2 pulse" />
                    </Button>
                  </Link>
                  
                  <Link to="/login">
                    <Button variant="outline-light" className="btn-hero btn-neon-outline">
                      Sign In to Continue
                    </Button>
                  </Link>
                </div>

                {/* Scroll Indicator */}
                <div className="neon-scroll-indicator">
                  <div className="scroll-arrow"></div>
                  <div className="neon-glow-scroll"></div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="stats-section py-5">
        <Container>
          <Row className="g-4">
            {stats.map((stat, index) => (
              <Col key={index} md={3} sm={6}>
                <Card className={`stat-card neon-card fade-in-delay-${index + 1}`}>
                  <Card.Body className="text-center">
                    <div className="stat-icon neon-icon">
                      {stat.icon}
                    </div>
                    <h3 className="stat-number neon-counter">
                      {stat.number}
                    </h3>
                    <p className="stat-label">{stat.label}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="features-section py-5">
        <Container>
          <Row className="justify-content-center mb-5">
            <Col lg={8} className="text-center">
              <h2 className="section-title neon-title">
                Why Choose <span className="neon-text">MentorPulse</span>?
              </h2>
              <p className="section-subtitle">
                Experience the future of mentorship with our cutting-edge platform
              </p>
            </Col>
          </Row>

          <Row className="g-4">
            {features.map((feature, index) => (
              <Col key={index} lg={4} md={6}>
                <Card className={`feature-card neon-feature-card fade-in-delay-${(index % 3) + 1}`}>
                  <Card.Body className="text-center">
                    <div className={`feature-icon-wrapper ${feature.color}`}>
                      {feature.icon}
                      <div className="icon-glow"></div>
                    </div>
                    <h4 className="feature-title">{feature.title}</h4>
                    <p className="feature-description">{feature.description}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="cta-section py-5">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8} className="text-center">
              <Card className="cta-card neon-cta-card">
                <Card.Body className="py-5">
                  <h2 className="cta-title">Ready to Transform Your Career?</h2>
                  <p className="cta-subtitle">
                    Join thousands of professionals who have accelerated their growth with MentorPulse
                  </p>
                  
                  <div className="cta-actions">
                    <Link to="/register">
                      <Button className="btn-neon-cta btn-lg">
                        <FaPlayCircle className="me-2 pulse" />
                        Get Started Free
                      </Button>
                    </Link>
                    
                    <div className="trust-badges mt-4">
                      <div className="trust-item">
                        <FaStar className="text-warning me-1" />
                        <small>Rated 4.9/5 by our community</small>
                      </div>
                      <div className="trust-item">
                        <FaShieldAlt className="text-info me-1" />
                        <small>Secure & Private</small>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Demo Section */}
      <section className="demo-section py-5">
        <Container>
          <Row className="justify-content-center">
            <Col md={8}>
              <Card className="demo-card neon-demo-card">
                <Card.Body className="text-center py-4">
                  <h5 className="demo-title">
                    <FaRocket className="me-2 pulse" />
                    Quick Start Demo
                  </h5>
                  <p className="demo-text">
                    Experience the platform instantly with our demo account
                  </p>
                  <div className="demo-credentials">
                    <div className="credential-item">
                      <strong>Email:</strong> 
                      <code>demo@mentorpulse.com</code>
                    </div>
                    <div className="credential-item">
                      <strong>Password:</strong> 
                      <code>demopassword123</code>
                    </div>
                  </div>
                  <Link to="/login">
                    <Button variant="outline-light" className="btn-neon-demo">
                      Try Demo Now
                    </Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Home;