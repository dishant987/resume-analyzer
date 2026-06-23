import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PublicLayout from '../components/ui/public-layout'
import DashboardLayout from '../components/ui/dashboard-layout'
import Landing from '../pages/Landing'
import Login from '../pages/Login'
import Signup from '../pages/Signup'
import Dashboard from '../pages/Dashboard'
import Upload from '../pages/Upload'
import Analysis from '../pages/Analysis'
import JobMatcher from '../pages/JobMatcher'
import CoverLetter from '../pages/CoverLetter'
import InterviewPrep from '../pages/InterviewPrep'
import Roadmap from '../pages/Roadmap'
import SalaryNegotiation from '../pages/SalaryNegotiation'
import Editor from '../pages/Editor'
import Profile from '../pages/Profile'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/analysis/:resumeId" element={<Analysis />} />
          <Route path="/analysis/:resumeId/job-matcher" element={<JobMatcher />} />
          <Route path="/analysis/:resumeId/cover-letter" element={<CoverLetter />} />
          <Route path="/analysis/:resumeId/interview-prep" element={<InterviewPrep />} />
          <Route path="/analysis/:resumeId/roadmap" element={<Roadmap />} />
          <Route path="/analysis/:resumeId/salary-negotiation" element={<SalaryNegotiation />} />
          <Route path="/editor/:resumeId" element={<Editor />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
