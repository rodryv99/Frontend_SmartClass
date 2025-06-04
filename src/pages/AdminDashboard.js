import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Snackbar,
  Alert,
  TablePagination,
  TableSortLabel,
  Chip,
  IconButton,
  Tooltip,
  ButtonGroup,
  LinearProgress,
  InputAdornment
} from '@mui/material';
import {
  Search,
  FilterList,
  Download,
  Refresh,
  Edit,
  Delete,
  PersonAdd,
  TableChart,
  PictureAsPdf,
  Description,
  Clear
} from '@mui/icons-material';

// Importar los componentes de gestión
import PeriodManagement from '../components/admin/PeriodManagement';
import SubjectManagement from '../components/admin/SubjectManagement';
import CourseManagement from '../components/admin/CourseManagement';
import GroupManagement from '../components/admin/GroupManagement';
import AuditLogManagement from '../components/AuditLogManagement';

// Panel de contenido para cada pestaña
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openTeacherModal, setOpenTeacherModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    user: {
      username: '',
      email: '',
      password: '',
    },
    teacher_code: '',
    ci: '',
    first_name: '',
    last_name: '',
    phone: '',
    birth_date: '',
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const [openAlert, setOpenAlert] = useState(false);

  // Estados para filtros y ordenamiento
  const [orderBy, setOrderBy] = useState('id');
  const [order, setOrder] = useState('asc');
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    search: '',
    userType: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [users, filters, order, orderBy]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Obtener usuarios con sus perfiles incluidos
      const usersData = await userService.getAllUsers();
      console.log("Datos de usuarios recibidos:", usersData);
      setUsers(usersData);
      
      setError(null);
    } catch (err) {
      setError('Error al cargar los usuarios');
      console.error("Error en fetchUsers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros y ordenamiento
  const applyFiltersAndSort = () => {
    let filtered = [...users];

    // Aplicar filtro de búsqueda
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        getUserName(user).toLowerCase().includes(searchTerm) ||
        getUserLastName(user).toLowerCase().includes(searchTerm) ||
        user.id.toString().includes(searchTerm)
      );
    }

    // Aplicar filtro de tipo de usuario
    if (filters.userType) {
      filtered = filtered.filter(user => user.user_type === filters.userType);
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (orderBy) {
        case 'id':
          aVal = a.id;
          bVal = b.id;
          break;
        case 'username':
          aVal = a.username.toLowerCase();
          bVal = b.username.toLowerCase();
          break;
        case 'firstName':
          aVal = getUserName(a).toLowerCase();
          bVal = getUserName(b).toLowerCase();
          break;
        case 'lastName':
          aVal = getUserLastName(a).toLowerCase();
          bVal = getUserLastName(b).toLowerCase();
          break;
        case 'email':
          aVal = a.email.toLowerCase();
          bVal = b.email.toLowerCase();
          break;
        case 'userType':
          aVal = a.user_type.toLowerCase();
          bVal = b.user_type.toLowerCase();
          break;
        default:
          aVal = a.id;
          bVal = b.id;
      }

      if (order === 'desc') {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });

    setFilteredUsers(filtered);
  };

  // Función auxiliar para obtener el nombre de un usuario
  const getUserName = (user) => {
    if (user.teacher_profile) {
      return user.teacher_profile.first_name || '';
    } else if (user.student_profile) {
      return user.student_profile.first_name || '';
    }
    return '';
  };

  // Función auxiliar para obtener el apellido de un usuario
  const getUserLastName = (user) => {
    if (user.teacher_profile) {
      return user.teacher_profile.last_name || '';
    } else if (user.student_profile) {
      return user.student_profile.last_name || '';
    }
    return '';
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      userType: '',
    });
  };

  const handleOpenTeacherModal = () => {
    setOpenTeacherModal(true);
  };

  const handleCloseTeacherModal = () => {
    setOpenTeacherModal(false);
  };

  const handleOpenEditModal = (user) => {
    setCurrentUser(user);
    setOpenEditModal(true);
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setCurrentUser(null);
  };

  const handleTeacherInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setNewTeacher({
        ...newTeacher,
        [parent]: {
          ...newTeacher[parent],
          [child]: value,
        },
      });
    } else {
      setNewTeacher({
        ...newTeacher,
        [name]: value,
      });
    }
  };
  
  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentUser({
      ...currentUser,
      [name]: value,
    });
  };

  const handleCreateTeacher = async () => {
    try {
      await userService.createTeacher(newTeacher);
      
      // Recargar la lista de usuarios
      fetchUsers();
      handleCloseTeacherModal();
      // Mostrar alerta de éxito
      setAlertMessage('Profesor creado correctamente');
      setAlertSeverity('success');
      setOpenAlert(true);
      // Resetear el formulario
      setNewTeacher({
        user: {
          username: '',
          email: '',
          password: '',
        },
        teacher_code: '',
        ci: '',
        first_name: '',
        last_name: '',
        phone: '',
        birth_date: '',
      });
    } catch (err) {
      setAlertMessage('Error al crear el profesor');
      setAlertSeverity('error');
      setOpenAlert(true);
      console.error(err);
    }
  };

  const handleUpdateUser = async () => {
    try {
      await userService.updateUser(currentUser.id, currentUser);
      fetchUsers();
      handleCloseEditModal();
      setAlertMessage('Usuario actualizado correctamente');
      setAlertSeverity('success');
      setOpenAlert(true);
    } catch (err) {
      setAlertMessage('Error al actualizar el usuario');
      setAlertSeverity('error');
      setOpenAlert(true);
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      try {
        await userService.deleteUser(userId);
        fetchUsers();
        setAlertMessage('Usuario eliminado correctamente');
        setAlertSeverity('success');
        setOpenAlert(true);
      } catch (err) {
        setAlertMessage('Error al eliminar el usuario');
        setAlertSeverity('error');
        setOpenAlert(true);
        console.error(err);
      }
    }
  };

  const handleCloseAlert = () => {
    setOpenAlert(false);
  };

  const handleNavigateToClasses = () => {
    navigate('/classes');
  };

  // Funciones de exportación
  const getExportData = () => {
    return filteredUsers.map(user => ({
      id: user.id,
      username: user.username,
      firstName: getUserName(user),
      lastName: getUserLastName(user),
      email: user.email,
      userType: user.user_type,
      createdAt: user.date_joined ? new Date(user.date_joined).toLocaleDateString('es-ES') : '',
      lastLogin: user.last_login ? new Date(user.last_login).toLocaleDateString('es-ES') : 'Nunca'
    }));
  };

  // Exportar como Excel
  const handleExportExcel = async () => {
    try {
      setLoading(true);
      
      const data = getExportData();
      
      // Importar SheetJS
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');
      
      // Preparar datos para Excel
      const worksheetData = [
        ['ID', 'Usuario', 'Nombre', 'Apellido', 'Email', 'Tipo', 'Fecha Registro', 'Último Acceso'],
        ...data.map(user => [
          user.id,
          user.username,
          user.firstName,
          user.lastName,
          user.email,
          user.userType,
          user.createdAt,
          user.lastLogin
        ])
      ];

      // Crear worksheet y workbook
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');

      // Aplicar estilos básicos
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let C = range.s.c; C <= range.e.c; C++) {
        const address = XLSX.utils.encode_col(C) + "1";
        if (!worksheet[address]) continue;
        worksheet[address].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "EEEEEE" } }
        };
      }

      // Descargar archivo
      XLSX.writeFile(workbook, `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`);
      
    } catch (err) {
      console.error('Error exporting Excel:', err);
      setError('Error al exportar como Excel');
    } finally {
      setLoading(false);
    }
  };

  // Exportar como CSV
  const handleExportCSV = () => {
    try {
      const data = getExportData();
      
      const headers = [
        'ID', 'Usuario', 'Nombre', 'Apellido', 'Email', 'Tipo', 'Fecha Registro', 'Último Acceso'
      ];
      
      const rows = data.map(user => [
        user.id,
        user.username,
        user.firstName,
        user.lastName,
        user.email,
        user.userType,
        user.createdAt,
        user.lastLogin
      ]);
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Error al exportar como CSV');
    }
  };

  // Exportar como PDF
  const handleExportPDF = async () => {
    try {
      setLoading(true);
      
      const data = getExportData();
      
      // Importar jsPDF
      const { jsPDF } = await import('jspdf');
      
      // Importar autoTable si está disponible
      let autoTable;
      try {
        autoTable = await import('jspdf-autotable');
      } catch (e) {
        console.log('autoTable no disponible, usando fallback');
      }
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Título
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('LISTA DE USUARIOS', 148, 20, { align: 'center' });
      
      // Información
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 35);
      doc.text(`Total: ${data.length} usuarios`, 20, 42);
      
      if (autoTable && autoTable.default) {
        // Usar autoTable si está disponible
        const tableData = data.map(user => [
          user.id,
          user.username,
          user.firstName,
          user.lastName,
          user.email.length > 25 ? user.email.substring(0, 25) + '...' : user.email,
          user.userType
        ]);
        
        autoTable.default(doc, {
          head: [['ID', 'Usuario', 'Nombre', 'Apellido', 'Email', 'Tipo']],
          body: tableData,
          startY: 50,
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 35 },
            2: { cellWidth: 35 },
            3: { cellWidth: 35 },
            4: { cellWidth: 60 },
            5: { cellWidth: 25 },
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { top: 50, right: 20, bottom: 20, left: 20 },
        });
      } else {
        // Fallback sin autoTable
        let y = 50;
        doc.setFontSize(8);
        
        // Encabezados
        doc.setFont(undefined, 'bold');
        doc.text('ID', 20, y);
        doc.text('USUARIO', 35, y);
        doc.text('NOMBRE', 70, y);
        doc.text('APELLIDO', 105, y);
        doc.text('EMAIL', 140, y);
        doc.text('TIPO', 200, y);
        
        y += 8;
        doc.setFont(undefined, 'normal');
        
        // Datos
        data.slice(0, 40).forEach((user) => {
          doc.text(user.id.toString(), 20, y);
          doc.text(user.username.substring(0, 15), 35, y);
          doc.text(user.firstName.substring(0, 15), 70, y);
          doc.text(user.lastName.substring(0, 15), 105, y);
          doc.text(user.email.substring(0, 25), 140, y);
          doc.text(user.userType, 200, y);
          
          y += 6;
          
          if (y > 190) {
            doc.addPage();
            y = 20;
          }
        });
      }
      
      // Descargar el PDF
      doc.save(`usuarios_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (err) {
      console.error('Error al generar PDF:', err);
      setError('Error al generar PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Obtener el color del chip según el tipo de usuario
  const getUserTypeColor = (userType) => {
    switch (userType) {
      case 'admin':
        return 'error';
      case 'teacher':
        return 'primary';
      case 'student':
        return 'success';
      default:
        return 'default';
    }
  };

  // Obtener usuarios sin paginación
  const displayedUsers = filteredUsers;

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Panel de Administrador
        </Typography>

        <Paper sx={{ width: '100%', mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Gestionar Usuarios" />
            <Tab label="Gestionar Periodos" />
            <Tab label="Gestionar Materias" />
            <Tab label="Gestionar Cursos" />
            <Tab label="Gestionar Grupos" />
            <Tab label="Gestionar Clases" />
            <Tab label="Bitácora" />
          </Tabs>

          {/* Panel de Gestionar Usuarios - MEJORADO */}
          <TabPanel value={tabValue} index={0}>
            {/* Filtros y controles */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Filtros y Búsqueda
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Buscar usuarios"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                      endAdornment: filters.search && (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => handleFilterChange('search', '')}
                          >
                            <Clear />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    placeholder="ID, usuario, nombre, apellido, email..."
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo de Usuario</InputLabel>
                    <Select
                      value={filters.userType}
                      onChange={(e) => handleFilterChange('userType', e.target.value)}
                      label="Tipo de Usuario"
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="admin">Administradores</MenuItem>
                      <MenuItem value="teacher">Profesores</MenuItem>
                      <MenuItem value="student">Estudiantes</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    startIcon={<FilterList />}
                    fullWidth
                  >
                    Limpiar
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    onClick={fetchUsers}
                    startIcon={<Refresh />}
                    disabled={loading}
                    fullWidth
                  >
                    Actualizar
                  </Button>
                </Grid>
              </Grid>
              
              {/* Botones de acción */}
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleOpenTeacherModal}
                  startIcon={<PersonAdd />}
                >
                  Agregar Profesor
                </Button>
                
                <ButtonGroup variant="outlined" disabled={loading}>
                  <Button
                    onClick={handleExportExcel}
                    startIcon={<TableChart />}
                    title="Exportar como Excel"
                  >
                    Excel
                  </Button>
                  <Button
                    onClick={handleExportCSV}
                    startIcon={<Description />}
                    title="Exportar como CSV"
                  >
                    CSV
                  </Button>
                  <Button
                    onClick={handleExportPDF}
                    startIcon={<PictureAsPdf />}
                    title="Exportar como PDF"
                  >
                    PDF
                  </Button>
                </ButtonGroup>
              </Box>
            </Paper>

            {/* Estadísticas rápidas */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">{filteredUsers.length}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Filtrado
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">
                    {filteredUsers.filter(u => u.user_type === 'admin').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Administradores
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">
                    {filteredUsers.filter(u => u.user_type === 'teacher').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Profesores
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">
                    {filteredUsers.filter(u => u.user_type === 'student').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Estudiantes
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            
            {loading && <LinearProgress sx={{ mb: 2 }} />}
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Tabla de usuarios con ordenamiento */}
            <Paper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'id'}
                          direction={orderBy === 'id' ? order : 'asc'}
                          onClick={() => handleRequestSort('id')}
                        >
                          ID
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'username'}
                          direction={orderBy === 'username' ? order : 'asc'}
                          onClick={() => handleRequestSort('username')}
                        >
                          Usuario
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'firstName'}
                          direction={orderBy === 'firstName' ? order : 'asc'}
                          onClick={() => handleRequestSort('firstName')}
                        >
                          Nombre
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'lastName'}
                          direction={orderBy === 'lastName' ? order : 'asc'}
                          onClick={() => handleRequestSort('lastName')}
                        >
                          Apellido
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'email'}
                          direction={orderBy === 'email' ? order : 'asc'}
                          onClick={() => handleRequestSort('email')}
                        >
                          Email
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'userType'}
                          direction={orderBy === 'userType' ? order : 'asc'}
                          onClick={() => handleRequestSort('userType')}
                        >
                          Tipo
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          {loading ? 'Cargando usuarios...' : 'No se encontraron usuarios'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedUsers.map((user) => (
                        <TableRow key={user.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {user.id}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {user.username}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {getUserName(user) || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {getUserLastName(user) || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                maxWidth: 200, 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {user.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.user_type}
                              color={getUserTypeColor(user.user_type)}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Editar usuario">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleOpenEditModal(user)}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar usuario">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </TabPanel>

          {/* Panel de Gestionar Periodos */}
          <TabPanel value={tabValue} index={1}>
            <PeriodManagement />
          </TabPanel>

          {/* Panel de Gestionar Materias */}
          <TabPanel value={tabValue} index={2}>
            <SubjectManagement />
          </TabPanel>
          
          {/* Panel de Gestionar Cursos */}
          <TabPanel value={tabValue} index={3}>
            <CourseManagement />
          </TabPanel>
          
          {/* Panel de Gestionar Grupos */}
          <TabPanel value={tabValue} index={4}>
            <GroupManagement />
          </TabPanel>
          
          {/* Panel de Gestionar Clases */}
          <TabPanel value={tabValue} index={5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Gestión de Clases
              </Typography>
              <Typography paragraph>
                Desde aquí puede acceder a la administración de clases donde podrá ver, crear, editar y eliminar clases, así como gestionar los alumnos asignados a cada clase.
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleNavigateToClasses}
                sx={{ mt: 2 }}
              >
                Ir a Gestión de Clases
              </Button>
            </Box>
          </TabPanel>
          
          {/* Panel de Bitácora */}
          <TabPanel value={tabValue} index={6}>
            <AuditLogManagement />
          </TabPanel>
        </Paper>
      </Box>

      {/* Modal para crear profesor */}
      <Dialog open={openTeacherModal} onClose={handleCloseTeacherModal} maxWidth="md" fullWidth>
        <DialogTitle>Crear Nuevo Profesor</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Datos de usuario
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Usuario"
                  name="user.username"
                  value={newTeacher.user.username}
                  onChange={handleTeacherInputChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Email"
                  name="user.email"
                  value={newTeacher.user.email}
                  onChange={handleTeacherInputChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Contraseña"
                  name="user.password"
                  type="password"
                  value={newTeacher.user.password}
                  onChange={handleTeacherInputChange}
                  margin="normal"
                />
              </Grid>
            </Grid>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Datos del profesor
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Código de profesor"
                  name="teacher_code"
                  value={newTeacher.teacher_code}
                  onChange={handleTeacherInputChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="CI"
                  name="ci"
                  value={newTeacher.ci}
                  onChange={handleTeacherInputChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre"
                  name="first_name"
                  value={newTeacher.first_name}
                  onChange={handleTeacherInputChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Apellido"
                  name="last_name"
                  value={newTeacher.last_name}
                  onChange={handleTeacherInputChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  name="phone"
                  value={newTeacher.phone}
                  onChange={handleTeacherInputChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fecha de nacimiento"
                  name="birth_date"
                  type="date"
                  value={newTeacher.birth_date}
                  onChange={handleTeacherInputChange}
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTeacherModal}>Cancelar</Button>
          <Button onClick={handleCreateTeacher} variant="contained" color="primary">
            Crear Profesor
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para editar usuario */}
      <Dialog open={openEditModal} onClose={handleCloseEditModal} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Usuario</DialogTitle>
        <DialogContent>
          {currentUser && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Usuario"
                name="username"
                value={currentUser.username}
                onChange={handleUserInputChange}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={currentUser.email}
                onChange={handleUserInputChange}
                margin="normal"
              />
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Tipo de usuario</InputLabel>
                <Select
                  name="user_type"
                  value={currentUser.user_type}
                  onChange={handleUserInputChange}
                  label="Tipo de usuario"
                >
                  <MenuItem value="admin">Administrador</MenuItem>
                  <MenuItem value="teacher">Profesor</MenuItem>
                  <MenuItem value="student">Alumno</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal}>Cancelar</Button>
          <Button onClick={handleUpdateUser} variant="contained" color="primary">
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alerta */}
      <Snackbar open={openAlert} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity={alertSeverity} sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDashboard;