import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, Typography, Box, Paper, Grid, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Tooltip, TextField, InputAdornment,
  TableSortLabel, ButtonGroup, LinearProgress
} from '@mui/material';
import { 
  DatePicker, LocalizationProvider 
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { 
  CheckCircle, Cancel, Schedule, CalendarToday, 
  BarChart, Person, ArrowBack, Save, Search, Clear,
  TableChart, PictureAsPdf, Description, FilterList,
  Refresh
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { academicService } from '../services/api';
import { AuthContext } from '../context/AuthContext';

// Mapeo de estados entre frontend y backend
const STATUS_MAPPING = {
  // Frontend -> Backend
  'present': 'presente',
  'absent': 'falta', 
  'late': 'tardanza'
};

const STATUS_REVERSE_MAPPING = {
  // Backend -> Frontend
  'presente': 'present',
  'falta': 'absent',
  'tardanza': 'late'
};

// Función para convertir estado del backend al frontend
const mapBackendToFrontend = (backendStatus) => {
  return STATUS_REVERSE_MAPPING[backendStatus] || 'present';
};

// Función para convertir estado del frontend al backend  
const mapFrontendToBackend = (frontendStatus) => {
  return STATUS_MAPPING[frontendStatus] || 'presente';
};

const AttendanceManagement = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  
  // Estados principales
  const [classData, setClassData] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState(0);
  
  // Estados para asistencia
  const [attendances, setAttendances] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [filteredStats, setFilteredStats] = useState([]);
  const [dailyAttendances, setDailyAttendances] = useState({});
  
  // Estados para filtros y ordenamiento
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState('student_name');
  const [order, setOrder] = useState('asc');
  
  // Estados para UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  
  // Verificar permisos
  const canManageAttendance = 
    currentUser?.user_type === 'admin' || 
    (currentUser?.user_type === 'teacher' && 
     classData?.teacher === currentUser?.teacher_profile?.id);

  const canViewAttendance = 
    canManageAttendance || 
    (currentUser?.user_type === 'student' && 
     currentUser?.student_profile?.id && 
     (classData?.students?.includes(currentUser?.student_profile?.id) || 
      classData?.students_detail?.some(student => student.id === currentUser?.student_profile?.id)));

  // Aplicar filtros y ordenamiento
  useEffect(() => {
    let filtered = [...attendanceStats];

    // Aplicar búsqueda
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(stat => 
        stat.student_name.toLowerCase().includes(search) ||
        stat.student_id.toString().includes(search)
      );
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (orderBy) {
        case 'student_name':
          aVal = a.student_name.toLowerCase();
          bVal = b.student_name.toLowerCase();
          break;
        case 'attendance_percentage':
          aVal = a.attendance_percentage;
          bVal = b.attendance_percentage;
          break;
        case 'present_count':
          aVal = a.present_count;
          bVal = b.present_count;
          break;
        case 'absent_count':
          aVal = a.absent_count;
          bVal = b.absent_count;
          break;
        case 'late_count':
          aVal = a.late_count || a.absent_with_excuse_count || 0;
          bVal = b.late_count || b.absent_with_excuse_count || 0;
          break;
        case 'total_days':
          aVal = a.total_days;
          bVal = b.total_days;
          break;
        default:
          aVal = a.student_name.toLowerCase();
          bVal = b.student_name.toLowerCase();
      }

      if (order === 'desc') {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });

    setFilteredStats(filtered);
  }, [attendanceStats, searchTerm, orderBy, order]);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Obtener datos de la clase
        const classResponse = await academicService.getClass(classId);
        setClassData(classResponse);
        
        console.log("=== DEPURACIÓN ATTENDANCE MANAGEMENT ===");
        console.log("Datos de la clase:", classResponse);
        console.log("Períodos de la clase:", classResponse.periods_detail);
        
        // Usar los períodos asignados a la clase
        if (classResponse.periods_detail && classResponse.periods_detail.length > 0) {
          setPeriods(classResponse.periods_detail);
          setSelectedPeriod(classResponse.periods_detail[0].id);
        } else {
          console.warn("No hay períodos asignados a esta clase");
          setPeriods([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Error al cargar los datos de la clase');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [classId, currentUser]);
  
  // Cargar asistencias cuando cambia el período o la fecha
  useEffect(() => {
    if (selectedPeriod && selectedDate) {
      loadAttendanceData();
    }
  }, [selectedPeriod, selectedDate]);

  // Auto-seleccionar pestaña de estadísticas para estudiantes
  useEffect(() => {
    if (currentUser?.user_type === 'student' && !canManageAttendance && canViewAttendance) {
      setActiveTab(1); // Ir a estadísticas
    }
  }, [currentUser, canManageAttendance, canViewAttendance]);

  // Actualizar fecha cuando cambia el período
  useEffect(() => {
    if (selectedPeriod && periods.length > 0) {
      const currentPeriod = periods.find(p => p.id === selectedPeriod);
      if (currentPeriod) {
        // Crear fechas sin problemas de zona horaria
        const periodStart = new Date(currentPeriod.start_date + 'T12:00:00');
        const periodEnd = new Date(currentPeriod.end_date + 'T12:00:00');
        
        const currentDate = new Date(selectedDate);
        currentDate.setHours(12, 0, 0, 0);
        
        if (currentDate < periodStart || currentDate > periodEnd) {
          setSelectedDate(periodStart);
        }
      }
      loadAttendanceStats();
    }
  }, [selectedPeriod, periods]);

  // Función para deshabilitar fechas fuera del período
  const shouldDisableDate = (date) => {
    if (!selectedPeriod || !periods.length) return false;
    
    const currentPeriod = periods.find(p => p.id === selectedPeriod);
    if (!currentPeriod) return false;
    
    // Crear fechas sin problemas de zona horaria
    const periodStart = new Date(currentPeriod.start_date + 'T00:00:00');
    const periodEnd = new Date(currentPeriod.end_date + 'T23:59:59');
    
    // Normalizar la fecha de entrada para comparación
    const compareDate = new Date(date);
    compareDate.setHours(12, 0, 0, 0);
    
    return compareDate < periodStart || compareDate > periodEnd;
  };

  const loadAttendanceData = async () => {
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      console.log("Cargando asistencias para:", { classId, selectedPeriod, dateString });
      
      const response = await academicService.getAttendancesByClassAndPeriod(
        classId, 
        selectedPeriod, 
        dateString
      );
      
      console.log("Respuesta de asistencias del backend:", response);
      
      // Convertir array a objeto indexado por student_id CON MAPEO CORRECTO
      const attendanceMap = {};
      
      if (Array.isArray(response)) {
        response.forEach(attendance => {
          console.log("Procesando asistencia:", attendance);
          // CAMBIO CRÍTICO: Mapear estado del backend al frontend
          const frontendStatus = mapBackendToFrontend(attendance.status);
          console.log(`Mapeando estado: ${attendance.status} -> ${frontendStatus}`);
          attendanceMap[attendance.student.toString()] = frontendStatus;
        });
      }
      
      console.log("Mapa de asistencias procesado:", attendanceMap);
      setDailyAttendances(attendanceMap);
      
    } catch (err) {
      console.error('Error loading attendance data:', err);
      // No mostrar error si simplemente no hay datos
      setDailyAttendances({});
    }
  };

  const loadAttendanceStats = async () => {
    try {
      console.log("Cargando estadísticas para:", { classId, selectedPeriod });
      const response = await academicService.getAttendanceStats(classId, selectedPeriod);
      console.log("Estadísticas de asistencia recibidas:", response);
      setAttendanceStats(response);
    } catch (err) {
      console.error('Error loading attendance stats:', err);
      setAttendanceStats([]);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleAttendanceChange = (studentId, status) => {
    console.log(`Cambiando asistencia de estudiante ${studentId} a ${status}`);
    setDailyAttendances(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const saveAttendance = async () => {
    if (!canManageAttendance) {
      setError('No tienes permisos para gestionar asistencia');
      return;
    }

    try {
      setSaving(true);
      
      // Preparar datos para el envío CON MAPEO CORRECTO
      const attendanceData = {
        class_instance: parseInt(classId),
        period: parseInt(selectedPeriod),
        date: selectedDate.toISOString().split('T')[0],
        attendances: classData.students_detail.map(student => {
          const frontendStatus = dailyAttendances[student.id] || 'present';
          const backendStatus = mapFrontendToBackend(frontendStatus);
          console.log(`Estudiante ${student.id}: ${frontendStatus} -> ${backendStatus}`);
          
          return {
            student_id: student.id.toString(),
            status: backendStatus
          };
        })
      };
      
      console.log('Guardando asistencia con mapeo correcto:', attendanceData);
      
      const response = await academicService.createBulkAttendance(attendanceData);
      console.log('Respuesta del guardado:', response);
      
      setSuccess('Asistencia guardada correctamente');
      
      // Recargar datos
      await loadAttendanceData();
      await loadAttendanceStats();
      
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('Error saving attendance:', err);
      setError(err.response?.data?.error || 'Error al guardar la asistencia');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Funciones de exportación
  const getExportData = () => {
    return filteredStats.map(stat => ({
      student_name: stat.student_name,
      present_count: stat.present_count,
      absent_count: stat.absent_count,
      late_count: stat.late_count || stat.absent_with_excuse_count || 0,
      total_days: stat.total_days,
      attendance_percentage: stat.attendance_percentage,
      status: stat.attendance_percentage >= 85 ? 'Excelente' :
              stat.attendance_percentage >= 70 ? 'Regular' : 'Deficiente'
    }));
  };

  // Exportar como Excel
  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      
      const data = getExportData();
      const periodName = periods.find(p => p.id === selectedPeriod)?.number || '';
      
      // Importar SheetJS
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');
      
      // Preparar datos para Excel
      const worksheetData = [
        ['Estudiante', 'Presente', 'Faltas', 'Tardanzas', 'Total Días', '% Asistencia', 'Estado'],
        ...data.map(stat => [
          stat.student_name,
          stat.present_count,
          stat.absent_count,
          stat.late_count,
          stat.total_days,
          stat.attendance_percentage + '%',
          stat.status
        ])
      ];

      // Crear worksheet y workbook
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Estadísticas Asistencia');

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
      XLSX.writeFile(workbook, `asistencia_${classData.name}_periodo_${periodName}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
    } catch (err) {
      console.error('Error exporting Excel:', err);
      setError('Error al exportar como Excel');
    } finally {
      setExportLoading(false);
    }
  };

  // Exportar como CSV
  const handleExportCSV = () => {
    try {
      setExportLoading(true);
      
      const data = getExportData();
      const periodName = periods.find(p => p.id === selectedPeriod)?.number || '';
      
      const headers = [
        'Estudiante', 'Presente', 'Faltas', 'Tardanzas', 'Total Días', '% Asistencia', 'Estado'
      ];
      
      const rows = data.map(stat => [
        stat.student_name,
        stat.present_count,
        stat.absent_count,
        stat.late_count,
        stat.total_days,
        stat.attendance_percentage + '%',
        stat.status
      ]);
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `asistencia_${classData.name}_periodo_${periodName}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Error al exportar como CSV');
    } finally {
      setExportLoading(false);
    }
  };

  // Exportar como PDF
  const handleExportPDF = async () => {
    try {
      setExportLoading(true);
      
      const data = getExportData();
      const periodName = periods.find(p => p.id === selectedPeriod)?.number || '';
      
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
      doc.text('ESTADÍSTICAS DE ASISTENCIA', 148, 20, { align: 'center' });
      
      // Información
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Clase: ${classData.name}`, 20, 35);
      doc.text(`Período: ${periodName}`, 20, 42);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 49);
      doc.text(`Total estudiantes: ${data.length}`, 200, 35);
      
      if (autoTable && autoTable.default) {
        // Usar autoTable si está disponible
        const tableData = data.map(stat => [
          stat.student_name,
          stat.present_count,
          stat.absent_count,
          stat.late_count,
          stat.total_days,
          stat.attendance_percentage + '%',
          stat.status
        ]);
        
        autoTable.default(doc, {
          head: [['Estudiante', 'Presente', 'Faltas', 'Tardanzas', 'Total', '% Asistencia', 'Estado']],
          body: tableData,
          startY: 60,
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
            0: { cellWidth: 60 },
            1: { cellWidth: 25 },
            2: { cellWidth: 25 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 },
            5: { cellWidth: 30 },
            6: { cellWidth: 30 },
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { top: 60, right: 20, bottom: 20, left: 20 },
        });
      } else {
        // Fallback sin autoTable
        let y = 60;
        doc.setFontSize(8);
        
        // Encabezados
        doc.setFont(undefined, 'bold');
        doc.text('ESTUDIANTE', 20, y);
        doc.text('PRESENTE', 90, y);
        doc.text('FALTAS', 120, y);
        doc.text('TARDANZAS', 150, y);
        doc.text('TOTAL', 180, y);
        doc.text('% ASIST.', 210, y);
        doc.text('ESTADO', 240, y);
        
        y += 8;
        doc.setFont(undefined, 'normal');
        
        // Datos
        data.forEach((stat) => {
          doc.text(stat.student_name.substring(0, 25), 20, y);
          doc.text(stat.present_count.toString(), 90, y);
          doc.text(stat.absent_count.toString(), 120, y);
          doc.text(stat.late_count.toString(), 150, y);
          doc.text(stat.total_days.toString(), 180, y);
          doc.text(stat.attendance_percentage + '%', 210, y);
          doc.text(stat.status, 240, y);
          
          y += 6;
          
          if (y > 190) {
            doc.addPage();
            y = 20;
          }
        });
      }
      
      // Descargar el PDF
      doc.save(`asistencia_${classData.name}_periodo_${periodName}_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (err) {
      console.error('Error al generar PDF:', err);
      setError('Error al generar PDF: ' + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const getAttendanceIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle color="success" />;
      case 'absent':
        return <Cancel color="error" />;
      case 'late':
        return <Schedule color="warning" />;
      default:
        return <CheckCircle color="disabled" />;
    }
  };

  const getAttendanceColor = (status) => {
    switch (status) {
      case 'present':
        return 'success';
      case 'absent':
        return 'error';
      case 'late':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getAttendanceLabel = (status) => {
    switch (status) {
      case 'present':
        return 'Presente';
      case 'absent':
        return 'Falta';
      case 'late':
        return 'Tardanza';
      default:
        return 'Presente';
    }
  };

  // Función para formatear el nombre del período (versión simplificada)
  const formatPeriodName = (period) => {
    return `${period.number} - ${period.year}`;
  };

  // Función para formatear fechas correctamente
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T12:00:00'); // Añadir hora para evitar problemas de zona horaria
    return date.toLocaleDateString('es-ES');
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!classData) {
    return (
      <Container maxWidth="lg">
        <Typography color="error">No se pudo cargar la información de la clase</Typography>
        <Button 
          variant="contained" 
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/classes/${classId}`)}
          sx={{ mt: 2 }}
        >
          Volver a la clase
        </Button>
      </Container>
    );
  }

  if (periods.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/classes/${classId}`)}
            sx={{ mb: 3 }}
          >
            Volver a la clase
          </Button>
          
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              No hay períodos asignados a esta clase
            </Typography>
            <Typography>
              Para gestionar asistencia, primero debes asignar períodos a la clase desde el detalle de la clase.
            </Typography>
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/classes/${classId}`)}
            sx={{ mb: 3 }}
          >
            Volver a la clase
          </Button>
          
          <Typography variant="h4" component="h1" gutterBottom>
            Gestionar Asistencia
          </Typography>
          
          <Typography variant="h6" color="textSecondary" gutterBottom>
            {classData.name} - {classData.subject_detail?.name}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Paper sx={{ mb: 4 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="fullWidth"
            >
              <Tab 
                label="Registrar Asistencia" 
                icon={<CalendarToday />}
                disabled={!canManageAttendance}
              />
              <Tab 
                label="Estadísticas" 
                icon={<BarChart />}
                disabled={!canViewAttendance}
              />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {/* Panel de controles */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Período</InputLabel>
                    <Select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      label="Período"
                    >
                      {periods.map(period => (
                        <MenuItem key={period.id} value={period.id}>
                          {formatPeriodName(period)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {activeTab === 0 && (
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Fecha"
                      value={selectedDate}
                      onChange={(newValue) => setSelectedDate(newValue)}
                      shouldDisableDate={shouldDisableDate}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                      disabled={!canManageAttendance || !selectedPeriod}
                    />
                  </Grid>
                )}
              </Grid>

              {/* Contenido de las pestañas */}
              {activeTab === 0 && (
                <Box>
                  {canManageAttendance ? (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">
                          Asistencia del {selectedDate.toLocaleDateString('es-ES')}
                        </Typography>
                        <Button 
                          variant="contained" 
                          color="primary"
                          startIcon={<Save />}
                          onClick={saveAttendance}
                          disabled={saving || !selectedPeriod}
                        >
                          {saving ? <CircularProgress size={24} /> : 'Guardar Asistencia'}
                        </Button>
                      </Box>

                      <TableContainer component={Paper}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Estudiante</TableCell>
                              <TableCell>CI</TableCell>
                              <TableCell align="center">Presente</TableCell>
                              <TableCell align="center">Falta</TableCell>
                              <TableCell align="center">Tardanza</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {classData.students_detail?.map(student => (
                              <TableRow key={student.id}>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Person sx={{ mr: 1 }} />
                                    {student.first_name} {student.last_name}
                                  </Box>
                                </TableCell>
                                <TableCell>{student.ci}</TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    color={dailyAttendances[student.id] === 'present' ? 'success' : 'default'}
                                    onClick={() => handleAttendanceChange(student.id, 'present')}
                                  >
                                    <CheckCircle />
                                  </IconButton>
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    color={dailyAttendances[student.id] === 'absent' ? 'error' : 'default'}
                                    onClick={() => handleAttendanceChange(student.id, 'absent')}
                                  >
                                    <Cancel />
                                  </IconButton>
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    color={dailyAttendances[student.id] === 'late' ? 'warning' : 'default'}
                                    onClick={() => handleAttendanceChange(student.id, 'late')}
                                  >
                                    <Schedule />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  ) : (
                    <Alert severity="info">
                      No tienes permisos para gestionar la asistencia de esta clase.
                    </Alert>
                  )}
                </Box>
              )}

              {activeTab === 1 && (
                <Box>
                  {canViewAttendance ? (
                    <>
                      <Typography variant="h6" gutterBottom>
                        Estadísticas de Asistencia
                        {selectedPeriod && periods.find(p => p.id === selectedPeriod) && 
                          ` - ${formatPeriodName(periods.find(p => p.id === selectedPeriod))}`
                        }
                        {currentUser?.user_type === 'student' && (
                          <Typography variant="subtitle2" color="textSecondary">
                            (Solo tus estadísticas personales)
                          </Typography>
                        )}
                      </Typography>

                      {attendanceStats.length === 0 ? (
                        <Alert severity="info">
                          {currentUser?.user_type === 'student' 
                            ? "No tienes datos de asistencia registrados para este período."
                            : "No hay datos de asistencia registrados para este período."
                          }
                        </Alert>
                      ) : (
                        <>
                          {/* Controles de búsqueda y exportación */}
                          <Paper sx={{ p: 2, mb: 3 }}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                  label="Buscar estudiante"
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  fullWidth
                                  size="small"
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <Search />
                                      </InputAdornment>
                                    ),
                                    endAdornment: searchTerm && (
                                      <InputAdornment position="end">
                                        <IconButton
                                          size="small"
                                          onClick={() => setSearchTerm('')}
                                        >
                                          <Clear />
                                        </IconButton>
                                      </InputAdornment>
                                    )
                                  }}
                                  placeholder="Nombre del estudiante..."
                                />
                              </Grid>
                              
                              <Grid item xs={12} sm={6} md={4}>
                                <Button
                                  variant="outlined"
                                  onClick={() => setSearchTerm('')}
                                  startIcon={<FilterList />}
                                  fullWidth
                                >
                                  Limpiar Búsqueda
                                </Button>
                              </Grid>
                              
                              <Grid item xs={12} md={4}>
                                <ButtonGroup variant="outlined" disabled={exportLoading} fullWidth>
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
                              </Grid>
                            </Grid>
                          </Paper>

                          {exportLoading && <LinearProgress sx={{ mb: 2 }} />}

                          {/* Resumen general - Solo para profesores y admin */}
                          {canManageAttendance && (
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                              <Grid item xs={12} sm={3}>
                                <Card>
                                  <CardContent>
                                    <Typography variant="h6" color="success.main">
                                      Promedio General
                                    </Typography>
                                    <Typography variant="h4">
                                      {filteredStats.length > 0 
                                        ? (filteredStats.reduce((sum, stat) => sum + stat.attendance_percentage, 0) / filteredStats.length).toFixed(1)
                                        : 0}%
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <Card>
                                  <CardContent>
                                    <Typography variant="h6" color="primary.main">
                                      Total Estudiantes
                                    </Typography>
                                    <Typography variant="h4">
                                      {filteredStats.length}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <Card>
                                  <CardContent>
                                    <Typography variant="h6" color="warning.main">
                                      Con Asistencia &lt; 85%
                                    </Typography>
                                    <Typography variant="h4">
                                      {filteredStats.filter(stat => stat.attendance_percentage < 85).length}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <Card>
                                  <CardContent>
                                    <Typography variant="h6" color="error.main">
                                      Con Asistencia &lt; 70%
                                    </Typography>
                                    <Typography variant="h4">
                                      {filteredStats.filter(stat => stat.attendance_percentage < 70).length}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            </Grid>
                          )}

                          {/* Resumen personal para estudiantes */}
                          {currentUser?.user_type === 'student' && filteredStats.length > 0 && (
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                              <Grid item xs={12} sm={3}>
                                <Card>
                                  <CardContent>
                                    <Typography variant="h6" color="success.main">
                                      Tu Asistencia
                                    </Typography>
                                    <Typography variant="h4">
                                      {filteredStats[0].attendance_percentage}%
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <Card>
                                  <CardContent>
                                    <Typography variant="h6" color="primary.main">
                                      Días Presente
                                    </Typography>
                                    <Typography variant="h4">
                                      {filteredStats[0].present_count}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <Card>
                                  <CardContent>
                                    <Typography variant="h6" color="error.main">
                                      Faltas
                                    </Typography>
                                    <Typography variant="h4">
                                      {filteredStats[0].absent_count}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <Card>
                                  <CardContent>
                                    <Typography variant="h6" color="warning.main">
                                      Tardanzas
                                    </Typography>
                                    <Typography variant="h4">
                                      {filteredStats[0].late_count || filteredStats[0].absent_with_excuse_count || 0}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            </Grid>
                          )}

                          {/* Tabla detallada */}
                          <TableContainer component={Paper}>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  {canManageAttendance && (
                                    <TableCell>
                                      <TableSortLabel
                                        active={orderBy === 'student_name'}
                                        direction={orderBy === 'student_name' ? order : 'asc'}
                                        onClick={() => handleRequestSort('student_name')}
                                      >
                                        Estudiante
                                      </TableSortLabel>
                                    </TableCell>
                                  )}
                                  {currentUser?.user_type === 'student' && <TableCell>Mi Asistencia</TableCell>}
                                  <TableCell align="center">
                                    <TableSortLabel
                                      active={orderBy === 'present_count'}
                                      direction={orderBy === 'present_count' ? order : 'asc'}
                                      onClick={() => handleRequestSort('present_count')}
                                    >
                                      Presente
                                    </TableSortLabel>
                                  </TableCell>
                                  <TableCell align="center">
                                    <TableSortLabel
                                      active={orderBy === 'absent_count'}
                                      direction={orderBy === 'absent_count' ? order : 'asc'}
                                      onClick={() => handleRequestSort('absent_count')}
                                    >
                                      Faltas
                                    </TableSortLabel>
                                  </TableCell>
                                  <TableCell align="center">
                                    <TableSortLabel
                                      active={orderBy === 'late_count'}
                                      direction={orderBy === 'late_count' ? order : 'asc'}
                                      onClick={() => handleRequestSort('late_count')}
                                    >
                                      Tardanzas
                                    </TableSortLabel>
                                  </TableCell>
                                  <TableCell align="center">
                                    <TableSortLabel
                                      active={orderBy === 'total_days'}
                                      direction={orderBy === 'total_days' ? order : 'asc'}
                                      onClick={() => handleRequestSort('total_days')}
                                    >
                                      Total Días
                                    </TableSortLabel>
                                  </TableCell>
                                  <TableCell align="center">
                                    <TableSortLabel
                                      active={orderBy === 'attendance_percentage'}
                                      direction={orderBy === 'attendance_percentage' ? order : 'asc'}
                                      onClick={() => handleRequestSort('attendance_percentage')}
                                    >
                                      % Asistencia
                                    </TableSortLabel>
                                  </TableCell>
                                  <TableCell align="center">Estado</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {filteredStats.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={canManageAttendance ? 8 : 7} align="center">
                                      No se encontraron estudiantes
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredStats.map(stat => (
                                    <TableRow key={stat.student_id}>
                                      {canManageAttendance && (
                                        <TableCell>
                                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Person sx={{ mr: 1 }} />
                                            {stat.student_name}
                                          </Box>
                                        </TableCell>
                                      )}
                                      {currentUser?.user_type === 'student' && (
                                        <TableCell>
                                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Person sx={{ mr: 1 }} />
                                            {stat.student_name}
                                          </Box>
                                        </TableCell>
                                      )}
                                      <TableCell align="center">
                                        <Chip 
                                          icon={<CheckCircle />}
                                          label={stat.present_count}
                                          color="success"
                                          variant="outlined"
                                          size="small"
                                        />
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip 
                                          icon={<Cancel />}
                                          label={stat.absent_count}
                                          color="error"
                                          variant="outlined"
                                          size="small"
                                        />
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip 
                                          icon={<Schedule />}
                                          label={stat.late_count || stat.absent_with_excuse_count || 0}
                                          color="warning"
                                          variant="outlined"
                                          size="small"
                                        />
                                      </TableCell>
                                      <TableCell align="center">
                                        {stat.total_days}
                                      </TableCell>
                                      <TableCell align="center">
                                        <Typography 
                                          variant="h6" 
                                          color={
                                            stat.attendance_percentage >= 85 ? 'success.main' :
                                            stat.attendance_percentage >= 70 ? 'warning.main' : 'error.main'
                                          }
                                        >
                                          {stat.attendance_percentage}%
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip 
                                          label={
                                            stat.attendance_percentage >= 85 ? 'Excelente' :
                                            stat.attendance_percentage >= 70 ? 'Regular' : 'Deficiente'
                                          }
                                          color={
                                            stat.attendance_percentage >= 85 ? 'success' :
                                            stat.attendance_percentage >= 70 ? 'warning' : 'error'
                                          }
                                          size="small"
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </>
                      )}
                    </>
                  ) : (
                    <Alert severity="info">
                      No tienes permisos para ver las estadísticas de asistencia de esta clase.
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default AttendanceManagement;