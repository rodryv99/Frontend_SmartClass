//Notas finales - Versión mejorada con búsqueda, ordenamiento y exportación
import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip, 
  CircularProgress, Alert, Paper, Button, Collapse, IconButton,
  TextField, FormControl, InputLabel, Select, MenuItem, ButtonGroup,
  TableSortLabel
} from '@mui/material';
import { 
  Person, CheckCircle, Cancel, TrendingUp, ExpandMore, ExpandLess,
  Search, PictureAsPdf, TableChart, Description
} from '@mui/icons-material';

const FinalGradesTab = ({ 
  canViewGrades, 
  canManageGrades, 
  currentUser, 
  finalGrades, 
  expandedStudents,
  saving, 
  setSaving, 
  setSuccess, 
  setError, 
  classId, 
  loadFinalGrades, 
  refreshAllData,
  toggleStudentExpansion, 
  getGradeColor, 
  getGradeLabel, 
  formatNumber, 
  refreshing,
  gradeService 
}) => {
  // Estados para búsqueda y ordenamiento
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('nota_final');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('');
  const [exportType, setExportType] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Datos filtrados y ordenados
  const filteredAndSortedGrades = useMemo(() => {
    if (!Array.isArray(finalGrades)) return [];
    
    let filtered = finalGrades.filter(grade => {
      // Filtro por nombre
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const fullName = `${grade.student_detail?.first_name || ''} ${grade.student_detail?.last_name || ''}`.toLowerCase();
        if (!fullName.includes(term)) return false;
      }
      
      // Filtro por estado
      if (statusFilter && statusFilter !== grade.estado_final) {
        return false;
      }
      
      return true;
    });

    // Ordenamiento
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'student_name') {
        aValue = `${a.student_detail?.first_name || ''} ${a.student_detail?.last_name || ''}`.toLowerCase();
        bValue = `${b.student_detail?.first_name || ''} ${b.student_detail?.last_name || ''}`.toLowerCase();
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else if (sortBy === 'nota_final') {
        aValue = parseFloat(a.nota_final) || 0;
        bValue = parseFloat(b.nota_final) || 0;
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      } else if (sortBy === 'periods_count') {
        aValue = parseInt(a.periods_count) || 0;
        bValue = parseInt(b.periods_count) || 0;
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    return filtered;
  }, [finalGrades, searchTerm, sortBy, sortOrder, statusFilter]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'student_name' ? 'asc' : 'desc');
    }
  };

  // Función genérica para obtener datos de exportación
  const getExportData = (includeDetails = false) => {
    const data = filteredAndSortedGrades;
    
    if (!includeDetails) {
      return {
        title: 'Notas Finales de la Clase',
        data: data,
        timestamp: new Date().toLocaleString('es-ES'),
        summary: {
          total: data.length,
          approved: data.filter(g => g.estado_final === 'approved').length,
          failed: data.filter(g => g.estado_final === 'failed').length,
          average: data.length > 0 
            ? data.reduce((sum, g) => sum + g.nota_final, 0) / data.length 
            : 0
        }
      };
    }
    
    // Crear datos detallados con notas por período
    const detailedData = [];
    data.forEach(grade => {
      const studentName = `${grade.student_detail?.first_name || ''} ${grade.student_detail?.last_name || ''}`.trim();
      
      if (grade.period_grades && grade.period_grades.length > 0) {
        grade.period_grades.forEach(periodGrade => {
          detailedData.push({
            estudiante: studentName,
            nota_final: grade.nota_final,
            estado_final: grade.estado_final === 'approved' ? 'APROBADO' : 'REPROBADO',
            calificacion_final: getGradeLabel(grade.nota_final),
            periodo_tipo: periodGrade.period.period_type === 'bimester' ? 'Bimestre' : 'Trimestre',
            periodo_numero: periodGrade.period.number,
            nota_periodo: periodGrade.nota_total,
            estado_periodo: periodGrade.estado
          });
        });
      } else {
        // Si no hay períodos, agregar solo la fila del estudiante
        detailedData.push({
          estudiante: studentName,
          nota_final: grade.nota_final,
          estado_final: grade.estado_final === 'approved' ? 'APROBADO' : 'REPROBADO',
          calificacion_final: getGradeLabel(grade.nota_final),
          periodo_tipo: 'Sin períodos',
          periodo_numero: '-',
          nota_periodo: '-',
          estado_periodo: '-'
        });
      }
    });
    
    return {
      title: 'Notas Finales de la Clase - Detalle por Períodos',
      data: data,
      detailedData: detailedData,
      timestamp: new Date().toLocaleString('es-ES'),
      summary: {
        total: data.length,
        approved: data.filter(g => g.estado_final === 'approved').length,
        failed: data.filter(g => g.estado_final === 'failed').length,
        average: data.length > 0 
          ? data.reduce((sum, g) => sum + g.nota_final, 0) / data.length 
          : 0
      }
    };
  };

  // Exportar como Excel
  const handleExportExcel = async () => {
    try {
      setLoading(true);
      
      const includeDetails = exportType === 'detailed';
      const exportData = getExportData(includeDetails);
      const { data, detailedData, timestamp, summary } = exportData;
      
      // Importar SheetJS
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');
      
      const workbook = XLSX.utils.book_new();
      
      if (!includeDetails) {
        // Exportación resumen
        const worksheetData = [
          ['NOTAS FINALES DE LA CLASE'],
          [`Generado: ${timestamp}`],
          [`Total estudiantes: ${summary.total}`],
          [`Aprobados: ${summary.approved} | Reprobados: ${summary.failed}`],
          [`Promedio general: ${formatNumber(summary.average)}`],
          [],
          ['Estudiante', 'Nota Final', 'Estado Final', 'Períodos Evaluados', 'Calificación'],
          ...data.map(grade => [
            `${grade.student_detail?.first_name || ''} ${grade.student_detail?.last_name || ''}`.trim(),
            formatNumber(grade.nota_final),
            grade.estado_final === 'approved' ? 'APROBADO' : 'REPROBADO',
            `${grade.periods_count} período${grade.periods_count !== 1 ? 's' : ''}`,
            getGradeLabel(grade.nota_final)
          ])
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Notas Finales');
        
        // Aplicar estilos básicos
        if (worksheet['A1']) {
          worksheet['A1'].s = {
            font: { bold: true, sz: 16 },
            alignment: { horizontal: 'center' }
          };
        }
        
        // Ajustar ancho de columnas
        worksheet['!cols'] = [
          { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }
        ];
        
      } else {
        // Exportación detallada con dos hojas
        
        // Hoja 1: Resumen
        const summaryData = [
          ['RESUMEN - NOTAS FINALES DE LA CLASE'],
          [`Generado: ${timestamp}`],
          [`Total estudiantes: ${summary.total}`],
          [`Aprobados: ${summary.approved} | Reprobados: ${summary.failed}`],
          [`Promedio general: ${formatNumber(summary.average)}`],
          [],
          ['Estudiante', 'Nota Final', 'Estado Final', 'Calificación'],
          ...data.map(grade => [
            `${grade.student_detail?.first_name || ''} ${grade.student_detail?.last_name || ''}`.trim(),
            formatNumber(grade.nota_final),
            grade.estado_final === 'approved' ? 'APROBADO' : 'REPROBADO',
            getGradeLabel(grade.nota_final)
          ])
        ];
        
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
        
        // Hoja 2: Detalle por períodos
        const detailData = [
          ['DETALLE POR PERÍODOS'],
          [`Generado: ${timestamp}`],
          [],
          ['Estudiante', 'Nota Final', 'Estado Final', 'Calificación Final', 'Tipo Período', 'Número', 'Nota Período', 'Estado Período'],
          ...detailedData.map(detail => [
            detail.estudiante,
            detail.nota_final,
            detail.estado_final,
            detail.calificacion_final,
            detail.periodo_tipo,
            detail.periodo_numero,
            detail.nota_periodo,
            detail.estado_periodo
          ])
        ];
        
        const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
        XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detalle por Períodos');
        
        // Aplicar estilos a ambas hojas
        if (summarySheet['A1']) {
          summarySheet['A1'].s = {
            font: { bold: true, sz: 16 },
            alignment: { horizontal: 'center' }
          };
        }
        
        if (detailSheet['A1']) {
          detailSheet['A1'].s = {
            font: { bold: true, sz: 16 },
            alignment: { horizontal: 'center' }
          };
        }
        
        // Ajustar anchos de columnas
        summarySheet['!cols'] = [
          { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
        ];
        
        detailSheet['!cols'] = [
          { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, 
          { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 15 }
        ];
      }

      // Descargar archivo
      const fileName = includeDetails 
        ? `notas_finales_detallado_${new Date().toISOString().split('T')[0]}.xlsx`
        : `notas_finales_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      XLSX.writeFile(workbook, fileName);
      
    } catch (err) {
      console.error('Error exporting Excel:', err);
      setLocalError('Error al exportar como Excel');
      setTimeout(() => setLocalError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Exportar como CSV
  const handleExportCSV = async () => {
    try {
      setLoading(true);
      
      const includeDetails = exportType === 'detailed';
      const exportData = getExportData(includeDetails);
      
      let csvContent = '';
      let fileName = '';
      
      if (!includeDetails) {
        // CSV Resumen
        const { data } = exportData;
        const headers = [
          'Estudiante', 'Nota Final', 'Estado Final', 'Períodos Evaluados', 'Calificación'
        ];
        
        const rows = data.map(grade => [
          `${grade.student_detail?.first_name || ''} ${grade.student_detail?.last_name || ''}`.trim(),
          formatNumber(grade.nota_final),
          grade.estado_final === 'approved' ? 'APROBADO' : 'REPROBADO',
          `${grade.periods_count} período${grade.periods_count !== 1 ? 's' : ''}`,
          getGradeLabel(grade.nota_final)
        ]);
        
        csvContent = [headers, ...rows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');
          
        fileName = `notas_finales_${new Date().toISOString().split('T')[0]}.csv`;
        
      } else {
        // CSV Detallado
        const { detailedData } = exportData;
        const headers = [
          'Estudiante', 'Nota Final', 'Estado Final', 'Calificación Final', 
          'Tipo Período', 'Número Período', 'Nota Período', 'Estado Período'
        ];
        
        const rows = detailedData.map(detail => [
          detail.estudiante,
          detail.nota_final,
          detail.estado_final,
          detail.calificacion_final,
          detail.periodo_tipo,
          detail.periodo_numero,
          detail.nota_periodo,
          detail.estado_periodo
        ]);
        
        csvContent = [headers, ...rows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');
          
        fileName = `notas_finales_detallado_${new Date().toISOString().split('T')[0]}.csv`;
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setLocalError('Error al exportar como CSV');
      setTimeout(() => setLocalError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Exportar como PDF
  const handleExportPDF = async () => {
    try {
      setLoading(true);
      
      const includeDetails = exportType === 'detailed';
      const exportData = getExportData(includeDetails);
      const { data, detailedData, timestamp, summary } = exportData;
      
      // Importar jsPDF
      const { jsPDF } = await import('jspdf');
      
      try {
        // Intentar con autoTable
        const autoTable = await import('jspdf-autotable');
        
        const doc = new jsPDF({
          orientation: includeDetails ? 'landscape' : 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        if (!includeDetails) {
          // PDF Resumen
          doc.setFontSize(18);
          doc.setFont(undefined, 'bold');
          doc.text('NOTAS FINALES DE LA CLASE', 105, 20, { align: 'center' });
          
          doc.setFontSize(12);
          doc.setFont(undefined, 'normal');
          doc.text(`Generado: ${timestamp}`, 20, 35);
          doc.text(`Total estudiantes: ${summary.total}`, 20, 42);
          doc.text(`Aprobados: ${summary.approved} | Reprobados: ${summary.failed}`, 20, 49);
          doc.text(`Promedio general: ${formatNumber(summary.average)}`, 20, 56);
          
          const tableData = data.map(grade => [
            (`${grade.student_detail?.first_name || ''} ${grade.student_detail?.last_name || ''}`.trim()).substring(0, 30),
            formatNumber(grade.nota_final),
            grade.estado_final === 'approved' ? 'APROBADO' : 'REPROBADO',
            `${grade.periods_count}`,
            getGradeLabel(grade.nota_final).substring(0, 15)
          ]);
          
          autoTable.default(doc, {
            head: [['Estudiante', 'Nota Final', 'Estado', 'Períodos', 'Calificación']],
            body: tableData,
            startY: 65,
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
            columnStyles: {
              0: { cellWidth: 60 }, 1: { cellWidth: 25 }, 2: { cellWidth: 30 }, 
              3: { cellWidth: 25 }, 4: { cellWidth: 40 }
            },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { top: 65, right: 20, bottom: 20, left: 20 }
          });
          
        } else {
          // PDF Detallado
          doc.setFontSize(16);
          doc.setFont(undefined, 'bold');
          doc.text('NOTAS FINALES - DETALLE POR PERÍODOS', 148, 20, { align: 'center' });
          
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
          doc.text(`Generado: ${timestamp}`, 20, 35);
          doc.text(`Total: ${summary.total} | Aprobados: ${summary.approved} | Reprobados: ${summary.failed}`, 20, 42);
          doc.text(`Promedio: ${formatNumber(summary.average)}`, 20, 49);
          
          const tableData = detailedData.map(detail => [
            detail.estudiante.substring(0, 20),
            detail.nota_final,
            detail.estado_final === 'APROBADO' ? 'APR' : 'REP',
            detail.periodo_tipo.substring(0, 8),
            detail.periodo_numero,
            detail.nota_periodo,
            detail.estado_periodo.substring(0, 8)
          ]);
          
          autoTable.default(doc, {
            head: [['Estudiante', 'Nota Final', 'Estado', 'Tipo', 'Nº', 'Nota Per.', 'Estado Per.']],
            body: tableData,
            startY: 55,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
            columnStyles: {
              0: { cellWidth: 50 }, 1: { cellWidth: 20 }, 2: { cellWidth: 20 }, 
              3: { cellWidth: 25 }, 4: { cellWidth: 15 }, 5: { cellWidth: 20 }, 6: { cellWidth: 25 }
            },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { top: 55, right: 20, bottom: 20, left: 20 }
          });
        }
        
        const fileName = includeDetails 
          ? `notas_finales_detallado_${new Date().toISOString().split('T')[0]}.pdf`
          : `notas_finales_${new Date().toISOString().split('T')[0]}.pdf`;
          
        doc.save(fileName);
        
      } catch (autoTableError) {
        // Fallback sin autoTable
        console.warn('AutoTable no disponible, usando método simple');
        
        const doc = new jsPDF(includeDetails ? 'landscape' : 'portrait', 'mm', 'a4');
        
        doc.setFontSize(16);
        doc.text('NOTAS FINALES DE LA CLASE', includeDetails ? 148 : 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Generado: ${timestamp}`, 20, 35);
        doc.text(`Total: ${summary.total} | Aprobados: ${summary.approved} | Reprobados: ${summary.failed}`, 20, 42);
        doc.text(`Promedio: ${formatNumber(summary.average)}`, 20, 49);
        
        let y = 60;
        doc.setFontSize(8);
        
        if (!includeDetails) {
          // Tabla simple resumen
          doc.setFont(undefined, 'bold');
          doc.text('ESTUDIANTE', 20, y);
          doc.text('NOTA', 100, y);
          doc.text('ESTADO', 130, y);
          doc.text('PERÍODOS', 160, y);
          
          y += 8;
          doc.setFont(undefined, 'normal');
          
          data.slice(0, 30).forEach((grade) => {
            const studentName = (`${grade.student_detail?.first_name || ''} ${grade.student_detail?.last_name || ''}`.trim()).substring(0, 25);
            doc.text(studentName, 20, y);
            doc.text(formatNumber(grade.nota_final), 100, y);
            doc.text(grade.estado_final === 'approved' ? 'APROBADO' : 'REPROBADO', 130, y);
            doc.text(String(grade.periods_count), 160, y);
            
            y += 7;
            if (y > 270) { doc.addPage(); y = 20; }
          });
        } else {
          // Tabla simple detallada
          doc.setFont(undefined, 'bold');
          doc.text('ESTUDIANTE', 20, y);
          doc.text('NOTA FINAL', 80, y);
          doc.text('PERÍODO', 120, y);
          doc.text('NOTA PER.', 150, y);
          doc.text('ESTADO', 180, y);
          
          y += 8;
          doc.setFont(undefined, 'normal');
          
          detailedData.slice(0, 50).forEach((detail) => {
            doc.text(detail.estudiante.substring(0, 15), 20, y);
            doc.text(String(detail.nota_final), 80, y);
            doc.text(`${detail.periodo_tipo.substring(0, 4)} ${detail.periodo_numero}`, 120, y);
            doc.text(String(detail.nota_periodo), 150, y);
            doc.text(detail.estado_periodo.substring(0, 8), 180, y);
            
            y += 6;
            if (y > 190) { doc.addPage(); y = 20; }
          });
        }
        
        const fileName = includeDetails 
          ? `notas_finales_detallado_${new Date().toISOString().split('T')[0]}.pdf`
          : `notas_finales_${new Date().toISOString().split('T')[0]}.pdf`;
          
        doc.save(fileName);
      }
      
    } catch (err) {
      console.error('Error al generar PDF:', err);
      setLocalError('Error al generar PDF: ' + err.message);
      setTimeout(() => setLocalError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateFinalGrades = async () => {
    try {
      setSaving(true);
      await gradeService.recalculateFinalGrades(classId);
      await refreshAllData();
      setSuccess('Notas finales recalculadas correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al recalcular notas finales');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (!canViewGrades) {
    return (
      <Alert severity="info">
        No tienes permisos para ver las notas finales de esta clase.
      </Alert>
    );
  }

  if (finalGrades.length === 0) {
    return (
      <Alert severity="info">
        {currentUser?.user_type === 'student' 
          ? "No tienes una nota final calculada aún."
          : "No hay notas finales calculadas para esta clase."
        }
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Notas Finales de la Clase - {filteredAndSortedGrades.length} estudiantes
        {currentUser?.user_type === 'student' && (
          <Typography variant="subtitle2" color="textSecondary">
            (Solo tu nota final)
          </Typography>
        )}
        {refreshing && (
          <CircularProgress size={20} sx={{ ml: 1 }} />
        )}
      </Typography>

      {localError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLocalError(null)}>
          {localError}
        </Alert>
      )}

      {/* Controles de búsqueda, filtros y exportación */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
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
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Estado"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="approved">Aprobados</MenuItem>
                <MenuItem value="failed">Reprobados</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de exportación</InputLabel>
              <Select
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
                label="Tipo de exportación"
              >
                <MenuItem value="summary">Resumen</MenuItem>
                <MenuItem value="detailed">Detallado con períodos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Ordenar por</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Ordenar por"
              >
                <MenuItem value="student_name">Nombre</MenuItem>
                <MenuItem value="nota_final">Nota Final</MenuItem>
                <MenuItem value="periods_count">Períodos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <ButtonGroup 
              variant="outlined" 
              disabled={loading || filteredAndSortedGrades.length === 0}
              size="small"
            >
              <Button 
                onClick={handleExportExcel}
                startIcon={<TableChart />}
                title={exportType === 'detailed' ? "Excel con detalles por períodos" : "Excel resumen"}
              >
                Excel
              </Button>
              <Button 
                onClick={handleExportCSV}
                startIcon={<Description />}
                title={exportType === 'detailed' ? "CSV con detalles por períodos" : "CSV resumen"}
              >
                CSV
              </Button>
              <Button 
                onClick={handleExportPDF}
                startIcon={<PictureAsPdf />}
                title={exportType === 'detailed' ? "PDF con detalles por períodos" : "PDF resumen"}
              >
                PDF
              </Button>
            </ButtonGroup>
          </Grid>
        </Grid>
      </Paper>

      {/* Resumen general - Solo para profesores y admin */}
      {canManageGrades && filteredAndSortedGrades.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">
                  {formatNumber(filteredAndSortedGrades.reduce((sum, grade) => sum + grade.nota_final, 0) / filteredAndSortedGrades.length)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  Aprobados Final
                </Typography>
                <Typography variant="h4">
                  {filteredAndSortedGrades.filter(grade => grade.estado_final === 'approved').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="error.main">
                  Reprobados Final
                </Typography>
                <Typography variant="h4">
                  {filteredAndSortedGrades.filter(grade => grade.estado_final === 'failed').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  % Aprobación
                </Typography>
                <Typography variant="h4">
                  {formatNumber((filteredAndSortedGrades.filter(grade => grade.estado_final === 'approved').length / filteredAndSortedGrades.length) * 100)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Botón para recalcular - Solo para profesores y admin */}
      {canManageGrades && (
        <Box sx={{ mb: 3 }}>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<TrendingUp />}
            onClick={handleRecalculateFinalGrades}
            disabled={saving || refreshing}
          >
            {saving ? <CircularProgress size={24} /> : 'Recalcular Notas Finales'}
          </Button>
        </Box>
      )}

      {/* Tabla de notas finales */}
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
              {currentUser?.user_type === 'student' && <TableCell>Mi Nota Final</TableCell>}
              <TableCell align="center">
                <TableSortLabel
                  active={sortBy === 'nota_final'}
                  direction={sortBy === 'nota_final' ? sortOrder : 'desc'}
                  onClick={() => handleSort('nota_final')}
                >
                  Nota Final
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Estado Final</TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortBy === 'periods_count'}
                  direction={sortBy === 'periods_count' ? sortOrder : 'desc'}
                  onClick={() => handleSort('periods_count')}
                >
                  Períodos Evaluados
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Calificación</TableCell>
              <TableCell align="center">Detalles</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedGrades.map(finalGrade => (
              <React.Fragment key={finalGrade._key || finalGrade.id}>
                <TableRow>
                  {(canManageGrades || currentUser?.user_type === 'student') && (
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Person sx={{ mr: 1 }} />
                        {finalGrade.student_detail.first_name} {finalGrade.student_detail.last_name}
                      </Box>
                    </TableCell>
                  )}
                  <TableCell align="center">
                    <Typography 
                      variant="h5" 
                      color={
                        finalGrade.nota_final >= 90 ? 'success.main' :
                        finalGrade.nota_final >= 75 ? 'info.main' :
                        finalGrade.nota_final >= 51 ? 'warning.main' : 'error.main'
                      }
                    >
                      {formatNumber(finalGrade.nota_final)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      icon={finalGrade.estado_final === 'approved' ? <CheckCircle /> : <Cancel />}
                      label={finalGrade.estado_final === 'approved' ? 'APROBADO' : 'REPROBADO'}
                      color={finalGrade.estado_final === 'approved' ? 'success' : 'error'}
                      size="medium"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body1">
                      {finalGrade.periods_count} período{finalGrade.periods_count !== 1 ? 's' : ''}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={getGradeLabel(finalGrade.nota_final)}
                      color={getGradeColor(finalGrade.nota_final)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={() => toggleStudentExpansion(finalGrade.student)}
                      size="small"
                    >
                      {expandedStudents[finalGrade.student] ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </TableCell>
                </TableRow>
                
                {/* Fila expandible con detalles */}
                <TableRow>
                  <TableCell 
                    style={{ paddingBottom: 0, paddingTop: 0 }} 
                    colSpan={canManageGrades ? 7 : 6}
                  >
                    <Collapse 
                      in={expandedStudents[finalGrade.student]} 
                      timeout="auto" 
                      unmountOnExit
                    >
                      <Box sx={{ margin: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          Notas por Período
                        </Typography>
                        {finalGrade.period_grades && finalGrade.period_grades.length > 0 ? (
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Período</TableCell>
                                <TableCell align="center">Total</TableCell>
                                <TableCell align="center">Estado</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {finalGrade.period_grades.map((periodGrade, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <Chip
                                      label={`${periodGrade.period.period_type === 'bimester' ? 'Bim' : 'Trim'} ${periodGrade.period.number}`}
                                      color={periodGrade.period.period_type === 'bimester' ? 'primary' : 'secondary'}
                                      size="small"
                                      variant="outlined"
                                    />
                                  </TableCell>
                                  <TableCell align="center">
                                    <Typography
                                      variant="body2"
                                      color={
                                        periodGrade.nota_total >= 90 ? 'success.main' :
                                        periodGrade.nota_total >= 75 ? 'info.main' :
                                        periodGrade.nota_total >= 51 ? 'warning.main' : 'error.main'
                                      }
                                      fontWeight="bold"
                                    >
                                      {formatNumber(periodGrade.nota_total)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Chip
                                      label={periodGrade.estado}
                                      color={periodGrade.estado === 'Aprobado' ? 'success' : 'error'}
                                      size="small"
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No hay notas registradas para este estudiante
                          </Typography>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredAndSortedGrades.length === 0 && (searchTerm || statusFilter) && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No se encontraron estudiantes que coincidan con los filtros aplicados
        </Alert>
      )}
    </Box>
  );
};

export default FinalGradesTab;