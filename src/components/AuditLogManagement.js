// src/components/AuditLogManagement.js - Versión con filtros corregidos y exportación mejorada
import React, { useState, useEffect, useContext } from 'react';
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, TextField,
  Button, Grid, FormControl, InputLabel, Select, MenuItem,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Card, CardContent, Divider, IconButton, Tooltip,
  LinearProgress, CircularProgress, ButtonGroup
} from '@mui/material';
import {
  Search, FilterList, Download, Security, Refresh,
  Info, Error, CheckCircle, Warning, Visibility,
  PictureAsPdf, TableChart, Description
} from '@mui/icons-material';

import { auditService } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const AuditLogManagement = () => {
  const { currentUser } = useContext(AuthContext);

  // Estados para datos
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [actionChoices, setActionChoices] = useState([]);
  
  // Estados para UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  
  // Estados para filtros (corregidos)
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    date_from: '',  // Corregido de dateFrom a date_from
    date_to: '',    // Corregido de dateTo a date_to
    username: '',
    ip_address: '', // Corregido de ipAddress a ip_address
    success: '',
    content_type: '' // Corregido de contentType a content_type
  });
  
  // Estados para modales
  const [selectedLog, setSelectedLog] = useState(null);
  const [showLogDetail, setShowLogDetail] = useState(false);

  // Función para formatear fechas correctamente
  const formatDate = (dateString) => {
    try {
      // Crear fecha desde string ISO
      const date = new Date(dateString);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return dateString; // Retornar original si no es válida
      }
      
      // Formatear a hora local de Bolivia (UTC-4)
      const boliviaOffset = -4 * 60; // UTC-4 en minutos
      const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
      const boliviaTime = new Date(utc + (boliviaOffset * 60000));
      
      // Formatear como DD/MM/YYYY HH:MM:SS
      const day = boliviaTime.getDate().toString().padStart(2, '0');
      const month = (boliviaTime.getMonth() + 1).toString().padStart(2, '0');
      const year = boliviaTime.getFullYear();
      const hours = boliviaTime.getHours().toString().padStart(2, '0');
      const minutes = boliviaTime.getMinutes().toString().padStart(2, '0');
      const seconds = boliviaTime.getSeconds().toString().padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Retornar original en caso de error
    }
  };

  // Verificar permisos
  useEffect(() => {
    if (!currentUser || currentUser.user_type !== 'admin') {
      setError('No tienes permisos para acceder a los logs de auditoría');
      return;
    }
    
    loadInitialData();
  }, [currentUser]);

  // Cargar datos cuando cambian filtros o página (con debounce mejorado)
  useEffect(() => {
    if (currentUser?.user_type === 'admin') {
      const timeoutId = setTimeout(() => {
        loadLogs();
      }, 800); // Aumentar tiempo de debounce

      return () => clearTimeout(timeoutId);
    }
  }, [page, rowsPerPage, filters, currentUser]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Cargar opciones de acciones y estadísticas
      const [actionsData, statsData] = await Promise.all([
        auditService.getActionChoices(),
        auditService.getStats()
      ]);
      
      setActionChoices(actionsData);
      setStats(statsData);
      
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Error al cargar datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null); // Limpiar errores previos
      
      // Preparar parámetros de consulta - filtrar valores vacíos y null
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => {
          // Permitir solo valores que no sean vacíos, null o undefined
          if (value === '' || value === null || value === undefined) return false;
          
          const trimmedValue = String(value).trim();
          if (trimmedValue === '') return false;
          
          // Validación especial para IP - debe ser una IP válida o al menos 7 caracteres
          if (key === 'ip_address') {
            // Permitir búsqueda parcial si tiene al menos 7 caracteres O es una IP completa
            const isValidIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(trimmedValue);
            const isPartialIP = trimmedValue.length >= 7;
            
            if (!isValidIP && !isPartialIP) return false;
          }
          
          return true;
        })
      );
      
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
        ...cleanFilters
      };
      
      // Debug: mostrar parámetros enviados
      console.log('Parámetros enviados a la API:', params);
      
      const data = await auditService.getLogs(params);
      
      setLogs(data.results || []);
      setTotalCount(data.count || 0);
      
    } catch (err) {
      console.error('Error loading logs:', err);
      
      // Manejar diferentes tipos de errores
      if (err.response?.status === 400) {
        setError('Parámetros de búsqueda inválidos. Verifica los filtros.');
      } else if (err.response?.status === 500) {
        setError('Error del servidor. Intenta nuevamente.');
      } else {
        setError('Error al cargar los logs de auditoría');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    // Validar que el valor no cause problemas
    const cleanValue = value === null || value === undefined ? '' : String(value);
    
    // PERMITIR escribir cualquier cosa, solo validar al buscar
    setFilters(prev => ({
      ...prev,
      [field]: cleanValue
    }));
    
    setPage(0); // Resetear página cuando cambian filtros
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      action: '',
      date_from: '',
      date_to: '',
      username: '',
      ip_address: '',
      success: '',
      content_type: ''
    });
    setPage(0);
  };

  const handleViewLogDetail = (log) => {
    setSelectedLog(log);
    setShowLogDetail(true);
  };

  // Función genérica para exportar datos
  const getExportData = async () => {
    const params = {
      limit: 1000,
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)
      )
    };
    
    const data = await auditService.exportLogs(params);
    return data.results;
  };

  // Exportar como Excel REAL (.xlsx)
  const handleExportExcel = async () => {
    try {
      setLoading(true);
      
      const data = await getExportData();
      
      // Crear workbook usando SheetJS
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');
      
      // Preparar datos para Excel
      const worksheetData = [
        ['Fecha/Hora', 'Usuario', 'Acción', 'Descripción', 'IP', 'Tipo Objeto', 'Objeto', 'Estado', 'Error'],
        ...data.map(log => [
          formatDate(log.timestamp),
          log.username || 'Anónimo',
          log.action_display,
          log.description || '',
          log.ip_address || '',
          log.content_type || '',
          log.object_repr || '',
          log.success ? 'Exitoso' : 'Error',
          log.error_message || ''
        ])
      ];

      // Crear worksheet y workbook
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Logs de Auditoría');

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

      // Descargar archivo Excel
      XLSX.writeFile(workbook, `audit_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
      
    } catch (err) {
      console.error('Error exporting Excel:', err);
      setError('Error al exportar como Excel');
    } finally {
      setLoading(false);
    }
  };

  // Nueva función para exportar como CSV
  const handleExportCSV = async () => {
    try {
      setLoading(true);
      
      const data = await getExportData();
      const csvContent = convertToCSV(data);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Error al exportar como CSV');
    } finally {
      setLoading(false);
    }
  };

  // Exportar como PDF - CORRIGIENDO AUTOTABLE
  const handleExportPDF = async () => {
    try {
      setLoading(true);
      
      const exportData = await getExportData();
      
      // Importar jsPDF desde npm
      const { jsPDF } = await import('jspdf');
      
      // Importar autoTable
      const autoTable = await import('jspdf-autotable');
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Título
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('LOGS DE AUDITORÍA', 148, 20, { align: 'center' });
      
      // Información
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Fecha: ${new Date().toLocaleString('es-ES')}`, 20, 35);
      doc.text(`Total: ${exportData.length} registros`, 20, 42);
      
      // Preparar datos para la tabla
      const tableData = exportData.map(log => [
        formatDate(log.timestamp),
        log.username || 'Anónimo',
        log.action_display,
        (log.description || '').substring(0, 40),
        log.ip_address || '',
        (log.object_repr || '').substring(0, 30),
        log.success ? 'OK' : 'ERROR'
      ]);
      
      // Usar autoTable correctamente
      autoTable.default(doc, {
        head: [['Fecha/Hora', 'Usuario', 'Acción', 'Descripción', 'IP', 'Objeto', 'Estado']],
        body: tableData,
        startY: 50,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 25 },
          2: { cellWidth: 30 },
          3: { cellWidth: 50 },
          4: { cellWidth: 25 },
          5: { cellWidth: 40 },
          6: { cellWidth: 20 },
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: 50, right: 20, bottom: 20, left: 20 },
      });
      
      // Descargar el PDF
      doc.save(`logs_auditoria_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (err) {
      console.error('Error al generar PDF:', err);
      
      // Fallback simple sin autoTable
      try {
        const data = await getExportData(); // Obtener datos nuevamente
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF('landscape', 'mm', 'a4');
        
        doc.setFontSize(16);
        doc.text('LOGS DE AUDITORÍA', 148, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleString('es-ES')} | Total: ${data.length}`, 20, 35);
        
        // Tabla simple sin autoTable
        let y = 50;
        doc.setFontSize(8);
        
        // Encabezados
        doc.setFont(undefined, 'bold');
        doc.text('FECHA/HORA', 20, y);
        doc.text('USUARIO', 60, y);
        doc.text('ACCIÓN', 100, y);
        doc.text('DESCRIPCIÓN', 140, y);
        doc.text('IP', 200, y);
        doc.text('ESTADO', 230, y);
        
        y += 8;
        doc.setFont(undefined, 'normal');
        
        // Datos
        data.slice(0, 50).forEach((log) => {
          doc.text(formatDate(log.timestamp).substring(0, 16), 20, y);
          doc.text((log.username || 'Anónimo').substring(0, 12), 60, y);
          doc.text(log.action_display.substring(0, 15), 100, y);
          doc.text((log.description || '').substring(0, 20), 140, y);
          doc.text((log.ip_address || '').substring(0, 12), 200, y);
          doc.text(log.success ? 'OK' : 'ERROR', 230, y);
          
          y += 6;
          
          if (y > 190) {
            doc.addPage();
            y = 20;
          }
        });
        
        doc.save(`logs_auditoria_${new Date().toISOString().split('T')[0]}.pdf`);
        
      } catch (fallbackError) {
        console.error('Error en fallback:', fallbackError);
        setError('Error al generar PDF: ' + fallbackError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data) => {
    const headers = [
      'Fecha/Hora', 'Usuario', 'Acción', 'Descripción', 'IP', 'Éxito', 'Error'
    ];
    
    const rows = data.map(log => [
      formatDate(log.timestamp),
      log.username || 'Anónimo',
      log.action_display,
      log.description || '',
      log.ip_address || '',
      log.success ? 'Sí' : 'No',
      log.error_message || ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    return csvContent;
  };

  const getActionColor = (action) => {
    if (action.includes('CREATE')) return 'success';
    if (action.includes('UPDATE')) return 'warning';
    if (action.includes('DELETE')) return 'error';
    if (action.includes('LOGIN')) return 'info';
    if (action.includes('VIEW')) return 'default';
    return 'primary';
  };

  const getSuccessIcon = (success) => {
    return success ? (
      <CheckCircle sx={{ color: 'green', fontSize: 20 }} />
    ) : (
      <Error sx={{ color: 'red', fontSize: 20 }} />
    );
  };

  if (!currentUser || currentUser.user_type !== 'admin') {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          No tienes permisos para acceder a los logs de auditoría
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gestión de Bitácora
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Estadísticas */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total de Logs
                  </Typography>
                  <Typography variant="h5">
                    {stats.total_logs?.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Acciones Hoy
                  </Typography>
                  <Typography variant="h5">
                    {stats.total_actions_today?.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Tasa de Éxito
                  </Typography>
                  <Typography variant="h5" color={stats.success_rate >= 95 ? 'green' : 'orange'}>
                    {stats.success_rate}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Usuarios Únicos
                  </Typography>
                  <Typography variant="h5">
                    {stats.total_users?.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Buscar"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Usuario"
                value={filters.username}
                onChange={(e) => handleFilterChange('username', e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Acción</InputLabel>
                <Select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  label="Acción"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {actionChoices.map(choice => (
                    <MenuItem key={choice.value} value={choice.value}>
                      {choice.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filters.success}
                  onChange={(e) => handleFilterChange('success', e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Exitoso</MenuItem>
                  <MenuItem value="false">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Fecha Desde (YYYY-MM-DD)"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                fullWidth
                size="small"
                placeholder="2025-01-01"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Fecha Hasta (YYYY-MM-DD)"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                fullWidth
                size="small"
                placeholder="2025-12-31"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Dirección IP"
                value={filters.ip_address}
                onChange={(e) => handleFilterChange('ip_address', e.target.value)}
                fullWidth
                size="small"
                placeholder="127.0.0.1"
                helperText="Busca cuando tengas al menos 7 caracteres"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Tipo de Objeto"
                value={filters.content_type}
                onChange={(e) => handleFilterChange('content_type', e.target.value)}
                fullWidth
                size="small"
                placeholder="user, course, etc."
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button 
              variant="outlined" 
              onClick={handleClearFilters}
              startIcon={<FilterList />}
            >
              Limpiar Filtros
            </Button>
            <Button 
              variant="outlined" 
              onClick={loadLogs}
              startIcon={<Refresh />}
              disabled={loading}
            >
              Actualizar
            </Button>
            
            {/* Botones de exportación mejorados */}
            <ButtonGroup variant="outlined" disabled={loading}>
              <Button 
                onClick={handleExportExcel}
                startIcon={<TableChart />}
                title="Descargar como archivo CSV compatible con Excel"
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
          </Box>
        </Paper>

        {/* Tabla de logs */}
        <Paper>
          {loading && <LinearProgress />}
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha/Hora</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Acción</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>IP</TableCell>
                  <TableCell>Objeto</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      {loading ? <CircularProgress /> : 'No se encontraron logs'}
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {formatDate(log.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {log.username || 'Anónimo'}
                          </Typography>
                          {log.user_full_name && (
                            <Typography variant="caption" color="textSecondary">
                              {log.user_full_name}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.action_display}
                          color={getActionColor(log.action)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 200, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {log.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {log.ip_address || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {log.content_type && (
                          <Box>
                            <Typography variant="caption" color="primary">
                              {log.content_type}
                            </Typography>
                            {log.object_repr && (
                              <Typography variant="body2">
                                {log.object_repr.length > 30 
                                  ? `${log.object_repr.substring(0, 30)}...`
                                  : log.object_repr
                                }
                              </Typography>
                            )}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={log.success ? 'Exitoso' : `Error: ${log.error_message}`}>
                          {getSuccessIcon(log.success)}
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleViewLogDetail(log)}
                          color="primary"
                          size="small"
                        >
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </Paper>
      </Box>

      {/* Modal de detalle del log */}
      <Dialog
        open={showLogDetail}
        onClose={() => setShowLogDetail(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalle del Log de Auditoría
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Fecha/Hora (Hora de Bolivia)
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {formatDate(selectedLog.timestamp)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Usuario
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedLog.username || 'Anónimo'}
                    {selectedLog.user_full_name && (
                      <Typography variant="body2" color="textSecondary">
                        ({selectedLog.user_full_name})
                      </Typography>
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Acción
                  </Typography>
                  <Chip
                    label={selectedLog.action_display}
                    color={getActionColor(selectedLog.action)}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Estado
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {getSuccessIcon(selectedLog.success)}
                    <Typography variant="body1" sx={{ ml: 1 }}>
                      {selectedLog.success ? 'Exitoso' : 'Error'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Descripción
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedLog.description || 'Sin descripción'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Dirección IP
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2, fontFamily: 'monospace' }}>
                    {selectedLog.ip_address || 'No disponible'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Objeto Afectado
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedLog.content_type ? (
                      `${selectedLog.content_type}: ${selectedLog.object_repr || selectedLog.object_id}`
                    ) : (
                      'No aplica'
                    )}
                  </Typography>
                </Grid>
                {selectedLog.error_message && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="error">
                      Mensaje de Error
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                      {selectedLog.error_message}
                    </Typography>
                  </Grid>
                )}
                {selectedLog.extra_data && Object.keys(selectedLog.extra_data).length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Datos Adicionales
                    </Typography>
                    <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                      <pre style={{ fontSize: '12px', margin: 0, overflow: 'auto' }}>
                        {JSON.stringify(selectedLog.extra_data, null, 2)}
                      </pre>
                    </Paper>
                  </Grid>
                )}
                {selectedLog.user_agent && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      User Agent
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '11px' }}>
                      {selectedLog.user_agent}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogDetail(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AuditLogManagement;