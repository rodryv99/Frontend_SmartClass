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
} from '@mui/material';

const Login = () => {
  const { login, error } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState(null);

  const initialValues = {
    username: '',
    password: '',
  };

  const validationSchema = Yup.object({
    username: Yup.string().required('Usuario requerido'),
    password: Yup.string().required('Contraseña requerida'),
  });

  const handleSubmit = async (values) => {
    try {
      setLoginError(null);
      const user = await login(values.username, values.password);
      
      // Redireccionar según el tipo de usuario
      if (user.user_type === 'admin') {
        navigate('/admin');
      } else if (user.user_type === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setLoginError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Iniciar Sesión
        </Typography>
        
        {(loginError || error) && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {loginError || error}
          </Alert>
        )}
        
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form style={{ width: '100%', marginTop: '1rem' }}>
              <Field
                as={TextField}
                margin="normal"
                fullWidth
                id="username"
                label="Usuario"
                name="username"
                autoComplete="username"
                error={touched.username && Boolean(errors.username)}
                helperText={touched.username && errors.username}
              />
              
              <Field
                as={TextField}
                margin="normal"
                fullWidth
                name="password"
                label="Contraseña"
                type="password"
                id="password"
                autoComplete="current-password"
                error={touched.password && Boolean(errors.password)}
                helperText={touched.password && errors.password}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                sx={{ mt: 3, mb: 2 }}
              >
                {isSubmitting ? 'Cargando...' : 'Iniciar Sesión'}
              </Button>
            </Form>
          )}
        </Formik>
      </Box>
    </Container>
  );
};

export default Login;