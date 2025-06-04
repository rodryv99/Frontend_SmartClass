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

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSubject, setCurrentSubject] = useState({
    code: '',
    name: '',
  });
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const [openAlert, setOpenAlert] = useState(false);

  // Cargar materias
  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const data = await academicService.getAllSubjects();
      setSubjects(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar las materias');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Manejo del diálogo
  const handleOpenDialog = (subject = null) => {
    if (subject) {
      setCurrentSubject(subject);
      setIsEditing(true);
    } else {
      setCurrentSubject({
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
    setCurrentSubject({
      ...currentSubject,
      [name]: value,
    });
  };

  // Guardar materia
  const handleSaveSubject = async () => {
    try {
      if (isEditing) {
        await academicService.updateSubject(currentSubject.id, currentSubject);
        setAlertMessage('Materia actualizada correctamente');
      } else {
        await academicService.createSubject(currentSubject);
        setAlertMessage('Materia creada correctamente');
      }
      setAlertSeverity('success');
      setOpenAlert(true);
      handleCloseDialog();
      fetchSubjects();
    } catch (err) {
      setAlertMessage('Error al guardar la materia');
      setAlertSeverity('error');
      setOpenAlert(true);
      console.error(err);
    }
  };

  // Eliminar materia
  const handleDeleteSubject = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta materia?')) {
      try {
        await academicService.deleteSubject(id);
        setAlertMessage('Materia eliminada correctamente');
        setAlertSeverity('success');
        setOpenAlert(true);
        fetchSubjects();
      } catch (err) {
        setAlertMessage('Error al eliminar la materia');
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
          Gestión de Materias
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Nueva Materia
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
              {subjects.length > 0 ? (
                subjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell>{subject.code}</TableCell>
                    <TableCell>{subject.name}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(subject)}
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteSubject(subject.id)}
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
                    No hay materias registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Diálogo para crear/editar materia */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{isEditing ? 'Editar Materia' : 'Nueva Materia'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, width: 400 }}>
            <TextField
              fullWidth
              label="Código"
              name="code"
              value={currentSubject.code}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Nombre"
              name="name"
              value={currentSubject.name}
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
          <Button onClick={handleSaveSubject} color="primary" variant="contained">
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

export default SubjectManagement;