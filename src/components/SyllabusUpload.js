import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
  Alert,
  Chip,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  CloudUpload,
  PictureAsPdf,
  Delete,
  Visibility,
  CheckCircle,
  Pending,
  Error as ErrorIcon,
  Analytics,
  School,
  BookmarkBorder
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { 
  uploadSyllabusPDF, 
  getSyllabiByBranch,
  generateQuestionsFromSyllabus 
} from '../firebase/syllabusManager';

const SyllabusUpload = () => {
  const { branches } = useUser();
  const [selectedBranch, setSelectedBranch] = useState('');
  const [semester, setSemester] = useState('');
  const [year, setYear] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [syllabi, setSyllabi] = useState([]);
  const [loadingSyllabi, setLoadingSyllabi] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  const semesters = Array.from({ length: 8 }, (_, i) => i + 1);
  const years = [1, 2, 3, 4];

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setUploadResult(null);
    } else {
      setUploadResult({
        success: false,
        error: 'Please select a valid PDF file'
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedBranch || !semester || !year) {
      setUploadResult({
        success: false,
        error: 'Please fill all fields and select a PDF file'
      });
      return;
    }

    setUploading(true);
    try {
      const result = await uploadSyllabusPDF(selectedFile, selectedBranch, semester, year);
      setUploadResult(result);
      
      if (result.success) {
        // Reset form
        setSelectedFile(null);
        setSemester('');
        setYear('');
        // Refresh syllabi list
        loadSyllabi();
      }
    } catch (error) {
      setUploadResult({
        success: false,
        error: error.message
      });
    } finally {
      setUploading(false);
    }
  };

  const loadSyllabi = async () => {
    if (!selectedBranch) return;
    
    setLoadingSyllabi(true);
    try {
      const branchSyllabi = await getSyllabiByBranch(selectedBranch);
      setSyllabi(branchSyllabi);
    } catch (error) {
      console.error('Error loading syllabi:', error);
    } finally {
      setLoadingSyllabi(false);
    }
  };

  const handleGenerateQuestions = async (syllabusId) => {
    setGeneratingQuestions(true);
    try {
      const result = await generateQuestionsFromSyllabus(syllabusId, {
        questionType: 'mcq',
        defaultMarks: 2,
        defaultTimeLimit: 120
      });
      
      if (result.success) {
        setUploadResult({
          success: true,
          message: `Generated ${result.totalQuestions} questions successfully!`
        });
      } else {
        setUploadResult({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        error: error.message
      });
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'processing':
        return <Pending color="warning" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <Pending color="action" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  React.useEffect(() => {
    if (selectedBranch) {
      loadSyllabi();
    }
  }, [selectedBranch]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <School sx={{ mr: 2 }} />
        Syllabus Management
      </Typography>

      <Grid container spacing={3}>
        {/* Upload Section */}
        <Grid item xs={12} lg={6}>
          <Card component={motion.div} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload New Syllabus
              </Typography>

              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Branch</InputLabel>
                  <Select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    label="Branch"
                  >
                    {branches.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Semester</InputLabel>
                      <Select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        label="Semester"
                      >
                        {semesters.map((sem) => (
                          <MenuItem key={sem} value={sem}>
                            Semester {sem}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Year</InputLabel>
                      <Select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        label="Year"
                      >
                        {years.map((yr) => (
                          <MenuItem key={yr} value={yr}>
                            Year {yr}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>

              {/* File Upload */}
              <Box sx={{ mb: 3 }}>
                <input
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  id="syllabus-upload"
                  type="file"
                  onChange={handleFileSelect}
                />
                <label htmlFor="syllabus-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    fullWidth
                    sx={{ mb: 1, py: 2 }}
                  >
                    Select PDF File
                  </Button>
                </label>
                
                {selectedFile && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <PictureAsPdf color="error" sx={{ mr: 1 }} />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Upload Button */}
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !selectedBranch || !semester || !year}
                fullWidth
                sx={{ mb: 2 }}
              >
                {uploading ? 'Uploading...' : 'Upload Syllabus'}
              </Button>

              {uploading && <LinearProgress sx={{ mb: 2 }} />}

              {/* Upload Result */}
              <AnimatePresence>
                {uploadResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Alert 
                      severity={uploadResult.success ? 'success' : 'error'}
                      sx={{ mb: 2 }}
                    >
                      {uploadResult.success ? uploadResult.message : uploadResult.error}
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </Grid>

        {/* Syllabi List */}
        <Grid item xs={12} lg={6}>
          <Card component={motion.div} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Uploaded Syllabi
                {selectedBranch && (
                  <Chip 
                    label={branches.find(b => b.id === selectedBranch)?.code || selectedBranch}
                    size="small"
                    sx={{ ml: 2 }}
                  />
                )}
              </Typography>

              {loadingSyllabi ? (
                <LinearProgress sx={{ mt: 2 }} />
              ) : syllabi.length > 0 ? (
                <List>
                  {syllabi.map((syllabus) => (
                    <motion.div
                      key={syllabus.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: syllabi.indexOf(syllabus) * 0.1 }}
                    >
                      <ListItem>
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                          {getStatusIcon(syllabus.extractionStatus)}
                        </Box>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1">
                                Semester {syllabus.semester} - Year {syllabus.year}
                              </Typography>
                              <Chip
                                label={syllabus.extractionStatus || 'pending'}
                                size="small"
                                color={getStatusColor(syllabus.extractionStatus)}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                {syllabus.fileName}
                              </Typography>
                              {syllabus.totalTopics > 0 && (
                                <Typography variant="caption" display="block">
                                  {syllabus.totalTopics} topics extracted
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => {
                              setSelectedSyllabus(syllabus);
                              setPreviewDialog(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                          {syllabus.extractionStatus === 'completed' && (
                            <IconButton
                              edge="end"
                              onClick={() => handleGenerateQuestions(syllabus.id)}
                              disabled={generatingQuestions}
                            >
                              <Analytics />
                            </IconButton>
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                    </motion.div>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <BookmarkBorder sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    {selectedBranch ? 'No syllabi uploaded for this branch' : 'Select a branch to view syllabi'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Syllabus Details
          {selectedSyllabus && (
            <Typography variant="subtitle2" color="text.secondary">
              {selectedSyllabus.fileName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedSyllabus && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Branch</Typography>
                  <Typography variant="body1">{selectedSyllabus.branchId.toUpperCase()}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">Semester</Typography>
                  <Typography variant="body1">{selectedSyllabus.semester}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">Year</Typography>
                  <Typography variant="body1">{selectedSyllabus.year}</Typography>
                </Grid>
              </Grid>

              {selectedSyllabus.subjects && selectedSyllabus.subjects.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Subjects</Typography>
                  {selectedSyllabus.subjects.map((subject, index) => (
                    <Card key={index} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1">{subject.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Code: {subject.code} | Credits: {subject.credits}
                        </Typography>
                        {subject.units && (
                          <Box sx={{ mt: 2 }}>
                            {subject.units.map((unit, unitIndex) => (
                              <Box key={unitIndex} sx={{ mb: 1 }}>
                                <Typography variant="body2" fontWeight="medium">
                                  Unit {unit.unitNumber}: {unit.title}
                                </Typography>
                                <Box sx={{ ml: 2 }}>
                                  {unit.topics?.map((topic, topicIndex) => (
                                    <Chip
                                      key={topicIndex}
                                      label={topic}
                                      size="small"
                                      sx={{ mr: 1, mb: 1 }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Close</Button>
          {selectedSyllabus?.pdfUrl && (
            <Button
              variant="contained"
              onClick={() => window.open(selectedSyllabus.pdfUrl, '_blank')}
            >
              View PDF
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SyllabusUpload;
