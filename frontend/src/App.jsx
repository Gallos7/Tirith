import { Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/auth/Login";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { AppLayout } from "./components/layout/AppLayout";
import { Dashboard } from "./pages/dashboard/Dashboard";
import { BeaconDetails } from "./pages/beacons/BeaconDetails";
import { Profile } from "./pages/users/Profile";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Routes wrapped in the AppLayout */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/beacon/:id" element={<BeaconDetails />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Fallback routing */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;