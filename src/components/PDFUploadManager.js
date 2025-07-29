import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton
} from '@mui/material';
import {
  CloudUpload,
  PictureAsPdf,
  Delete,
  CheckCircle,
  Error as ErrorIcon,
  Info
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import pdfStorageService from '../services/pdfStorageService';

const PDFUploadManager = () => {
  // State management
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  
  // Form data
  const [academicYear, setAcademicYear] = useState('2024-25');
  const [branchId, setBranchId] = useState('cse');
  const [semester, setSemester] = useState(1);
  const [documentType, setDocumentType] = useState('complete');

  // Available options
  const academicYears = ['2024-25', '2023-24', '2022-23', '2021-22'];
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
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
  const documentTypes = [
    { id: 'complete', name: 'Complete Syllabus' },
    { id: 'subject', name: 'Subject-wise Document' },
    { id: 'unit', name: 'Unit-wise Document' }
  ];

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle accepted files
    if (acceptedFiles.length > 0) {
      const newFiles = acceptedFiles.map(file => ({
        file,
        id: `${file.name}_${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'ready',
        progress: 0
      }));
      
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        console.error(`File ${file.name} rejected:`, errors);
        // You could show an error message here
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });

  // Remove file from selection
  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Clear all files
  const clearAllFiles = () => {
    setSelectedFiles([]);
    setUploadResults(null);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle single file upload
  const uploadSingleFile = async (fileData) => {
    try {
      setUploadProgress(prev => ({
        ...prev,
        [fileData.id]: { status: 'uploading', progress: 0 }
      }));

      const metadata = {
        academicYear,
        branchId,
        semester,
        documentType: fileData.inferredType || documentType
      };

      const result = await pdfStorageService.uploadPDF(fileData.file, metadata);

      setUploadProgress(prev => ({
        ...prev,
        [fileData.id]: { status: 'completed', progress: 100 }
      }));

      return result;

    } catch (error) {
      setUploadProgress(prev => ({
        ...prev,
        [fileData.id]: { status: 'error', progress: 0, error: error.message }
      }));
      
      throw error;
    }
  };

  // Handle batch upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadResults(null);

    try {
      const results = [];
      const errors = [];

      // Upload files one by one with progress tracking
      for (const fileData of selectedFiles) {
        try {
          const result = await uploadSingleFile(fileData);
          results.push({
            fileName: fileData.name,
            ...result
          });
        } catch (error) {
          errors.push({
            fileName: fileData.name,
            error: error.message
          });
        }
      }

      const uploadResults = {
        success: results.length > 0,
        results,
        errors,
        summary: {
          total: selectedFiles.length,
          successful: results.length,
          failed: errors.length
        }
      };

      setUploadResults(uploadResults);
      setShowResults(true);

      console.log('Upload Summary:', uploadResults.summary);

    } catch (error) {
      console.error('❌ Batch upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 4, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          PDF Syllabus Upload Manager
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Upload syllabus PDFs organized by academic year, branch, and semester
        </Typography>

        {/* Configuration Form */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Academic Year</InputLabel>
              <Select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                label="Academic Year"
              >
                {academicYears.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Branch</InputLabel>
              <Select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                label="Branch"
              >
                {branches.map(branch => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Semester</InputLabel>
              <Select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                label="Semester"
              >
                {semesters.map(sem => (
                  <MenuItem key={sem} value={sem}>Semester {sem}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                label="Document Type"
              >
                {documentTypes.map(type => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* File Upload Area */}
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragActive ? 'action.hover' : 'background.default',
            transition: 'all 0.3s ease',
            mb: 3
          }}
        >
          <input {...getInputProps()} />
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Drop PDF files here' : 'Drag & drop PDF files here'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            or click to select files • Maximum 50MB per file • PDF only
          </Typography>
          <Button variant="outlined" sx={{ mt: 2 }}>
            Browse Files
          </Button>
        </Box>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Selected Files ({selectedFiles.length})
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={clearAllFiles}
                disabled={uploading}
              >
                Clear All
              </Button>
            </Box>
            
            <List>
              {selectedFiles.map((fileData) => {
                const progress = uploadProgress[fileData.id];
                
                return (
                  <ListItem key={fileData.id} sx={{ 
                    border: 1, 
                    borderColor: 'divider', 
                    borderRadius: 1, 
                    mb: 1 
                  }}>
                    <ListItemIcon>
                      <PictureAsPdf color="primary" />
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={2}>
                          <Typography variant="subtitle2">
                            {fileData.name}
                          </Typography>
                          {progress && (
                            <Chip
                              label={progress.status}
                              color={
                                progress.status === 'completed' ? 'success' :
                                progress.status === 'error' ? 'error' : 'primary'
                              }
                              size="small"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Size: {formatFileSize(fileData.size)}
                          </Typography>
                          {progress && progress.status === 'uploading' && (
                            <LinearProgress 
                              variant="indeterminate" 
                              sx={{ mt: 1, height: 4, borderRadius: 2 }} 
                            />
                          )}
                          {progress && progress.error && (
                            <Alert severity="error" size="small" sx={{ mt: 1 }}>
                              {progress.error}
                            </Alert>
                          )}
                        </Box>
                      }
                    />
                    
                    <IconButton
                      onClick={() => removeFile(fileData.id)}
                      disabled={uploading}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        )}

        {/* Upload Button */}
        {selectedFiles.length > 0 && (
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              size="large"
              onClick={handleUpload}
              disabled={uploading}
              startIcon={<CloudUpload />}
            >
              {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
            </Button>
            
            {uploadResults && (
              <Button
                variant="outlined"
                onClick={() => setShowResults(true)}
                startIcon={<Info />}
              >
                View Results
              </Button>
            )}
          </Box>
        )}

        {/* Current Configuration Display */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Upload Configuration:</strong> {academicYear} • {
              branches.find(b => b.id === branchId)?.name
            } • Semester {semester} • {
              documentTypes.find(t => t.id === documentType)?.name
            }
          </Typography>
        </Alert>
      </Paper>

      {/* Results Dialog */}
      <Dialog 
        open={showResults} 
        onClose={() => setShowResults(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Results</DialogTitle>
        <DialogContent>
          {uploadResults && (
            <Box>
              {/* Summary */}
              <Card sx={{ mb: 3, backgroundColor: 'background.default' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Summary</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Total Files</Typography>
                      <Typography variant="h5">{uploadResults.summary.total}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="success.main">Successful</Typography>
                      <Typography variant="h5" color="success.main">
                        {uploadResults.summary.successful}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="error.main">Failed</Typography>
                      <Typography variant="h5" color="error.main">
                        {uploadResults.summary.failed}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Successful Uploads */}
              {uploadResults.results.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom color="success.main">
                    ✅ Successful Uploads
                  </Typography>
                  {uploadResults.results.map((result, index) => (
                    <Alert key={index} severity="success" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>{result.fileName}</strong> - Document ID: {result.documentId}
                      </Typography>
                    </Alert>
                  ))}
                </Box>
              )}

              {/* Failed Uploads */}
              {uploadResults.errors.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom color="error.main">
                    ❌ Failed Uploads
                  </Typography>
                  {uploadResults.errors.map((error, index) => (
                    <Alert key={index} severity="error" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>{error.fileName}</strong> - {error.error}
                      </Typography>
                    </Alert>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResults(false)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setShowResults(false);
              clearAllFiles();
              setUploadProgress({});
            }}
          >
            Upload More Files
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PDFUploadManager;
