import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, Paper, Grid, Card, CardContent, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Alert, Typography, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { 
  Psychology, Timeline, Refresh, ModelTraining, Person,
  TrendingUp, CheckCircle, Cancel, History, CompareArrows
} from '@mui/icons-material';
import { mlService, gradeService } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const MLPredictions = ({ classData, canManageGrades, canViewGrades }) => {
  const { currentUser } = useContext(AuthContext);
  
  // Estados para ML
  const [predictions, setPredictions] = useState([]);
  const [predictionStats, setPredictionStats] = useState(null);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [comparisonStats, setComparisonStats] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');

  // Función helper para formatear números
  const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0.0';
    return parseFloat(value).toFixed(1);
  };

  // Cargar datos de ML al montar el componente
  useEffect(() => {
    if (classData && canViewGrades) {
      loadMLData();
    }
  }, [classData, canViewGrades]);

  const loadMLData = async () => {
    try {
      setMlLoading(true);
      
      // Cargar predicciones
      const predictionsResponse = await mlService.getPredictionsByClass(classData.id);
      setPredictions(predictionsResponse);
      
      // Cargar estadísticas de predicciones
      const statsResponse = await mlService.getPredictionStats(classData.id);
      setPredictionStats(statsResponse);
      
      // Cargar historial de predicciones
      const historyResponse = await mlService.getPredictionHistoryByClass(classData.id);
      setPredictionHistory(historyResponse);
      
      // Cargar estadísticas de comparación
      const comparisonResponse = await mlService.getComparisonStats(classData.id);
      setComparisonStats(comparisonResponse);
      
    } catch (err) {
      console.error('Error loading ML data:', err);
      // No mostrar error si no hay datos de ML
    } finally {
      setMlLoading(false);
    }
  };

  const updatePredictions = async () => {
    if (!canManageGrades) {
      setError('No tienes permisos para actualizar predicciones');
      return;
    }

    try {
      setMlLoading(true);
      
      const response = await mlService.updateClassPredictions({
        class_id: classData.id
      });
      setSuccess(`Predicciones actualizadas: ${response.updated_count} estudiantes`);
      
      // Recargar datos de ML
      await loadMLData();
      
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('Error updating predictions:', err);
      setError('Error al actualizar predicciones');
      setTimeout(() => setError(''), 3000);
    } finally {
      setMlLoading(false);
    }
  };

  // Función para generar predicciones retrospectivas
  const generateRetrospectivePredictions = async (periodId = null) => {
    if (!canManageGrades) {
      setError('No tienes permisos para generar predicciones retrospectivas');
      return;
    }

    try {
      setMlLoading(true);
      
      const requestData = { class_id: classData.id };
      if (periodId) {
        requestData.period_id = periodId;
      }
      
      const response = await mlService.generateRetrospectivePredictions(requestData);
      setSuccess(`Predicciones retrospectivas generadas: ${response.predictions_count} predicciones, ${response.comparisons_created} comparaciones creadas`);
      
      // Recargar datos de ML
      await loadMLData();
      
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (err) {
      console.error('Error generating retrospective predictions:', err);
      setError(err.response?.data?.error || 'Error al generar predicciones retrospectivas');
      setTimeout(() => setError(''), 5000);
    } finally {
      setMlLoading(false);
    }
  };

  // Función para actualizar predicciones incluyendo retrospectivas
  const updatePredictionsWithRetrospective = async () => {
    if (!canManageGrades) {
      setError('No tienes permisos para actualizar predicciones');
      return;
    }

    try {
      setMlLoading(true);
      
      const response = await mlService.updateClassPredictions({
        class_id: classData.id,
        include_retrospective: true
      });
      setSuccess(`Predicciones actualizadas (incluyendo retrospectivas): ${response.updated_count} estudiantes`);
      
      // Recargar datos de ML
      await loadMLData();
      
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('Error updating predictions with retrospective:', err);
      setError('Error al actualizar predicciones');
      setTimeout(() => setError(''), 3000);
    } finally {
      setMlLoading(false);
    }
  };

  // Función para predecir un período específico
  const predictSpecificPeriod = async () => {
    if (!canManageGrades) {
      setError('No tienes permisos para hacer predicciones específicas');
      return;
    }

    if (!selectedPeriod) {
      setError('Selecciona un período para predecir');
      return;
    }

    await generateRetrospectivePredictions(parseInt(selectedPeriod));
  };

  const retrainModel = async () => {
    if (!canManageGrades) {
      setError('No tienes permisos para reentrenar el modelo');
      return;
    }

    try {
      setMlLoading(true);
      
      const response = await mlService.retrainModel(classData.id);
      setSuccess(`Modelo reentrenado exitosamente. Score: ${response.validation_score.toFixed(3)}`);
      
      // Recargar datos de ML
      await loadMLData();
      
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (err) {
      console.error('Error retraining model:', err);
      setError(err.response?.data?.error || 'Error al reentrenar modelo');
      setTimeout(() => setError(''), 5000);
    } finally {
      setMlLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
    return 'error';
  };

  const getGradeColor = (grade) => {
    if (grade >= 90) return 'success.main';
    if (grade >= 75) return 'info.main';
    if (grade >= 51) return 'warning.main';
    return 'error.main';
  };

  if (!canViewGrades) {
    return (
      <Alert severity="info">
        No tienes permisos para ver las predicciones de esta clase.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header con botones de acción */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6">
          Predicciones y Comparaciones ML
          {currentUser?.user_type === 'student' && (
            <Typography variant="subtitle2" color="textSecondary">
              (Solo tus predicciones personales)
            </Typography>
          )}
        </Typography>
        
        {canManageGrades && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button 
              variant="outlined" 
              color="primary"
              startIcon={<Refresh />}
              onClick={updatePredictions}
              disabled={mlLoading}
              size="small"
            >
              Actualizar Predicciones
            </Button>
            
            {/* Selector de período para predicciones retrospectivas */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Período</InputLabel>
              <Select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                label="Período"
                disabled={mlLoading}
              >
                {classData?.periods?.map((period) => (
                  <MenuItem key={period.id} value={period.id}>
                    {period.period_type === 'bimestre' ? 'Bim' : 'Trim'} {period.number}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button 
              variant="outlined" 
              color="info"
              startIcon={<History />}
              onClick={predictSpecificPeriod}
              disabled={mlLoading || !selectedPeriod}
              size="small"
            >
              Predecir Retrospectivo
            </Button>
            
            {classData?.year === 2024 && (
              <Button 
                variant="outlined" 
                color="secondary"
                startIcon={<CompareArrows />}
                onClick={() => generateRetrospectivePredictions()}
                disabled={mlLoading}
                size="small"
              >
                Generar Comparaciones
              </Button>
            )}
            
            <Button 
              variant="outlined" 
              color="secondary"
              startIcon={<ModelTraining />}
              onClick={retrainModel}
              disabled={mlLoading}
              size="small"
            >
              Reentrenar Modelo
            </Button>
          </Box>
        )}
      </Box>

      {/* Alertas */}
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

      {/* Loading indicator */}
      {mlLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Procesando datos de Machine Learning...</Typography>
        </Box>
      )}

      {/* Estadísticas de predicciones */}
      {predictionStats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary.main">
                  Predicciones Activas
                </Typography>
                <Typography variant="h4">
                  {predictionStats.predictions_count}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  Nota Predicha Promedio
                </Typography>
                <Typography variant="h4">
                  {formatNumber(predictionStats.avg_predicted_grade)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  Confianza Promedio
                </Typography>
                <Typography variant="h4">
                  {formatNumber(predictionStats.avg_confidence)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  Modelo Activo
                </Typography>
                <Typography variant="body2">
                  {predictionStats.model_version}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabla de predicciones actuales */}
      {predictions.length > 0 ? (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Predicciones para Próximos Períodos
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  {canManageGrades && <TableCell>Estudiante</TableCell>}
                  {currentUser?.user_type === 'student' && <TableCell>Mi Predicción</TableCell>}
                  <TableCell align="center">Período Predicho</TableCell>
                  <TableCell align="center">Nota Predicha</TableCell>
                  <TableCell align="center">Confianza</TableCell>
                  <TableCell align="center">Basado en Notas</TableCell>
                  <TableCell align="center">Asistencia %</TableCell>
                  <TableCell align="center">Participación</TableCell>
                  <TableCell align="center">Última Actualización</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {predictions
                  .sort((a, b) => b.predicted_grade - a.predicted_grade)
                  .map(prediction => (
                    <TableRow key={prediction.id}>
                      {canManageGrades && (
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Person sx={{ mr: 1 }} />
                            {prediction.student_detail.first_name} {prediction.student_detail.last_name}
                          </Box>
                        </TableCell>
                      )}
                      {currentUser?.user_type === 'student' && (
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Person sx={{ mr: 1 }} />
                            {prediction.student_detail.first_name} {prediction.student_detail.last_name}
                          </Box>
                        </TableCell>
                      )}
                      <TableCell align="center">
                        <Chip
                          label={`${prediction.period_detail.period_type === 'bimestre' ? 'Bim' : 'Trim'} ${prediction.period_detail.number}`}
                          color={prediction.period_detail.period_type === 'bimestre' ? 'primary' : 'secondary'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="h6" 
                          color={getGradeColor(prediction.predicted_grade)}
                          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Psychology sx={{ mr: 0.5, fontSize: '1rem' }} />
                          {formatNumber(prediction.predicted_grade)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${formatNumber(prediction.confidence)}%`}
                          color={getConfidenceColor(prediction.confidence)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {formatNumber(prediction.avg_previous_grades)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {formatNumber(prediction.attendance_percentage)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {formatNumber(prediction.participation_average)}/3.0
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="caption" color="textSecondary">
                          {new Date(prediction.updated_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <Alert severity="info" sx={{ mb: 4 }}>
          {currentUser?.user_type === 'student' 
            ? "No tienes predicciones disponibles. Necesitas más datos históricos."
            : "No hay predicciones disponibles. Los estudiantes necesitan más datos históricos."
          }
        </Alert>
      )}

      {/* Estadísticas de comparación realidad vs predicción */}
      {comparisonStats && comparisonStats.total_comparisons > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Precisión del Modelo (Realidad vs Predicción)
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary.main">
                    Comparaciones Totales
                  </Typography>
                  <Typography variant="h4">
                    {comparisonStats.total_comparisons}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    Precisión Promedio
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(comparisonStats.avg_accuracy_percentage)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    Error Promedio
                  </Typography>
                  <Typography variant="h4">
                    ±{formatNumber(comparisonStats.avg_absolute_error)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="info.main">
                    Predicciones Excelentes
                  </Typography>
                  <Typography variant="h4">
                    {comparisonStats.excellent_predictions}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    (Error ≤ 5 puntos)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Historial de predicciones */}
      {predictionHistory.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Historial de Comparaciones
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {canManageGrades && <TableCell>Estudiante</TableCell>}
                  {currentUser?.user_type === 'student' && <TableCell>Mi Historial</TableCell>}
                  <TableCell align="center">Período</TableCell>
                  <TableCell align="center">Predicción</TableCell>
                  <TableCell align="center">Realidad</TableCell>
                  <TableCell align="center">Diferencia</TableCell>
                  <TableCell align="center">Precisión</TableCell>
                  <TableCell align="center">Calidad</TableCell>
                  <TableCell align="center">Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {predictionHistory
                  .sort((a, b) => new Date(b.actual_grade_date) - new Date(a.actual_grade_date))
                  .map(history => (
                    <TableRow key={history.id}>
                      {canManageGrades && (
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Person sx={{ mr: 1 }} />
                            {history.student_detail.first_name} {history.student_detail.last_name}
                          </Box>
                        </TableCell>
                      )}
                      {currentUser?.user_type === 'student' && (
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Person sx={{ mr: 1 }} />
                            {history.student_detail.first_name} {history.student_detail.last_name}
                          </Box>
                        </TableCell>
                      )}
                      <TableCell align="center">
                        <Chip
                          label={`${history.period_detail.period_type === 'bimestre' ? 'Bim' : 'Trim'} ${history.period_detail.number}`}
                          color={history.period_detail.period_type === 'bimestre' ? 'primary' : 'secondary'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="body2" 
                          color="textSecondary"
                          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Psychology sx={{ mr: 0.5, fontSize: '0.8rem' }} />
                          {formatNumber(history.predicted_grade)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="body1" 
                          color={getGradeColor(history.actual_grade)}
                          fontWeight="bold"
                        >
                          {formatNumber(history.actual_grade)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="body2"
                          color={
                            Math.abs(history.difference) <= 5 ? 'success.main' :
                            Math.abs(history.difference) <= 10 ? 'warning.main' : 'error.main'
                          }
                        >
                          {history.difference > 0 ? '+' : ''}{formatNumber(history.difference)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {formatNumber(history.accuracy_percentage)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={history.prediction_quality}
                          color={
                            history.prediction_quality === 'Excelente' ? 'success' :
                            history.prediction_quality === 'Buena' ? 'info' :
                            history.prediction_quality === 'Regular' ? 'warning' : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="caption" color="textSecondary">
                          {new Date(history.actual_grade_date).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Mensaje si no hay historial */}
      {predictionHistory.length === 0 && predictions.length > 0 && (
        <Alert severity="info" sx={{ mt: 4 }}>
          El historial de comparaciones se generará automáticamente cuando se registren notas para los períodos predichos, o puedes generar comparaciones retrospectivas usando los botones de arriba.
        </Alert>
      )}

      {/* Información sobre clases de 2024 */}
      {canManageGrades && classData?.year === 2024 && (
        <Alert severity="info" sx={{ mt: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Clase de 2024 - Comparaciones Disponibles
          </Typography>
          Esta clase tiene datos completos. Puedes usar "Generar Comparaciones" para ver qué tan precisas habrían sido las predicciones del modelo si hubiera predicho períodos pasados basándose en datos anteriores.
        </Alert>
      )}
    </Box>
  );
};

export default MLPredictions;