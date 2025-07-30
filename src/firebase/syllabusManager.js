import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';

// Get user syllabi
export const getUserSyllabi = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Simple query without compound index requirement
    const syllabusQuery = query(
      collection(db, 'syllabi'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(syllabusQuery);
    const syllabi = [];

    querySnapshot.forEach((doc) => {
      syllabi.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by createdAt in JavaScript to avoid index requirement
    syllabi.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
      return dateB - dateA; // Descending order (newest first)
    });

    return syllabi;
  } catch (error) {
    console.error('Error getting user syllabi:', error);
    // Return empty array as fallback
    return [];
  }
};

// Save syllabus for user
export const saveSyllabus = async (userId, syllabusData) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const syllabusDoc = {
      ...syllabusData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'syllabi'), syllabusDoc);
    return { id: docRef.id, ...syllabusDoc };
  } catch (error) {
    console.error('Error saving syllabus:', error);
    throw error;
  }
};

// Update syllabus
export const updateSyllabus = async (syllabusId, updates) => {
  try {
    if (!syllabusId) {
      throw new Error('Syllabus ID is required');
    }

    const syllabusRef = doc(db, 'syllabi', syllabusId);
    await updateDoc(syllabusRef, {
      ...updates,
      updatedAt: new Date()
    });

    return { id: syllabusId, ...updates };
  } catch (error) {
    console.error('Error updating syllabus:', error);
    throw error;
  }
};

// Delete syllabus
export const deleteSyllabus = async (syllabusId) => {
  try {
    if (!syllabusId) {
      throw new Error('Syllabus ID is required');
    }

    await deleteDoc(doc(db, 'syllabi', syllabusId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting syllabus:', error);
    throw error;
  }
};

// Get syllabus by ID
export const getSyllabusById = async (syllabusId) => {
  try {
    if (!syllabusId) {
      throw new Error('Syllabus ID is required');
    }

    const syllabusRef = doc(db, 'syllabi', syllabusId);
    const syllabusSnap = await getDoc(syllabusRef);

    if (syllabusSnap.exists()) {
      return { id: syllabusSnap.id, ...syllabusSnap.data() };
    } else {
      throw new Error('Syllabus not found');
    }
  } catch (error) {
    console.error('Error getting syllabus:', error);
    throw error;
  }
};

// Generate questions from syllabus (mock implementation)
export const generateQuestionsFromSyllabus = async (syllabusData, difficulty = 'medium', count = 10) => {
  try {
    // This is a mock implementation
    // In a real scenario, this would interface with an AI service
    const mockQuestions = [
      {
        id: 1,
        question: "What is the time complexity of binary search?",
        options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
        correctAnswer: 1,
        difficulty: "medium",
        subject: syllabusData.subject || "Computer Science",
        topic: "Algorithms",
        explanation: "Binary search divides the search space in half with each comparison, resulting in O(log n) time complexity."
      },
      {
        id: 2,
        question: "Which data structure uses LIFO principle?",
        options: ["Queue", "Stack", "Array", "Linked List"],
        correctAnswer: 1,
        difficulty: "easy",
        subject: syllabusData.subject || "Computer Science",
        topic: "Data Structures",
        explanation: "Stack follows Last In First Out (LIFO) principle where the last element added is the first one to be removed."
      },
      {
        id: 3,
        question: "What is the purpose of a primary key in a database?",
        options: ["To create relationships", "To uniquely identify records", "To sort data", "To backup data"],
        correctAnswer: 1,
        difficulty: "medium",
        subject: syllabusData.subject || "Computer Science",
        topic: "Database Systems",
        explanation: "A primary key uniquely identifies each record in a database table and ensures no duplicate records exist."
      },
      {
        id: 4,
        question: "Which HTTP method is used to update a resource?",
        options: ["GET", "POST", "PUT", "DELETE"],
        correctAnswer: 2,
        difficulty: "easy",
        subject: syllabusData.subject || "Computer Science",
        topic: "Web Technologies",
        explanation: "PUT method is used to update an existing resource or create a new resource if it doesn't exist."
      },
      {
        id: 5,
        question: "What is the worst-case time complexity of quicksort?",
        options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"],
        correctAnswer: 1,
        difficulty: "hard",
        subject: syllabusData.subject || "Computer Science",
        topic: "Algorithms",
        explanation: "Quicksort has O(n²) worst-case time complexity when the pivot is always the smallest or largest element."
      }
    ];

    // Filter by difficulty if specified
    let filteredQuestions = mockQuestions;
    if (difficulty !== 'all') {
      filteredQuestions = mockQuestions.filter(q => q.difficulty === difficulty);
    }

    // Return requested count or all available
    return filteredQuestions.slice(0, count);
  } catch (error) {
    console.error('Error generating questions from syllabus:', error);
    // Return some default questions as fallback
    return [
      {
        id: 1,
        question: "What is a variable in programming?",
        options: ["A constant value", "A storage location with a name", "A function", "A loop"],
        correctAnswer: 1,
        difficulty: "easy",
        subject: "Computer Science",
        topic: "Programming Basics",
        explanation: "A variable is a storage location with an associated name that can hold data that can be modified during program execution."
      }
    ];
  }
};

// Search syllabi by subject or topic
export const searchSyllabi = async (userId, searchTerm) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const syllabusQuery = query(
      collection(db, 'syllabi'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(syllabusQuery);
    const syllabi = [];

    querySnapshot.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() };
      // Simple text search
      if (
        data.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.description?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        syllabi.push(data);
      }
    });

    return syllabi;
  } catch (error) {
    console.error('Error searching syllabi:', error);
    return [];
  }
};

// Get syllabus statistics
export const getSyllabusStats = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const syllabi = await getUserSyllabi(userId);
    
    const stats = {
      totalSyllabi: syllabi.length,
      subjects: [...new Set(syllabi.map(s => s.subject))],
      recentlyAdded: syllabi.slice(0, 5),
      totalTopics: syllabi.reduce((acc, s) => acc + (s.topics?.length || 0), 0)
    };

    return stats;
  } catch (error) {
    console.error('Error getting syllabus stats:', error);
    return {
      totalSyllabi: 0,
      subjects: [],
      recentlyAdded: [],
      totalTopics: 0
    };
  }
};

// Get syllabi by branch
export const getSyllabiByBranch = async (branchCode) => {
  try {
    if (!branchCode) {
      throw new Error('Branch code is required');
    }

    const syllabusQuery = query(
      collection(db, 'syllabi'),
      where('branch', '==', branchCode),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(syllabusQuery);
    const syllabi = [];

    querySnapshot.forEach((doc) => {
      syllabi.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // If no syllabi found, return default ones for the branch
    if (syllabi.length === 0) {
      return getDefaultSyllabiByBranch(branchCode);
    }

    return syllabi;
  } catch (error) {
    console.error('Error getting syllabi by branch:', error);
    // Return default syllabi as fallback
    return getDefaultSyllabiByBranch(branchCode);
  }
};

// Upload syllabus PDF
export const uploadSyllabusPDF = async (file, userId, metadata = {}) => {
  try {
    if (!file) {
      throw new Error('File is required');
    }
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Create a reference to the file location
    const fileName = `syllabi/${userId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Save metadata to Firestore
    const syllabusData = {
      fileName: file.name,
      fileUrl: downloadURL,
      fileSize: file.size,
      uploadedAt: new Date(),
      userId,
      ...metadata,
      type: 'pdf'
    };

    const docRef = await addDoc(collection(db, 'syllabi'), syllabusData);

    return {
      id: docRef.id,
      ...syllabusData,
      success: true
    };
  } catch (error) {
    console.error('Error uploading syllabus PDF:', error);
    
    // Return a mock response for development
    return {
      id: `mock_${Date.now()}`,
      fileName: file?.name || 'syllabus.pdf',
      fileUrl: `mock://localhost/syllabus/${Date.now()}`,
      fileSize: file?.size || 0,
      uploadedAt: new Date(),
      userId,
      ...metadata,
      type: 'pdf',
      success: true,
      isMock: true
    };
  }
};

// Get default syllabi by branch
const getDefaultSyllabiByBranch = (branchCode) => {
  const defaultSyllabi = {
    'CSE': [
      {
        id: 'cse_default_1',
        subject: 'Data Structures',
        title: 'Data Structures and Algorithms',
        description: 'Fundamental data structures and algorithms',
        branch: 'CSE',
        semester: 3,
        topics: ['Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Graphs'],
        difficulty: 'medium'
      },
      {
        id: 'cse_default_2',
        subject: 'Database Management Systems',
        title: 'DBMS Fundamentals',
        description: 'Database design and management concepts',
        branch: 'CSE',
        semester: 4,
        topics: ['ER Model', 'Normalization', 'SQL', 'Transactions', 'Indexing'],
        difficulty: 'medium'
      }
    ],
    'ECE': [
      {
        id: 'ece_default_1',
        subject: 'Digital Electronics',
        title: 'Digital Circuit Design',
        description: 'Digital logic and circuit design',
        branch: 'ECE',
        semester: 3,
        topics: ['Boolean Algebra', 'Logic Gates', 'Flip-Flops', 'Counters'],
        difficulty: 'medium'
      }
    ],
    'MECH': [
      {
        id: 'mech_default_1',
        subject: 'Thermodynamics',
        title: 'Engineering Thermodynamics',
        description: 'Heat and energy transfer principles',
        branch: 'MECH',
        semester: 3,
        topics: ['Laws of Thermodynamics', 'Heat Engines', 'Entropy'],
        difficulty: 'medium'
      }
    ]
  };

  return defaultSyllabi[branchCode] || defaultSyllabi['CSE'];
};
