import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
} from '@mui/material';

const Register = () => {
  const { register, error } = useContext(AuthContext);
  const navigate = useNavigate();
  const [registerError, setRegisterError] = useState(null);

  const initialValues = {
    user: {
      username: '',
      email: '',
      password: '',
    },
    ci: '',
    first_name: '',  // Nuevo campo de nombre
    last_name: '',   // Nuevo campo de apellido
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
    first_name: Yup.string().required('Nombre requerido'),  // Validación para nombre
    last_name: Yup.string().required('Apellido requerido'),  // Validación para apellido
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

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Registro de Estudiante
        </Typography>
        
        {(registerError || error) && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {registerError || error}
          </Alert>
        )}
        
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form style={{ width: '100%', marginTop: '1rem' }}>
              <Typography variant="h6" gutterBottom>
                Datos de usuario
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Field
                    as={TextField}
                    fullWidth
                    id="username"
                    label="Usuario"
                    name="user.username"
                    error={touched.user?.username && Boolean(errors.user?.username)}
                    helperText={touched.user?.username && errors.user?.username}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Field
                    as={TextField}
                    fullWidth
                    id="email"
                    label="Email"
                    name="user.email"
                    error={touched.user?.email && Boolean(errors.user?.email)}
                    helperText={touched.user?.email && errors.user?.email}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Field
                    as={TextField}
                    fullWidth
                    name="user.password"
                    label="Contraseña"
                    type="password"
                    id="password"
                    error={touched.user?.password && Boolean(errors.user?.password)}
                    helperText={touched.user?.password && errors.user?.password}
                  />
                </Grid>
              </Grid>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Datos personales
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Field
                    as={TextField}
                    fullWidth
                    id="first_name"
                    label="Nombre"
                    name="first_name"
                    error={touched.first_name && Boolean(errors.first_name)}
                    helperText={touched.first_name && errors.first_name}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Field
                    as={TextField}
                    fullWidth
                    id="last_name"
                    label="Apellido"
                    name="last_name"
                    error={touched.last_name && Boolean(errors.last_name)}
                    helperText={touched.last_name && errors.last_name}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Field
                    as={TextField}
                    fullWidth
                    id="ci"
                    label="CI"
                    name="ci"
                    error={touched.ci && Boolean(errors.ci)}
                    helperText={touched.ci && errors.ci}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Field
                    as={TextField}
                    fullWidth
                    id="phone"
                    label="Teléfono"
                    name="phone"
                    error={touched.phone && Boolean(errors.phone)}
                    helperText={touched.phone && errors.phone}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    fullWidth
                    id="birth_date"
                    label="Fecha de nacimiento"
                    name="birth_date"
                    type="date"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    error={touched.birth_date && Boolean(errors.birth_date)}
                    helperText={touched.birth_date && errors.birth_date}
                  />
                </Grid>
              </Grid>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Datos del tutor
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Field
                    as={TextField}
                    fullWidth
                    id="tutor_name"
                    label="Nombre del tutor"
                    name="tutor_name"
                    error={touched.tutor_name && Boolean(errors.tutor_name)}
                    helperText={touched.tutor_name && errors.tutor_name}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Field
                    as={TextField}
                    fullWidth
                    id="tutor_phone"
                    label="Teléfono del tutor"
                    name="tutor_phone"
                    error={touched.tutor_phone && Boolean(errors.tutor_phone)}
                    helperText={touched.tutor_phone && errors.tutor_phone}
                  />
                </Grid>
              </Grid>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                sx={{ mt: 3, mb: 2 }}
              >
                {isSubmitting ? 'Registrando...' : 'Registrarse'}
              </Button>
            </Form>
          )}
        </Formik>
      </Box>
    </Container>
  );
};

export default Register;