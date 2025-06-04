import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Card, 
  CardContent 
} from '@mui/material';
const Home = () => {
  return (
    <Container maxWidth="lg">
      <Box 
        sx={{ 
          mt: 8, 
          mb: 4, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom>
          Bienvenido a Smart Class
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
          Tu plataforma integral para la gestión educativa
        </Typography>
        
        <Box sx={{ mt: 4, mb: 6 }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            component={Link} 
            to="/register"
            sx={{ mr: 2 }}
          >
            Registrarse
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            size="large" 
            component={Link} 
            to="/login"
          >
            Iniciar Sesión
          </Button>
        </Box>
      </Box>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Estudiantes
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Accede a tus notas, asistencia y participación en tiempo real. Visualiza predicciones de rendimiento basadas en datos históricos.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Profesores
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Gestiona cursos, calificaciones y asistencia. Analiza el rendimiento de tus estudiantes y obtén predicciones basadas en machine learning.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Administradores
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Configura periodos académicos, gestiona usuarios, materias, cursos y grupos. Accede a reportes completos del sistema.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;