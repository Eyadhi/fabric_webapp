import { useAuth } from '../contexts/AuthContext';

const AuthDebug = () => {
  const { user } = useAuth();
  
  const checkLocalStorage = () => {
    // Debug functionality disabled
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#f0f0f0', 
      padding: '10px', 
      border: '1px solid #ccc',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <h4>Auth Debug</h4>
      <p>User: {user ? user.username || 'Logged in' : 'Not logged in'}</p>
      <button onClick={checkLocalStorage} style={{ marginRight: '5px' }}>
        Check Storage
      </button>
      <button onClick={clearAuth}>
        Clear Auth
      </button>
    </div>
  );
};

export default AuthDebug;