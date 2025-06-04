import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  IconButton,
  useScrollTrigger,
  Slide,
  Divider,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Class,
  Dashboard,
  Person,
  ExitToApp,
  School,
  AdminPanelSettings,
  AccountCircle,
  Settings,
  Notifications,
  Menu as MenuIcon
} from '@mui/icons-material';

// Componente para hacer el navbar transparente al hacer scroll
function HideOnScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

const Navbar = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  // Función para redirigir al dashboard según el tipo de usuario
  const navigateToDashboard = () => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    switch (currentUser.user_type) {
      case 'admin':
        navigate('/admin');
        break;
      case 'teacher':
        navigate('/teacher');
        break;
      case 'student':
        navigate('/student');
        break;
      default:
        navigate('/');
        break;
    }
  };

  // Función para obtener el color del chip según el tipo de usuario
  const getUserTypeChip = (userType) => {
    const configs = {
      admin: { 
        label: 'Administrador', 
        color: 'error', 
        icon: <AdminPanelSettings sx={{ fontSize: 16 }} /> 
      },
      teacher: { 
        label: 'Profesor', 
        color: 'success', 
        icon: <School sx={{ fontSize: 16 }} /> 
      },
      student: { 
        label: 'Estudiante', 
        color: 'primary', 
        icon: <Person sx={{ fontSize: 16 }} /> 
      }
    };

    const config = configs[userType] || { label: userType, color: 'default', icon: null };
    
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
        sx={{ 
          bgcolor: 'rgba(255,255,255,0.1)', 
          color: 'white',
          border: '1px solid rgba(255,255,255,0.3)',
          '& .MuiChip-icon': {
            color: 'white'
          }
        }}
      />
    );
  };

  // Función para obtener el avatar del usuario
  const getUserAvatar = (userType) => {
    const avatarConfigs = {
      admin: { bgcolor: '#d32f2f', icon: <AdminPanelSettings /> },
      teacher: { bgcolor: '#388e3c', icon: <School /> },
      student: { bgcolor: '#1976d2', icon: <Person /> }
    };

    const config = avatarConfigs[userType] || { bgcolor: '#757575', icon: <AccountCircle /> };
    
    return (
      <Avatar sx={{ width: 32, height: 32, bgcolor: config.bgcolor }}>
        {config.icon}
      </Avatar>
    );
  };

  // Determinar si estamos en la página home
  const isHomePage = location.pathname === '/';

  return (
    <HideOnScroll>
      <AppBar 
        position="fixed" 
        sx={{ 
          background: isHomePage 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}
      >
        <Toolbar sx={{ minHeight: '70px !important' }}>
          {/* Logo y título */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              flexGrow: 1, 
              cursor: 'pointer',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.02)'
              }
            }}
            onClick={navigateToDashboard}
          >
            <Avatar 
              sx={{ 
                width: 40, 
                height: 40, 
                bgcolor: 'rgba(255,255,255,0.2)',
                mr: 2,
                border: '2px solid rgba(255,255,255,0.3)'
              }}
            >
              <Class sx={{ fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography 
                variant="h5" 
                component="div" 
                sx={{ 
                  fontWeight: 'bold',
                  letterSpacing: '-0.5px',
                  lineHeight: 1
                }}
              >
                Smart Class
              </Typography>
              <Typography 
                variant="caption" 
                component="div" 
                sx={{ 
                  opacity: 0.8,
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px'
                }}
              >
                Gestión Educativa Inteligente
              </Typography>
            </Box>
          </Box>
          
          {/* Menú de usuario o botones de autenticación */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {currentUser ? (
              <>
                {/* Información del usuario */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
                  {getUserTypeChip(currentUser.user_type)}
                  
                  {/* Botón de notificaciones */}
                  <Tooltip title="Notificaciones">
                    <IconButton 
                      color="inherit" 
                      onClick={handleNotificationOpen}
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.2)'
                        }
                      }}
                    >
                      <Badge badgeContent={3} color="error">
                        <Notifications />
                      </Badge>
                    </IconButton>
                  </Tooltip>

                  {/* Dashboard button */}
                  <Tooltip title="Ir al Dashboard">
                    <Button
                      color="inherit"
                      startIcon={<Dashboard />}
                      onClick={navigateToDashboard}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.2)'
                        }
                      }}
                    >
                      Dashboard
                    </Button>
                  </Tooltip>
                </Box>

                {/* Avatar del usuario y menú */}
                <Tooltip title={`${currentUser.username} - ${currentUser.user_type}`}>
                  <IconButton
                    onClick={handleMenuOpen}
                    sx={{ 
                      p: 0,
                      border: '2px solid rgba(255,255,255,0.3)',
                      '&:hover': {
                        border: '2px solid rgba(255,255,255,0.5)'
                      }
                    }}
                  >
                    {getUserAvatar(currentUser.user_type)}
                  </IconButton>
                </Tooltip>

                {/* Menú desplegable del usuario */}
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      minWidth: 200,
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      border: '1px solid rgba(0,0,0,0.1)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                    }
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  {/* Header del menú */}
                  <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {currentUser.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {currentUser.email || `${currentUser.user_type}@smartclass.edu`}
                    </Typography>
                  </Box>
                  
                  <Divider />
                  
                  {/* Opciones del menú */}
                  <MenuItem onClick={navigateToDashboard} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                      <Dashboard fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Dashboard</ListItemText>
                  </MenuItem>
                  
                  <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                      <Person fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Mi Perfil</ListItemText>
                  </MenuItem>
                  
                  <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                      <Settings fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Configuración</ListItemText>
                  </MenuItem>
                  
                  <Divider />
                  
                  <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
                    <ListItemIcon>
                      <ExitToApp fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>Cerrar Sesión</ListItemText>
                  </MenuItem>
                </Menu>

                {/* Menú de notificaciones */}
                <Menu
                  anchorEl={notificationAnchor}
                  open={Boolean(notificationAnchor)}
                  onClose={handleNotificationClose}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      minWidth: 300,
                      maxHeight: 400
                    }
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Notificaciones
                    </Typography>
                  </Box>
                  <Divider />
                  <MenuItem>
                    <Typography variant="body2">
                      Nueva predicción de notas disponible
                    </Typography>
                  </MenuItem>
                  <MenuItem>
                    <Typography variant="body2">
                      Recordatorio: Registrar asistencia del día
                    </Typography>
                  </MenuItem>
                  <MenuItem>
                    <Typography variant="body2">
                      Informe semanal listo para revisión
                    </Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              /* Botones para usuarios no autenticados */
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/login"
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(255,255,255,0.5)',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Iniciar Sesión
                </Button>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/register"
                  variant="contained"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)'
                    }
                  }}
                >
                  Registro
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </HideOnScroll>
  );
};

export default Navbar;