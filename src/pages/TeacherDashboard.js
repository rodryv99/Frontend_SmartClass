import React, { useState, useEffect, useContext } from 'react';
import { Container, Typography, Box, Paper, Grid, Card, CardContent, Button, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Avatar, LinearProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { academicService, gradeService, mlService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { School, TrendingUp, Assessment, People, CheckCircle, Psychology, Visibility, BarChart, Warning, Error } from '@mui/icons-material';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  
  // Estados básicos
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [error, setError] = useState(null);
  
  // Estados de datos
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    avgGrade: 0,
    approvedStudents: 0
  });
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [predictionHistory, setPredictionHistory] = useState([]);
  
  // Estados de UI
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentDetail, setShowStudentDetail] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const classesData = await academicService.getAllClasses();
      setClasses(classesData);
      
      if (classesData.length > 0) {
        setSelectedClass(classesData[0]);
        
        // Calcular estadísticas generales
        const totalStudents = classesData.reduce((sum, cls) => 
          sum + (cls.students_detail?.length || 0), 0);
        
        setDashboardStats(prev => ({
          ...prev,
          totalStudents,
          totalClasses: classesData.length
        }));
        
        // Cargar datos de la primera clase
        await loadClassData(classesData[0]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Error al cargar los datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const loadClassData = async (classToLoad = selectedClass) => {
    if (!classToLoad) return;
    
    try {
      // Cargar notas finales de la clase
      const finalGrades = await gradeService.getFinalGradesByClass(classToLoad.id).catch(() => []);
      
      // Cargar predicciones
      const predictionsData = await mlService.getPredictionsByClass(classToLoad.id).catch(() => []);
      
      // Cargar historial de predicciones
      const historyData = await mlService.getPredictionHistoryByClass(classToLoad.id).catch(() => []);
      
      // Procesar rendimiento de estudiantes
      const performance = finalGrades.map(grade => ({
        id: grade.student,
        name: `${grade.student_detail.first_name} ${grade.student_detail.last_name}`,
        finalGrade: grade.nota_final,
        finalStatus: grade.estado_final,
        periodsCount: grade.periods_count,
        periodGrades: grade.period_grades || []
      }));
      
      setStudentPerformance(performance);
      setPredictions(predictionsData);
      setPredictionHistory(historyData);
      
      // Actualizar estadísticas de la clase
      if (finalGrades.length > 0) {
        const avgGrade = finalGrades.reduce((sum, grade) => sum + grade.nota_final, 0) / finalGrades.length;
        const approvedStudents = finalGrades.filter(grade => grade.estado_final === 'approved').length;
        
        setDashboardStats(prev => ({
          ...prev,
          avgGrade: avgGrade,
          approvedStudents: approvedStudents
        }));
      }
      
    } catch (err) {
      console.error('Error loading class data:', err);
      setError('Error al cargar los datos de la clase');
    }
  };

  const handleClassChange = async (newClass) => {
    setSelectedClass(newClass);
    await loadClassData(newClass);
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setShowStudentDetail(true);
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0.0';
    return parseFloat(value).toFixed(1);
  };

  const getGradeColor = (grade) => {
    if (grade >= 90) return 'success';
    if (grade >= 75) return 'info';
    if (grade >= 51) return 'warning';
    return 'error';
  };

  const getTrendIcon = (periodGrades) => {
    if (!periodGrades || periodGrades.length < 2) return <BarChart color="info" />;
    
    const first = periodGrades[0].nota_total;
    const last = periodGrades[periodGrades.length - 1].nota_total;
    const diff = last - first;
    
    if (diff > 5) return <TrendingUp color="success" />;
    if (diff < -5) return <Warning color="error" />;
    return <BarChart color="info" />;
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        {/* Header */}
        <Typography variant="h4" component="h1" gutterBottom>
          Panel de Profesor
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 4 }}>
          Bienvenido, {currentUser?.username}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Estadísticas Principales según documento */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <School color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4" color="primary">
                      {dashboardStats.totalClasses}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Mis Clases
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <People color="info" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4" color="info.main">
                      {dashboardStats.totalStudents}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Cantidad total de alumnos
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Assessment color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4" color="success.main">
                      {formatNumber(dashboardStats.avgGrade)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Promedio general de notas
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4" color="success.main">
                      {dashboardStats.approvedStudents}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Estudiantes Aprobados
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Selector de Clase */}
        {classes.length > 0 && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Seleccionar Clase para Ver Detalles
            </Typography>
            <Grid container spacing={2}>
              {classes.map(cls => (
                <Grid item xs={12} sm={6} md={4} key={cls.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedClass?.id === cls.id ? 2 : 1,
                      borderColor: selectedClass?.id === cls.id ? 'primary.main' : 'divider',
                      '&:hover': { boxShadow: 6 }
                    }}
                    onClick={() => handleClassChange(cls)}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>{cls.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {cls.subject_detail?.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Gestión: {cls.year}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {cls.students_detail?.length || 0} estudiantes
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {selectedClass && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Rendimiento Individual de Estudiantes - {selectedClass.name}
            </Typography>
            
            {studentPerformance.length === 0 ? (
              <Alert severity="info">
                No hay datos de rendimiento disponibles para esta clase.
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Estudiante</TableCell>
                      <TableCell align="center">Nota Final</TableCell>
                      <TableCell align="center">Estado</TableCell>
                      <TableCell align="center">Períodos</TableCell>
                      <TableCell align="center">Tendencia</TableCell>
                      <TableCell align="center">Ver Ficha</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentPerformance
                      .sort((a, b) => b.finalGrade - a.finalGrade)
                      .map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </Avatar>
                            <Typography variant="body2">
                              {student.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={formatNumber(student.finalGrade)}
                            color={getGradeColor(student.finalGrade)}
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={student.finalStatus === 'approved' ? <CheckCircle /> : <Error />}
                            label={student.finalStatus === 'approved' ? 'Aprobado' : 'Reprobado'}
                            color={student.finalStatus === 'approved' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {student.periodsCount} período{student.periodsCount !== 1 ? 's' : ''}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {getTrendIcon(student.periodGrades)}
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => handleStudentClick(student)}
                          >
                            Ver Ficha
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}

        {/* Botón para gestionar clases */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/classes')}
            size="large"
          >
            Gestionar Mis Clases
          </Button>
        </Box>

        {/* Modal de Ficha Individual del Estudiante */}
        <Dialog
          open={showStudentDetail}
          onClose={() => setShowStudentDetail(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Ficha Individual del Estudiante
          </DialogTitle>
          <DialogContent>
            {selectedStudent && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {selectedStudent.name}
                </Typography>
                
                {/* Nota Final */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Nota Final
                    </Typography>
                    <Typography variant="h3" color={getGradeColor(selectedStudent.finalGrade)}>
                      {formatNumber(selectedStudent.finalGrade)}
                    </Typography>
                    <Chip
                      label={selectedStudent.finalStatus === 'approved' ? 'APROBADO' : 'REPROBADO'}
                      color={selectedStudent.finalStatus === 'approved' ? 'success' : 'error'}
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
                
                {/* Datos históricos y predicción */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Progreso por Período
                    </Typography>
                    {selectedStudent.periodGrades && selectedStudent.periodGrades.length > 0 ? (
                      selectedStudent.periodGrades.map((periodGrade, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">
                              {periodGrade.period?.period_type === 'bimester' ? 'Bimestre' : 'Trimestre'} {periodGrade.period?.number}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {formatNumber(periodGrade.nota_total)}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={periodGrade.nota_total}
                            color={getGradeColor(periodGrade.nota_total)}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                      ))
                    ) : (
                      <Typography color="textSecondary">
                        No hay datos de períodos disponibles
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowStudentDetail(false)}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default TeacherDashboard;