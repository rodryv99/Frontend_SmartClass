// App.js - Actualizado con nueva estructura de componentes de gestión de notas

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

// Layouts
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

// Pages de Gestión de Clases
import ClassList from './pages/ClassList';
import ClassForm from './pages/ClassForm';
import ClassDetail from './pages/ClassDetail';

// Pages de Gestión de Asistencia y Participación
import AttendanceManagement from './components/AttendanceManagement';
import ParticipationManagement from './components/ParticipationManagement';

// Componente principal de Gestión de Notas (refactorizado)
import GradeManagement from './components/grades/GradeManagement';

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Rutas protegidas - Admin */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              {/* La bitácora está integrada en AdminDashboard, no necesita ruta separada */}
            </Route>
            
            {/* Rutas protegidas - Profesor */}
            <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
              <Route path="/teacher" element={<TeacherDashboard />} />
            </Route>
            
            {/* Rutas protegidas - Estudiante */}
            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/student" element={<StudentDashboard />} />
            </Route>
            
            {/* Rutas para Gestionar Clase - Accesibles para Profesor y Admin */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher']} />}>
              <Route path="/classes" element={<ClassList />} />
              <Route path="/classes/new" element={<ClassForm />} />
              <Route path="/classes/edit/:id" element={<ClassForm />} />
            </Route>
            
            {/* Ruta para ver detalles de clase - Accesible para Profesor, Admin y Estudiantes que pertenecen */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'student']} />}>
              <Route path="/classes/:id" element={<ClassDetail />} />
            </Route>

            {/* Rutas para Gestionar Asistencia - Accesible para Admin, Profesor y Estudiantes inscritos */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'student']} />}>
              <Route path="/classes/:classId/attendance" element={<AttendanceManagement />} />
            </Route>

            {/* Rutas para Gestionar Participación - Accesible para Admin, Profesor y Estudiantes inscritos */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'student']} />}>
              <Route path="/classes/:classId/participation" element={<ParticipationManagement />} />
            </Route>

            {/* Rutas para Gestionar Notas - Accesible para Admin, Profesor y Estudiantes inscritos */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'student']} />}>
              <Route path="/classes/:classId/grades" element={<GradeManagement />} />
            </Route>
            
            {/* Redirección de rutas no encontradas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;