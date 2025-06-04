import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Container, Typography, Box, Paper, Grid, Card, CardContent, Button, CircularProgress, Alert, Chip, LinearProgress, Avatar } from '@mui/material';
import { Assessment, School, TrendingUp, CheckCircle, Psychology, Timeline, BarChart } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { academicService, gradeService, mlService } from '../services/api';

const StudentDashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Estados básicos
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados de datos
  const [studentStats, setStudentStats] = useState({
    totalClasses: 0,
    avgGrade: 0,
    approvedClasses: 0,
    totalPredictions: 0
  });
  const [gradeData, setGradeData] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [predictionHistory, setPredictionHistory] = useState([]);

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Cargar clases del estudiante
      const classesData = await academicService.getAllClasses();
      setClasses(classesData);
      
      if (classesData.length > 0) {
        // Cargar datos de cada clase
        const allGrades = [];
        const allPredictions = [];
        const allHistory = [];
        
        for (const classItem of classesData) {
          try {
            // Obtener datos de notas del estudiante para esta clase
            const gradesSummary = await gradeService.getStudentGradesSummary(classItem.id);
            if (gradesSummary) {
              allGrades.push({
                ...gradesSummary,
                className: classItem.name,
                subject: classItem.subject_detail?.name
              });
            }
            
            // Obtener predicciones del estudiante
            const classPredictions = await mlService.getPredictionsByClass(classItem.id);
            const studentPredictions = classPredictions.filter(p => 
              p.student === currentUser.student_profile?.id
            );
            allPredictions.push(...studentPredictions);
            
            // Obtener historial de predicciones
            const classHistory = await mlService.getPredictionHistoryByClass(classItem.id);
            const studentHistory = classHistory.filter(h => 
              h.student === currentUser.student_profile?.id
            );
            allHistory.push(...studentHistory);
            
          } catch (err) {
            console.warn(`Error loading data for class ${classItem.name}:`, err);
          }
        }
        
        setGradeData(allGrades);
        setPredictions(allPredictions);
        setPredictionHistory(allHistory);
        
        // Calcular estadísticas generales
        const approvedClasses = allGrades.filter(g => 
          g.final_grade?.estado_final === 'approved'
        ).length;
        
        const avgGrade = allGrades.length > 0 ? 
          allGrades.reduce((sum, g) => sum + (g.final_grade?.nota_final || 0), 0) / allGrades.length : 0;
        
        setStudentStats({
          totalClasses: classesData.length,
          avgGrade: avgGrade,
          approvedClasses: approvedClasses,
          totalPredictions: allPredictions.length
        });
      }
      
      setError(null);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError('Error al cargar los datos del estudiante');
    } finally {
      setLoading(false);
    }
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
          Mi Dashboard Académico
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 4 }}>
          Bienvenido, {currentUser.username}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Estadísticas Principales */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <School color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4" color="primary">
                      {studentStats.totalClasses}
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
                  <Assessment color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4" color="success.main">
                      {formatNumber(studentStats.avgGrade)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Mi Promedio General
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
                      {studentStats.approvedClasses}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Clases Aprobadas
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
                  <Psychology color="info" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4" color="info.main">
                      {studentStats.totalPredictions}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Predicciones ML
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Mis Clases */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Mis Clases
          </Typography>
          
          {classes.length === 0 ? (
            <Alert severity="info">
              No estás inscrito en ninguna clase. Los profesores te añadirán a las clases correspondientes.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {classes.map((clase) => (
                <Grid item key={clase.id} xs={12} sm={6} md={4}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 6 }
                    }}
                    onClick={() => navigate(`/classes/${clase.id}`)}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>{clase.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        <strong>Materia:</strong> {clase.subject_detail?.name || clase.subject}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        <strong>Gestión:</strong> {clase.year}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        <strong>Curso:</strong> {clase.course_detail?.name || clase.course}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        <strong>Grupo:</strong> {clase.group_detail?.name || clase.group}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        <strong>Profesor:</strong> {clase.teacher_detail ? 
                          `${clase.teacher_detail.first_name} ${clase.teacher_detail.last_name}` : 
                          clase.teacher || 'No asignado'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>

        {/* Visualización sencilla del rendimiento real vs predicho */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Mi Rendimiento por Clase
          </Typography>
          
          {gradeData.length === 0 ? (
            <Alert severity="info">
              Aún no tienes datos de rendimiento registrados. Una vez que tus profesores registren notas, aparecerán aquí.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {gradeData.map((classGrades, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {classGrades.className}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {classGrades.subject}
                      </Typography>
                      
                      {classGrades.final_grade ? (
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h4" color={getGradeColor(classGrades.final_grade.nota_final)}>
                              {formatNumber(classGrades.final_grade.nota_final)}
                            </Typography>
                            <Chip
                              label={classGrades.final_grade.estado_final === 'approved' ? 'APROBADO' : 'REPROBADO'}
                              color={classGrades.final_grade.estado_final === 'approved' ? 'success' : 'error'}
                            />
                          </Box>
                          
                          <Typography variant="body2" gutterBottom>
                            Períodos evaluados: {classGrades.final_grade.periods_count}
                          </Typography>
                          
                          {/* Mostrar progreso por período */}
                          {classGrades.period_grades && classGrades.period_grades.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" fontWeight="bold" gutterBottom>
                                Progreso por período:
                              </Typography>
                              {classGrades.period_grades.map((periodGrade, pIndex) => (
                                <Box key={pIndex} sx={{ mb: 1 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="caption">
                                      {periodGrade.period?.period_type === 'bimester' ? 'Bim' : 'Trim'} {periodGrade.period?.number}
                                    </Typography>
                                    <Typography variant="caption" fontWeight="bold">
                                      {formatNumber(periodGrade.nota_total)}
                                    </Typography>
                                  </Box>
                                  <LinearProgress
                                    variant="determinate"
                                    value={periodGrade.nota_total}
                                    color={getGradeColor(periodGrade.nota_total)}
                                    sx={{ height: 6, borderRadius: 3 }}
                                  />
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Box>
                      ) : (
                        <Typography color="textSecondary">
                          No hay notas registradas aún para esta clase.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default StudentDashboard;