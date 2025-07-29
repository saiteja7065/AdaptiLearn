// Real-time data service for fetching academic data
import { safeFirestoreQuery, safeFirestoreAdd } from '../firebase/firestoreShield';

class RealTimeDataService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  // Get cached data if available and not expired
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  // Set data in cache
  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Fetch branches from real-time database or fallback to static data
  async getBranches() {
    const cacheKey = 'branches';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Try to fetch from Firestore first
      const branches = await safeFirestoreQuery('branches', []);
      
      if (branches.success && branches.data && branches.data.length > 0) {
        this.setCachedData(cacheKey, branches.data);
        return branches.data;
      }
    } catch (error) {
      console.log('📱 Using fallback branches data');
    }

    // Fallback to static data
    const fallbackBranches = [
      { id: 'cse', name: 'Computer Science Engineering', code: 'CSE', popularity: 95 },
      { id: 'ece', name: 'Electronics and Communication Engineering', code: 'ECE', popularity: 85 },
      { id: 'mech', name: 'Mechanical Engineering', code: 'MECH', popularity: 80 },
      { id: 'civil', name: 'Civil Engineering', code: 'CIVIL', popularity: 75 },
      { id: 'eee', name: 'Electrical and Electronics Engineering', code: 'EEE', popularity: 70 },
      { id: 'it', name: 'Information Technology', code: 'IT', popularity: 90 },
      { id: 'chem', name: 'Chemical Engineering', code: 'CHEM', popularity: 65 },
      { id: 'aero', name: 'Aeronautical Engineering', code: 'AERO', popularity: 60 }
    ];

    this.setCachedData(cacheKey, fallbackBranches);
    return fallbackBranches;
  }

  // Fetch subjects for a specific branch with real-time updates
  async getSubjectsByBranch(branchId) {
    const cacheKey = `subjects_${branchId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Try to fetch from Firestore
      const subjects = await safeFirestoreQuery(`subjects_${branchId}`, []);
      
      if (subjects.success && subjects.data && subjects.data.length > 0) {
        this.setCachedData(cacheKey, subjects.data);
        return subjects.data;
      }
    } catch (error) {
      console.log(`📱 Using fallback subjects for ${branchId}`);
    }

    // Enhanced fallback data with more comprehensive subjects
    const subjectsByBranch = {
      cse: [
        { id: 'ds', name: 'Data Structures', code: 'DS', credits: 4, difficulty: 'medium', popularity: 95 },
        { id: 'algo', name: 'Algorithms', code: 'ALGO', credits: 4, difficulty: 'hard', popularity: 90 },
        { id: 'dbms', name: 'Database Management Systems', code: 'DBMS', credits: 3, difficulty: 'medium', popularity: 88 },
        { id: 'os', name: 'Operating Systems', code: 'OS', credits: 4, difficulty: 'medium', popularity: 85 },
        { id: 'cn', name: 'Computer Networks', code: 'CN', credits: 3, difficulty: 'medium', popularity: 82 },
        { id: 'se', name: 'Software Engineering', code: 'SE', credits: 3, difficulty: 'easy', popularity: 80 },
        { id: 'oops', name: 'Object Oriented Programming', code: 'OOPS', credits: 4, difficulty: 'medium', popularity: 92 },
        { id: 'web', name: 'Web Technologies', code: 'WEB', credits: 3, difficulty: 'easy', popularity: 95 },
        { id: 'ai', name: 'Artificial Intelligence', code: 'AI', credits: 4, difficulty: 'hard', popularity: 98 },
        { id: 'ml', name: 'Machine Learning', code: 'ML', credits: 4, difficulty: 'hard', popularity: 96 },
        { id: 'blockchain', name: 'Blockchain Technology', code: 'BC', credits: 3, difficulty: 'medium', popularity: 75 },
        { id: 'cyber', name: 'Cyber Security', code: 'CS', credits: 3, difficulty: 'medium', popularity: 85 }
      ],
      ece: [
        { id: 'signals', name: 'Signals and Systems', code: 'SS', credits: 4, difficulty: 'medium', popularity: 85 },
        { id: 'comm', name: 'Communication Systems', code: 'COMM', credits: 4, difficulty: 'medium', popularity: 88 },
        { id: 'dsp', name: 'Digital Signal Processing', code: 'DSP', credits: 4, difficulty: 'hard', popularity: 80 },
        { id: 'vlsi', name: 'VLSI Design', code: 'VLSI', credits: 4, difficulty: 'hard', popularity: 82 },
        { id: 'embedded', name: 'Embedded Systems', code: 'ES', credits: 4, difficulty: 'medium', popularity: 90 },
        { id: 'microwave', name: 'Microwave Engineering', code: 'MW', credits: 3, difficulty: 'medium', popularity: 70 },
        { id: 'antenna', name: 'Antenna Theory', code: 'AT', credits: 3, difficulty: 'medium', popularity: 75 },
        { id: 'rf', name: 'RF Engineering', code: 'RF', credits: 3, difficulty: 'hard', popularity: 72 },
        { id: 'iot', name: 'Internet of Things', code: 'IoT', credits: 3, difficulty: 'medium', popularity: 95 },
        { id: 'robotics', name: 'Robotics', code: 'ROB', credits: 4, difficulty: 'hard', popularity: 85 }
      ],
      mech: [
        { id: 'thermo', name: 'Thermodynamics', code: 'THERMO', credits: 4, difficulty: 'medium', popularity: 85 },
        { id: 'fluid', name: 'Fluid Mechanics', code: 'FM', credits: 4, difficulty: 'medium', popularity: 82 },
        { id: 'som', name: 'Strength of Materials', code: 'SOM', credits: 4, difficulty: 'medium', popularity: 88 },
        { id: 'manufacturing', name: 'Manufacturing Processes', code: 'MP', credits: 3, difficulty: 'medium', popularity: 80 },
        { id: 'design', name: 'Machine Design', code: 'MD', credits: 4, difficulty: 'hard', popularity: 85 },
        { id: 'heat', name: 'Heat Transfer', code: 'HT', credits: 3, difficulty: 'medium', popularity: 78 },
        { id: 'dynamics', name: 'Engineering Dynamics', code: 'ED', credits: 4, difficulty: 'medium', popularity: 75 },
        { id: 'materials', name: 'Engineering Materials', code: 'EM', credits: 3, difficulty: 'easy', popularity: 82 },
        { id: 'automotive', name: 'Automotive Engineering', code: 'AE', credits: 3, difficulty: 'medium', popularity: 90 },
        { id: 'cad', name: 'CAD/CAM', code: 'CAD', credits: 3, difficulty: 'easy', popularity: 85 }
      ],
      civil: [
        { id: 'structural', name: 'Structural Analysis', code: 'SA', credits: 4, difficulty: 'medium', popularity: 85 },
        { id: 'concrete', name: 'Concrete Technology', code: 'CT', credits: 3, difficulty: 'medium', popularity: 82 },
        { id: 'geotechnical', name: 'Geotechnical Engineering', code: 'GE', credits: 4, difficulty: 'medium', popularity: 78 },
        { id: 'hydraulics', name: 'Hydraulics', code: 'HYD', credits: 3, difficulty: 'medium', popularity: 80 },
        { id: 'surveying', name: 'Surveying', code: 'SURV', credits: 3, difficulty: 'easy', popularity: 75 },
        { id: 'transportation', name: 'Transportation Engineering', code: 'TE', credits: 3, difficulty: 'medium', popularity: 77 },
        { id: 'environmental', name: 'Environmental Engineering', code: 'EE', credits: 3, difficulty: 'medium', popularity: 85 },
        { id: 'construction', name: 'Construction Management', code: 'CM', credits: 3, difficulty: 'easy', popularity: 88 },
        { id: 'earthquake', name: 'Earthquake Engineering', code: 'EQ', credits: 3, difficulty: 'hard', popularity: 70 },
        { id: 'gis', name: 'GIS and Remote Sensing', code: 'GIS', credits: 3, difficulty: 'medium', popularity: 82 }
      ],
      eee: [
        { id: 'circuits', name: 'Electrical Circuits', code: 'EC', credits: 4, difficulty: 'medium', popularity: 88 },
        { id: 'machines', name: 'Electrical Machines', code: 'EM', credits: 4, difficulty: 'medium', popularity: 85 },
        { id: 'power', name: 'Power Systems', code: 'PS', credits: 4, difficulty: 'hard', popularity: 82 },
        { id: 'control', name: 'Control Systems', code: 'CS', credits: 4, difficulty: 'hard', popularity: 80 },
        { id: 'electronics', name: 'Power Electronics', code: 'PE', credits: 4, difficulty: 'medium', popularity: 85 },
        { id: 'drives', name: 'Electric Drives', code: 'ED', credits: 3, difficulty: 'medium', popularity: 78 },
        { id: 'protection', name: 'Power System Protection', code: 'PSP', credits: 3, difficulty: 'hard', popularity: 75 },
        { id: 'renewable', name: 'Renewable Energy Systems', code: 'RES', credits: 3, difficulty: 'medium', popularity: 95 },
        { id: 'smart_grid', name: 'Smart Grid Technology', code: 'SGT', credits: 3, difficulty: 'medium', popularity: 90 },
        { id: 'hvdc', name: 'HVDC Transmission', code: 'HVDC', credits: 3, difficulty: 'hard', popularity: 65 }
      ],
      it: [
        { id: 'programming', name: 'Programming Languages', code: 'PL', credits: 4, difficulty: 'medium', popularity: 95 },
        { id: 'ds_it', name: 'Data Structures', code: 'DS', credits: 4, difficulty: 'medium', popularity: 92 },
        { id: 'dbms_it', name: 'Database Management', code: 'DBMS', credits: 3, difficulty: 'medium', popularity: 88 },
        { id: 'networks', name: 'Computer Networks', code: 'CN', credits: 3, difficulty: 'medium', popularity: 85 },
        { id: 'security', name: 'Information Security', code: 'IS', credits: 3, difficulty: 'medium', popularity: 92 },
        { id: 'web_dev', name: 'Web Development', code: 'WD', credits: 3, difficulty: 'easy', popularity: 98 },
        { id: 'mobile', name: 'Mobile Computing', code: 'MC', credits: 3, difficulty: 'medium', popularity: 95 },
        { id: 'cloud', name: 'Cloud Computing', code: 'CC', credits: 3, difficulty: 'medium', popularity: 96 },
        { id: 'devops', name: 'DevOps', code: 'DO', credits: 3, difficulty: 'medium', popularity: 85 },
        { id: 'bigdata', name: 'Big Data Analytics', code: 'BDA', credits: 4, difficulty: 'hard', popularity: 88 }
      ],
      chem: [
        { id: 'process', name: 'Chemical Process Calculations', code: 'CPC', credits: 4, difficulty: 'medium', popularity: 80 },
        { id: 'thermodynamics', name: 'Chemical Thermodynamics', code: 'CT', credits: 4, difficulty: 'hard', popularity: 75 },
        { id: 'reaction', name: 'Chemical Reaction Engineering', code: 'CRE', credits: 4, difficulty: 'hard', popularity: 82 },
        { id: 'separation', name: 'Separation Processes', code: 'SP', credits: 4, difficulty: 'medium', popularity: 78 },
        { id: 'transport', name: 'Transport Phenomena', code: 'TP', credits: 4, difficulty: 'hard', popularity: 70 },
        { id: 'kinetics', name: 'Chemical Kinetics', code: 'CK', credits: 3, difficulty: 'medium', popularity: 75 },
        { id: 'design', name: 'Process Design', code: 'PD', credits: 4, difficulty: 'hard', popularity: 85 },
        { id: 'safety', name: 'Process Safety', code: 'PS', credits: 3, difficulty: 'medium', popularity: 88 },
        { id: 'polymer', name: 'Polymer Engineering', code: 'PE', credits: 3, difficulty: 'medium', popularity: 72 },
        { id: 'biotech', name: 'Biochemical Engineering', code: 'BE', credits: 3, difficulty: 'medium', popularity: 85 }
      ],
      aero: [
        { id: 'aerodynamics', name: 'Aerodynamics', code: 'AERO', credits: 4, difficulty: 'hard', popularity: 85 },
        { id: 'structures', name: 'Aircraft Structures', code: 'AS', credits: 4, difficulty: 'medium', popularity: 82 },
        { id: 'propulsion', name: 'Aircraft Propulsion', code: 'AP', credits: 4, difficulty: 'hard', popularity: 88 },
        { id: 'flight', name: 'Flight Mechanics', code: 'FM', credits: 4, difficulty: 'hard', popularity: 80 },
        { id: 'design', name: 'Aircraft Design', code: 'AD', credits: 4, difficulty: 'hard', popularity: 90 },
        { id: 'control', name: 'Flight Control Systems', code: 'FCS', credits: 3, difficulty: 'medium', popularity: 78 },
        { id: 'materials', name: 'Aerospace Materials', code: 'AM', credits: 3, difficulty: 'medium', popularity: 75 },
        { id: 'systems', name: 'Aircraft Systems', code: 'ASY', credits: 3, difficulty: 'medium', popularity: 82 },
        { id: 'space', name: 'Space Technology', code: 'ST', credits: 3, difficulty: 'hard', popularity: 95 },
        { id: 'avionics', name: 'Avionics', code: 'AVI', credits: 3, difficulty: 'medium', popularity: 85 }
      ]
    };

    const subjects = subjectsByBranch[branchId] || [];
    this.setCachedData(cacheKey, subjects);
    return subjects;
  }

  // Get popular subjects across all branches
  async getPopularSubjects(limit = 10) {
    const cacheKey = 'popular_subjects';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const allSubjects = [];
      const branches = ['cse', 'ece', 'mech', 'civil', 'eee', 'it', 'chem', 'aero'];
      
      for (const branchId of branches) {
        const subjects = await this.getSubjectsByBranch(branchId);
        allSubjects.push(...subjects.map(s => ({ ...s, branch: branchId })));
      }

      // Sort by popularity and return top subjects
      const popular = allSubjects
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, limit);

      this.setCachedData(cacheKey, popular);
      return popular;
    } catch (error) {
      console.error('Error fetching popular subjects:', error);
      return [];
    }
  }

  // Save user subject preferences for analytics
  async saveSubjectPreferences(userId, branchId, subjects) {
    const preferences = {
      userId,
      branchId,
      subjects,
      timestamp: new Date().toISOString(),
      analytics: {
        totalSubjects: subjects.length,
        averageDifficulty: this.calculateAverageDifficulty(subjects),
        preferredAreas: this.identifyPreferredAreas(subjects)
      }
    };

    try {
      await safeFirestoreAdd('user_preferences', preferences);
      console.log('✅ Subject preferences saved');
    } catch (error) {
      console.log('📱 Using fallback storage for preferences');
      localStorage.setItem(`preferences_${userId}`, JSON.stringify(preferences));
    }
  }

  // Helper method to calculate average difficulty
  calculateAverageDifficulty(subjects) {
    const difficultyMap = { easy: 1, medium: 2, hard: 3 };
    const totalDifficulty = subjects.reduce((sum, subject) => {
      return sum + (difficultyMap[subject.difficulty] || 2);
    }, 0);
    return totalDifficulty / subjects.length;
  }

  // Helper method to identify preferred areas
  identifyPreferredAreas(subjects) {
    const areas = {};
    subjects.forEach(subject => {
      const category = this.categorizeSubject(subject.code);
      areas[category] = (areas[category] || 0) + 1;
    });
    return areas;
  }

  // Categorize subjects into areas
  categorizeSubject(code) {
    const categories = {
      programming: ['DS', 'ALGO', 'OOPS', 'PL', 'WD'],
      systems: ['OS', 'CN', 'DBMS', 'CC', 'IS'],
      emerging: ['AI', 'ML', 'IoT', 'BC', 'BDA'],
      core: ['SS', 'COMM', 'THERMO', 'FM', 'EC'],
      design: ['VLSI', 'MD', 'AD', 'PD'],
      management: ['SE', 'CM', 'PS', 'DO']
    };

    for (const [category, codes] of Object.entries(categories)) {
      if (codes.includes(code)) return category;
    }
    return 'other';
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      expiry: this.cacheExpiry
    };
  }
}

// Create singleton instance
const realTimeDataService = new RealTimeDataService();

export default realTimeDataService;
