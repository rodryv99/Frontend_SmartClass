import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Card, 
  CardContent,
  Chip,
  Avatar,
  CardActions,
  Paper,
  Divider
} from '@mui/material';
import {
  School,
  Person,
  Assessment,
  TrendingUp,
  Class,
  Grade,
  EventAvailable,
  Analytics,
  AdminPanelSettings,
  Psychology,
  Compare
} from '@mui/icons-material';

const Home = () => {
  const features = [
    {
      icon: <Grade sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: "Gestión de Notas",
      description: "Sistema completo de calificaciones con componentes Ser, Saber, Hacer, Decidir y Autoevaluación. Seguimiento automático del progreso académico.",
      color: '#e3f2fd'
    },
    {
      icon: <EventAvailable sx={{ fontSize: 40, color: '#388e3c' }} />,
      title: "Control de Asistencia",
      description: "Registro diario de asistencia con calendario interactivo. Cálculo automático de porcentajes y estadísticas por periodo.",
      color: '#e8f5e8'
    },
    {
      icon: <Psychology sx={{ fontSize: 40, color: '#7b1fa2' }} />,
      title: "Predicciones con IA",
      description: "Machine Learning para predecir el rendimiento futuro basado en notas, asistencia y participación histórica.",
      color: '#f3e5f5'
    },
    {
      icon: <Compare sx={{ fontSize: 40, color: '#f57c00' }} />,
      title: "Análisis Comparativo",
      description: "Comparación entre predicciones y resultados reales para mejorar la precisión del sistema predictivo.",
      color: '#fff3e0'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40, color: '#d32f2f' }} />,
      title: "Seguimiento de Participación",
      description: "Registro y análisis de participación estudiantil con niveles Alta, Media y Baja. Cálculos automáticos de promedios.",
      color: '#ffebee'
    },
    {
      icon: <Analytics sx={{ fontSize: 40, color: '#455a64' }} />,
      title: "Reportes y Dashboard",
      description: "Visualizaciones interactivas del rendimiento académico y herramientas de análisis para la toma de decisiones.",
      color: '#eceff1'
    }
  ];

  const userRoles = [
    {
      role: "Estudiantes",
      icon: <Person sx={{ fontSize: 60, color: '#1976d2' }} />,
      description: "Accede a tus notas, asistencia y participación en tiempo real. Visualiza predicciones de tu rendimiento académico basadas en inteligencia artificial.",
      features: ["Ver notas personales", "Consultar asistencia", "Seguimiento de participación", "Predicciones de rendimiento"],
      access: "Solo registro disponible"
    },
    {
      role: "Profesores",
      icon: <School sx={{ fontSize: 60, color: '#388e3c' }} />,
      description: "Gestiona cursos completos, calificaciones detalladas y control de asistencia. Utiliza herramientas de machine learning para analizar el progreso estudiantil.",
      features: ["Gestionar clases", "Registrar notas (Ser, Saber, Hacer, Decidir)", "Control de asistencia diario", "Análisis predictivo", "Reportes detallados"],
      access: "Gestionado por administrador"
    },
    {
      role: "Administradores",
      icon: <AdminPanelSettings sx={{ fontSize: 60, color: '#d32f2f' }} />,
      description: "Control total del sistema educativo: configuración de periodos académicos, gestión de usuarios, materias, cursos y acceso a reportes completos.",
      features: ["Gestión de usuarios", "Configurar periodos (trimestral/bimestral)", "Administrar materias y cursos", "Bitácora del sistema", "Reportes ejecutivos"],
      access: "Acceso por consola"
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="36" cy="24" r="12"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Box 
            sx={{ 
              textAlign: 'center',
              mb: 6
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: 'rgba(255,255,255,0.2)' }}>
                <Class sx={{ fontSize: 40 }} />
              </Avatar>
            </Box>
            
            <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
              Smart Class
            </Typography>
            <Typography variant="h5" component="h2" gutterBottom sx={{ opacity: 0.9, maxWidth: '600px', mx: 'auto' }}>
              Plataforma Integral de Gestión Educativa con Inteligencia Artificial
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: '700px', mx: 'auto', mb: 4 }}>
              Sistema completo para la gestión académica con predicciones de rendimiento, 
              control de asistencia avanzado y análisis de datos educativos en tiempo real.
            </Typography>
            
            <Box sx={{ mt: 4 }}>
              <Button 
                variant="contained" 
                color="primary" 
                size="large" 
                component={Link} 
                to="/register"
                sx={{ 
                  mr: 2, 
                  py: 1.5, 
                  px: 4,
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'grey.100'
                  }
                }}
              >
                Registrarse como Estudiante
              </Button>
              <Button 
                variant="outlined" 
                size="large" 
                component={Link} 
                to="/login"
                sx={{ 
                  py: 1.5, 
                  px: 4,
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Iniciar Sesión
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* User Roles Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom fontWeight="bold" color="text.primary">
          Roles del Sistema
        </Typography>
        <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 6, maxWidth: '600px', mx: 'auto' }}>
          Smart Class está diseñado para satisfacer las necesidades específicas de cada usuario en el entorno educativo
        </Typography>
        
        <Grid container spacing={4}>
          {userRoles.map((user, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', pb: 2 }}>
                  <Box sx={{ mb: 2 }}>
                    {user.icon}
                  </Box>
                  <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
                    {user.role}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {user.description}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Funcionalidades:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                    {user.features.map((feature, idx) => (
                      <Chip
                        key={idx}
                        label={feature}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Chip 
                    label={user.access} 
                    color={index === 0 ? "primary" : index === 1 ? "success" : "error"}
                    variant="filled"
                  />
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" textAlign="center" gutterBottom fontWeight="bold" color="text.primary">
            Características Principales
          </Typography>
          <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 6, maxWidth: '600px', mx: 'auto' }}>
            Tecnología avanzada aplicada a la educación para un seguimiento integral del proceso de aprendizaje
          </Typography>
          
          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    backgroundColor: feature.color,
                    border: '1px solid',
                    borderColor: 'grey.200',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {feature.icon}
                    <Typography variant="h6" component="h3" fontWeight="bold" sx={{ ml: 2 }}>
                      {feature.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* System Info Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" component="h2" gutterBottom fontWeight="bold" color="text.primary">
            Sistema de Evaluación Integral
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '700px', mx: 'auto' }}>
            Smart Class implementa el modelo educativo boliviano con componentes específicos de evaluación y períodos académicos flexibles
          </Typography>
          
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, height: '100%' }}>
                <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
                  Componentes de Evaluación
                </Typography>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" gutterBottom>• <strong>Ser:</strong> 0-5 puntos (Valores y actitudes)</Typography>
                  <Typography variant="body2" gutterBottom>• <strong>Saber:</strong> 0-45 puntos (Conocimientos teóricos)</Typography>
                  <Typography variant="body2" gutterBottom>• <strong>Hacer:</strong> 0-40 puntos (Habilidades prácticas)</Typography>
                  <Typography variant="body2" gutterBottom>• <strong>Decidir:</strong> 0-5 puntos (Toma de decisiones)</Typography>
                  <Typography variant="body2" gutterBottom>• <strong>Autoevaluación:</strong> 0-5 puntos</Typography>
                  <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
                    <strong>Total:</strong> 100 puntos (Aprobación: ≥51 puntos)
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, height: '100%' }}>
                <Typography variant="h6" gutterBottom color="secondary" fontWeight="bold">
                  Períodos Académicos
                </Typography>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Sistema Trimestral:</strong> 3 períodos por gestión
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Sistema Bimestral:</strong> 4 períodos por gestión
                  </Typography>
                  <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
                    <strong>Seguimiento automático de:</strong>
                  </Typography>
                  <Typography variant="body2" gutterBottom>• Porcentajes de asistencia por período</Typography>
                  <Typography variant="body2" gutterBottom>• Promedios de participación</Typography>
                  <Typography variant="body2" gutterBottom>• Notas finales por período y gestión</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* Footer CTA */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 6 }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              ¿Listo para transformar la gestión educativa?
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
              Únete a Smart Class y experimenta el futuro de la educación con inteligencia artificial
            </Typography>
            <Button 
              variant="contained" 
              size="large" 
              component={Link} 
              to="/register"
              sx={{ 
                bgcolor: 'white', 
                color: 'primary.main',
                px: 4,
                py: 1.5,
                '&:hover': {
                  bgcolor: 'grey.100'
                }
              }}
            >
              Comenzar Ahora
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;