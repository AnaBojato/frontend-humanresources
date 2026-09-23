import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Directory from "./pages/Directory/Directory";
import Shifts from "./pages/Shifts/Shifts";

import RutaProtegida from "./components/RutaProtegida/RutaProtegida";
import Candidate from "./pages/Candidate/Candidate";

function App() {
  return (
    <Routes>

      {/* LOGIN */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* DASHBOARD */}
      <Route
        path="/dashboard"
        element={
          <RutaProtegida>
            <Dashboard />
          </RutaProtegida>
        }
      />

      {/* DIRECTORY */}
      <Route
        path="/directorio"
        element={
          <RutaProtegida>
            <Directory />
          </RutaProtegida>
        }
      />

      {/* SHIFTS */}
      <Route
        path="/shifts"
        element={
          <RutaProtegida>
            <Shifts />
          </RutaProtegida>
        }
      />

      {/* DEFAULT */}
      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      {/* CANDIDATE */}
      <Route
        path="/candidatos"
        element={
          <RutaProtegida>
            <Candidate />
          </RutaProtegida>
        }
      />

      {/* NOT FOUND */}
      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

    </Routes>
  );
}

export default App;