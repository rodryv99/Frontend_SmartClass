import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, Typography, Box, Paper, Grid, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Alert, IconButton, TextField, InputAdornment,
  TableSortLabel, ButtonGroup, LinearProgress
} from '@mui/material';
import { 
  DatePicker, LocalizationProvider 
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { 
  TrendingUp, TrendingFlat, TrendingDown, CalendarToday, 
  BarChart, Person, ArrowBack, Save, Star, Search, Clear,
  TableChart, PictureAsPdf, Description, FilterList,
  Refresh
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { academicService } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const ParticipationManagement = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  
  // Estados principales
  const [classData, setClassData] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState(0);
  
  // Estados para participación
  const [participations, setParticipations] = useState([]);
  const [participationStats, setParticipationStats] = useState([]);
  const [filteredStats, setFilteredStats] = useState([]);
  const [dailyParticipations, setDailyParticipations] = useState({});
  
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
  const canManageParticipation = 
    currentUser?.user_type === 'admin' || 
    (currentUser?.user_type === 'teacher' && 
     classData?.teacher === currentUser?.teacher_profile?.id);

  const canViewParticipation = 
    canManageParticipation || 
    (currentUser?.user_type === 'student' && 
     currentUser?.student_profile?.id && 
     (classData?.students?.includes(currentUser?.student_profile?.id) || 
      classData?.students_detail?.some(student => student.id === currentUser?.student_profile?.id)));

  // Mapeos para BD que mantiene niveles en español
  const frontendToBackend = {
    'high': 'alta',
    'medium': 'media',
    'low': 'baja'
  };

  const backendToFrontend = {
    'alta': 'high',
    'media': 'medium',
    'baja': 'low'
  };

  // Aplicar filtros y ordenamiento
  useEffect(() => {
    let filtered = [...participationStats];

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
        case 'average_score':
          aVal = a.average_score;
          bVal = b.average_score;
          break;
        case 'high_count':
          aVal = a.high_count;
          bVal = b.high_count;
          break;
        case 'medium_count':
          aVal = a.medium_count;
          bVal = b.medium_count;
          break;
        case 'low_count':
          aVal = a.low_count;
          bVal = b.low_count;
          break;
        case 'total_days':
          aVal = a.total_days;
          bVal = b.total_days;
          break;
        case 'average_level':
          // Convertir nivel a número para ordenar
          const levelToNumber = { 'Alta': 3, 'Media': 2, 'Baja': 1 };
          aVal = levelToNumber[a.average_level] || 0;
          bVal = levelToNumber[b.average_level] || 0;
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
  }, [participationStats, searchTerm, orderBy, order]);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Obtener datos de la clase
        const classResponse = await academicService.getClass(classId);
        setClassData(classResponse);
        
        console.log("=== DEPURACIÓN PARTICIPATION MANAGEMENT ===");
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
  
  // Cargar participaciones cuando cambia el período o la fecha
  useEffect(() => {
    if (selectedPeriod && selectedDate) {
      loadParticipationData();
    }
  }, [selectedPeriod, selectedDate]);

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
      loadParticipationStats();
    }
  }, [selectedPeriod, periods]);

  // Auto-seleccionar pestaña de estadísticas para estudiantes
  useEffect(() => {
    if (currentUser?.user_type === 'student' && !canManageParticipation && canViewParticipation) {
      setActiveTab(1); // Ir a estadísticas
    }
  }, [currentUser, canManageParticipation, canViewParticipation]);

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

  const loadParticipationData = async () => {
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      console.log("🔍 Cargando participaciones para:", { classId, selectedPeriod, dateString });
      
      const response = await academicService.getParticipationsByClassAndPeriod(
        classId, 
        selectedPeriod, 
        dateString
      );
      
      console.log('📥 Participaciones cargadas del backend:', response);
      
      // Convertir array a objeto indexado por student_id con mapeo backend -> frontend
      const participationMap = {};
      if (Array.isArray(response)) {
        response.forEach(participation => {
          const backendLevel = participation.level;
          const frontendLevel = backendToFrontend[backendLevel] || backendLevel;
          participationMap[participation.student.toString()] = frontendLevel;
          console.log(`🔄 Estudiante ${participation.student}: ${backendLevel} -> ${frontendLevel}`);
        });
      }
      
      console.log('📊 Mapa de participaciones procesado:', participationMap);
      setDailyParticipations(participationMap);
      
    } catch (err) {
      console.error('❌ Error loading participation data:', err);
      // No mostrar error si simplemente no hay datos
      setDailyParticipations({});
    }
  };

  const loadParticipationStats = async () => {
    try {
      console.log("📊 Cargando estadísticas para:", { classId, selectedPeriod });
      const response = await academicService.getParticipationStats(classId, selectedPeriod);
      console.log('📈 Estadísticas de participación cargadas:', response);
      setParticipationStats(response);
    } catch (err) {
      console.error('❌ Error loading participation stats:', err);
      setParticipationStats([]);
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

  const handleParticipationChange = (studentId, level) => {
    console.log(`🔄 Cambiando participación del estudiante ${studentId} a ${level}`);
    setDailyParticipations(prev => ({
      ...prev,
      [studentId]: level
    }));
  };

  const saveParticipation = async () => {
    if (!canManageParticipation) {
      setError('No tienes permisos para gestionar participación');
      return;
    }

    try {
      setSaving(true);
      
      // Preparar datos para el envío con mapeo frontend -> backend
      const participationData = {
        class_instance: parseInt(classId),
        period: parseInt(selectedPeriod),
        date: selectedDate.toISOString().split('T')[0],
        participations: classData.students_detail.map(student => {
          const frontendLevel = dailyParticipations[student.id] || 'medium';
          
          // DEBUGGING: Verificar que el mapeo es correcto
          console.log(`🔍 Estudiante ${student.id} (${student.first_name} ${student.last_name}): nivel frontend = ${frontendLevel}`);
          
          return {
            student_id: student.id.toString(),
            level: frontendLevel  // Enviar nivel en inglés (frontend)
          };
        })
      };
      
      console.log('📤 Datos de participación a enviar:', participationData);
      console.log('📤 Número de participaciones:', participationData.participations.length);
      
      const response = await academicService.createBulkParticipation(participationData);
      console.log('📥 Respuesta del servidor:', response);
      
      setSuccess('Participación guardada correctamente');
      
      // Recargar datos
      await loadParticipationData();
      await loadParticipationStats();
      
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('❌ Error completo:', err);
      console.error('❌ Respuesta del error:', err.response?.data);
      console.error('❌ Status:', err.response?.status);
      
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.detail || 
                          err.message || 
                          'Error al guardar la participación';
      
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Funciones de exportación
  const getExportData = () => {
    return filteredStats.map(stat => ({
      student_name: stat.student_name,
      high_count: stat.high_count,
      medium_count: stat.medium_count,
      low_count: stat.low_count,
      total_days: stat.total_days,
      average_score: stat.average_score,
      average_level: stat.average_level
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
        ['Estudiante', 'Alta', 'Media', 'Baja', 'Total Días', 'Promedio', 'Nivel Promedio'],
        ...data.map(stat => [
          stat.student_name,
          stat.high_count,
          stat.medium_count,
          stat.low_count,
          stat.total_days,
          stat.average_score,
          stat.average_level
        ])
      ];

      // Crear worksheet y workbook
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Estadísticas Participación');

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
      XLSX.writeFile(workbook, `participacion_${classData.name}_periodo_${periodName}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
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
        'Estudiante', 'Alta', 'Media', 'Baja', 'Total Días', 'Promedio', 'Nivel Promedio'
      ];
      
      const rows = data.map(stat => [
        stat.student_name,
        stat.high_count,
        stat.medium_count,
        stat.low_count,
        stat.total_days,
        stat.average_score,
        stat.average_level
      ]);
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `participacion_${classData.name}_periodo_${periodName}_${new Date().toISOString().split('T')[0]}.csv`);
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
      doc.text('ESTADÍSTICAS DE PARTICIPACIÓN', 148, 20, { align: 'center' });
      
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
          stat.high_count,
          stat.medium_count,
          stat.low_count,
          stat.total_days,
          stat.average_score,
          stat.average_level
        ]);
        
        autoTable.default(doc, {
          head: [['Estudiante', 'Alta', 'Media', 'Baja', 'Total', 'Promedio', 'Nivel']],
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
        doc.text('ALTA', 90, y);
        doc.text('MEDIA', 120, y);
        doc.text('BAJA', 150, y);
        doc.text('TOTAL', 180, y);
        doc.text('PROMEDIO', 210, y);
        doc.text('NIVEL', 240, y);
        
        y += 8;
        doc.setFont(undefined, 'normal');
        
        // Datos
        data.forEach((stat) => {
          doc.text(stat.student_name.substring(0, 25), 20, y);
          doc.text(stat.high_count.toString(), 90, y);
          doc.text(stat.medium_count.toString(), 120, y);
          doc.text(stat.low_count.toString(), 150, y);
          doc.text(stat.total_days.toString(), 180, y);
          doc.text(stat.average_score.toString(), 210, y);
          doc.text(stat.average_level, 240, y);
          
          y += 6;
          
          if (y > 190) {
            doc.addPage();
            y = 20;
          }
        });
      }
      
      // Descargar el PDF
      doc.save(`participacion_${classData.name}_periodo_${periodName}_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (err) {
      console.error('Error al generar PDF:', err);
      setError('Error al generar PDF: ' + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const getParticipationIcon = (level) => {
    switch (level) {
      case 'high':
        return <TrendingUp color="success" />;
      case 'medium':
        return <TrendingFlat color="warning" />;
      case 'low':
        return <TrendingDown color="error" />;
      default:
        return <TrendingFlat color="disabled" />;
    }
  };

  const getParticipationColor = (level) => {
    switch (level) {
      case 'high':
        return 'success';
      case 'medium':
        return 'warning';
      case 'low':
        return 'error';
      default:
        return 'default';
    }
  };

  const getParticipationLabel = (level) => {
    switch (level) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return 'Media';
    }
  };

  const getAverageColor = (averageLevel) => {
    switch (averageLevel) {
      case 'Alta':
        return 'success';
      case 'Media':
        return 'warning';
      case 'Baja':
        return 'error';
      default:
        return 'default';
    }
  };

  // Función para formatear el nombre del período (versión simplificada)
  const formatPeriodName = (period) => {
    return `${period.number} - ${period.year}`;
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
              Para gestionar participación, primero debes asignar períodos a la clase desde el detalle de la clase.
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
            Gestionar Participación
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
                label="Registrar Participación" 
                icon={<CalendarToday />}
                disabled={!canManageParticipation}
              />
              <Tab 
                label="Estadísticas" 
                icon={<BarChart />}
                disabled={!canViewParticipation}
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
                      disabled={!canManageParticipation || !selectedPeriod}
                    />
                  </Grid>
                )}
              </Grid>

              {/* Contenido de las pestañas */}
              {activeTab === 0 && (
                <Box>
                  {canManageParticipation ? (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">
                          Participación del {selectedDate.toLocaleDateString('es-ES')}
                        </Typography>
                        <Button 
                          variant="contained" 
                          color="primary"
                          startIcon={<Save />}
                          onClick={saveParticipation}
                          disabled={saving || !selectedPeriod}
                        >
                          {saving ? <CircularProgress size={24} /> : 'Guardar Participación'}
                        </Button>
                      </Box>

                      {/* Información sobre los niveles */}
                      <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Niveles de Participación:
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item>
                            <Chip 
                              icon={<TrendingUp />}
                              label="Alta: Participación activa y constante"
                              color="success"
                              variant="outlined"
                              size="small"
                            />
                          </Grid>
                          <Grid item>
                            <Chip 
                              icon={<TrendingFlat />}
                              label="Media: Participación moderada"
                              color="warning"
                              variant="outlined"
                              size="small"
                            />
                          </Grid>
                          <Grid item>
                            <Chip 
                              icon={<TrendingDown />}
                              label="Baja: Poca o ninguna participación"
                              color="error"
                              variant="outlined"
                              size="small"
                            />
                          </Grid>
                        </Grid>
                      </Box>

                      <TableContainer component={Paper}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Estudiante</TableCell>
                              <TableCell>CI</TableCell>
                              <TableCell align="center">Alta</TableCell>
                              <TableCell align="center">Media</TableCell>
                              <TableCell align="center">Baja</TableCell>
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
                                    color={dailyParticipations[student.id] === 'high' ? 'success' : 'default'}
                                    onClick={() => handleParticipationChange(student.id, 'high')}
                                  >
                                    <TrendingUp />
                                  </IconButton>
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    color={dailyParticipations[student.id] === 'medium' ? 'warning' : 'default'}
                                    onClick={() => handleParticipationChange(student.id, 'medium')}
                                  >
                                    <TrendingFlat />
                                  </IconButton>
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    color={dailyParticipations[student.id] === 'low' ? 'error' : 'default'}
                                    onClick={() => handleParticipationChange(student.id, 'low')}
                                  >
                                    <TrendingDown />
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
                      No tienes permisos para gestionar la participación de esta clase.
                    </Alert>
                  )}
                </Box>
              )}

              {activeTab === 1 && (
                <Box>
                  {canViewParticipation ? (
                    <>
                      <Typography variant="h6" gutterBottom>
                        Estadísticas de Participación
                        {selectedPeriod && periods.find(p => p.id === selectedPeriod) && 
                          ` - ${formatPeriodName(periods.find(p => p.id === selectedPeriod))}`
                        }
                        {currentUser?.user_type === 'student' && (
                          <Typography variant="subtitle2" color="textSecondary">
                            (Solo tus estadísticas personales)
                          </Typography>
                        )}
                      </Typography>

                      {participationStats.length === 0 ? (
                        <Alert severity="info">
                          {currentUser?.user_type === 'student' 
                            ? "No tienes datos de participación registrados para este período."
                            : "No hay datos de participación registrados para este período."
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
                          {canManageParticipation && (
                            <Grid container spacing={3} sx={{ mb: 4 }}>
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
                                    <Typography variant="h6" color="success.main">
                                      Participación Alta
                                    </Typography>
                                    <Typography variant="h4">
                                      {filteredStats.filter(stat => stat.average_level === 'Alta').length}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <Card>
                                  <CardContent>
                                    <Typography variant="h6" color="warning.main">
                                      Participación Media
                                    </Typography>
                                    <Typography variant="h4">
                                      {filteredStats.filter(stat => stat.average_level === 'Media').length}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <Card>
                                  <CardContent>
                                    <Typography variant="h6" color="error.main">
                                      Participación Baja
                                    </Typography>
                                    <Typography variant="h4">
                                      {filteredStats.filter(stat => stat.average_level === 'Baja').length}
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
                                    <Typography variant="h6" color="primary.main">
                                      Tu Nivel Promedio
                                    </Typography>
                                    <Typography variant="h4">
                                      {filteredStats[0].average_level}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <Card>
                                  <CardContent>
                                    <Typography variant="h6" color="success.main">
                                      Participación Alta
                                    </Typography>
                                    <Typography variant="h4">
                                      {filteredStats[0].high_count}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <Card>
                                  <CardContent>
                                    <Typography variant="h6" color="warning.main">
                                      Participación Media
                                    </Typography>
                                    <Typography variant="h4">
                                      {filteredStats[0].medium_count}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <Card>
                                  <CardContent>
                                    <Typography variant="h6" color="error.main">
                                      Participación Baja
                                    </Typography>
                                    <Typography variant="h4">
                                      {filteredStats[0].low_count}
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
                                  {canManageParticipation && (
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
                                  {currentUser?.user_type === 'student' && <TableCell>Mi Participación</TableCell>}
                                  <TableCell align="center">
                                    <TableSortLabel
                                      active={orderBy === 'high_count'}
                                      direction={orderBy === 'high_count' ? order : 'asc'}
                                      onClick={() => handleRequestSort('high_count')}
                                    >
                                      Alta
                                    </TableSortLabel>
                                  </TableCell>
                                  <TableCell align="center">
                                    <TableSortLabel
                                      active={orderBy === 'medium_count'}
                                      direction={orderBy === 'medium_count' ? order : 'asc'}
                                      onClick={() => handleRequestSort('medium_count')}
                                    >
                                      Media
                                    </TableSortLabel>
                                  </TableCell>
                                  <TableCell align="center">
                                    <TableSortLabel
                                      active={orderBy === 'low_count'}
                                      direction={orderBy === 'low_count' ? order : 'asc'}
                                      onClick={() => handleRequestSort('low_count')}
                                    >
                                      Baja
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
                                      active={orderBy === 'average_score'}
                                      direction={orderBy === 'average_score' ? order : 'asc'}
                                      onClick={() => handleRequestSort('average_score')}
                                    >
                                      Promedio
                                    </TableSortLabel>
                                  </TableCell>
                                  <TableCell align="center">
                                    <TableSortLabel
                                      active={orderBy === 'average_level'}
                                      direction={orderBy === 'average_level' ? order : 'asc'}
                                      onClick={() => handleRequestSort('average_level')}
                                    >
                                      Nivel Promedio
                                    </TableSortLabel>
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {filteredStats.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={canManageParticipation ? 8 : 7} align="center">
                                      No se encontraron estudiantes
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredStats.map(stat => (
                                    <TableRow key={stat.student_id}>
                                      {canManageParticipation && (
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
                                          icon={<TrendingUp />}
                                          label={stat.high_count}
                                          color="success"
                                          variant="outlined"
                                          size="small"
                                        />
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip 
                                          icon={<TrendingFlat />}
                                          label={stat.medium_count}
                                          color="warning"
                                          variant="outlined"
                                          size="small"
                                        />
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip 
                                          icon={<TrendingDown />}
                                          label={stat.low_count}
                                          color="error"
                                          variant="outlined"
                                          size="small"
                                        />
                                      </TableCell>
                                      <TableCell align="center">
                                        {stat.total_days}
                                      </TableCell>
                                      <TableCell align="center">
                                        <Typography variant="h6">
                                          {stat.average_score}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip 
                                          icon={getParticipationIcon(
                                            stat.average_level === 'Alta' ? 'high' :
                                            stat.average_level === 'Media' ? 'medium' : 'low'
                                          )}
                                          label={stat.average_level}
                                          color={getAverageColor(stat.average_level)}
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
                      No tienes permisos para ver las estadísticas de participación de esta clase.
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

export default ParticipationManagement;