import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, Typography, Box, Button, 
  Tabs, Tab, Divider, Paper,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Chip, Grid, CircularProgress
} from '@mui/material';
import { 
  Person, PersonAdd, Delete, ArrowBack,
  School, Class, Group, Book, EventNote, BarChart,
  Schedule, Add, Remove, Assessment
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { academicService, userService } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  
  // Estados para datos
  const [classData, setClassData] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  
  // Estados para UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [showAddPeriods, setShowAddPeriods] = useState(false);
  const [studentFilter, setStudentFilter] = useState('');
  
  // Permisos
  const isTeacherOwner = 
    currentUser?.user_type === 'teacher' && 
    classData?.teacher === currentUser?.teacher_profile?.id;
  
  const isAdmin = currentUser?.user_type === 'admin';
  
  const canModifyStudents = isTeacherOwner || isAdmin;
  const canModifyPeriods = isTeacherOwner || isAdmin;
  const canManageAttendanceParticipation = isTeacherOwner || isAdmin;
  const canManageGrades = isTeacherOwner || isAdmin;
  const canViewAttendanceParticipation = 
    canManageAttendanceParticipation || 
    (currentUser?.user_type === 'student' && 
     classData?.students?.includes(currentUser?.student_profile?.id));
  const canViewGrades = 
    canManageGrades || 
    (currentUser?.user_type === 'student' && 
     classData?.students?.includes(currentUser?.student_profile?.id));

  // Log de permisos
  console.log("=== PERMISOS CLASS DETAIL ===");
  console.log("canModifyStudents:", canModifyStudents);
  console.log("canModifyPeriods:", canModifyPeriods);
  console.log("canManageAttendanceParticipation:", canManageAttendanceParticipation);
  console.log("canViewAttendanceParticipation:", canViewAttendanceParticipation);
  console.log("canManageGrades:", canManageGrades);
  console.log("canViewGrades:", canViewGrades);
  
  // Cargar datos de la clase
  useEffect(() => {
    const fetchClassData = async () => {
      try {
        setLoading(true);
        
        // Obtener datos de la clase
        const data = await academicService.getClass(id);
        setClassData(data);
        
        console.log("=== DEPURACIÓN CLASS DETAIL ===");
        console.log("Datos de la clase:", data);
        console.log("Usuario actual:", currentUser);
        console.log("¿Es estudiante?", currentUser?.user_type === 'student');
        console.log("ID del perfil de estudiante:", currentUser?.student_profile?.id);
        console.log("classData.students (IDs):", data?.students);
        console.log("¿Está en students array?", data?.students?.includes(currentUser?.student_profile?.id));
        
        // Si es profesor propietario o admin, cargar estudiantes y períodos disponibles
        if ((currentUser?.user_type === 'teacher' && 
             data.teacher === currentUser?.teacher_profile?.id) || 
            currentUser?.user_type === 'admin') {
          try {
            // Cargar estudiantes disponibles
            const availableStudents = await academicService.getAvailableStudents(id);
            setAllStudents(availableStudents);
          } catch (err) {
            // Si falla, usar el método general
            const studentsResponse = await userService.getAllStudentProfiles();
            setAllStudents(studentsResponse.filter(
              student => !data.students.includes(student.id)
            ));
          }

          try {
            // Cargar períodos disponibles
            const availablePeriodsData = await academicService.getAvailablePeriodsForClass(id);
            setAvailablePeriods(availablePeriodsData);
          } catch (err) {
            console.error('Error loading available periods:', err);
            setAvailablePeriods([]);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error loading class data:', err);
        setError('Error al cargar los datos de la clase. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClassData();
  }, [id, currentUser]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleAddStudents = () => {
    setShowAddStudents(true);
  };

  const handleAddPeriods = () => {
    setShowAddPeriods(true);
  };
  
  const handleFilterChange = (e) => {
    setStudentFilter(e.target.value);
  };
  
  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSelectPeriod = (periodId) => {
    setSelectedPeriods(prev => {
      if (prev.includes(periodId)) {
        return prev.filter(id => id !== periodId);
      } else {
        return [...prev, periodId];
      }
    });
  };
  
  const handleSubmitAddStudents = async () => {
    try {
      setLoading(true);
      
      console.log("Añadiendo estudiantes a la clase:", id);
      console.log("IDs de estudiantes seleccionados:", selectedStudents);
      
      // Añadir estudiantes seleccionados a la clase
      const response = await academicService.addStudentsToClass(id, selectedStudents);
      console.log("Respuesta de add_students:", response);
      
      // Recargar datos de la clase
      const updatedClassData = await academicService.getClass(id);
      console.log("Datos actualizados de la clase:", updatedClassData);
      console.log("Estudiantes actualizados:", updatedClassData.students_detail);
      
      setClassData(updatedClassData);
      
      // Actualizar lista de estudiantes disponibles
      try {
        const availableStudents = await academicService.getAvailableStudents(id);
        setAllStudents(availableStudents);
      } catch (err) {
        console.error("Error al obtener estudiantes disponibles:", err);
        // Si falla, actualizar manualmente
        setAllStudents(prev => 
          prev.filter(student => !selectedStudents.includes(student.id))
        );
      }
      
      // Cerrar modal y limpiar selección
      setShowAddStudents(false);
      setSelectedStudents([]);
      
    } catch (err) {
      console.error('Error adding students:', err);
      console.error('Response data:', err.response?.data);
      setError('Error al añadir estudiantes: ' + (err.response?.data?.detail || err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAddPeriods = async () => {
    try {
      setLoading(true);
      
      console.log("Añadiendo períodos a la clase:", id);
      console.log("IDs de períodos seleccionados:", selectedPeriods);
      
      // Añadir períodos seleccionados a la clase
      const response = await academicService.addPeriodsToClass(id, selectedPeriods);
      console.log("Respuesta de add_periods:", response);
      
      // Recargar datos de la clase
      const updatedClassData = await academicService.getClass(id);
      console.log("Datos actualizados de la clase:", updatedClassData);
      console.log("Períodos actualizados:", updatedClassData.periods_detail);
      
      setClassData(updatedClassData);
      
      // Actualizar lista de períodos disponibles
      try {
        const availablePeriodsData = await academicService.getAvailablePeriodsForClass(id);
        setAvailablePeriods(availablePeriodsData);
      } catch (err) {
        console.error("Error al obtener períodos disponibles:", err);
        // Si falla, actualizar manualmente
        setAvailablePeriods(prev => 
          prev.filter(period => !selectedPeriods.includes(period.id))
        );
      }
      
      // Cerrar modal y limpiar selección
      setShowAddPeriods(false);
      setSelectedPeriods([]);
      
    } catch (err) {
      console.error('Error adding periods:', err);
      console.error('Response data:', err.response?.data);
      setError('Error al añadir períodos: ' + (err.response?.data?.detail || err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemoveStudent = async (studentId) => {
    try {
      setLoading(true);
      
      console.log("Removiendo estudiante:", studentId, "de la clase:", id);
      
      // Remover estudiante de la clase
      const response = await academicService.removeStudentsFromClass(id, [studentId]);
      console.log("Respuesta de remove_students:", response);
      
      // Recargar datos de la clase
      const updatedClassData = await academicService.getClass(id);
      console.log("Datos actualizados de la clase después de remover estudiante:", updatedClassData);
      console.log("Estudiantes actualizados:", updatedClassData.students_detail);
      
      setClassData(updatedClassData);
      
      // Actualizar lista de estudiantes disponibles
      try {
        const availableStudents = await academicService.getAvailableStudents(id);
        setAllStudents(availableStudents);
      } catch (err) {
        console.error("Error al obtener estudiantes disponibles:", err);
        
        // Si falla, intentar actualizar manualmente
        const removedStudent = classData.students_detail.find(s => s.id === studentId);
        
        if (removedStudent) {
          setAllStudents(prev => [...prev, removedStudent]);
          console.log("Añadido estudiante removido a lista de disponibles:", removedStudent);
        }
      }
      
    } catch (err) {
      console.error('Error removing student:', err);
      console.error('Response data:', err.response?.data);
      setError('Error al remover estudiante: ' + (err.response?.data?.detail || err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePeriod = async (periodId) => {
    try {
      setLoading(true);
      
      console.log("Removiendo período:", periodId, "de la clase:", id);
      
      // Remover período de la clase
      const response = await academicService.removePeriodsFromClass(id, [periodId]);
      console.log("Respuesta de remove_periods:", response);
      
      // Recargar datos de la clase
      const updatedClassData = await academicService.getClass(id);
      console.log("Datos actualizados de la clase después de remover período:", updatedClassData);
      console.log("Períodos actualizados:", updatedClassData.periods_detail);
      
      setClassData(updatedClassData);
      
      // Actualizar lista de períodos disponibles
      try {
        const availablePeriodsData = await academicService.getAvailablePeriodsForClass(id);
        setAvailablePeriods(availablePeriodsData);
      } catch (err) {
        console.error("Error al obtener períodos disponibles:", err);
        
        // Si falla, intentar actualizar manualmente
        const removedPeriod = classData.periods_detail.find(p => p.id === periodId);
        
        if (removedPeriod) {
          setAvailablePeriods(prev => [...prev, removedPeriod]);
          console.log("Añadido período removido a lista de disponibles:", removedPeriod);
        }
      }
      
    } catch (err) {
      console.error('Error removing period:', err);
      console.error('Response data:', err.response?.data);
      setError('Error al remover período: ' + (err.response?.data?.detail || err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToAttendance = () => {
    navigate(`/classes/${id}/attendance`);
  };

  const handleNavigateToParticipation = () => {
    navigate(`/classes/${id}/participation`);
  };

  const handleNavigateToGrades = () => {
    navigate(`/classes/${id}/grades`);
  };
  
  // Filtrar estudiantes para añadir
  const filteredStudents = allStudents.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const ci = student.ci?.toLowerCase() || '';
    const searchTerm = studentFilter.toLowerCase();
    
    return (
      fullName.includes(searchTerm) || 
      ci.includes(searchTerm)
    );
  });

  // Función para formatear fechas correctamente
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T12:00:00'); // Añadir hora para evitar problemas de zona horaria
    return date.toLocaleDateString('es-ES');
  };

  // Función para formatear el nombre del período
  const formatPeriodName = (period) => {
    const typeName = period.period_type === 'bimester' ? 'Bimestre' : 'Trimestre';
    return `${typeName} ${period.number}`;
  };

  // Función para obtener el color del chip según el tipo de período
  const getPeriodColor = (periodType) => {
    return periodType === 'bimester' ? 'primary' : 'secondary';
  };
  
  if (loading && !classData) {
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
        <Typography color="error">
          No se pudo cargar la información de la clase.
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<ArrowBack />}
          onClick={() => navigate('/classes')}
          sx={{ mt: 2 }}
        >
          Volver a la lista
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />}
          onClick={() => navigate('/classes')}
          sx={{ mb: 3 }}
        >
          Volver a la lista
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          {classData.name}
        </Typography>
        
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          Código: {classData.code}
        </Typography>
        
        {error && (
          <Typography color="error" sx={{ my: 2 }}>
            {error}
          </Typography>
        )}
        
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Book sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Materia</Typography>
              </Box>
              <Typography>{classData.subject_detail?.name}</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Class sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Curso</Typography>
              </Box>
              <Typography>{classData.course_detail?.name}</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Group sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Grupo</Typography>
              </Box>
              <Typography>{classData.group_detail?.name}</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <School sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Año</Typography>
              </Box>
              <Typography>{classData.year}</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Botones de gestión de asistencia, participación y notas */}
        {(canViewAttendanceParticipation || canViewGrades) && (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {canViewAttendanceParticipation && (
              <>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<EventNote />}
                    onClick={handleNavigateToAttendance}
                    sx={{ py: 2 }}
                  >
                    {canManageAttendanceParticipation ? "Gestionar Asistencia" : "Ver Mi Asistencia"}
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    startIcon={<BarChart />}
                    onClick={handleNavigateToParticipation}
                    sx={{ py: 2 }}
                  >
                    {canManageAttendanceParticipation ? "Gestionar Participación" : "Ver Mi Participación"}
                  </Button>
                </Grid>
              </>
            )}
            {canViewGrades && (
              <Grid item xs={12} sm={4}>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  startIcon={<Assessment />}
                  onClick={handleNavigateToGrades}
                  sx={{ py: 2 }}
                >
                  {canManageGrades ? "Gestionar Notas" : "Ver Mis Notas"}
                </Button>
              </Grid>
            )}
          </Grid>
        )}
        
        {classData.description && (
          <Paper sx={{ p: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom>Descripción</Typography>
            <Typography variant="body1">{classData.description}</Typography>
          </Paper>
        )}
        
        <Paper sx={{ mb: 4 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
          >
            <Tab label="Participantes" />
            <Tab label="Períodos" />
          </Tabs>
          
          <Divider />
          
          <Box sx={{ p: 2 }}>
            {activeTab === 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Estudiantes ({classData.students_detail?.length || 0})
                  </Typography>
                  
                  {canModifyStudents && (
                    <Button 
                      variant="contained" 
                      color="primary" 
                      startIcon={<PersonAdd />}
                      onClick={handleAddStudents}
                    >
                      Añadir Estudiantes
                    </Button>
                  )}
                </Box>
                
                {classData.students_detail?.length === 0 ? (
                  <Typography>No hay estudiantes asignados a esta clase.</Typography>
                ) : (
                  <List>
                    {classData.students_detail?.map(student => (
                      <ListItem key={student.id}>
                        <ListItemText 
                          primary={`${student.first_name} ${student.last_name}`} 
                          secondary={`CI: ${student.ci}`} 
                        />
                        
                        {canModifyStudents && (
                          <ListItemSecondaryAction>
                            <IconButton 
                              edge="end" 
                              color="error"
                              onClick={() => handleRemoveStudent(student.id)}
                            >
                              <Delete />
                            </IconButton>
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}
            
            {activeTab === 1 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Períodos del año {classData.year} ({classData.periods_detail?.length || 0})
                  </Typography>
                  
                  {canModifyPeriods && (
                    <Button 
                      variant="contained" 
                      color="primary" 
                      startIcon={<Add />}
                      onClick={handleAddPeriods}
                    >
                      Añadir Períodos
                    </Button>
                  )}
                </Box>
                
                {classData.periods_detail?.length === 0 ? (
                  <Typography>
                    No hay períodos asignados a esta clase.
                  </Typography>
                ) : (
                  <List>
                    {classData.periods_detail?.map(period => (
                      <ListItem key={period.id}>
                        <ListItemText 
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label={formatPeriodName(period)}
                                color={getPeriodColor(period.period_type)}
                                variant="outlined"
                                size="small"
                              />
                            </Box>
                          }
                          secondary={`Del ${formatDate(period.start_date)} al ${formatDate(period.end_date)}`} 
                        />
                        
                        {canModifyPeriods && (
                          <ListItemSecondaryAction>
                            <IconButton 
                              edge="end" 
                              color="error"
                              onClick={() => handleRemovePeriod(period.id)}
                            >
                              <Remove />
                            </IconButton>
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
      
      {/* Diálogo para añadir estudiantes */}
      <Dialog 
        open={showAddStudents} 
        onClose={() => setShowAddStudents(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Añadir Estudiantes a la Clase</DialogTitle>
        
        <DialogContent>
          <TextField
            label="Buscar estudiantes por nombre o CI"
            value={studentFilter}
            onChange={handleFilterChange}
            fullWidth
            variant="outlined"
            margin="normal"
          />
          
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Estudiantes seleccionados: {selectedStudents.length}
          </Typography>
          
          <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedStudents.length > 0 ? (
              selectedStudents.map(studentId => {
                const student = allStudents.find(s => s.id === studentId);
                return student ? (
                  <Chip
                    key={student.id}
                    label={`${student.first_name} ${student.last_name}`}
                    onDelete={() => handleSelectStudent(student.id)}
                    color="primary"
                  />
                ) : null;
              })
            ) : (
              <Typography variant="body2" color="textSecondary">
                Ningún estudiante seleccionado
              </Typography>
            )}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Estudiantes disponibles
          </Typography>
          
          {filteredStudents.length === 0 ? (
            <Typography>No se encontraron estudiantes.</Typography>
          ) : (
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {filteredStudents
                .filter(student => !classData.students.includes(student.id))
                .map(student => (
                  <ListItem 
                    key={student.id} 
                    button
                    onClick={() => handleSelectStudent(student.id)}
                    selected={selectedStudents.includes(student.id)}
                  >
                    <ListItemText 
                      primary={`${student.first_name} ${student.last_name}`} 
                      secondary={`CI: ${student.ci}`} 
                    />
                  </ListItem>
                ))}
            </List>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowAddStudents(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmitAddStudents} 
            variant="contained" 
            color="primary"
            disabled={selectedStudents.length === 0 || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Añadir Seleccionados'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para añadir períodos */}
      <Dialog 
        open={showAddPeriods} 
        onClose={() => setShowAddPeriods(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Añadir Períodos a la Clase</DialogTitle>
        
        <DialogContent>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Períodos seleccionados: {selectedPeriods.length}
          </Typography>
          
          <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedPeriods.length > 0 ? (
              selectedPeriods.map(periodId => {
                const period = availablePeriods.find(p => p.id === periodId);
                return period ? (
                  <Chip
                    key={period.id}
                    label={formatPeriodName(period)}
                    onDelete={() => handleSelectPeriod(period.id)}
                    color={getPeriodColor(period.period_type)}
                  />
                ) : null;
              })
            ) : (
              <Typography variant="body2" color="textSecondary">
                Ningún período seleccionado
              </Typography>
            )}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Períodos disponibles para el año {classData.year}
          </Typography>
          
          {availablePeriods.length === 0 ? (
            <Typography>
              No hay períodos disponibles para el año {classData.year}.
              <br />
              Debes crear períodos primero en la gestión de períodos.
            </Typography>
          ) : (
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {availablePeriods.map(period => (
                <ListItem 
                  key={period.id} 
                  button
                  onClick={() => handleSelectPeriod(period.id)}
                  selected={selectedPeriods.includes(period.id)}
                >
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={formatPeriodName(period)}
                          color={getPeriodColor(period.period_type)}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                    }
                    secondary={`Del ${formatDate(period.start_date)} al ${formatDate(period.end_date)}`} 
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowAddPeriods(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmitAddPeriods} 
            variant="contained" 
            color="primary"
            disabled={selectedPeriods.length === 0 || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Añadir Seleccionados'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ClassDetail;