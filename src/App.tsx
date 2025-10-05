import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ExamDemo from "./pages/ExamDemo";
import About from "./pages/About";
import Features from "./pages/Features";
import EmailVerification from "./pages/EmailVerification";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import LecturerDashboard from "./pages/LecturerDashboard";
import ExamInterface from "./pages/ExamInterface";
import ExamCreator from "./pages/ExamCreator";
import ComplaintManagement from "./pages/ComplaintManagement";
import UserManagement from "./pages/UserManagement";
import SystemAnalytics from "./pages/SystemAnalytics";
import SecuritySettings from "./pages/SecuritySettings";
import SystemSettings from "./pages/SystemSettings";
import StudentComplaint from "./pages/StudentComplaint";
import AcademicRecords from "./pages/AcademicRecords";
import ExamSchedule from "./pages/ExamSchedule";
import HelpSupport from "./pages/HelpSupport";
import ExamSubmissions from "./pages/ExamSubmissions";
import ExamResults from "./pages/ExamResults";
import ScheduleExam from "./pages/ScheduleExam";
import LecturerAnalytics from "./pages/LecturerAnalytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/demo" element={<ExamDemo />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/email-verification" element={<EmailVerification />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/lecturer-dashboard" element={<LecturerDashboard />} />
          <Route path="/exam/:examId/attempt/:attemptId" element={<ExamInterface />} />
          <Route path="/exam-creator" element={<ExamCreator />} />
          <Route path="/complaint-management" element={<ComplaintManagement />} />
          <Route path="/user-management" element={<UserManagement />} />
          <Route path="/system-analytics" element={<SystemAnalytics />} />
          <Route path="/security-settings" element={<SecuritySettings />} />
          <Route path="/system-settings" element={<SystemSettings />} />
          <Route path="/student-complaint" element={<StudentComplaint />} />
          <Route path="/academic-records" element={<AcademicRecords />} />
          <Route path="/exam-schedule" element={<ExamSchedule />} />
          <Route path="/help-support" element={<HelpSupport />} />
          <Route path="/exam-submissions" element={<ExamSubmissions />} />
          <Route path="/exam-results" element={<ExamResults />} />
          <Route path="/schedule-exam" element={<ScheduleExam />} />
          <Route path="/lecturer-analytics" element={<LecturerAnalytics />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
