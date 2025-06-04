import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, Typography, Box, Paper, Button, Tabs, Tab,
  CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, Grid
} from '@mui/material';
import { 
  Assessment, BarChart, Star, ArrowBack, Psychology, TrendingUp
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { academicService, gradeService } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

// Importar los componentes separados
import RegisterGradesTab from './RegisterGradesTab';
import StatsTab from './StatsTab';
import FinalGradesTab from './FinalGradesTab';
import MLPredictions from '../MLPredictions';

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
        
        const classResponse = await academicService.getClass(classId);
        setClassData(classResponse);
        
        console.log("=== DEPURACIÓN GRADE MANAGEMENT ===");
        console.log("Datos de la clase:", classResponse);
        console.log("Períodos de la clase:", classResponse.periods_detail);
        
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
      setActiveTab(1);
    }
  }, [currentUser, canManageGrades, canViewGrades]);

  // Función para cargar datos de notas
  const loadGradeData = async () => {
    try {
      const response = await gradeService.getGradesByClassAndPeriod(classId, selectedPeriod);
      
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
      setPeriodGrades({});
    }
  };

  // Función para cargar estadísticas
  const loadGradeStats = async (forceFresh = false) => {
    try {
      console.log("FRONTEND: Cargando estadísticas...");
      
      setGradeStats([]);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await gradeService.getGradeStats(classId, selectedPeriod, forceFresh);
      console.log("FRONTEND: Estadísticas recibidas:", response);
      
      const freshStats = response.map((stat, index) => ({
        ...stat,
        _timestamp: Date.now() + index,
        _key: `${stat.student_id}-${Date.now()}-${index}`
      }));
      
      setGradeStats(freshStats);
      setStatsKey(prev => prev + 1);
      
      console.log("FRONTEND: Estado gradeStats actualizado con", freshStats.length, "elementos");
      
    } catch (err) {
      console.error('Error loading grade stats:', err);
      setGradeStats([]);
    }
  };

  // Función para cargar notas finales
  const loadFinalGrades = async (forceFresh = false) => {
    try {
      console.log("FRONTEND: Cargando notas finales...");
      
      setFinalGrades([]);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await gradeService.getFinalGradesByClass(classId, forceFresh);
      console.log("FRONTEND: Notas finales recibidas:", response);
      
      const freshFinalGrades = response.map((grade, index) => ({
        ...grade,
        _timestamp: Date.now() + index,
        _key: `${grade.student}-${Date.now()}-${index}`
      }));
      
      setFinalGrades(freshFinalGrades);
      
      console.log("FRONTEND: Estado finalGrades actualizado con", freshFinalGrades.length, "elementos");
      
    } catch (err) {
      console.error('Error loading final grades:', err);
      setFinalGrades([]);
    }
  };

  // Función para refrescar todos los datos
  const refreshAllData = async () => {
    try {
      setRefreshing(true);
      console.log("FRONTEND: Refrescando todos los datos...");
      
      await gradeService.clearBrowserCache();
      
      setGradeStats([]);
      setFinalGrades([]);
      setPeriodGrades({});
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await loadGradeData();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await loadGradeStats(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await loadFinalGrades(true);
      
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
    
    if (newValue === 1 || newValue === 2) {
      console.log("FRONTEND: Cambiando a pestaña", newValue, "- refrescando datos");
      setTimeout(() => {
        refreshAllData();
      }, 100);
    }
  };

  const handleGradeChange = (studentId, field, value) => {
    const numValue = parseFloat(value) || 0;
    
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

  // Función para guardar notas
  const saveGrades = async () => {
    if (!canManageGrades) {
      setError('No tienes permisos para gestionar notas');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      await gradeService.clearBrowserCache();
      
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
      
      await gradeService.createBulkGrades(gradeData);
      
      setSuccess('Notas guardadas. Actualizando estadísticas...');
      
      setGradeStats([]);
      setFinalGrades([]);
      
      console.log("FRONTEND: Esperando procesamiento del backend...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await refreshAllData();
      
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
                gradeService={gradeService}
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

export default GradeManagement;