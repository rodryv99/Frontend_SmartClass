import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  Paper,
  Avatar,
  InputAdornment,
  IconButton,
  Divider,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  PersonAdd,
  Person,
  Email,
  Lock,
  Badge,
  Phone,
  CalendarToday,
  FamilyRestroom,
  Visibility,
  VisibilityOff,
  ArrowBack,
  School,
  CheckCircle
} from '@mui/icons-material';

const Register = () => {
  const { register, error } = useContext(AuthContext);
  const navigate = useNavigate();
  const [registerError, setRegisterError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Datos de Usuario', 'Información Personal', 'Datos del Tutor'];

  const initialValues = {
    user: {
      username: '',
      email: '',
      password: '',
    },
    ci: '',
    first_name: '',
    last_name: '',
    phone: '',
    birth_date: '',
    tutor_name: '',
    tutor_phone: '',
  };

  const validationSchema = Yup.object({
    user: Yup.object({
      username: Yup.string().required('Usuario requerido'),
      email: Yup.string().email('Email inválido').required('Email requerido'),
      password: Yup.string().required('Contraseña requerida'),
    }),
    ci: Yup.string().required('CI requerido'),
    first_name: Yup.string().required('Nombre requerido'),
    last_name: Yup.string().required('Apellido requerido'),
    phone: Yup.string().required('Teléfono requerido'),
    birth_date: Yup.date().required('Fecha de nacimiento requerida'),
    tutor_name: Yup.string().required('Nombre del tutor requerido'),
    tutor_phone: Yup.string().required('Teléfono del tutor requerido'),
  });

  const handleSubmit = async (values) => {
    try {
      setRegisterError(null);
      await register(values);
      navigate('/student');
    } catch (err) {
      setRegisterError('Error al registrarse. Verifica los datos e intenta de nuevo.');
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const renderStepContent = (step, formikProps) => {
    const { errors, touched } = formikProps;

    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
                📚 Datos de Usuario
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configura tu usuario y contraseña para acceder al sistema
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Field
                as={TextField}
                fullWidth
                id="username"
                label="Usuario"
                name="user.username"
                variant="outlined"
                error={touched.user?.username && Boolean(errors.user?.username)}
                helperText={touched.user?.username && errors.user?.username}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Field
                as={TextField}
                fullWidth
                id="email"
                label="Correo Electrónico"
                name="user.email"
                type="email"
                variant="outlined"
                error={touched.user?.email && Boolean(errors.user?.email)}
                helperText={touched.user?.email && errors.user?.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Field
                as={TextField}
                fullWidth
                name="user.password"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                id="password"
                variant="outlined"
                error={touched.user?.password && Boolean(errors.user?.password)}
                helperText={touched.user?.password && errors.user?.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
                👤 Información Personal
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Completa tus datos personales para tu perfil estudiantil
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Field
                as={TextField}
                fullWidth
                id="first_name"
                label="Nombre"
                name="first_name"
                variant="outlined"
                error={touched.first_name && Boolean(errors.first_name)}
                helperText={touched.first_name && errors.first_name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Field
                as={TextField}
                fullWidth
                id="last_name"
                label="Apellido"
                name="last_name"
                variant="outlined"
                error={touched.last_name && Boolean(errors.last_name)}
                helperText={touched.last_name && errors.last_name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Field
                as={TextField}
                fullWidth
                id="ci"
                label="Cédula de Identidad"
                name="ci"
                variant="outlined"
                error={touched.ci && Boolean(errors.ci)}
                helperText={touched.ci && errors.ci}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Badge color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Field
                as={TextField}
                fullWidth
                id="phone"
                label="Teléfono"
                name="phone"
                variant="outlined"
                error={touched.phone && Boolean(errors.phone)}
                helperText={touched.phone && errors.phone}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Field
                as={TextField}
                fullWidth
                id="birth_date"
                label="Fecha de Nacimiento"
                name="birth_date"
                type="date"
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
                error={touched.birth_date && Boolean(errors.birth_date)}
                helperText={touched.birth_date && errors.birth_date}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
                👨‍👩‍👧‍👦 Datos del Tutor
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Información de contacto de tu tutor o representante legal
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Field
                as={TextField}
                fullWidth
                id="tutor_name"
                label="Nombre Completo del Tutor"
                name="tutor_name"
                variant="outlined"
                error={touched.tutor_name && Boolean(errors.tutor_name)}
                helperText={touched.tutor_name && errors.tutor_name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FamilyRestroom color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Field
                as={TextField}
                fullWidth
                id="tutor_phone"
                label="Teléfono del Tutor"
                name="tutor_phone"
                variant="outlined"
                error={touched.tutor_phone && Boolean(errors.tutor_phone)}
                helperText={touched.tutor_phone && errors.tutor_phone}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        );

      default:
        return 'Paso desconocido';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4
      }}
    >
      {/* Patrón de fondo */}
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

      <Container maxWidth="md" sx={{ position: 'relative' }}>
        <Card
          elevation={24}
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 4
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  width: 70,
                  height: 70,
                  bgcolor: 'success.main',
                  mx: 'auto',
                  mb: 2,
                  background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)'
                }}
              >
                <PersonAdd sx={{ fontSize: 35 }} />
              </Avatar>
              
              <Typography
                variant="h4"
                component="h1"
                fontWeight="bold"
                color="text.primary"
                gutterBottom
              >
                Registro de Estudiante
              </Typography>
              
              <Typography
                variant="body1"
                color="text.secondary"
              >
                Únete a Smart Class y comienza tu experiencia educativa
              </Typography>

              <Chip
                icon={<School />}
                label="Solo estudiantes pueden registrarse"
                color="primary"
                variant="outlined"
                sx={{ mt: 2 }}
              />
            </Box>

            {/* Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Progress bar */}
            <Box sx={{ mb: 3 }}>
              <LinearProgress 
                variant="determinate" 
                value={((activeStep + 1) / steps.length) * 100}
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
                  }
                }}
              />
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
                Paso {activeStep + 1} de {steps.length}
              </Typography>
            </Box>

            {/* Mensajes de error */}
            {(registerError || error) && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2
                }}
              >
                {registerError || error}
              </Alert>
            )}

            {/* Formulario */}
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {(formikProps) => {
                const { isSubmitting } = formikProps;
                
                return (
                  <Form>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: 3, 
                        mb: 4,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'grey.200'
                      }}
                    >
                      {renderStepContent(activeStep, formikProps)}
                    </Paper>

                    {/* Botones de navegación */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                      <Button
                        disabled={activeStep === 0}
                        onClick={() => setActiveStep(activeStep - 1)}
                        startIcon={<ArrowBack />}
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                      >
                        Anterior
                      </Button>

                      {activeStep === steps.length - 1 ? (
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          disabled={isSubmitting}
                          startIcon={<CheckCircle />}
                          sx={{
                            px: 4,
                            py: 1.5,
                            borderRadius: 2,
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                            },
                          }}
                        >
                          {isSubmitting ? 'Registrando...' : 'Completar Registro'}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setActiveStep(activeStep + 1)}
                          variant="contained"
                          sx={{ borderRadius: 2 }}
                        >
                          Siguiente
                        </Button>
                      )}
                    </Box>
                  </Form>
                );
              }}
            </Formik>

            {/* Divider */}
            <Divider sx={{ my: 4 }}>
              <Typography variant="body2" color="text.secondary">
                ¿Ya tienes cuenta?
              </Typography>
            </Divider>

            {/* Link a login */}
            <Box sx={{ textAlign: 'center' }}>
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                size="large"
                sx={{
                  borderRadius: 2,
                  px: 4,
                  fontWeight: '600',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    bgcolor: 'primary.50',
                  },
                }}
              >
                Iniciar Sesión
              </Button>
            </Box>

            {/* Footer info */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Al registrarte aceptas formar parte del sistema Smart Class
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Gestión Educativa Inteligente © 2025
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Register;