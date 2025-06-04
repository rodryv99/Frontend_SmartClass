import React from 'react';
import {
  Box, Typography, Button, Grid, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, TextField, 
  Chip, CircularProgress, Alert
} from '@mui/material';
import { Save, Person, CheckCircle, Cancel } from '@mui/icons-material';

const RegisterGradesTab = ({ 
  canManageGrades, 
  classData, 
  periods, 
  selectedPeriod, 
  periodGrades, 
  saving, 
  formatPeriodName, 
  formatNumber, 
  handleGradeChange, 
  saveGrades 
}) => {
  if (!canManageGrades) {
    return (
      <Alert severity="info">
        No tienes permisos para gestionar las notas de esta clase.
      </Alert>
    );
  }

  const selectedPeriodData = periods.find(p => p.id === selectedPeriod);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Notas del {selectedPeriodData ? formatPeriodName(selectedPeriodData) : ''}
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<Save />}
          onClick={saveGrades}
          disabled={saving || !selectedPeriod}
        >
          {saving ? <CircularProgress size={24} /> : 'Guardar Notas'}
        </Button>
      </Box>

      {/* Información sobre los campos de calificación */}
      <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Campos de Calificación:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="caption" display="block">
              <strong>Ser:</strong> 0-5 puntos
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="caption" display="block">
              <strong>Saber:</strong> 0-45 puntos
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="caption" display="block">
              <strong>Hacer:</strong> 0-40 puntos
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="caption" display="block">
              <strong>Decidir:</strong> 0-5 puntos
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="caption" display="block">
              <strong>Autoevaluación:</strong> 0-5 puntos
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="caption" display="block">
              <strong>Total:</strong> 0-100 puntos
            </Typography>
          </Grid>
        </Grid>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Estudiante</TableCell>
              <TableCell align="center">Ser (0-5)</TableCell>
              <TableCell align="center">Saber (0-45)</TableCell>
              <TableCell align="center">Hacer (0-40)</TableCell>
              <TableCell align="center">Decidir (0-5)</TableCell>
              <TableCell align="center">Autoevaluación (0-5)</TableCell>
              <TableCell align="center">Total</TableCell>
              <TableCell align="center">Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {classData.students_detail?.map(student => {
              const studentGrade = periodGrades[student.id] || {};
              const total = (studentGrade.ser || 0) + 
                           (studentGrade.saber || 0) + 
                           (studentGrade.hacer || 0) + 
                           (studentGrade.decidir || 0) + 
                           (studentGrade.autoevaluacion || 0);
              const estado = total >= 51 ? 'approved' : 'failed';
              
              return (
                <TableRow key={student.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Person sx={{ mr: 1 }} />
                      {student.first_name} {student.last_name}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                      value={studentGrade.ser || 0}
                      onChange={(e) => handleGradeChange(student.id, 'ser', e.target.value)}
                      inputProps={{ min: 0, max: 5, step: 0.1 }}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                      value={studentGrade.saber || 0}
                      onChange={(e) => handleGradeChange(student.id, 'saber', e.target.value)}
                      inputProps={{ min: 0, max: 45, step: 0.1 }}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                      value={studentGrade.hacer || 0}
                      onChange={(e) => handleGradeChange(student.id, 'hacer', e.target.value)}
                      inputProps={{ min: 0, max: 40, step: 0.1 }}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                      value={studentGrade.decidir || 0}
                      onChange={(e) => handleGradeChange(student.id, 'decidir', e.target.value)}
                      inputProps={{ min: 0, max: 5, step: 0.1 }}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                      value={studentGrade.autoevaluacion || 0}
                      onChange={(e) => handleGradeChange(student.id, 'autoevaluacion', e.target.value)}
                      inputProps={{ min: 0, max: 5, step: 0.1 }}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography 
                      variant="h6" 
                      color={
                        total >= 90 ? 'success.main' :
                        total >= 75 ? 'info.main' :
                        total >= 51 ? 'warning.main' : 'error.main'
                      }
                    >
                      {formatNumber(total)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      icon={estado === 'approved' ? <CheckCircle /> : <Cancel />}
                      label={estado === 'approved' ? 'Aprobado' : 'Reprobado'}
                      color={estado === 'approved' ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RegisterGradesTab;