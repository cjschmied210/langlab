import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { TextReader } from './features/reader/TextReader';
import { TeacherDashboard } from './features/dashboard/TeacherDashboard';
import { AssignmentDetail } from './features/dashboard/AssignmentDetail';
import { TeacherReview } from './features/teacher/TeacherReview';
import { StudentDashboard } from './features/dashboard/StudentDashboard';
import { ThesisPage } from './features/thesis/ThesisPage';
import { ParagraphPage } from './features/writer/ParagraphPage';
import { EssayPage } from './features/writer/EssayPage';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="reader" element={<TextReader />} />
            <Route path="assignment/:id" element={<TextReader />} />
            <Route
              path="assignment/:id/thesis"
              element={
                <ProtectedRoute>
                  <ThesisPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="assignment/:id/paragraphs"
              element={
                <ProtectedRoute>
                  <ParagraphPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="assignment/:id/essay"
              element={
                <ProtectedRoute>
                  <EssayPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="teacher/dashboard"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="teacher/assignment/:assignmentId"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <AssignmentDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="teacher/assignment/:assignmentId/review"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherReview />
                </ProtectedRoute>
              }
            />

            {/* TEACHER REVIEW ROUTES - Mirroring the Student Workflow */}
            <Route
              path="teacher/review/:id/:studentId/reader"
              element={<ProtectedRoute allowedRoles={['teacher']}><TextReader /></ProtectedRoute>}
            />
            <Route
              path="teacher/review/:id/:studentId/thesis"
              element={<ProtectedRoute allowedRoles={['teacher']}><ThesisPage /></ProtectedRoute>}
            />
            <Route
              path="teacher/review/:id/:studentId/paragraphs"
              element={<ProtectedRoute allowedRoles={['teacher']}><ParagraphPage /></ProtectedRoute>}
            />
            <Route
              path="teacher/review/:id/:studentId/essay"
              element={<ProtectedRoute allowedRoles={['teacher']}><EssayPage /></ProtectedRoute>}
            />

            <Route
              path="student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
