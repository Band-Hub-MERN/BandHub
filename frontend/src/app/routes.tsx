import { createBrowserRouter, Navigate } from 'react-router';
import DashboardLayout from './components/layout/DashboardLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import EmailVerification from './pages/EmailVerification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MemberDashboard from './pages/MemberDashboard';
import GarageBooking from './pages/GarageBooking';
import OrganizationManagement from './pages/OrganizationManagement';
import EventsFeed from './pages/EventsFeed';
import EventCreate from './pages/EventCreate';
import EventDetails from './pages/EventDetails';
import Invites from './pages/Invites';
import Settings from './pages/Settings';

export const router = createBrowserRouter([
  { path: '/', Component: Landing },
  { path: '/login', Component: Login },
  { path: '/register', Component: Register },
  { path: '/verify-email', Component: EmailVerification },
  { path: '/forgot-password', Component: ForgotPassword },
  { path: '/reset-password', Component: ResetPassword },
  {
    Component: DashboardLayout,
    children: [
      { path: '/dashboard', Component: MemberDashboard },
      { path: '/garages', Component: GarageBooking },
      { path: '/organization', Component: OrganizationManagement },
      { path: '/invites', Component: Invites },
      { path: '/events', Component: EventsFeed },
      { path: '/events/create', Component: EventCreate },
      { path: '/events/:id/edit', Component: EventCreate },
      { path: '/events/:id', Component: EventDetails },
      { path: '/settings', Component: Settings },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
