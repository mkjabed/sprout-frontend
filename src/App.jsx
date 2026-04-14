import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/useAuth.js";
import ChildScorecard from "./pages/ChildScorecard.jsx";
import GuardianDashboard from "./pages/GuardianDashboard.jsx";
import ProfileSelector from "./pages/ProfileSelector.jsx";
import RewardsPage from "./pages/RewardsPage.jsx";
import TaskManager from "./pages/TaskManager.jsx";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<ProfileSelector />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <GuardianDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/child/:childId" element={<ChildScorecard />} />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <TaskManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rewards"
        element={
          <ProtectedRoute>
            <RewardsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
