import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package, Activity, Zap, Boxes } from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalWorkers: 0,
    totalProducts: 0,
    totalMachines: 0,
    totalShifts: 0,
    totalPieces: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Single API call to get all dashboard stats
        const response = await api.get('/users/dashboard/stats');
        
        if (response.data.status) {
          setStats(response.data.data);
          setError(null);
        } else {
          setError('Failed to fetch dashboard statistics');
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setError('Error fetching dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const dashboardCards = [
    {
      title: 'Workers',
      count: stats.totalWorkers,
      icon: Users,
      color: '#007bff',
      link: '/workers'
    },
    {
      title: 'Products',
      count: stats.totalProducts,
      icon: Package,
      color: '#28a745',
      link: '/products'
    },
    {
      title: 'Machines',
      count: stats.totalMachines,
      icon: Activity,
      color: '#fd7e14',
      link: '/meters'
    },
    // {
    //   title: 'Shifts',
    //   count: stats.totalShifts,
    //   icon: Zap,
    //   color: '#dc3545',
    //   link: '/shift-assignment'
    // },
    // {
    //   title: 'Pieces',
    //   count: stats.totalPieces,
    //   icon: Boxes,
    //   color: '#6f42c1',
    //   link: '/pieces'
    // }
  ];

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error" style={{ color: 'red', padding: '20px' }}>Error: {error}</div>;
  }

  return (
    <div className="container">
      <h1 className="mb-20">Dashboard</h1>
      
      <div className="grid grid-5">
        {dashboardCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Link key={index} to={card.link} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ 
                borderLeft: `4px solid ${card.color}`,
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 style={{ color: card.color, marginBottom: '10px' }}>
                      {card.title}
                    </h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                      {card.count}
                    </p>
                  </div>
                  <IconComponent size={48} color={card.color} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;