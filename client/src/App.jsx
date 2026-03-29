import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EventTypes from './pages/EventTypes';
import CreateEventType from './pages/CreateEventType';
import BookingPage from './pages/BookingPage';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';

function AppLayout({ children }) {
    return (
        <>
            <Sidebar />
            <main className="main-content">{children}</main>
        </>
    );
}

function AuthLayout({ children }) {
    return (
        <>
            <Topbar />
            {children}
            <Footer />
        </>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public auth pages */}
                    <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
                    <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />

                    {/* Public booking pages — no sidebar */}
                    <Route path="/book/:id" element={<BookingPage />} />
                    <Route path="/u/:username/:slug" element={<BookingPage />} />
                    <Route path="/u/:username" element={<UserProfile />} />

                    {/* Landing page */}
                    <Route path="/" element={<AuthLayout><Home /></AuthLayout>} />

                    {/* Protected app pages — with sidebar */}
                    <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
                    <Route path="/event-types" element={<ProtectedRoute><AppLayout><EventTypes /></AppLayout></ProtectedRoute>} />
                    <Route path="/event-types/new" element={<ProtectedRoute><AppLayout><CreateEventType /></AppLayout></ProtectedRoute>} />
                    <Route path="/event-types/:id/edit" element={<ProtectedRoute><AppLayout><CreateEventType /></AppLayout></ProtectedRoute>} />
                    <Route path="/bookings" element={<ProtectedRoute><AppLayout><MyBookings /></AppLayout></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;