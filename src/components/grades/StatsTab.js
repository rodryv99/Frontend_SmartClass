// Notas por periodo - Versión mejorada con búsqueda, ordenamiento y exportación
import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip, 
  CircularProgress, Alert, Paper, TextField, Button, 
  FormControl, InputLabel, Select, MenuItem, ButtonGroup,
  TableSortLabel
} from '@mui/material';
import { 
  Person, CheckCircle, Cancel, Search, Download, 
  PictureAsPdf, TableChart, Description, Sort
} from '@mui/icons-material';

const StatsTab = ({ 
  canViewGrades, 
  canManageGrades, 
  currentUser, 
  gradeStats, 
  periods, 
  selectedPeriod, 
  formatPeriodName, 
  formatNumber, 
  refreshing 
}) => {
  // Estados para búsqueda y ordenamiento
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('avg_total');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // LOGS DE DEBUG
  console.log("STATSTAB: Renderizando con gradeStats:", gradeStats);
  console.log("STATSTAB: Cantidad de estadísticas:", gradeStats.length);
  
  // Datos filtrados y ordenados
  const filteredAndSortedStats = useMemo(() => {
    if (!Array.isArray(gradeStats)) return [];
    
    let filtered = gradeStats.filter(stat => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      return stat.student_name?.toLowerCase().includes(term);
    });

    // Ordenamiento
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'student_name') {
        aValue = (a.student_name || '').toLowerCase();
        bValue = (b.student_name || '').toLowerCase();
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        aValue = parseFloat(a[sortBy]) || 0;
        bValue = parseFloat(b[sortBy]) || 0;
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return filtered;
  }, [gradeStats, searchTerm, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'student_name' ? 'asc' : 'desc');
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return dateString;
    }
  };

  // Función genérica para obtener datos de exportación
  const getExportData = () => {
    const selectedPeriodData = periods.find(p => p.id === selectedPeriod);
    const periodName = selectedPeriodData ? formatPeriodName(selectedPeriodData) : 'Período Actual';
    
    return {
      title: `Estadísticas de Notas - ${periodName}`,
      data: filteredAndSortedStats,
      timestamp: new Date().toLocaleString('es-ES')
    };
  };

  // Exportar como Excel
  const handleExportExcel = async () => {
    try {
      setLoading(true);
      
      const { title, data, timestamp } = getExportData();
      
      // Importar SheetJS
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');
      
      // Preparar datos para Excel
      const worksheetData = [
        ['ESTADÍSTICAS DE NOTAS POR PERÍODO'],
        [`Generado: ${timestamp}`],
        [`Total estudiantes: ${data.length}`],
        [],
        ['Estudiante', 'Ser (5)', 'Saber (45)', 'Hacer (40)', 'Decidir (5)', 'Autoevaluación (5)', 'Nota Total (100)', 'Aprobados', 'Reprobados'],
        ...data.map(stat => [
          stat.student_name || 'Sin nombre',
          formatNumber(stat.avg_ser),
          formatNumber(stat.avg_saber),
          formatNumber(stat.avg_hacer),
          formatNumber(stat.avg_decidir),
          formatNumber(stat.avg_autoevaluacion),
          formatNumber(stat.avg_total),
          stat.approved_count || 0,
          stat.failed_count || 0
        ])
      ];

      // Crear worksheet y workbook
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Estadísticas');

      // Aplicar estilos básicos
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      
      // Estilo para el título
      if (worksheet['A1']) {
        worksheet['A1'].s = {
          font: { bold: true, sz: 16 },
          alignment: { horizontal: 'center' }
        };
      }
      
      // Estilo para encabezados
      for (let C = range.s.c; C <= range.e.c; C++) {
        const address = XLSX.utils.encode_col(C) + "5";
        if (worksheet[address]) {
          worksheet[address].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "EEEEEE" } }
          };
        }
      }

      // Ajustar ancho de columnas
      worksheet['!cols'] = [
        { wch: 25 }, // Estudiante
        { wch: 10 }, // Ser
        { wch: 12 }, // Saber
        { wch: 12 }, // Hacer
        { wch: 12 }, // Decidir
        { wch: 15 }, // Autoevaluación
        { wch: 15 }, // Total
        { wch: 12 }, // Aprobados
        { wch: 12 }  // Reprobados
      ];

      // Descargar archivo
      XLSX.writeFile(workbook, `estadisticas_notas_${new Date().toISOString().split('T')[0]}.xlsx`);
      
    } catch (err) {
      console.error('Error exporting Excel:', err);
      setError('Error al exportar como Excel');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Exportar como CSV
  const handleExportCSV = async () => {
    try {
      setLoading(true);
      
      const { data } = getExportData();
      
      const headers = [
        'Estudiante', 'Ser (5)', 'Saber (45)', 'Hacer (40)', 'Decidir (5)', 
        'Autoevaluación (5)', 'Nota Total (100)', 'Aprobados', 'Reprobados'
      ];
      
      const rows = data.map(stat => [
        stat.student_name || 'Sin nombre',
        formatNumber(stat.avg_ser),
        formatNumber(stat.avg_saber),
        formatNumber(stat.avg_hacer),
        formatNumber(stat.avg_decidir),
        formatNumber(stat.avg_autoevaluacion),
        formatNumber(stat.avg_total),
        stat.approved_count || 0,
        stat.failed_count || 0
      ]);
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `estadisticas_notas_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Error al exportar como CSV');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Exportar como PDF
  const handleExportPDF = async () => {
    try {
      setLoading(true);
      
      const { title, data, timestamp } = getExportData();
      
      // Importar jsPDF
      const { jsPDF } = await import('jspdf');
      
      try {
        // Intentar con autoTable
        const autoTable = await import('jspdf-autotable');
        
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        
        // Título
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('ESTADÍSTICAS DE NOTAS POR PERÍODO', 148, 20, { align: 'center' });
        
        // Información
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Generado: ${timestamp}`, 20, 35);
        doc.text(`Total estudiantes: ${data.length}`, 20, 42);
        
        // Preparar datos para la tabla
        const tableData = data.map(stat => [
          (stat.student_name || 'Sin nombre').substring(0, 25),
          formatNumber(stat.avg_ser),
          formatNumber(stat.avg_saber),
          formatNumber(stat.avg_hacer),
          formatNumber(stat.avg_decidir),
          formatNumber(stat.avg_autoevaluacion),
          formatNumber(stat.avg_total),
          stat.approved_count || 0,
          stat.failed_count || 0
        ]);
        
        // Usar autoTable
        autoTable.default(doc, {
          head: [['Estudiante', 'Ser', 'Saber', 'Hacer', 'Decidir', 'Auto.', 'Total', 'Apr.', 'Rep.']],
          body: tableData,
          startY: 50,
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 20 },
            2: { cellWidth: 20 },
            3: { cellWidth: 20 },
            4: { cellWidth: 20 },
            5: { cellWidth: 20 },
            6: { cellWidth: 25 },
            7: { cellWidth: 20 },
            8: { cellWidth: 20 },
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { top: 50, right: 20, bottom: 20, left: 20 },
        });
        
        doc.save(`estadisticas_notas_${new Date().toISOString().split('T')[0]}.pdf`);
        
      } catch (autoTableError) {
        // Fallback sin autoTable
        console.warn('AutoTable no disponible, usando método simple');
        
        const doc = new jsPDF('landscape', 'mm', 'a4');
        
        doc.setFontSize(16);
        doc.text('ESTADÍSTICAS DE NOTAS POR PERÍODO', 148, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Generado: ${timestamp} | Total: ${data.length}`, 20, 35);
        
        // Tabla simple
        let y = 50;
        doc.setFontSize(8);
        
        // Encabezados
        doc.setFont(undefined, 'bold');
        doc.text('ESTUDIANTE', 20, y);
        doc.text('SER', 80, y);
        doc.text('SABER', 100, y);
        doc.text('HACER', 120, y);
        doc.text('DECIDIR', 140, y);
        doc.text('AUTO', 160, y);
        doc.text('TOTAL', 180, y);
        doc.text('APR', 200, y);
        doc.text('REP', 220, y);
        
        y += 8;
        doc.setFont(undefined, 'normal');
        
        // Datos (solo primeros 40 para que quepan)
        data.slice(0, 40).forEach((stat) => {
          doc.text((stat.student_name || 'Sin nombre').substring(0, 20), 20, y);
          doc.text(formatNumber(stat.avg_ser), 80, y);
          doc.text(formatNumber(stat.avg_saber), 100, y);
          doc.text(formatNumber(stat.avg_hacer), 120, y);
          doc.text(formatNumber(stat.avg_decidir), 140, y);
          doc.text(formatNumber(stat.avg_autoevaluacion), 160, y);
          doc.text(formatNumber(stat.avg_total), 180, y);
          doc.text(String(stat.approved_count || 0), 200, y);
          doc.text(String(stat.failed_count || 0), 220, y);
          
          y += 6;
          
          if (y > 190) {
            doc.addPage();
            y = 20;
          }
        });
        
        doc.save(`estadisticas_notas_${new Date().toISOString().split('T')[0]}.pdf`);
      }
      
    } catch (err) {
      console.error('Error al generar PDF:', err);
      setError('Error al generar PDF: ' + err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (!canViewGrades) {
    return (
      <Alert severity="info">
        No tienes permisos para ver las estadísticas de notas de esta clase.
      </Alert>
    );
  }

  const selectedPeriodData = periods.find(p => p.id === selectedPeriod);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Estadísticas de Notas - Datos: {filteredAndSortedStats.length} estudiantes
        <Typography variant="caption" display="block" color="textSecondary">
          Última actualización: {new Date().toLocaleTimeString()}
        </Typography>
        {selectedPeriodData && 
          ` - ${formatPeriodName(selectedPeriodData)}`
        }
        {currentUser?.user_type === 'student' && (
          <Typography variant="subtitle2" color="textSecondary">
            (Solo tus estadísticas personales)
          </Typography>
        )}
        {refreshing && (
          <CircularProgress size={20} sx={{ ml: 1 }} />
        )}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {gradeStats.length === 0 ? (
        <Alert severity="info">
          {currentUser?.user_type === 'student' 
            ? "No tienes notas registradas para este período."
            : "No hay notas registradas para este período."
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
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Ordenar por</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    label="Ordenar por"
                  >
                    <MenuItem value="student_name">Nombre</MenuItem>
                    <MenuItem value="avg_total">Nota Total</MenuItem>
                    <MenuItem value="avg_ser">Ser</MenuItem>
                    <MenuItem value="avg_saber">Saber</MenuItem>
                    <MenuItem value="avg_hacer">Hacer</MenuItem>
                    <MenuItem value="avg_decidir">Decidir</MenuItem>
                    <MenuItem value="avg_autoevaluacion">Autoevaluación</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} md={5}>
                <ButtonGroup variant="outlined" disabled={loading || filteredAndSortedStats.length === 0}>
                  <Button 
                    onClick={handleExportExcel}
                    startIcon={<TableChart />}
                    title="Descargar como archivo Excel"
                  >
                    Excel
                  </Button>
                  <Button 
                    onClick={handleExportCSV}
                    startIcon={<Description />}
                    title="Descargar como archivo CSV"
                  >
                    CSV
                  </Button>
                  <Button 
                    onClick={handleExportPDF}
                    startIcon={<PictureAsPdf />}
                    title="Generar PDF para imprimir"
                  >
                    PDF
                  </Button>
                </ButtonGroup>
              </Grid>
            </Grid>
          </Paper>

          {/* Resumen general - Solo para profesores y admin */}
          {canManageGrades && filteredAndSortedStats.length > 0 && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary.main">
                      Promedio General
                    </Typography>
                    <Typography variant="h4">
                      {formatNumber(filteredAndSortedStats.reduce((sum, stat) => sum + stat.avg_total, 0) / filteredAndSortedStats.length)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="success.main">
                      Aprobados
                    </Typography>
                    <Typography variant="h4">
                      {filteredAndSortedStats.reduce((sum, stat) => sum + stat.approved_count, 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="error.main">
                      Reprobados
                    </Typography>
                    <Typography variant="h4">
                      {filteredAndSortedStats.reduce((sum, stat) => sum + stat.failed_count, 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="info.main">
                      Total Estudiantes
                    </Typography>
                    <Typography variant="h4">
                      {filteredAndSortedStats.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Resumen personal para estudiantes */}
          {currentUser?.user_type === 'student' && filteredAndSortedStats.length > 0 && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[
                { label: 'Ser (5)', value: filteredAndSortedStats[0].avg_ser },
                { label: 'Saber (45)', value: filteredAndSortedStats[0].avg_saber },
                { label: 'Hacer (40)', value: filteredAndSortedStats[0].avg_hacer },
                { label: 'Decidir (5)', value: filteredAndSortedStats[0].avg_decidir },
                { label: 'Autoevaluación (5)', value: filteredAndSortedStats[0].avg_autoevaluacion },
                { label: 'Promedio Total (100)', value: filteredAndSortedStats[0].avg_total, color: 'success.main' }
              ].map((item, index) => (
                <Grid item xs={12} sm={2} key={index}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color={item.color || "primary.main"}>
                        {item.label}
                      </Typography>
                      <Typography variant="h4">
                        {formatNumber(item.value)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Tabla detallada */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {canManageGrades && (
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'student_name'}
                        direction={sortBy === 'student_name' ? sortOrder : 'asc'}
                        onClick={() => handleSort('student_name')}
                      >
                        Estudiante
                      </TableSortLabel>
                    </TableCell>
                  )}
                  {currentUser?.user_type === 'student' && <TableCell>Mis Notas</TableCell>}
                  <TableCell align="center">
                    <TableSortLabel
                      active={sortBy === 'avg_ser'}
                      direction={sortBy === 'avg_ser' ? sortOrder : 'desc'}
                      onClick={() => handleSort('avg_ser')}
                    >
                      Ser (5)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">
                    <TableSortLabel
                      active={sortBy === 'avg_saber'}
                      direction={sortBy === 'avg_saber' ? sortOrder : 'desc'}
                      onClick={() => handleSort('avg_saber')}
                    >
                      Saber (45)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">
                    <TableSortLabel
                      active={sortBy === 'avg_hacer'}
                      direction={sortBy === 'avg_hacer' ? sortOrder : 'desc'}
                      onClick={() => handleSort('avg_hacer')}
                    >
                      Hacer (40)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">
                    <TableSortLabel
                      active={sortBy === 'avg_decidir'}
                      direction={sortBy === 'avg_decidir' ? sortOrder : 'desc'}
                      onClick={() => handleSort('avg_decidir')}
                    >
                      Decidir (5)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">
                    <TableSortLabel
                      active={sortBy === 'avg_autoevaluacion'}
                      direction={sortBy === 'avg_autoevaluacion' ? sortOrder : 'desc'}
                      onClick={() => handleSort('avg_autoevaluacion')}
                    >
                      Autoevaluación (5)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">
                    <TableSortLabel
                      active={sortBy === 'avg_total'}
                      direction={sortBy === 'avg_total' ? sortOrder : 'desc'}
                      onClick={() => handleSort('avg_total')}
                    >
                      Nota (100)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">Aprobados</TableCell>
                  <TableCell align="center">Reprobados</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedStats.map(stat => (
                  <TableRow key={stat._key || stat.student_id}>
                    {(canManageGrades || currentUser?.user_type === 'student') && (
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Person sx={{ mr: 1 }} />
                          {stat.student_name}
                        </Box>
                      </TableCell>
                    )}
                    {[
                      stat.avg_ser, stat.avg_saber, stat.avg_hacer, 
                      stat.avg_decidir, stat.avg_autoevaluacion
                    ].map((value, index) => (
                      <TableCell key={index} align="center">
                        <Typography variant="h6">
                          {formatNumber(value)}
                        </Typography>
                      </TableCell>
                    ))}
                    <TableCell align="center">
                      <Typography 
                        variant="h6" 
                        color={
                          stat.avg_total >= 90 ? 'success.main' :
                          stat.avg_total >= 75 ? 'info.main' :
                          stat.avg_total >= 51 ? 'warning.main' : 'error.main'
                        }
                      >
                        {formatNumber(stat.avg_total)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        icon={<CheckCircle />}
                        label={stat.approved_count}
                        color="success"
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        icon={<Cancel />}
                        label={stat.failed_count}
                        color="error"
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredAndSortedStats.length === 0 && searchTerm && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No se encontraron estudiantes que coincidan con "{searchTerm}"
            </Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default StatsTab;