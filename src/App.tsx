import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import RutaProtegida from './components/RutaProtegida/RutaProtegida';

// Reemplaza esto por tu página real de dashboard cuando la construyas.
function Dashboard() {
  return <div style={{ padding: 32, fontFamily: 'Inter, sans-serif' }}>Dashboard (placeholder)</div>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <RutaProtegida>
            <Dashboard />
          </RutaProtegida>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;