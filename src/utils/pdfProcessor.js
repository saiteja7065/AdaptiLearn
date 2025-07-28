// Real PDF processing utilities for syllabus content extraction
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

class PDFProcessor {
  constructor() {
    this.textExtracted = '';
    this.pageContents = [];
    this.metadata = {};
  }

  // Extract text content from PDF file
  async extractTextFromPDF(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      this.metadata = {
        numPages: pdf.numPages,
        title: file.name,
        size: file.size,
        type: file.type
      };

      let fullText = '';
      this.pageContents = [];

      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ')
          .trim();
        
        this.pageContents.push({
          pageNumber: pageNum,
          text: pageText,
          wordCount: pageText.split(/\s+/).length
        });
        
        fullText += pageText + '\n';
      }

      this.textExtracted = fullText.trim();
      
      return {
        success: true,
        text: this.textExtracted,
        pages: this.pageContents,
        metadata: this.metadata,
        analysis: this.analyzeTextStructure(this.textExtracted)
      };
    } catch (error) {
      console.error('PDF processing error:', error);
      return {
        success: false,
        error: error.message,
        text: '',
        pages: [],
        metadata: {}
      };
    }
  }

  // Analyze text structure to identify syllabus components
  analyzeTextStructure(text) {
    const analysis = {
      totalWords: 0,
      totalCharacters: text.length,
      sections: [],
      topics: [],
      units: [],
      subjects: [],
      estimatedReadingTime: 0
    };

    if (!text || text.length === 0) {
      return analysis;
    }

    // Count words
    const words = text.split(/\s+/).filter(word => word.length > 0);
    analysis.totalWords = words.length;
    analysis.estimatedReadingTime = Math.ceil(words.length / 200); // 200 WPM average

    // Extract sections based on common patterns
    const sectionPatterns = [
      /(?:unit|chapter|section|module)\s*[-:]?\s*(\d+)[\s\S]*?(?=(?:unit|chapter|section|module)\s*[-:]?\s*\d+|$)/gi,
      /(?:topic|lesson)\s*[-:]?\s*(\d+)[\s\S]*?(?=(?:topic|lesson)\s*[-:]?\s*\d+|$)/gi
    ];

    sectionPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        analysis.sections.push({
          number: match[1],
          content: match[0].substring(0, 200) + '...',
          fullContent: match[0]
        });
      }
    });

    // Extract subject names (common academic terms)
    const subjectKeywords = [
      'programming', 'algorithms', 'data structures', 'database', 'operating system',
      'computer networks', 'software engineering', 'web technology', 'machine learning',
      'artificial intelligence', 'mathematics', 'physics', 'chemistry', 'electronics',
      'digital circuits', 'analog circuits', 'signals', 'communication', 'microprocessor',
      'thermodynamics', 'fluid mechanics', 'strength of materials', 'machine design',
      'manufacturing', 'heat transfer', 'control systems', 'robotics'
    ];

    subjectKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}[\\w\\s]*`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        analysis.subjects.push(...matches.slice(0, 3)); // Limit to 3 matches per keyword
      }
    });

    // Extract topics from numbered lists and bullet points
    const topicPatterns = [
      /(?:^|\n)\s*(?:\d+\.|\*|-|\•)\s*([^\n]+)/gm,
      /(?:^|\n)\s*(?:[a-z]\)|\([a-z]\))\s*([^\n]+)/gm
    ];

    topicPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const topic = match[1].trim();
        if (topic.length > 5 && topic.length < 100) {
          analysis.topics.push(topic);
        }
      }
    });

    // Remove duplicates and limit results
    analysis.subjects = [...new Set(analysis.subjects)].slice(0, 10);
    analysis.topics = [...new Set(analysis.topics)].slice(0, 20);

    return analysis;
  }

  // Extract syllabus-specific information
  extractSyllabusData(text, branchId, semester) {
    const syllabusData = {
      branchId,
      semester: parseInt(semester),
      extractedAt: new Date().toISOString(),
      content: {
        rawText: text,
        structure: this.analyzeTextStructure(text)
      },
      subjects: [],
      totalTopics: 0,
      estimatedStudyHours: 0
    };

    // Extract subjects and units based on branch
    const subjectExtractionRules = {
      cse: {
        patterns: [
          /programming|coding|software|algorithm|data structure|database|network|system|web|mobile/gi,
          /computer|digital|software engineering|operating system|compiler|artificial intelligence/gi
        ]
      },
      ece: {
        patterns: [
          /electronic|circuit|signal|communication|microprocessor|vlsi|embedded|control/gi,
          /analog|digital|microwave|antenna|telecommunication|semiconductor/gi
        ]
      },
      mech: {
        patterns: [
          /mechanical|thermal|fluid|strength|machine|manufacturing|design|material/gi,
          /thermodynamics|heat transfer|dynamics|kinematics|engineering drawing/gi
        ]
      }
    };

    const rules = subjectExtractionRules[branchId] || subjectExtractionRules.cse;
    
    rules.patterns.forEach((pattern, index) => {
      const matches = text.match(pattern) || [];
      if (matches.length > 0) {
        syllabusData.subjects.push({
          id: `subject_${index + 1}`,
          name: this.inferSubjectName(matches[0], branchId, semester),
          topics: matches.slice(0, 10),
          estimatedHours: matches.length * 2,
          weightage: Math.min(Math.max(matches.length * 5, 15), 35)
        });
      }
    });

    syllabusData.totalTopics = syllabusData.subjects.reduce((sum, subject) => sum + subject.topics.length, 0);
    syllabusData.estimatedStudyHours = syllabusData.subjects.reduce((sum, subject) => sum + subject.estimatedHours, 0);

    return syllabusData;
  }

  // Infer subject name based on content and branch
  inferSubjectName(firstMatch, branchId, semester) {
    const subjectMappings = {
      cse: {
        1: ['Programming Fundamentals', 'Mathematics-I', 'Physics', 'Chemistry', 'English'],
        2: ['Object Oriented Programming', 'Mathematics-II', 'Data Structures', 'Digital Logic', 'Environmental Science'],
        3: ['Database Management Systems', 'Computer Organization', 'Operating Systems', 'Discrete Mathematics', 'Probability'],
        4: ['Algorithms', 'Computer Networks', 'Software Engineering', 'Theory of Computation', 'Economics'],
        5: ['Machine Learning', 'Compiler Design', 'Web Technologies', 'Computer Graphics', 'Human Computer Interaction'],
        6: ['Artificial Intelligence', 'Mobile Computing', 'Cloud Computing', 'Information Security', 'Project Management'],
        7: ['Advanced Algorithms', 'Distributed Systems', 'Big Data Analytics', 'IoT', 'Blockchain'],
        8: ['Capstone Project', 'Advanced Topics', 'Industry Internship', 'Research Methodology', 'Entrepreneurship']
      }
    };

    const semesterSubjects = subjectMappings[branchId]?.[semester] || ['General Subject'];
    
    // Try to match the first word with known subjects
    const firstWord = firstMatch.toLowerCase();
    for (const subject of semesterSubjects) {
      if (subject.toLowerCase().includes(firstWord) || firstWord.includes(subject.toLowerCase().split(' ')[0])) {
        return subject;
      }
    }

    return semesterSubjects[0] || 'General Subject';
  }

  // Validate PDF file
  static validatePDFFile(file) {
    const errors = [];
    
    if (!file) {
      errors.push('No file selected');
      return { valid: false, errors };
    }

    if (file.type !== 'application/pdf') {
      errors.push('File must be a PDF');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      errors.push('File size must be less than 10MB');
    }

    if (file.size < 1024) { // 1KB minimum
      errors.push('File appears to be too small to contain syllabus content');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Get reading progress estimate
  getReadingProgress(currentPage, totalPages) {
    return {
      percentage: Math.round((currentPage / totalPages) * 100),
      pagesRemaining: totalPages - currentPage,
      estimatedTimeRemaining: Math.ceil((totalPages - currentPage) * 0.5) // 30 seconds per page
    };
  }
}

export default PDFProcessor;
export { PDFProcessor };
