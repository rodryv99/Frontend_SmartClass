import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, Typography, Box, Button, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Edit, Delete, Add, People } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { academicService } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const ClassList = () => {
  const { currentUser } = useContext(AuthContext);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const data = await academicService.getAllClasses();
        console.log("Clases cargadas:", data); // Log para depuración
        console.log("Clases cargadas (detalle):", JSON.stringify(data, null, 2));
        setClasses(data);
        setError(null);
      } catch (err) {
        setError('Error al cargar las clases. Por favor, intenta de nuevo.');
        console.error('Error fetching classes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const handleDelete = async (id) => {
    try {
      await academicService.deleteClass(id);
      setClasses(classes.filter(c => c.id !== id));
      setConfirmDelete(null);
    } catch (err) {
      setError('Error al eliminar la clase. Por favor, intenta de nuevo.');
      console.error('Error deleting class:', err);
    }
  };

  // Solo los profesores y admin pueden crear clases
  const canCreateClass = currentUser && 
    (currentUser.user_type === 'teacher' || currentUser.user_type === 'admin');
  
  // Función para verificar si el usuario puede editar/eliminar una clase
  const canEditClass = (classItem) => {
    if (!currentUser) return false;
    
    // El administrador siempre puede editar
    if (currentUser.user_type === 'admin') {
      return true;
    }
    
    // El profesor solo puede editar sus propias clases
    if (currentUser.user_type === 'teacher') {
      const hasPermission = classItem.teacher === currentUser.teacher_profile?.id;
      return hasPermission;
    }
    
    return false;
  };

  // Función auxiliar para obtener el nombre del profesor basado en los datos disponibles
  const getTeacherName = (classItem) => {
    console.log("Teacher detail para clase:", classItem.name, classItem.teacher_detail);
    
    // Si existe teacher_detail completo
    if (classItem.teacher_detail && 
        typeof classItem.teacher_detail === 'object' && 
        classItem.teacher_detail.first_name && 
        classItem.teacher_detail.last_name) {
      return `${classItem.teacher_detail.first_name} ${classItem.teacher_detail.last_name}`;
    }
    
    // Si solo tenemos el ID del profesor y es un valor válido
    if (classItem.teacher && classItem.teacher !== null && classItem.teacher !== undefined) {
      // Aquí podríamos buscar en currentUser, pero simplemente indicamos que hay un profesor
      return `Profesor ID: ${classItem.teacher}`;
    }
    
    // Si no hay información disponible
    return 'No asignado';
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gestionar Clases
        </Typography>
        
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        {canCreateClass && (
          <Box sx={{ mb: 3 }}>
            <Button 
              component={Link} 
              to="/classes/new" 
              variant="contained" 
              color="primary" 
              startIcon={<Add />}
            >
              Nueva Clase
            </Button>
          </Box>
        )}

        {loading ? (
          <Typography>Cargando clases...</Typography>
        ) : classes.length === 0 ? (
          <Typography>No hay clases disponibles.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Materia</TableCell>
                  <TableCell>Curso</TableCell>
                  <TableCell>Grupo</TableCell>
                  <TableCell>Año</TableCell>
                  <TableCell>Profesor</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classes.map((classItem) => (
                  <TableRow key={classItem.id}>
                    <TableCell>{classItem.code}</TableCell>
                    <TableCell>{classItem.name}</TableCell>
                    <TableCell>{classItem.subject_detail?.name}</TableCell>
                    <TableCell>{classItem.course_detail?.name}</TableCell>
                    <TableCell>{classItem.group_detail?.name}</TableCell>
                    <TableCell>{classItem.year}</TableCell>
                    <TableCell>
                      {getTeacherName(classItem)}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        color="primary" 
                        onClick={() => navigate(`/classes/${classItem.id}`)}
                        title="Ver detalles y participantes"
                      >
                        <People />
                      </IconButton>
                      
                      {canEditClass(classItem) && (
                        <>
                          <IconButton 
                            color="primary" 
                            component={Link} 
                            to={`/classes/edit/${classItem.id}`}
                            title="Editar clase"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            onClick={() => setConfirmDelete(classItem)}
                            title="Eliminar clase"
                          >
                            <Delete />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          ¿Estás seguro de que deseas eliminar la clase "{confirmDelete?.name}"?
          Esta acción no se puede deshacer.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button 
            onClick={() => handleDelete(confirmDelete?.id)} 
            color="error" 
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ClassList;