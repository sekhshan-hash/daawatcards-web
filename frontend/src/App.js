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
import GuestsPage from "@/pages/GuestsPage";
import GuestCardPage from "@/pages/GuestCardPage";
import ContactsTest from "@/pages/ContactsTest";
import LegalPage from "@/pages/LegalPage";
import Contact from "@/pages/Contact";
import Admin from "@/pages/Admin";
import Upgrade from "@/pages/Upgrade";
import Receipt from "@/pages/Receipt";
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
        <Route path="/contacts-test" element={<ContactsTest />} />
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={guard(<Dashboard />)} />
          <Route path="/create" element={guard(<Wizard />)} />
          <Route path="/cards/:cardId" element={guard(<CardDetail />)} />
          <Route path="/cards/:cardId/guests" element={guard(<GuestsPage />)} />
          <Route path="/cards/:cardId/edit" element={guard(<Wizard />)} />
          <Route path="/terms" element={<LegalPage page="terms" />} />
          <Route path="/privacy" element={<LegalPage page="privacy" />} />
          <Route path="/refund" element={<LegalPage page="refund" />} />
          <Route path="/pricing" element={<LegalPage page="pricing" />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={guard(<Admin />)} />
          <Route path="/cards/:cardId/upgrade" element={guard(<Upgrade />)} />
          <Route path="/receipt/:orderId" element={guard(<Receipt />)} />
          <Route path="*" element={<Landing />} />
        </Route>
      </Routes>
      <Toaster position="top-center" theme="dark" />
    </BrowserRouter>
  );
}

export default App;
