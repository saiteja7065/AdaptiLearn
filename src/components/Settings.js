import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  ArrowBack,
  Notifications,
  DarkMode,
  Language,
  Security,
  Storage,
  Help,
  Info,
  BookmarkBorder
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    autoSave: true,
    analytics: true
  });

  const handleSettingChange = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
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
                  Settings
                </Typography>
                <Typography variant="body2" className="text-neutral-600">
                  Customize your learning experience
                </Typography>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container maxWidth="md" className="py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <Card className="card-elevated">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-semibold mb-4">
                Preferences
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Notifications />
                  </ListItemIcon>
                  <ListItemText
                    primary="Notifications"
                    secondary="Receive study reminders and updates"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.notifications}
                      onChange={() => handleSettingChange('notifications')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <DarkMode />
                  </ListItemIcon>
                  <ListItemText
                    primary="Dark Mode"
                    secondary="Switch to dark theme"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.darkMode}
                      onChange={() => handleSettingChange('darkMode')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Storage />
                  </ListItemIcon>
                  <ListItemText
                    primary="Auto Save"
                    secondary="Automatically save your progress"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.autoSave}
                      onChange={() => handleSettingChange('autoSave')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Security />
                  </ListItemIcon>
                  <ListItemText
                    primary="Analytics"
                    secondary="Help improve the app with usage data"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.analytics}
                      onChange={() => handleSettingChange('analytics')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-semibold mb-4">
                Account
              </Typography>
              
              <div className="space-y-3">
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Language />}
                  onClick={() => navigate('/profile-setup')}
                  className="justify-start"
                >
                  Edit Profile & Subjects
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<BookmarkBorder />}
                  onClick={() => navigate('/syllabus-management')}
                  className="justify-start"
                >
                  Syllabus Management
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Security />}
                  className="justify-start"
                >
                  Privacy & Security
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Help />}
                  className="justify-start"
                >
                  Help & Support
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Info />}
                  className="justify-start"
                >
                  About AdaptiLearn
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </div>
  );
};

export default Settings;