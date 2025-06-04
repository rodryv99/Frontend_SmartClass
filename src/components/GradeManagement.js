import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, Typography, Box, Paper, Grid, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Alert, TextField, Collapse, IconButton
} from '@mui/material';
import { 
  Assessment, CalendarToday, BarChart, Person, ArrowBack, Save,
  School, Star, TrendingUp, CheckCircle, Cancel, ExpandMore, ExpandLess,
  Psychology
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { academicService, gradeService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import MLPredictions from '../components/MLPredictions';

const GradeManagement = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  
  // Estados principales
  const [classData, setClassData] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // Estados para notas
  const [gradeStats, setGradeStats] = useState([]);
  const [finalGrades, setFinalGrades] = useState([]);
  const [periodGrades, setPeriodGrades] = useState({});
  
  // Estados para UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [expandedStudents, setExpandedStudents] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  
  // NUEVO ESTADO para forzar re-renders
  const [statsKey, setStatsKey] = useState(0);
  
  // Función helper para formatear números con máximo 1 decimal
  const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0.0';
    return parseFloat(value).toFixed(1);
  };
  
  // Verificar permisos
  const canManageGrades = 
    currentUser?.user_type === 'admin' || 
    (currentUser?.user_type === 'teacher' && 
     classData?.teacher === currentUser?.teacher_profile?.id);

  const canViewGrades = 
    canManageGrades || 
    (currentUser?.user_type === 'student' && 
     currentUser?.student_profile?.id && 
     (classData?.students?.includes(currentUser?.student_profile?.id) || 
      classData?.students_detail?.some(student => student.id === currentUser?.student_profile?.id)));

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Obtener datos de la clase
        const classResponse = await academicService.getClass(classId);
        setClassData(classResponse);
        
        console.log("=== DEPURACIÓN GRADE MANAGEMENT ===");
        console.log("Datos de la clase:", classResponse);
        console.log("Períodos de la clase:", classResponse.periods_detail);
        
        // Usar los períodos asignados a la clase
        if (classResponse.periods_detail && classResponse.periods_detail.length > 0) {
          setPeriods(classResponse.periods_detail);
          setSelectedPeriod(classResponse.periods_detail[0].id);
        } else {
          console.warn("No hay períodos asignados a esta clase");
          setPeriods([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Error al cargar los datos de la clase');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [classId, currentUser]);
  
  // Cargar notas cuando cambia el período
  useEffect(() => {
    if (selectedPeriod) {
      loadGradeData();
      loadGradeStats();
    }
  }, [selectedPeriod]);

  // Cargar notas finales al cambiar cualquier cosa
  useEffect(() => {
    if (classData) {
      loadFinalGrades();
    }
  }, [classData]);

  // Auto-seleccionar pestaña de estadísticas para estudiantes
  useEffect(() => {
    if (currentUser?.user_type === 'student' && !canManageGrades && canViewGrades) {
      setActiveTab(1); // Ir a estadísticas
    }
  }, [currentUser, canManageGrades, canViewGrades]);

  // FUNCIÓN CORREGIDA para cargar datos de notas
  const loadGradeData = async () => {
    try {
      const response = await gradeService.getGradesByClassAndPeriod(classId, selectedPeriod);
      
      // Convertir array a objeto indexado por student_id
      const gradeMap = {};
      response.forEach(grade => {
        gradeMap[grade.student.toString()] = {
          id: grade.id,
          ser: grade.ser,
          saber: grade.saber,
          hacer: grade.hacer,
          decidir: grade.decidir,
          autoevaluacion: grade.autoevaluacion,
          nota_total: grade.nota_total,
          estado: grade.estado
        };
      });
      setPeriodGrades(gradeMap);
      
    } catch (err) {
      console.error('Error loading grade data:', err);
      // No mostrar error si simplemente no hay datos
      setPeriodGrades({});
    }
  };

  // FUNCIÓN CORREGIDA para cargar estadísticas
  const loadGradeStats = async (forceFresh = false) => {
    try {
      console.log("FRONTEND: Cargando estadísticas...");
      
      // 1. LIMPIAR EL ESTADO PRIMERO
      setGradeStats([]);
      
      // 2. PEQUEÑA PAUSA PARA ASEGURAR QUE REACT PROCESE EL ESTADO VACÍO
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 3. OBTENER DATOS FRESCOS
      const response = await gradeService.getGradeStats(classId, selectedPeriod, forceFresh);
      console.log("FRONTEND: Estadísticas recibidas:", response);
      
      // 4. CREAR NUEVO ARRAY CON SPREAD OPERATOR Y TIMESTAMPS
      const freshStats = response.map((stat, index) => ({
        ...stat,
        _timestamp: Date.now() + index, // Forzar nuevas referencias
        _key: `${stat.student_id}-${Date.now()}-${index}`
      }));
      
      // 5. ESTABLECER NUEVO ESTADO
      setGradeStats(freshStats);
      
      // 6. FORZAR RE-RENDER DEL COMPONENTE STATS
      setStatsKey(prev => prev + 1);
      
      console.log("FRONTEND: Estado gradeStats actualizado con", freshStats.length, "elementos");
      
    } catch (err) {
      console.error('Error loading grade stats:', err);
      setGradeStats([]);
    }
  };

  // FUNCIÓN CORREGIDA para cargar notas finales
  const loadFinalGrades = async (forceFresh = false) => {
    try {
      console.log("FRONTEND: Cargando notas finales...");
      
      // 1. LIMPIAR EL ESTADO PRIMERO
      setFinalGrades([]);
      
      // 2. PEQUEÑA PAUSA
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 3. OBTENER DATOS FRESCOS
      const response = await gradeService.getFinalGradesByClass(classId, forceFresh);
      console.log("FRONTEND: Notas finales recibidas:", response);
      
      // 4. CREAR NUEVO ARRAY CON SPREAD OPERATOR
      const freshFinalGrades = response.map((grade, index) => ({
        ...grade,
        _timestamp: Date.now() + index,
        _key: `${grade.student}-${Date.now()}-${index}`
      }));
      
      // 5. ESTABLECER NUEVO ESTADO
      setFinalGrades(freshFinalGrades);
      
      console.log("FRONTEND: Estado finalGrades actualizado con", freshFinalGrades.length, "elementos");
      
    } catch (err) {
      console.error('Error loading final grades:', err);
      setFinalGrades([]);
    }
  };

  // FUNCIÓN CORREGIDA para refrescar todos los datos
  const refreshAllData = async () => {
    try {
      setRefreshing(true);
      console.log("FRONTEND: Refrescando todos los datos...");
      
      // 1. Limpiar caché del navegador
      await gradeService.clearBrowserCache();
      
      // 2. LIMPIAR TODOS LOS ESTADOS PRIMERO
      setGradeStats([]);
      setFinalGrades([]);
      setPeriodGrades({});
      
      // 3. PAUSA PARA QUE REACT PROCESE LOS ESTADOS VACÍOS
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // 4. RECARGAR DATOS EN SECUENCIA (NO EN PARALELO)
      await loadGradeData();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await loadGradeStats(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await loadFinalGrades(true);
      
      // 5. FORZAR RE-RENDER FINAL
      setStatsKey(prev => prev + 1);
      
      console.log("FRONTEND: Todos los datos refrescados completamente");
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Error al actualizar los datos');
    } finally {
      setRefreshing(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Si cambió a estadísticas o notas finales, refrescar datos
    if (newValue === 1 || newValue === 2) {
      console.log("FRONTEND: Cambiando a pestaña", newValue, "- refrescando datos");
      // Pequeño delay para que se renderice la pestaña
      setTimeout(() => {
        refreshAllData();
      }, 100);
    }
  };

  const handleGradeChange = (studentId, field, value) => {
    const numValue = parseFloat(value) || 0;
    
    // Validar rangos según el campo
    let maxValue;
    switch (field) {
      case 'ser':
      case 'decidir':
      case 'autoevaluacion':
        maxValue = 5;
        break;
      case 'saber':
        maxValue = 45;
        break;
      case 'hacer':
        maxValue = 40;
        break;
      default:
        maxValue = 100;
    }
    
    if (numValue < 0 || numValue > maxValue) {
      setError(`${field.toUpperCase()}: El valor debe estar entre 0 y ${maxValue}`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setPeriodGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: numValue
      }
    }));
  };

  // FUNCIÓN CORREGIDA para guardar notas
  const saveGrades = async () => {
    if (!canManageGrades) {
      setError('No tienes permisos para gestionar notas');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // 1. Limpiar caché del navegador antes de guardar
      await gradeService.clearBrowserCache();
      
      // 2. Preparar datos para el envío
      const gradeData = {
        class_instance: parseInt(classId),
        period: parseInt(selectedPeriod),
        grades: classData.students_detail.map(student => ({
          student_id: student.id.toString(),
          ser: periodGrades[student.id]?.ser || 0,
          saber: periodGrades[student.id]?.saber || 0,
          hacer: periodGrades[student.id]?.hacer || 0,
          decidir: periodGrades[student.id]?.decidir || 0,
          autoevaluacion: periodGrades[student.id]?.autoevaluacion || 0
        }))
      };
      
      console.log('Guardando notas:', gradeData);
      
      // 3. Guardar notas
      await gradeService.createBulkGrades(gradeData);
      
      setSuccess('Notas guardadas. Actualizando estadísticas...');
      
      // 4. LIMPIAR TODOS LOS ESTADOS INMEDIATAMENTE
      setGradeStats([]);
      setFinalGrades([]);
      
      // 5. Dar tiempo considerable al backend para procesar
      console.log("FRONTEND: Esperando procesamiento del backend...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 6. REFRESCAR DATOS
      await refreshAllData();
      
      // 7. SI ESTAMOS EN ESTADÍSTICAS, FORZAR CAMBIO DE PESTAÑA
      if (activeTab === 1) {
        console.log("FRONTEND: Forzando re-render de estadísticas");
        setActiveTab(0);
        await new Promise(resolve => setTimeout(resolve, 200));
        setActiveTab(1);
        await new Promise(resolve => setTimeout(resolve, 200));
        await loadGradeStats(true);
      }
      
      setSuccess('¡Notas guardadas y estadísticas actualizadas correctamente!');
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (err) {
      console.error('Error saving grades:', err);
      setError(err.response?.data?.error || 'Error al guardar las notas');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const toggleStudentExpansion = (studentId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const getGradeColor = (nota, estado = null) => {
    if (estado) {
      return estado === 'approved' ? 'success' : 'error';
    }
    
    if (nota >= 90) return 'success';
    if (nota >= 75) return 'info';
    if (nota >= 51) return 'warning';
    return 'error';
  };

  const getGradeLabel = (nota) => {
    if (nota >= 90) return 'Excelente';
    if (nota >= 75) return 'Bueno';
    if (nota >= 51) return 'Regular';
    return 'Insuficiente';
  };

  // Función para formatear el nombre del período
  const formatPeriodName = (period) => {
    const typeName = period.period_type === 'bimester' ? 'Bimestre' : 'Trimestre';
    return `${typeName} ${period.number} - ${period.year}`;
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

  if (!classData) {
    return (
      <Container maxWidth="lg">
        <Typography color="error">No se pudo cargar la información de la clase</Typography>
        <Button 
          variant="contained" 
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/classes/${classId}`)}
          sx={{ mt: 2 }}
        >
          Volver a la clase
        </Button>
      </Container>
    );
  }

  if (periods.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/classes/${classId}`)}
            sx={{ mb: 3 }}
          >
            Volver a la clase
          </Button>
          
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              No hay períodos asignados a esta clase
            </Typography>
            <Typography>
              Para gestionar notas, primero debes asignar períodos a la clase desde el detalle de la clase.
            </Typography>
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/classes/${classId}`)}
          sx={{ mb: 3 }}
        >
          Volver a la clase
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Gestionar Notas
          {refreshing && (
            <CircularProgress size={24} sx={{ ml: 2 }} />
          )}
        </Typography>
        
        <Typography variant="h6" color="textSecondary" gutterBottom>
          {classData.name} - {classData.subject_detail?.name}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Paper sx={{ mb: 4 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
          >
            <Tab 
              label="Registrar Notas" 
              icon={<Assessment />}
              disabled={!canManageGrades}
            />
            <Tab 
              label="Estadísticas por Período" 
              icon={<BarChart />}
              disabled={!canViewGrades}
            />
            <Tab 
              label="Notas Finales" 
              icon={<Star />}
              disabled={!canViewGrades}
            />
            <Tab 
              label="Predicciones ML" 
              icon={<Psychology />}
              disabled={!canViewGrades}
            />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* Panel de controles para pestañas que lo necesitan */}
            {(activeTab === 0 || activeTab === 1) && (
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Período</InputLabel>
                    <Select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      label="Período"
                    >
                      {periods.map(period => (
                        <MenuItem key={period.id} value={period.id}>
                          {formatPeriodName(period)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Botón de actualización manual para debug */}
                {(activeTab === 1 || activeTab === 2) && (
                  <Grid item xs={12} sm={6}>
                    <Button 
                      variant="outlined" 
                      onClick={refreshAllData}
                      disabled={refreshing}
                      startIcon={refreshing ? <CircularProgress size={20} /> : <TrendingUp />}
                      fullWidth
                    >
                      {refreshing ? 'Actualizando...' : 'Actualizar Datos'}
                    </Button>
                  </Grid>
                )}
              </Grid>
            )}

            {/* Contenido de las pestañas */}
            {activeTab === 0 && (
              <RegisterGradesTab 
                canManageGrades={canManageGrades}
                classData={classData}
                periods={periods}
                selectedPeriod={selectedPeriod}
                periodGrades={periodGrades}
                saving={saving}
                formatPeriodName={formatPeriodName}
                formatNumber={formatNumber}
                handleGradeChange={handleGradeChange}
                saveGrades={saveGrades}
              />
            )}

            {activeTab === 1 && (
              <StatsTab 
                key={`stats-${selectedPeriod}-${statsKey}-${gradeStats.length}-${Date.now()}`}
                canViewGrades={canViewGrades}
                canManageGrades={canManageGrades}
                currentUser={currentUser}
                gradeStats={gradeStats}
                periods={periods}
                selectedPeriod={selectedPeriod}
                formatPeriodName={formatPeriodName}
                formatNumber={formatNumber}
                refreshing={refreshing}
              />
            )}

            {activeTab === 2 && (
              <FinalGradesTab 
                key={`final-${statsKey}-${finalGrades.length}-${Date.now()}`}
                canViewGrades={canViewGrades}
                canManageGrades={canManageGrades}
                currentUser={currentUser}
                finalGrades={finalGrades}
                expandedStudents={expandedStudents}
                saving={saving}
                setSaving={setSaving}
                setSuccess={setSuccess}
                setError={setError}
                classId={classId}
                loadFinalGrades={loadFinalGrades}
                refreshAllData={refreshAllData}
                toggleStudentExpansion={toggleStudentExpansion}
                getGradeColor={getGradeColor}
                getGradeLabel={getGradeLabel}
                formatNumber={formatNumber}
                refreshing={refreshing}
              />
            )}

            {activeTab === 3 && (
              <MLPredictions 
                classData={classData}
                canManageGrades={canManageGrades}
                canViewGrades={canViewGrades}
              />
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

// Componente separado para registrar notas
const RegisterGradesTab = ({ 
  canManageGrades, classData, periods, selectedPeriod, periodGrades, 
  saving, formatPeriodName, formatNumber, handleGradeChange, saveGrades 
}) => {
  if (!canManageGrades) {
    return (
      <Alert severity="info">
        No tienes permisos para gestionar las notas de esta clase.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Notas del {formatPeriodName(periods.find(p => p.id === selectedPeriod))}
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

// Componente separado para estadísticas CON LOGS DE DEBUG
const StatsTab = ({ 
  canViewGrades, canManageGrades, currentUser, gradeStats, 
  periods, selectedPeriod, formatPeriodName, formatNumber, refreshing 
}) => {
  // LOGS DE DEBUG
  console.log("STATSTAB: Renderizando con gradeStats:", gradeStats);
  console.log("STATSTAB: Cantidad de estadísticas:", gradeStats.length);
  
  if (!canViewGrades) {
    return (
      <Alert severity="info">
        No tienes permisos para ver las estadísticas de notas de esta clase.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Estadísticas de Notas - Datos: {gradeStats.length} estudiantes
        <Typography variant="caption" display="block" color="textSecondary">
          Última actualización: {new Date().toLocaleTimeString()}
        </Typography>
        {selectedPeriod && periods.find(p => p.id === selectedPeriod) && 
          ` - ${formatPeriodName(periods.find(p => p.id === selectedPeriod))}`
        }
        {currentUser?.user_type === 'student' && (
          <Typography variant="subtitle2" color="textSecondary">
            (Solo tus estadísticas personales)
          </Typography>
        )}
        {refreshing && (
          <CircularProgress size={20} sx={{ ml: 1 }} />
        )}
      </Typography>

      {gradeStats.length === 0 ? (
        <Alert severity="info">
          {currentUser?.user_type === 'student' 
            ? "No tienes notas registradas para este período."
            : "No hay notas registradas para este período."
          }
        </Alert>
      ) : (
        <>
          {/* Resumen general - Solo para profesores y admin */}
          {canManageGrades && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary.main">
                      Promedio General
                    </Typography>
                    <Typography variant="h4">
                      {formatNumber(gradeStats.reduce((sum, stat) => sum + stat.avg_total, 0) / gradeStats.length)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="success.main">
                      Aprobados
                    </Typography>
                    <Typography variant="h4">
                      {gradeStats.reduce((sum, stat) => sum + stat.approved_count, 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="error.main">
                      Reprobados
                    </Typography>
                    <Typography variant="h4">
                      {gradeStats.reduce((sum, stat) => sum + stat.failed_count, 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="info.main">
                      Total Estudiantes
                    </Typography>
                    <Typography variant="h4">
                      {gradeStats.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Resumen personal para estudiantes */}
          {currentUser?.user_type === 'student' && gradeStats.length > 0 && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[
                { label: 'Ser (5)', value: gradeStats[0].avg_ser },
                { label: 'Saber (45)', value: gradeStats[0].avg_saber },
                { label: 'Hacer (40)', value: gradeStats[0].avg_hacer },
                { label: 'Decidir (5)', value: gradeStats[0].avg_decidir },
                { label: 'Autoevaluación (5)', value: gradeStats[0].avg_autoevaluacion },
                { label: 'Promedio Total (100)', value: gradeStats[0].avg_total, color: 'success.main' }
              ].map((item, index) => (
                <Grid item xs={12} sm={2} key={index}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color={item.color || "primary.main"}>
                        {item.label}
                      </Typography>
                      <Typography variant="h4">
                        {formatNumber(item.value)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Tabla detallada */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {canManageGrades && <TableCell>Estudiante</TableCell>}
                  {currentUser?.user_type === 'student' && <TableCell>Mis Notas</TableCell>}
                  <TableCell align="center">Ser (5)</TableCell>
                  <TableCell align="center">Saber (45)</TableCell>
                  <TableCell align="center">Hacer (40)</TableCell>
                  <TableCell align="center">Decidir (5)</TableCell>
                  <TableCell align="center">Autoevaluación (5)</TableCell>
                  <TableCell align="center">Nota (100)</TableCell>
                  <TableCell align="center">Aprobados</TableCell>
                  <TableCell align="center">Reprobados</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gradeStats
                  .sort((a, b) => b.avg_total - a.avg_total)
                  .map(stat => (
                    <TableRow key={stat._key || stat.student_id}>
                      {(canManageGrades || currentUser?.user_type === 'student') && (
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Person sx={{ mr: 1 }} />
                            {stat.student_name}
                          </Box>
                        </TableCell>
                      )}
                      {[
                        stat.avg_ser, stat.avg_saber, stat.avg_hacer, 
                        stat.avg_decidir, stat.avg_autoevaluacion
                      ].map((value, index) => (
                        <TableCell key={index} align="center">
                          <Typography variant="h6">
                            {formatNumber(value)}
                          </Typography>
                        </TableCell>
                      ))}
                      <TableCell align="center">
                        <Typography 
                          variant="h6" 
                          color={
                            stat.avg_total >= 90 ? 'success.main' :
                            stat.avg_total >= 75 ? 'info.main' :
                            stat.avg_total >= 51 ? 'warning.main' : 'error.main'
                          }
                        >
                          {formatNumber(stat.avg_total)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          icon={<CheckCircle />}
                          label={stat.approved_count}
                          color="success"
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          icon={<Cancel />}
                          label={stat.failed_count}
                          color="error"
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

// Componente separado para notas finales (simplificado)
const FinalGradesTab = ({ 
  canViewGrades, canManageGrades, currentUser, finalGrades, expandedStudents,
  saving, setSaving, setSuccess, setError, classId, loadFinalGrades, refreshAllData,
  toggleStudentExpansion, getGradeColor, getGradeLabel, formatNumber, refreshing 
}) => {
  if (!canViewGrades) {
    return (
      <Alert severity="info">
        No tienes permisos para ver las notas finales de esta clase.
      </Alert>
    );
  }

  if (finalGrades.length === 0) {
    return (
      <Alert severity="info">
        {currentUser?.user_type === 'student' 
          ? "No tienes una nota final calculada aún."
          : "No hay notas finales calculadas para esta clase."
        }
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Notas Finales de la Clase
        {currentUser?.user_type === 'student' && (
          <Typography variant="subtitle2" color="textSecondary">
            (Solo tu nota final)
          </Typography>
        )}
        {refreshing && (
          <CircularProgress size={20} sx={{ ml: 1 }} />
        )}
      </Typography>

      {/* Resumen general - Solo para profesores y admin */}
      {canManageGrades && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary.main">
                  Promedio Final General
                </Typography>
                <Typography variant="h4">
                  {formatNumber(finalGrades.reduce((sum, grade) => sum + grade.nota_final, 0) / finalGrades.length)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  Aprobados Final
                </Typography>
                <Typography variant="h4">
                  {finalGrades.filter(grade => grade.estado_final === 'approved').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="error.main">
                  Reprobados Final
                </Typography>
                <Typography variant="h4">
                  {finalGrades.filter(grade => grade.estado_final === 'failed').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  % Aprobación
                </Typography>
                <Typography variant="h4">
                  {formatNumber((finalGrades.filter(grade => grade.estado_final === 'approved').length / finalGrades.length) * 100)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Botón para recalcular - Solo para profesores y admin */}
      {canManageGrades && (
        <Box sx={{ mb: 3 }}>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<TrendingUp />}
            onClick={async () => {
              try {
                setSaving(true);
                await gradeService.recalculateFinalGrades(classId);
                await refreshAllData();
                setSuccess('Notas finales recalculadas correctamente');
                setTimeout(() => setSuccess(''), 3000);
              } catch (err) {
                setError('Error al recalcular notas finales');
                setTimeout(() => setError(''), 3000);
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving || refreshing}
          >
            {saving ? <CircularProgress size={24} /> : 'Recalcular Notas Finales'}
          </Button>
        </Box>
      )}

      {/* Tabla simplificada de notas finales */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {canManageGrades && <TableCell>Estudiante</TableCell>}
              {currentUser?.user_type === 'student' && <TableCell>Mi Nota Final</TableCell>}
              <TableCell align="center">Nota Final</TableCell>
              <TableCell align="center">Estado Final</TableCell>
              <TableCell align="center">Períodos Evaluados</TableCell>
              <TableCell align="center">Calificación</TableCell>
              <TableCell align="center">Detalles</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {finalGrades
              .sort((a, b) => b.nota_final - a.nota_final)
              .map(finalGrade => (
                <React.Fragment key={finalGrade._key || finalGrade.id}>
                  <TableRow>
                    {(canManageGrades || currentUser?.user_type === 'student') && (
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Person sx={{ mr: 1 }} />
                          {finalGrade.student_detail.first_name} {finalGrade.student_detail.last_name}
                        </Box>
                      </TableCell>
                    )}
                    <TableCell align="center">
                      <Typography 
                        variant="h5" 
                        color={
                          finalGrade.nota_final >= 90 ? 'success.main' :
                          finalGrade.nota_final >= 75 ? 'info.main' :
                          finalGrade.nota_final >= 51 ? 'warning.main' : 'error.main'
                        }
                      >
                        {formatNumber(finalGrade.nota_final)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        icon={finalGrade.estado_final === 'approved' ? <CheckCircle /> : <Cancel />}
                        label={finalGrade.estado_final === 'approved' ? 'APROBADO' : 'REPROBADO'}
                        color={finalGrade.estado_final === 'approved' ? 'success' : 'error'}
                        size="medium"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body1">
                        {finalGrade.periods_count} período{finalGrade.periods_count !== 1 ? 's' : ''}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={getGradeLabel(finalGrade.nota_final)}
                        color={getGradeColor(finalGrade.nota_final)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => toggleStudentExpansion(finalGrade.student)}
                        size="small"
                      >
                        {expandedStudents[finalGrade.student] ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  
                  {/* Fila expandible simplificada */}
                  <TableRow>
                    <TableCell 
                      style={{ paddingBottom: 0, paddingTop: 0 }} 
                      colSpan={canManageGrades ? 7 : 6}
                    >
                      <Collapse 
                        in={expandedStudents[finalGrade.student]} 
                        timeout="auto" 
                        unmountOnExit
                      >
                        <Box sx={{ margin: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            Notas por Período
                          </Typography>
                          {finalGrade.period_grades && finalGrade.period_grades.length > 0 ? (
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Período</TableCell>
                                  <TableCell align="center">Total</TableCell>
                                  <TableCell align="center">Estado</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {finalGrade.period_grades.map((periodGrade, index) => (
                                  <TableRow key={index}>
                                    <TableCell>
                                      <Chip
                                        label={`${periodGrade.period.period_type === 'bimester' ? 'Bim' : 'Trim'} ${periodGrade.period.number}`}
                                        color={periodGrade.period.period_type === 'bimester' ? 'primary' : 'secondary'}
                                        size="small"
                                        variant="outlined"
                                      />
                                    </TableCell>
                                    <TableCell align="center">
                                      <Typography
                                        variant="body2"
                                        color={
                                          periodGrade.nota_total >= 90 ? 'success.main' :
                                          periodGrade.nota_total >= 75 ? 'info.main' :
                                          periodGrade.nota_total >= 51 ? 'warning.main' : 'error.main'
                                        }
                                        fontWeight="bold"
                                      >
                                        {formatNumber(periodGrade.nota_total)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip
                                        label={periodGrade.estado}
                                        color={periodGrade.estado === 'Aprobado' ? 'success' : 'error'}
                                        size="small"
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              No hay notas registradas para este estudiante
                            </Typography>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default GradeManagement;