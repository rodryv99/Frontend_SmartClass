import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a las solicitudes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  login: async (username, password) => {
    const response = await api.post('/users/login/', { username, password });
    console.log("Respuesta de login:", response.data);
    return response.data;
  },
  registerStudent: async (userData) => {
    const response = await api.post('/users/register/student/', userData);
    return response.data;
  },
  refreshToken: async (refreshToken) => {
    const response = await api.post('/users/token/refresh/', { refresh: refreshToken });
    return response.data;
  },
};

// Servicios de usuario
export const userService = {
  getUserProfile: async () => {
    const response = await api.get('/users/users/me/');
    return response.data;
  },
  getAllUsers: async () => {
    const response = await api.get('/users/users/');
    return response.data;
  },
  createTeacher: async (teacherData) => {
    const response = await api.post('/users/register/teacher/', teacherData);
    return response.data;
  },
  // Nuevas funciones para editar y eliminar usuarios
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/users/${id}/`, userData);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await api.delete(`/users/users/${id}/`);
    return response.data;
  },
  // Para actualizar perfiles específicos
  updateTeacherProfile: async (id, profileData) => {
    const response = await api.put(`/users/teacher-profile/${id}/`, profileData);
    return response.data;
  },
  updateStudentProfile: async (id, profileData) => {
    const response = await api.put(`/users/student-profile/${id}/`, profileData);
    return response.data;
  },
  // Obtener todos los perfiles de estudiantes
  getAllStudentProfiles: async () => {
    const response = await api.get('/users/student-profiles/');
    return response.data;
  },
};

// Servicios académicos
export const academicService = {
  // Períodos
  getAllPeriods: async () => {
    const response = await api.get('/academic/periods/');
    return response.data;
  },
  getPeriod: async (id) => {
    const response = await api.get(`/academic/periods/${id}/`);
    return response.data;
  },
  createPeriod: async (periodData) => {
    const response = await api.post('/academic/periods/', periodData);
    return response.data;
  },
  updatePeriod: async (id, periodData) => {
    const response = await api.put(`/academic/periods/${id}/`, periodData);
    return response.data;
  },
  deletePeriod: async (id) => {
    await api.delete(`/academic/periods/${id}/`);
    return true;
  },
  
  // Materias
  getAllSubjects: async () => {
    const response = await api.get('/academic/subjects/');
    return response.data;
  },
  getSubject: async (id) => {
    const response = await api.get(`/academic/subjects/${id}/`);
    return response.data;
  },
  createSubject: async (subjectData) => {
    const response = await api.post('/academic/subjects/', subjectData);
    return response.data;
  },
  updateSubject: async (id, subjectData) => {
    const response = await api.put(`/academic/subjects/${id}/`, subjectData);
    return response.data;
  },
  deleteSubject: async (id) => {
    await api.delete(`/academic/subjects/${id}/`);
    return true;
  },
  
  // Cursos
  getAllCourses: async () => {
    const response = await api.get('/academic/courses/');
    return response.data;
  },
  getCourse: async (id) => {
    const response = await api.get(`/academic/courses/${id}/`);
    return response.data;
  },
  createCourse: async (courseData) => {
    const response = await api.post('/academic/courses/', courseData);
    return response.data;
  },
  updateCourse: async (id, courseData) => {
    const response = await api.put(`/academic/courses/${id}/`, courseData);
    return response.data;
  },
  deleteCourse: async (id) => {
    await api.delete(`/academic/courses/${id}/`);
    return true;
  },
  
  // Grupos
  getAllGroups: async () => {
    const response = await api.get('/academic/groups/');
    return response.data;
  },
  getGroup: async (id) => {
    const response = await api.get(`/academic/groups/${id}/`);
    return response.data;
  },
  createGroup: async (groupData) => {
    const response = await api.post('/academic/groups/', groupData);
    return response.data;
  },
  updateGroup: async (id, groupData) => {
    const response = await api.put(`/academic/groups/${id}/`, groupData);
    return response.data;
  },
  deleteGroup: async (id) => {
    await api.delete(`/academic/groups/${id}/`);
    return true;
  },
  
  // Clases
  getAllClasses: async () => {
    try {
      console.log("Llamando a getAllClasses con token:", localStorage.getItem('access_token'));
      const user = JSON.parse(localStorage.getItem('user'));
      console.log("Usuario actual:", user);
      console.log("Tipo de usuario:", user?.user_type);
      console.log("Perfil de estudiante:", user?.student_profile);
      
      const response = await api.get('/academic/classes/');
      console.log("Respuesta completa de getAllClasses:", response);
      return response.data;
    } catch (error) {
      console.error("Error en getAllClasses:", error);
      console.error("Detalles del error:", error.response?.data);
      throw error;
    }
  },
  getClass: async (id) => {
    const response = await api.get(`/academic/classes/${id}/`);
    return response.data;
  },
  createClass: async (classData) => {
    const response = await api.post('/academic/classes/', classData);
    return response.data;
  },
  updateClass: async (id, classData) => {
    const response = await api.put(`/academic/classes/${id}/`, classData);
    return response.data;
  },
  deleteClass: async (id) => {
    await api.delete(`/academic/classes/${id}/`);
    return true;
  },
  addStudentsToClass: async (classId, studentIds) => {
    try {
      console.log(`Añadiendo estudiantes ${studentIds} a la clase ${classId}`);
      const response = await api.post(`/academic/classes/${classId}/add_students/`, {
        student_ids: studentIds
      });
      console.log("Respuesta de addStudentsToClass:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error en addStudentsToClass:", error);
      console.error("Detalles del error:", error.response?.data);
      throw error;
    }
  },
  removeStudentsFromClass: async (classId, studentIds) => {
    try {
      console.log(`Removiendo estudiantes ${studentIds} de la clase ${classId}`);
      const response = await api.post(`/academic/classes/${classId}/remove_students/`, {
        student_ids: studentIds
      });
      console.log("Respuesta de removeStudentsFromClass:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error en removeStudentsFromClass:", error);
      console.error("Detalles del error:", error.response?.data);
      throw error;
    }
  },
  getClassPeriods: async (classId) => {
    const response = await api.get(`/academic/classes/${classId}/periods/`);
    return response.data;
  },
  getAvailableStudents: async (classId) => {
    const response = await api.get(`/academic/classes/${classId}/available_students/`);
    return response.data;
  },
  
  // ===== SERVICIOS PARA PERÍODOS =====
  
  // Obtener períodos disponibles para una clase (del mismo año que no estén ya asignados)
  getAvailablePeriodsForClass: async (classId) => {
    const response = await api.get(`/academic/classes/${classId}/available_periods/`);
    return response.data;
  },
  
  // Añadir períodos a una clase
  addPeriodsToClass: async (classId, periodIds) => {
    try {
      console.log(`Añadiendo períodos ${periodIds} a la clase ${classId}`);
      const response = await api.post(`/academic/classes/${classId}/add_periods/`, {
        period_ids: periodIds
      });
      console.log("Respuesta de addPeriodsToClass:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error en addPeriodsToClass:", error);
      console.error("Detalles del error:", error.response?.data);
      throw error;
    }
  },
  
  // Remover períodos de una clase
  removePeriodsFromClass: async (classId, periodIds) => {
    try {
      console.log(`Removiendo períodos ${periodIds} de la clase ${classId}`);
      const response = await api.post(`/academic/classes/${classId}/remove_periods/`, {
        period_ids: periodIds
      });
      console.log("Respuesta de removePeriodsFromClass:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error en removePeriodsFromClass:", error);
      console.error("Detalles del error:", error.response?.data);
      throw error;
    }
  },
  
  // Ruta de depuración
  debugStudentClasses: async () => {
    try {
      console.log("Llamando a debugStudentClasses");
      const response = await api.get('/academic/debug/student-classes/');
      console.log("Respuesta de depuración:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error en debugStudentClasses:", error);
      throw error;
    }
  },

  // ===== SERVICIOS DE ASISTENCIA =====
  
  // Obtener todas las asistencias
  getAllAttendances: async () => {
    const response = await api.get('/academic/attendances/');
    return response.data;
  },
  
  // Obtener asistencia específica
  getAttendance: async (id) => {
    const response = await api.get(`/academic/attendances/${id}/`);
    return response.data;
  },
  
  // Crear asistencia individual
  createAttendance: async (attendanceData) => {
    const response = await api.post('/academic/attendances/', attendanceData);
    return response.data;
  },
  
  // Actualizar asistencia
  updateAttendance: async (id, attendanceData) => {
    const response = await api.put(`/academic/attendances/${id}/`, attendanceData);
    return response.data;
  },
  
  // Eliminar asistencia
  deleteAttendance: async (id) => {
    await api.delete(`/academic/attendances/${id}/`);
    return true;
  },
  
  // Crear asistencias masivas por día
  createBulkAttendance: async (attendanceData) => {
    try {
      console.log("Enviando asistencias masivas:", attendanceData);
      const response = await api.post('/academic/attendances/bulk_create/', attendanceData);
      console.log("Respuesta de asistencias masivas:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error en asistencias masivas:", error);
      console.error("Detalles del error:", error.response?.data);
      throw error;
    }
  },
  
  // Obtener asistencias por clase y período
  getAttendancesByClassAndPeriod: async (classId, periodId, date = null) => {
    try {
      let url = `/academic/attendances/by_class_and_period/?class_id=${classId}&period_id=${periodId}`;
      if (date) {
        url += `&date=${date}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo asistencias:", error);
      throw error;
    }
  },
  
  // Obtener estadísticas de asistencia
  getAttendanceStats: async (classId, periodId = null) => {
    try {
      let url = `/academic/attendances/stats/?class_id=${classId}`;
      if (periodId) {
        url += `&period_id=${periodId}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo estadísticas de asistencia:", error);
      throw error;
    }
  },

  // ===== SERVICIOS DE PARTICIPACIÓN =====
  
  // Obtener todas las participaciones
  getAllParticipations: async () => {
    const response = await api.get('/academic/participations/');
    return response.data;
  },
  
  // Obtener participación específica
  getParticipation: async (id) => {
    const response = await api.get(`/academic/participations/${id}/`);
    return response.data;
  },
  
  // Crear participación individual
  createParticipation: async (participationData) => {
    const response = await api.post('/academic/participations/', participationData);
    return response.data;
  },
  
  // Actualizar participación
  updateParticipation: async (id, participationData) => {
    const response = await api.put(`/academic/participations/${id}/`, participationData);
    return response.data;
  },
  
  // Eliminar participación
  deleteParticipation: async (id) => {
    await api.delete(`/academic/participations/${id}/`);
    return true;
  },
  
  // Crear participaciones masivas por día
  createBulkParticipation: async (participationData) => {
    try {
      console.log("Enviando participaciones masivas:", participationData);
      const response = await api.post('/academic/participations/bulk_create/', participationData);
      console.log("Respuesta de participaciones masivas:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error en participaciones masivas:", error);
      console.error("Detalles del error:", error.response?.data);
      throw error;
    }
  },
  
  // Obtener participaciones por clase y período
  getParticipationsByClassAndPeriod: async (classId, periodId, date = null) => {
    try {
      let url = `/academic/participations/by_class_and_period/?class_id=${classId}&period_id=${periodId}`;
      if (date) {
        url += `&date=${date}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo participaciones:", error);
      throw error;
    }
  },
  
  // Obtener estadísticas de participación
  getParticipationStats: async (classId, periodId = null) => {
    try {
      let url = `/academic/participations/stats/?class_id=${classId}`;
      if (periodId) {
        url += `&period_id=${periodId}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo estadísticas de participación:", error);
      throw error;
    }
  },
};

// ===== SERVICIOS DE NOTAS - VERSIÓN MEJORADA =====
export const gradeService = {
  // Obtener todas las notas
  getAllGrades: async () => {
    const response = await api.get('/grades/grades/');
    return response.data;
  },
  
  // Obtener nota específica
  getGrade: async (id) => {
    const response = await api.get(`/grades/grades/${id}/`);
    return response.data;
  },
  
  // Crear nota individual
  createGrade: async (gradeData) => {
    const response = await api.post('/grades/grades/', gradeData);
    return response.data;
  },
  
  // Actualizar nota
  updateGrade: async (id, gradeData) => {
    const response = await api.put(`/grades/grades/${id}/`, gradeData);
    return response.data;
  },
  
  // Eliminar nota
  deleteGrade: async (id) => {
    await api.delete(`/grades/grades/${id}/`);
    return true;
  },
  
  // Crear o actualizar notas masivamente por período
  createBulkGrades: async (gradeData) => {
    try {
      console.log("Enviando notas masivas:", gradeData);
      
      // Limpiar caché del navegador antes de enviar
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      const response = await api.post('/grades/grades/bulk_create_update/', gradeData);
      console.log("Respuesta de notas masivas:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error en notas masivas:", error);
      console.error("Detalles del error:", error.response?.data);
      throw error;
    }
  },
  
  // Obtener notas por clase y período
  getGradesByClassAndPeriod: async (classId, periodId) => {
    try {
      // Agregar timestamp para forzar cache bust
      const timestamp = Date.now();
      const url = `/grades/grades/by_class_and_period/?class_id=${classId}&period_id=${periodId}&_t=${timestamp}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo notas:", error);
      throw error;
    }
  },
  
  // Obtener estadísticas de notas - CON CACHE BUST
  getGradeStats: async (classId, periodId = null, forceFresh = false) => {
    try {
      let url = `/grades/grades/stats/?class_id=${classId}`;
      if (periodId) {
        url += `&period_id=${periodId}`;
      }
      // Cache bust siempre cuando se pide datos frescos o por defecto
      const timestamp = forceFresh || Date.now();
      url += `&_t=${timestamp}`;
      
      console.log("API: Solicitando estadísticas con URL:", url);
      
      // Limpiar caché del navegador antes de la solicitud
      if (forceFresh && 'caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      const response = await api.get(url);
      console.log("API: Estadísticas recibidas del servidor:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo estadísticas de notas:", error);
      throw error;
    }
  },
  
  // ===== SERVICIOS DE NOTAS FINALES =====
  
  // Obtener todas las notas finales
  getAllFinalGrades: async () => {
    const response = await api.get('/grades/final-grades/');
    return response.data;
  },
  
  // Obtener nota final específica
  getFinalGrade: async (id) => {
    const response = await api.get(`/grades/final-grades/${id}/`);
    return response.data;
  },
  
  // Obtener notas finales por clase - CON CACHE BUST
  getFinalGradesByClass: async (classId, forceFresh = false) => {
    try {
      let url = `/grades/final-grades/by_class/?class_id=${classId}`;
      // Cache bust siempre cuando se pide datos frescos o por defecto
      const timestamp = forceFresh || Date.now();
      url += `&_t=${timestamp}`;
      
      console.log("API: Solicitando notas finales con URL:", url);
      
      // Limpiar caché del navegador antes de la solicitud
      if (forceFresh && 'caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      const response = await api.get(url);
      console.log("API: Notas finales recibidas del servidor:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo notas finales:", error);
      throw error;
    }
  },
  
  // Recalcular todas las notas finales de una clase
  recalculateFinalGrades: async (classId) => {
    try {
      console.log(`Recalculando notas finales para la clase ${classId}`);
      
      // Limpiar caché del navegador antes de la solicitud
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      const response = await api.post('/grades/final-grades/recalculate_all/', {
        class_id: classId
      });
      console.log("Respuesta de recalcular notas finales:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error recalculando notas finales:", error);
      console.error("Detalles del error:", error.response?.data);
      throw error;
    }
  },
  
  // ===== SERVICIOS DE RESÚMENES =====
  
  // Obtener resumen completo de notas de un estudiante en una clase
  getStudentGradesSummary: async (classId, studentId = null) => {
    try {
      let url = `/grades/student/${classId}/`;
      if (studentId) {
        url += `${studentId}/`;
      }
      
      // Agregar timestamp para cache bust
      const timestamp = Date.now();
      url += `?_t=${timestamp}`;
      
      console.log(`Obteniendo resumen de notas: ${url}`);
      const response = await api.get(url);
      console.log("Respuesta de resumen de estudiante:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo resumen de notas del estudiante:", error);
      console.error("Detalles del error:", error.response?.data);
      throw error;
    }
  },
  
  // Obtener resumen de notas de toda una clase
  getClassGradesSummary: async (classId, periodId = null) => {
    try {
      let url = `/grades/class/${classId}/summary/`;
      const params = [];
      
      if (periodId) {
        params.push(`period_id=${periodId}`);
      }
      
      // Agregar timestamp para cache bust
      params.push(`_t=${Date.now()}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      console.log(`Obteniendo resumen de clase: ${url}`);
      const response = await api.get(url);
      console.log("Respuesta de resumen de clase:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo resumen de notas de la clase:", error);
      console.error("Detalles del error:", error.response?.data);
      throw error;
    }
  },

  // Función helper para limpiar caché manualmente
  clearBrowserCache: async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log("Caché del navegador limpiado");
      }
    } catch (error) {
      console.error("Error limpiando caché:", error);
    }
  }
};

// ===== SERVICIOS DE MACHINE LEARNING =====
export const mlService = {
  // Obtener todas las predicciones
  getAllPredictions: async () => {
    const response = await api.get('/ml/predictions/');
    return response.data;
  },
  
  // Obtener predicción específica
  getPrediction: async (id) => {
    const response = await api.get(`/ml/predictions/${id}/`);
    return response.data;
  },
  
  // Obtener predicciones por clase
  getPredictionsByClass: async (classId) => {
    try {
      const url = `/ml/predictions/by_class/?class_id=${classId}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo predicciones:", error);
      throw error;
    }
  },
  
  // Actualizar predicciones para toda la clase (versión mejorada)
  updateClassPredictions: async (data) => {
    try {
      console.log('Actualizando predicciones:', data);
      const response = await api.post('/ml/predictions/update_class_predictions/', data);
      console.log('Respuesta de actualizar predicciones:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error actualizando predicciones:', error);
      console.error('Detalles del error:', error.response?.data);
      throw error;
    }
  },
  
  // Generar predicciones retrospectivas para comparar con la realidad
  generateRetrospectivePredictions: async (data) => {
    try {
      console.log('Generando predicciones retrospectivas:', data);
      const response = await api.post('/ml/predictions/generate_retrospective_predictions/', data);
      console.log('Respuesta de predicciones retrospectivas:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error generando predicciones retrospectivas:', error);
      console.error('Detalles del error:', error.response?.data);
      throw error;
    }
  },
  
  // Reentrenar modelo para una clase
  retrainModel: async (classId) => {
    try {
      console.log(`Reentrenando modelo para la clase ${classId}`);
      const response = await api.post('/ml/predictions/retrain_model/', {
        class_id: classId
      });
      console.log("Respuesta de reentrenamiento:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error reentrenando modelo:", error);
      console.error("Detalles del error:", error.response?.data);
      throw error;
    }
  },
  
  // Obtener estadísticas de predicciones
  getPredictionStats: async (classId) => {
    try {
      let url = `/ml/predictions/stats/?class_id=${classId}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo estadísticas de predicciones:", error);
      throw error;
    }
  },
  
  // ===== SERVICIOS DE HISTORIAL DE PREDICCIONES =====
  
  // Obtener todo el historial
  getAllPredictionHistory: async () => {
    const response = await api.get('/ml/prediction-history/');
    return response.data;
  },
  
  // Obtener historial específico
  getPredictionHistory: async (id) => {
    const response = await api.get(`/ml/prediction-history/${id}/`);
    return response.data;
  },
  
  // Obtener historial por clase
  getPredictionHistoryByClass: async (classId) => {
    try {
      const url = `/ml/prediction-history/by_class/?class_id=${classId}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo historial de predicciones:", error);
      throw error;
    }
  },
  
  // Obtener estadísticas de comparación realidad vs predicción
  getComparisonStats: async (classId) => {
    try {
      let url = `/ml/prediction-history/comparison_stats/?class_id=${classId}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo estadísticas de comparación:", error);
      throw error;
    }
  },
};

// ===== SERVICIOS DE AUDITORÍA =====
export const auditService = {
  // Obtener todos los logs con filtros
  getLogs: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/audit/logs/?${queryString}`);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo logs de auditoría:", error);
      throw error;
    }
  },
  
  // Obtener log específico
  getLog: async (id) => {
    const response = await api.get(`/audit/logs/${id}/`);
    return response.data;
  },
  
  // Obtener estadísticas de auditoría
  getStats: async () => {
    try {
      const response = await api.get('/audit/logs/stats/');
      return response.data;
    } catch (error) {
      console.error("Error obteniendo estadísticas de auditoría:", error);
      throw error;
    }
  },
  
  // Exportar logs
  exportLogs: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/audit/logs/export/?${queryString}`);
      return response.data;
    } catch (error) {
      console.error("Error exportando logs:", error);
      throw error;
    }
  },
  
  // Obtener resúmenes de auditoría
  getSummaries: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/audit/summaries/?${queryString}`);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo resúmenes:", error);
      throw error;
    }
  },
  
  // Crear log manual
  createManualLog: async (logData) => {
    try {
      const response = await api.post('/audit/log-manual/', logData);
      return response.data;
    } catch (error) {
      console.error("Error creando log manual:", error);
      throw error;
    }
  },
  
  // Obtener opciones de acciones
  getActionChoices: async () => {
    try {
      const response = await api.get('/audit/action-choices/');
      return response.data;
    } catch (error) {
      console.error("Error obteniendo opciones de acciones:", error);
      throw error;
    }
  },
  
  // Limpiar logs antiguos
  cleanupOldLogs: async (days = 90) => {
    try {
      const response = await api.delete('/audit/cleanup/', {
        data: { days }
      });
      return response.data;
    } catch (error) {
      console.error("Error limpiando logs antiguos:", error);
      throw error;
    }
  }
};

export default api;