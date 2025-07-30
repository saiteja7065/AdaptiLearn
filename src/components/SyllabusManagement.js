import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  ArrowBack,
  CloudUpload,
  Description,
  Delete,
  Quiz,
  School,
  MenuBook
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import apiService from '../services/apiService';

const SyllabusManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userProfile } = useUser();
  
  const [formData, setFormData] = useState({
    branch: '',
    semester: '',
    year: '',
    subject: '',
    file: null
  });
  const [uploading, setUploading] = useState(false);
  const [uploadedSyllabi, setUploadedSyllabi] = useState([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  const branches = [
    { id: 'CSE', name: 'Computer Science Engineering' },
    { id: 'ECE', name: 'Electronics & Communication' },
    { id: 'MECH', name: 'Mechanical Engineering' },
    { id: 'CIVIL', name: 'Civil Engineering' },
    { id: 'EEE', name: 'Electrical Engineering' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setFormData(prev => ({ ...prev, file }));
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleUploadSyllabus = async () => {
    if (!formData.branch || !formData.semester || !formData.year || !formData.subject || !formData.file) {
      alert('Please fill all fields and select a PDF file');
      return;
    }

    setUploading(true);
    try {
      // Simulate PDF processing since backend is not available
      const mockTopics = {
        'Data Structures': ['Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Graphs', 'Hashing'],
        'Algorithms': ['Sorting', 'Searching', 'Dynamic Programming', 'Greedy Algorithms', 'Graph Algorithms'],
        'Database Systems': ['SQL', 'Normalization', 'Transactions', 'Indexing', 'Query Optimization'],
        'Operating Systems': ['Process Management', 'Memory Management', 'File Systems', 'Synchronization']
      };

      const extractedTopics = mockTopics[formData.subject] || ['Topic 1', 'Topic 2', 'Topic 3', 'Topic 4'];
      
      const newSyllabus = {
        id: Date.now(),
        ...formData,
        fileName: formData.file.name,
        uploadDate: new Date().toISOString(),
        topics: extractedTopics
      };
      
      setUploadedSyllabi(prev => [...prev, newSyllabus]);
      setFormData({ branch: '', semester: '', year: '', subject: '', file: null });
      alert('Syllabus uploaded successfully!');
      
    } catch (error) {
      console.error('Error uploading syllabus:', error);
      alert('Error uploading syllabus. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateQuestions = async (syllabus) => {
    setGeneratingQuestions(true);
    try {
      // Generate questions specifically from syllabus topics
      const syllabusQuestions = [];
      
      for (const topic of syllabus.topics) {
        const topicQuestions = await apiService.generateQuestions(
          topic, 
          'medium', 
          2, 
          syllabus.branch, 
          syllabus.semester
        );
        syllabusQuestions.push(...topicQuestions);
      }
      
      // Create a custom test component instead of redirecting to mock-test
      navigate('/syllabus-test', { 
        state: { 
          questions: syllabusQuestions,
          syllabus: syllabus,
          testTitle: `${syllabus.subject} - Syllabus Based Test`
        }
      });
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Error generating questions. Please try again.');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleDeleteSyllabus = (id) => {
    setUploadedSyllabi(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-secondary-50/30">
      <div className="glass-effect border-b border-white/20 sticky top-0 z-50">
        <Container maxWidth="xl">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <IconButton onClick={() => navigate('/dashboard')} className="hover-lift">
                <ArrowBack />
              </IconButton>
              <div>
                <Typography variant="h5" className="font-bold">
                  Syllabus Management
                </Typography>
                <Typography variant="body2" className="text-neutral-600">
                  Upload syllabus PDFs and generate personalized questions
                </Typography>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container maxWidth="lg" className="py-8">
        <Grid container spacing={4}>
          {/* Upload Form */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="card-elevated">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <CloudUpload className="text-primary-500 mr-2" />
                    <Typography variant="h6" className="font-semibold">
                      Upload New Syllabus
                    </Typography>
                  </div>

                  <div className="space-y-4">
                    <FormControl fullWidth>
                      <InputLabel>Branch</InputLabel>
                      <Select
                        value={formData.branch}
                        onChange={(e) => handleInputChange('branch', e.target.value)}
                        label="Branch"
                      >
                        {branches.map(branch => (
                          <MenuItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <FormControl fullWidth>
                          <InputLabel>Semester</InputLabel>
                          <Select
                            value={formData.semester}
                            onChange={(e) => handleInputChange('semester', e.target.value)}
                            label="Semester"
                          >
                            {[1,2,3,4,5,6,7,8].map(sem => (
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
                            value={formData.year}
                            onChange={(e) => handleInputChange('year', e.target.value)}
                            label="Year"
                          >
                            {[1,2,3,4].map(year => (
                              <MenuItem key={year} value={year}>
                                Year {year}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>

                    <TextField
                      fullWidth
                      label="Subject Name"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="e.g., Data Structures and Algorithms"
                    />

                    <Box className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        id="pdf-upload"
                      />
                      <label htmlFor="pdf-upload">
                        <Button
                          component="span"
                          variant="outlined"
                          startIcon={<Description />}
                          className="mb-2"
                        >
                          Select PDF File
                        </Button>
                      </label>
                      {formData.file && (
                        <Typography variant="body2" className="text-green-600 mt-2">
                          Selected: {formData.file.name}
                        </Typography>
                      )}
                      <Typography variant="caption" className="text-neutral-500 block mt-2">
                        Upload syllabus PDF to extract topics automatically
                      </Typography>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleUploadSyllabus}
                      disabled={uploading}
                      className="btn-primary"
                      startIcon={<CloudUpload />}
                    >
                      {uploading ? 'Uploading...' : 'Upload Syllabus'}
                    </Button>

                    {uploading && <LinearProgress className="mt-2" />}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Uploaded Syllabi */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="card-elevated">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <MenuBook className="text-secondary-500 mr-2" />
                    <Typography variant="h6" className="font-semibold">
                      Uploaded Syllabi
                    </Typography>
                  </div>

                  {uploadedSyllabi.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                      <Description className="text-4xl mb-2" />
                      <Typography variant="body2">
                        No syllabi uploaded yet
                      </Typography>
                    </div>
                  ) : (
                    <List>
                      {uploadedSyllabi.map((syllabus) => (
                        <ListItem key={syllabus.id} className="border rounded-lg mb-2">
                          <ListItemText
                            primary={
                              <div className="flex items-center space-x-2">
                                <Typography variant="body1" className="font-medium">
                                  {syllabus.subject}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={`${syllabus.branch} - Sem ${syllabus.semester}`}
                                  className="bg-primary-100 text-primary-800"
                                />
                              </div>
                            }
                            secondary={
                              <div className="mt-1">
                                <Typography variant="caption" className="text-neutral-500">
                                  {syllabus.fileName} • {syllabus.topics.length} topics extracted
                                </Typography>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {syllabus.topics.slice(0, 3).map((topic, idx) => (
                                    <Chip
                                      key={idx}
                                      size="small"
                                      label={topic}
                                      variant="outlined"
                                      className="text-xs"
                                    />
                                  ))}
                                  {syllabus.topics.length > 3 && (
                                    <Chip
                                      size="small"
                                      label={`+${syllabus.topics.length - 3} more`}
                                      variant="outlined"
                                      className="text-xs"
                                    />
                                  )}
                                </div>
                              </div>
                            }
                          />
                          <ListItemSecondaryAction>
                            <div className="flex space-x-1">
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleGenerateQuestions(syllabus)}
                                disabled={generatingQuestions}
                                startIcon={<Quiz />}
                                className="btn-primary"
                              >
                                Test
                              </Button>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteSyllabus(syllabus.id)}
                                className="text-red-500"
                              >
                                <Delete />
                              </IconButton>
                            </div>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {generatingQuestions && (
          <Alert severity="info" className="mt-4">
            Generating personalized questions from your syllabus...
          </Alert>
        )}
      </Container>
    </div>
  );
};

export default SyllabusManagement;