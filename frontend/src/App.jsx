import { Routes, Route } from 'react-router-dom'
import ProtectedRoute    from './components/ProtectedRoute'
import RegisterPage      from './pages/auth/RegisterPage'
import ActivatePage      from './pages/auth/ActivatePage'
import LoginPage         from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage  from './pages/auth/ResetPasswordPage'
import LandingPage from './pages/LandingPage'
import DashboardPage     from './pages/DashboardPage'
import ResumesPage from './pages/ResumesPage'
import JobDescriptionsPage from './pages/JobDescriptionsPage'
import JobDescriptionDetailPage from './pages/JobDescriptionDetailPage'
import ApplicationsPage from './pages/ApplicationsPage'
import ApplicationDetailPage from './pages/ApplicationDetailPage'
import ResumeDetailPage from './pages/ResumeDetailPage'
import JobRecommendationsPage from './pages/JobRecommendationsPage'
import CVGeneratorPage from './pages/CVGeneratorPage'
import ResumeGeneratorPage from './pages/ResumeGeneratorPage'
import AnalyticsPage from './pages/AnalyticsPage'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/register"        element={<RegisterPage />} />
      <Route path="/activate"        element={<ActivatePage />} />
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />

      {/* Protected — more added as features are built */}
      <Route path="/dashboard" element={
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      } />

      <Route path="/" element={<LandingPage />} />
      <Route path="/resumes" element={<ProtectedRoute><ResumesPage /></ProtectedRoute>} />
      <Route
        path="/job-descriptions"
        element={
          <ProtectedRoute>
            <JobDescriptionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/job-descriptions/:id"
        element={
          <ProtectedRoute>
            <JobDescriptionDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/applications"
        element={
          <ProtectedRoute>
            <ApplicationsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/resumes/:id" element={<ProtectedRoute><ResumeDetailPage /></ProtectedRoute>} />
      <Route
        path="/applications/:id"
        element={
          <ProtectedRoute>
            <ApplicationDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/job-recommendations"
        element={
          <ProtectedRoute>
            <JobRecommendationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cv-generator"
        element={
          <ProtectedRoute>
            <CVGeneratorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cv-generator/:id"
        element={
          <ProtectedRoute>
            <CVGeneratorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume-generator"
        element={
          <ProtectedRoute>
            <ResumeGeneratorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume-generator/:id"
        element={
          <ProtectedRoute>
            <ResumeGeneratorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
