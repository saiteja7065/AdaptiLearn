import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Search,
  Download,
  Visibility,
  Delete,
  PictureAsPdf,
  FilterList,
  Refresh,
  CloudDownload
} from '@mui/icons-material';
import pdfStorageService from '../services/pdfStorageService';

const PDFBrowser = () => {
  // State management
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    academicYear: '',
    branchId: '',
    semester: '',
    documentType: ''
  });
  
  // Available structure
  const [availableStructure, setAvailableStructure] = useState({});
  const [structureLoading, setStructureLoading] = useState(true);

  // Filter options
  const branches = [
    { id: 'cse', name: 'Computer Science Engineering' },
    { id: 'ece', name: 'Electronics & Communication' },
    { id: 'mech', name: 'Mechanical Engineering' },
    { id: 'civil', name: 'Civil Engineering' },
    { id: 'eee', name: 'Electrical Engineering' },
    { id: 'it', name: 'Information Technology' },
    { id: 'chem', name: 'Chemical Engineering' },
    { id: 'aero', name: 'Aerospace Engineering' }
  ];

  // Load available structure on component mount
  useEffect(() => {
    loadAvailableStructure();
  }, []);

  // Load documents when filters change
  useEffect(() => {
    if (filters.academicYear && filters.branchId) {
      loadDocuments();
    }
  }, [filters]);

  // Load available academic years and branches
  const loadAvailableStructure = async () => {
    try {
      setStructureLoading(true);
      const result = await pdfStorageService.getAvailableStructure();
      
      if (result.success) {
        setAvailableStructure(result.structure);
        
        // Auto-select first available year and branch
        const years = Object.keys(result.structure);
        if (years.length > 0) {
          const firstYear = years.sort().reverse()[0]; // Latest year first
          const branchesInYear = Object.keys(result.structure[firstYear]);
          if (branchesInYear.length > 0) {
            setFilters(prev => ({
              ...prev,
              academicYear: firstYear,
              branchId: branchesInYear[0]
            }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to load structure:', error);
    } finally {
      setStructureLoading(false);
    }
  };

  // Load documents based on current filters
  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      let result;
      if (searchQuery.trim()) {
        result = await pdfStorageService.searchPDFs(searchQuery, filters);
      } else {
        result = await pdfStorageService.getPDFsByBranch(
          filters.academicYear, 
          filters.branchId, 
          filters.semester || null
        );
      }
      
      if (result.success) {
        setDocuments(result.documents);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    loadDocuments();
  };

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      academicYear: '',
      branchId: '',
      semester: '',
      documentType: ''
    });
    setSearchQuery('');
    setDocuments([]);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'pending': return 'info';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  // Handle document download
  const handleDownload = (doc) => {
    if (doc.publicUrl) {
      window.open(doc.publicUrl, '_blank');
    } else {
      console.error('Download URL not available');
    }
  };

  // Handle document deletion
  const handleDelete = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await pdfStorageService.deletePDF(docId);
        setDocuments(prev => prev.filter(doc => doc.id !== docId));
        console.log('Document deleted successfully');
      } catch (error) {
        console.error('Failed to delete document:', error);
      }
    }
  };

  // Show document details
  const showDocumentDetails = (doc) => {
    setSelectedDoc(doc);
    setShowDetails(true);
  };

  // Get available academic years from structure
  const getAvailableYears = () => {
    return Object.keys(availableStructure).sort().reverse();
  };

  // Get available branches for selected year
  const getAvailableBranches = () => {
    if (!filters.academicYear || !availableStructure[filters.academicYear]) {
      return [];
    }
    return Object.keys(availableStructure[filters.academicYear]);
  };

  // Get available semesters for selected year and branch
  const getAvailableSemesters = () => {
    if (!filters.academicYear || !filters.branchId || 
        !availableStructure[filters.academicYear]?.[filters.branchId]) {
      return [];
    }
    return availableStructure[filters.academicYear][filters.branchId].semesters;
  };

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          PDF Document Browser
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Browse and manage uploaded syllabus documents
        </Typography>
      </Paper>

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🔍 Search & Filters
        </Typography>
        
        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search documents by name or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleSearch}>
                  <Search />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ mb: 3 }}
        />

        {/* Filters */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Academic Year</InputLabel>
              <Select
                value={filters.academicYear}
                onChange={(e) => handleFilterChange('academicYear', e.target.value)}
                label="Academic Year"
                disabled={structureLoading}
              >
                <MenuItem value="">All Years</MenuItem>
                {getAvailableYears().map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Branch</InputLabel>
              <Select
                value={filters.branchId}
                onChange={(e) => handleFilterChange('branchId', e.target.value)}
                label="Branch"
                disabled={!filters.academicYear}
              >
                <MenuItem value="">All Branches</MenuItem>
                {getAvailableBranches().map(branchId => {
                  const branch = branches.find(b => b.id === branchId);
                  return (
                    <MenuItem key={branchId} value={branchId}>
                      {branch ? branch.name : branchId.toUpperCase()}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Semester</InputLabel>
              <Select
                value={filters.semester}
                onChange={(e) => handleFilterChange('semester', e.target.value)}
                label="Semester"
                disabled={!filters.branchId}
              >
                <MenuItem value="">All Semesters</MenuItem>
                {getAvailableSemesters().map(sem => (
                  <MenuItem key={sem} value={sem}>Semester {sem}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box display="flex" gap={1} height="100%">
              <Button
                variant="outlined"
                onClick={clearFilters}
                startIcon={<FilterList />}
                sx={{ flexGrow: 1 }}
              >
                Clear
              </Button>
              <Button
                variant="contained"
                onClick={loadDocuments}
                startIcon={<Refresh />}
                sx={{ flexGrow: 1 }}
              >
                Refresh
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Documents Grid */}
      <Box>
        {loading ? (
          <Grid container spacing={2}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Grid item xs={12} md={6} lg={4} key={i}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="rectangular" width="100%" height={60} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : documents.length > 0 ? (
          <>
            <Typography variant="h6" gutterBottom>
              📄 Documents ({documents.length})
            </Typography>
            <Grid container spacing={2}>
              {documents.map((doc) => (
                <Grid item xs={12} md={6} lg={4} key={doc.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <PictureAsPdf color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" component="div" noWrap>
                          {doc.fileName}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                        <Chip 
                          label={doc.academicYear} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                        <Chip 
                          label={`Sem ${doc.semester}`} 
                          size="small" 
                          color="secondary" 
                          variant="outlined" 
                        />
                        <Chip 
                          label={doc.documentType} 
                          size="small" 
                          color="info" 
                          variant="outlined" 
                        />
                      </Box>
                      
                      <Box display="flex" gap={1} mb={2}>
                        <Chip 
                          label={doc.extractionStatus || 'pending'} 
                          size="small" 
                          color={getStatusColor(doc.extractionStatus)} 
                        />
                        {doc.totalPages && (
                          <Chip 
                            label={`${doc.totalPages} pages`} 
                            size="small" 
                            variant="outlined" 
                          />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Size: {formatFileSize(doc.fileSize || 0)}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        Uploaded: {formatDate(doc.uploadedAt)}
                      </Typography>
                      
                      {doc.subjects && doc.subjects.length > 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Subjects: {doc.subjects.length}
                        </Typography>
                      )}
                    </CardContent>
                    
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => showDocumentDetails(doc)}
                        startIcon={<Visibility />}
                      >
                        Details
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleDownload(doc)}
                        startIcon={<Download />}
                        disabled={!doc.publicUrl}
                      >
                        Download
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDelete(doc.id)}
                        startIcon={<Delete />}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <PictureAsPdf sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No documents found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filters.academicYear && filters.branchId
                ? 'No documents match your current filters'
                : 'Select academic year and branch to view documents'
              }
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Document Details Dialog */}
      <Dialog 
        open={showDetails} 
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Document Details</DialogTitle>
        <DialogContent>
          {selectedDoc && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedDoc.fileName}
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Academic Year</Typography>
                  <Typography variant="body1">{selectedDoc.academicYear}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Branch</Typography>
                  <Typography variant="body1">
                    {branches.find(b => b.id === selectedDoc.branchId)?.name || selectedDoc.branchId}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Semester</Typography>
                  <Typography variant="body1">{selectedDoc.semester}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Document Type</Typography>
                  <Typography variant="body1">{selectedDoc.documentType}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">File Size</Typography>
                  <Typography variant="body1">{formatFileSize(selectedDoc.fileSize || 0)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total Pages</Typography>
                  <Typography variant="body1">{selectedDoc.totalPages || 'Unknown'}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>Processing Status</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={4}>
                  <Chip 
                    label={`Upload: ${selectedDoc.uploadStatus || 'pending'}`}
                    color={getStatusColor(selectedDoc.uploadStatus)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={4}>
                  <Chip 
                    label={`Extraction: ${selectedDoc.extractionStatus || 'pending'}`}
                    color={getStatusColor(selectedDoc.extractionStatus)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={4}>
                  <Chip 
                    label={`OCR: ${selectedDoc.ocrStatus || 'pending'}`}
                    color={getStatusColor(selectedDoc.ocrStatus)}
                    fullWidth
                  />
                </Grid>
              </Grid>

              {selectedDoc.subjects && selectedDoc.subjects.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom>Extracted Subjects</Typography>
                  <List dense>
                    {selectedDoc.subjects.map((subject, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${subject.subjectCode}: ${subject.subjectName}`}
                          secondary={`Pages: ${subject.pageRange}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary">
                <strong>Document ID:</strong> {selectedDoc.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Uploaded:</strong> {formatDate(selectedDoc.uploadedAt)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Last Modified:</strong> {formatDate(selectedDoc.lastModified)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Close</Button>
          {selectedDoc?.publicUrl && (
            <Button 
              variant="contained" 
              onClick={() => handleDownload(selectedDoc)}
              startIcon={<CloudDownload />}
            >
              Download PDF
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PDFBrowser;
