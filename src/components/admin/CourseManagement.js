import React, { useState, useEffect } from 'react';
import { academicService } from '../../services/api';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCourse, setCurrentCourse] = useState({
    code: '',
    name: '',
  });
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const [openAlert, setOpenAlert] = useState(false);

  // Cargar cursos
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await academicService.getAllCourses();
      setCourses(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los cursos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Manejo del diálogo
  const handleOpenDialog = (course = null) => {
    if (course) {
      setCurrentCourse(course);
      setIsEditing(true);
    } else {
      setCurrentCourse({
        code: '',
        name: '',
      });
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Manejo de inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCourse({
      ...currentCourse,
      [name]: value,
    });
  };

  // Guardar curso
  const handleSaveCourse = async () => {
    try {
      if (isEditing) {
        await academicService.updateCourse(currentCourse.id, currentCourse);
        setAlertMessage('Curso actualizado correctamente');
      } else {
        await academicService.createCourse(currentCourse);
        setAlertMessage('Curso creado correctamente');
      }
      setAlertSeverity('success');
      setOpenAlert(true);
      handleCloseDialog();
      fetchCourses();
    } catch (err) {
      setAlertMessage('Error al guardar el curso');
      setAlertSeverity('error');
      setOpenAlert(true);
      console.error(err);
    }
  };

  // Eliminar curso
  const handleDeleteCourse = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este curso?')) {
      try {
        await academicService.deleteCourse(id);
        setAlertMessage('Curso eliminado correctamente');
        setAlertSeverity('success');
        setOpenAlert(true);
        fetchCourses();
      } catch (err) {
        setAlertMessage('Error al eliminar el curso');
        setAlertSeverity('error');
        setOpenAlert(true);
        console.error(err);
      }
    }
  };

// Cerrar alerta
  const handleCloseAlert = () => {
    setOpenAlert(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Gestión de Cursos
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Curso
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.length > 0 ? (
                courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>{course.code}</TableCell>
                    <TableCell>{course.name}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(course)}
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteCourse(course.id)}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No hay cursos registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Diálogo para crear/editar curso */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{isEditing ? 'Editar Curso' : 'Nuevo Curso'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, width: 400 }}>
            <TextField
              fullWidth
              label="Código"
              name="code"
              value={currentCourse.code}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Nombre"
              name="name"
              value={currentCourse.name}
              onChange={handleInputChange}
              margin="normal"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSaveCourse} color="primary" variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alerta */}
      <Snackbar open={openAlert} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity={alertSeverity} sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CourseManagement;