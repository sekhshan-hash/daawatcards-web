import "@/App.css";
import { BrowserRouter, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/host/HostShell";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import Dashboard from "@/pages/Dashboard";
import Wizard from "@/pages/Wizard";
import CardDetail from "@/pages/CardDetail";
import GuestCardPage from "@/pages/GuestCardPage";
import { BRAND } from "@/config/brand";

document.title = `${BRAND.name} · Cinematic Invitations`;

const AuthGate = () => {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return <Outlet />;
};

const AuthLayout = () => (
  <AuthProvider>
    <AuthGate />
  </AuthProvider>
);

const guard = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/i/:slug/:eventId?" element={<GuestCardPage />} />
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={guard(<Dashboard />)} />
          <Route path="/create" element={guard(<Wizard />)} />
          <Route path="/cards/:cardId" element={guard(<CardDetail />)} />
          <Route path="/cards/:cardId/edit" element={guard(<Wizard />)} />
          <Route path="*" element={<Landing />} />
        </Route>
      </Routes>
      <Toaster position="top-center" theme="dark" />
    </BrowserRouter>
  );
}

export default App;
