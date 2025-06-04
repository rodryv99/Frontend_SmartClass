import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, TextField, Button, Typography, Box, 
  Grid, MenuItem, CircularProgress, Alert, FormControl,
  InputLabel, Select, Chip, OutlinedInput, Checkbox,
  ListItemText
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { academicService } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const ClassForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const isEditing = Boolean(id);
  
  // Estados para datos del formulario
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    subject: '',
    course: '',
    group: '',
    year: new Date().getFullYear(),
    periods: [], // Array de IDs de períodos seleccionados
  });
  
  // Estados para datos relacionados
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [availablePeriods, setAvailablePeriods] = useState([]);
  
  // Estados para UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Cargar materias, cursos y grupos
        const [subjectsData, coursesData, groupsData] = await Promise.all([
          academicService.getAllSubjects(),
          academicService.getAllCourses(),
          academicService.getAllGroups()
        ]);
        
        setSubjects(subjectsData || []);
        setCourses(coursesData || []);
        setGroups(groupsData || []);
        
        // Si estamos editando, cargar datos de la clase
        if (isEditing) {
          const classData = await academicService.getClass(id);
          setFormData({
            code: classData.code || '',
            name: classData.name || '',
            description: classData.description || '',
            subject: classData.subject || '',
            course: classData.course || '',
            group: classData.group || '',
            year: classData.year || new Date().getFullYear(),
            periods: classData.periods || [], // IDs de períodos ya asignados
          });
          
          // Cargar períodos disponibles para el año de la clase
          if (classData.year) {
            await loadPeriodsForYear(classData.year);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error loading form data:', err);
        setError('Error al cargar los datos. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [id, isEditing]);

  // Cargar períodos cuando cambia el año
  useEffect(() => {
    if (formData.year && !isEditing) {
      loadPeriodsForYear(formData.year);
    }
  }, [formData.year, isEditing]);

  // Función para cargar períodos de un año específico
  const loadPeriodsForYear = async (year) => {
    try {
      const allPeriods = await academicService.getAllPeriods();
      const periodsForYear = allPeriods.filter(period => period.year === parseInt(year));
      setAvailablePeriods(periodsForYear);
    } catch (err) {
      console.error('Error loading periods:', err);
      setAvailablePeriods([]);
    }
  };
  
  // Comprobar si el usuario tiene permisos
  useEffect(() => {
    if (!currentUser || (currentUser.user_type !== 'teacher' && currentUser.user_type !== 'admin')) {
      setError('No tienes permisos para gestionar clases');
      navigate('/');
    }
  }, [currentUser, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si se cambia el año, cargar períodos para ese año
    if (name === 'year') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        periods: [] // Limpiar períodos seleccionados cuando cambia el año
      }));
      loadPeriodsForYear(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePeriodsChange = (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      periods: typeof value === 'string' ? value.split(',') : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación de campos obligatorios
    if (!formData.code || !formData.name || !formData.subject || 
        !formData.course || !formData.group || !formData.year) {
      setError('Por favor, completa todos los campos obligatorios.');
      return;
    }

    if (formData.periods.length === 0) {
      setError('Debes seleccionar al menos un período para la clase.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Enviando datos:', formData); // Para depuración
      
      // Crear o actualizar la clase
      let savedClass;
      if (isEditing) {
        savedClass = await academicService.updateClass(id, formData);
        
        // Si estamos editando, necesitamos manejar los períodos por separado
        // Primero obtenemos la clase actual para ver qué períodos tiene
        const currentClass = await academicService.getClass(id);
        const currentPeriodIds = currentClass.periods || [];
        const newPeriodIds = formData.periods.map(p => parseInt(p));
        
        // Períodos a añadir (están en newPeriodIds pero no en currentPeriodIds)
        const periodsToAdd = newPeriodIds.filter(pid => !currentPeriodIds.includes(pid));
        
        // Períodos a remover (están en currentPeriodIds pero no en newPeriodIds)
        const periodsToRemove = currentPeriodIds.filter(pid => !newPeriodIds.includes(pid));
        
        // Añadir nuevos períodos
        if (periodsToAdd.length > 0) {
          await academicService.addPeriodsToClass(id, periodsToAdd);
        }
        
        // Remover períodos no seleccionados
        if (periodsToRemove.length > 0) {
          await academicService.removePeriodsFromClass(id, periodsToRemove);
        }
      } else {
        // Para nuevas clases, crear primero la clase
        savedClass = await academicService.createClass(formData);
        
        // Luego añadir los períodos seleccionados
        if (formData.periods.length > 0) {
          const periodIds = formData.periods.map(p => parseInt(p));
          await academicService.addPeriodsToClass(savedClass.id, periodIds);
        }
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/classes');
      }, 1500);
    } catch (err) {
      console.error('Error saving class:', err);
      setError(err.response?.data?.detail || 
               err.response?.data?.non_field_errors?.join(', ') || 
               'Error al guardar la clase. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear fechas correctamente
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T12:00:00'); // Añadir hora para evitar problemas de zona horaria
    return date.toLocaleDateString('es-ES');
  };

  // Función para formatear el nombre del período
  const formatPeriodName = (period) => {
    const typeName = period.period_type === 'bimester' ? 'Bimestre' : 'Trimestre';
    return `${typeName} ${period.number} (${period.year})`;
  };

  // Función para obtener el color del chip según el tipo de período
  const getPeriodColor = (periodType) => {
    return periodType === 'bimester' ? 'primary' : 'secondary';
  };
  
  if (loading && !formData.name && !subjects.length) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditing ? 'Editar Clase' : 'Nueva Clase'}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Clase {isEditing ? 'actualizada' : 'creada'} correctamente.
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="code"
                label="Código"
                value={formData.code}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="Nombre"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Descripción"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="subject-label">Materia</InputLabel>
                <Select
                  labelId="subject-label"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  label="Materia"
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <em style={{ color: '#666' }}>Selecciona una materia</em>;
                    }
                    const subject = subjects.find(s => s.id === selected);
                    return subject ? subject.name : '';
                  }}
                >
                  <MenuItem value="" disabled>
                    <em>Selecciona una materia</em>
                  </MenuItem>
                  {subjects.map(subject => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="course-label">Curso</InputLabel>
                <Select
                  labelId="course-label"
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  label="Curso"
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <em style={{ color: '#666' }}>Selecciona un curso</em>;
                    }
                    const course = courses.find(c => c.id === selected);
                    return course ? course.name : '';
                  }}
                >
                  <MenuItem value="" disabled>
                    <em>Selecciona un curso</em>
                  </MenuItem>
                  {courses.map(course => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="group-label">Grupo</InputLabel>
                <Select
                  labelId="group-label"
                  name="group"
                  value={formData.group}
                  onChange={handleChange}
                  label="Grupo"
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <em style={{ color: '#666' }}>Selecciona un grupo</em>;
                    }
                    const group = groups.find(g => g.id === selected);
                    return group ? group.name : '';
                  }}
                >
                  <MenuItem value="" disabled>
                    <em>Selecciona un grupo</em>
                  </MenuItem>
                  {groups.map(group => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="year"
                label="Año/Gestión"
                value={formData.year}
                onChange={handleChange}
                type="number"
                fullWidth
                required
                InputProps={{ inputProps: { min: 2000 } }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="periods-label">Períodos</InputLabel>
                <Select
                  labelId="periods-label"
                  multiple
                  value={formData.periods}
                  onChange={handlePeriodsChange}
                  input={<OutlinedInput id="select-multiple-periods" label="Períodos" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const period = availablePeriods.find(p => p.id === parseInt(value));
                        return period ? (
                          <Chip 
                            key={value} 
                            label={formatPeriodName(period)}
                            color={getPeriodColor(period.period_type)}
                            variant="outlined"
                            size="small"
                          />
                        ) : null;
                      })}
                    </Box>
                  )}
                  MenuProps={MenuProps}
                >
                  {availablePeriods.length > 0 ? (
                    availablePeriods.map((period) => (
                      <MenuItem key={period.id} value={period.id}>
                        <Checkbox checked={formData.periods.indexOf(period.id) > -1} />
                        <ListItemText 
                          primary={formatPeriodName(period)}
                          secondary={`${formatDate(period.start_date)} - ${formatDate(period.end_date)}`}
                        />
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>
                      <em>No hay períodos disponibles para el año {formData.year}</em>
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              {availablePeriods.length === 0 && formData.year && (
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  No hay períodos registrados para el año {formData.year}. 
                  <br />
                  Debes crear períodos primero en la gestión de períodos.
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  onClick={() => navigate('/classes')} 
                  sx={{ mr: 1 }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : (isEditing ? 'Guardar Cambios' : 'Crear Clase')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Container>
  );
};

export default ClassForm;