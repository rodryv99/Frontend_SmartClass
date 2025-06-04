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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';

const PeriodManagement = () => {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState({
    period_type: 'bimestre', // Cambiado de 'bimester' a 'bimestre'
    number: '',
    year: new Date().getFullYear(),
    start_date: '',
    end_date: '',
  });
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const [openAlert, setOpenAlert] = useState(false);

  // Cargar períodos
  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const data = await academicService.getAllPeriods();
      setPeriods(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los períodos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Manejo del diálogo
  const handleOpenDialog = (period = null) => {
    if (period) {
      setCurrentPeriod(period);
      setIsEditing(true);
    } else {
      setCurrentPeriod({
        period_type: 'trimestre', // Cambiado por defecto a trimestre para años actuales
        number: '',
        year: new Date().getFullYear(),
        start_date: '',
        end_date: '',
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
    
    // Si se cambia el tipo de período, ajustar el número máximo permitido
    if (name === 'period_type') {
      const newPeriod = {
        ...currentPeriod,
        [name]: value,
      };
      
      // Si se cambia a trimestre y el número actual es mayor a 3, resetear
      if (value === 'trimestre' && currentPeriod.number > 3) {
        newPeriod.number = '';
      }
      
      setCurrentPeriod(newPeriod);
    } else {
      setCurrentPeriod({
        ...currentPeriod,
        [name]: value,
      });
    }
  };

  // Guardar período
  const handleSavePeriod = async () => {
    try {
      // Validaciones adicionales en el frontend
      if (!currentPeriod.number || !currentPeriod.year || !currentPeriod.start_date || !currentPeriod.end_date) {
        setAlertMessage('Por favor completa todos los campos');
        setAlertSeverity('error');
        setOpenAlert(true);
        return;
      }

      const maxNumber = currentPeriod.period_type === 'trimestre' ? 3 : 4;
      if (currentPeriod.number > maxNumber) {
        setAlertMessage(`El número no puede ser mayor a ${maxNumber} para ${currentPeriod.period_type === 'trimestre' ? 'trimestres' : 'bimestres'}`);
        setAlertSeverity('error');
        setOpenAlert(true);
        return;
      }

      if (new Date(currentPeriod.start_date) >= new Date(currentPeriod.end_date)) {
        setAlertMessage('La fecha de inicio debe ser anterior a la fecha de fin');
        setAlertSeverity('error');
        setOpenAlert(true);
        return;
      }

      if (isEditing) {
        await academicService.updatePeriod(currentPeriod.id, currentPeriod);
        setAlertMessage('Período actualizado correctamente');
      } else {
        await academicService.createPeriod(currentPeriod);
        setAlertMessage('Período creado correctamente');
      }
      setAlertSeverity('success');
      setOpenAlert(true);
      handleCloseDialog();
      fetchPeriods();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.period_type?.[0] || 
                      err.response?.data?.number?.[0] || 
                      err.response?.data?.non_field_errors?.[0] ||
                      'Error al guardar el período';
      setAlertMessage(errorMsg);
      setAlertSeverity('error');
      setOpenAlert(true);
    }
  };

  // Eliminar período
  const handleDeletePeriod = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este período?')) {
      try {
        await academicService.deletePeriod(id);
        setAlertMessage('Período eliminado correctamente');
        setAlertSeverity('success');
        setOpenAlert(true);
        fetchPeriods();
      } catch (err) {
        setAlertMessage('Error al eliminar el período');
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

  // Obtener opciones de números según el tipo de período
  const getNumberOptions = () => {
    const maxNumber = currentPeriod.period_type === 'trimestre' ? 3 : 4;
    return Array.from({ length: maxNumber }, (_, i) => i + 1);
  };

  // Función para formatear el tipo de período
  const formatPeriodType = (periodType) => {
    return periodType === 'bimestre' ? 'Bimestral' : 'Trimestral';
  };

  // Función para formatear el nombre del período
  const formatPeriodName = (period) => {
    const typeName = period.period_type === 'bimestre' ? 'Bimestre' : 'Trimestre';
    return `${typeName} ${period.number}`;
  };

  // Función para obtener el color del chip según el tipo
  const getPeriodChipColor = (periodType) => {
    return periodType === 'bimestre' ? 'primary' : 'secondary';
  };

  // Función para ordenar períodos por año y número
  const sortedPeriods = [...periods].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year; // Años más recientes primero
    return a.number - b.number; // Números en orden ascendente
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Gestión de Períodos
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Período
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
                <TableCell>Tipo</TableCell>
                <TableCell>Período</TableCell>
                <TableCell>Año/Gestión</TableCell>
                <TableCell>Fecha de Inicio</TableCell>
                <TableCell>Fecha de Finalización</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPeriods.length > 0 ? (
                sortedPeriods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell>
                      <Chip 
                        label={formatPeriodType(period.period_type)}
                        color={getPeriodChipColor(period.period_type)}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatPeriodName(period)}</TableCell>
                    <TableCell>{period.year}</TableCell>
                    <TableCell>{new Date(period.start_date + 'T12:00:00').toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(period.end_date + 'T12:00:00').toLocaleDateString()}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(period)}
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeletePeriod(period.id)}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No hay períodos registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Diálogo para crear/editar período */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{isEditing ? 'Editar Período' : 'Nuevo Período'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, width: 400 }}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Tipo de Período</InputLabel>
              <Select
                name="period_type"
                value={currentPeriod.period_type}
                onChange={handleInputChange}
                label="Tipo de Período"
              >
                <MenuItem value="bimestre">Bimestral</MenuItem>
                <MenuItem value="trimestre">Trimestral</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal" required>
              <InputLabel>Número</InputLabel>
              <Select
                name="number"
                value={currentPeriod.number}
                onChange={handleInputChange}
                label="Número"
              >
                {getNumberOptions().map(num => (
                  <MenuItem key={num} value={num}>
                    {num}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Año/Gestión"
              name="year"
              type="number"
              value={currentPeriod.year}
              onChange={handleInputChange}
              margin="normal"
              required
              inputProps={{ min: 2000, max: 2050 }}
            />
            <TextField
              fullWidth
              label="Fecha de Inicio"
              name="start_date"
              type="date"
              value={currentPeriod.start_date}
              onChange={handleInputChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              fullWidth
              label="Fecha de Fin"
              name="end_date"
              type="date"
              value={currentPeriod.end_date}
              onChange={handleInputChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSavePeriod} color="primary" variant="contained">
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

export default PeriodManagement;