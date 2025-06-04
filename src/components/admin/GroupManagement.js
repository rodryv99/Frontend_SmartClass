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

const GroupManagement = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentGroup, setCurrentGroup] = useState({
    code: '',
    name: '',
  });
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const [openAlert, setOpenAlert] = useState(false);

  // Cargar grupos
  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await academicService.getAllGroups();
      setGroups(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los grupos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Manejo del diálogo
  const handleOpenDialog = (group = null) => {
    if (group) {
      setCurrentGroup(group);
      setIsEditing(true);
    } else {
      setCurrentGroup({
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
    setCurrentGroup({
      ...currentGroup,
      [name]: value,
    });
  };

  // Guardar grupo
  const handleSaveGroup = async () => {
    try {
      if (isEditing) {
        await academicService.updateGroup(currentGroup.id, currentGroup);
        setAlertMessage('Grupo actualizado correctamente');
      } else {
        await academicService.createGroup(currentGroup);
        setAlertMessage('Grupo creado correctamente');
      }
      setAlertSeverity('success');
      setOpenAlert(true);
      handleCloseDialog();
      fetchGroups();
    } catch (err) {
      setAlertMessage('Error al guardar el grupo');
      setAlertSeverity('error');
      setOpenAlert(true);
      console.error(err);
    }
  };

  // Eliminar grupo
  const handleDeleteGroup = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este grupo?')) {
      try {
        await academicService.deleteGroup(id);
        setAlertMessage('Grupo eliminado correctamente');
        setAlertSeverity('success');
        setOpenAlert(true);
        fetchGroups();
      } catch (err) {
        setAlertMessage('Error al eliminar el grupo');
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
          Gestión de Grupos
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Grupo
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
              {groups.length > 0 ? (
                groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>{group.code}</TableCell>
                    <TableCell>{group.name}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(group)}
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteGroup(group.id)}
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
                    No hay grupos registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Diálogo para crear/editar grupo */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{isEditing ? 'Editar Grupo' : 'Nuevo Grupo'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, width: 400 }}>
            <TextField
              fullWidth
              label="Código"
              name="code"
              value={currentGroup.code}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Nombre"
              name="name"
              value={currentGroup.name}
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
          <Button onClick={handleSaveGroup} color="primary" variant="contained">
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

export default GroupManagement;