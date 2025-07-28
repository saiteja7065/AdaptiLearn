// Real AI service integration for question generation
import { GoogleGenerativeAI } from '@google/generative-ai';

class RealAIQuestionGenerator {
  constructor() {
    // Initialize Gemini API (fallback to mock if no API key)
    this.geminiApiKey = process.env.REACT_APP_GEMINI_API_KEY;
    this.openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;
    
    if (this.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(this.geminiApiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    }
  }

  // Extract topics from PDF text using AI
  async extractTopicsFromText(text, branchId, semester) {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('No text content provided');
      }

      // Use AI if available, otherwise fallback to intelligent parsing
      if (this.geminiApiKey && this.model) {
        return await this.aiExtractTopics(text, branchId, semester);
      } else {
        return await this.intelligentTopicExtraction(text, branchId, semester);
      }
    } catch (error) {
      console.error('Error extracting topics:', error);
      return {
        success: false,
        error: error.message,
        topics: [],
        subjects: []
      };
    }
  }

  // AI-powered topic extraction using Gemini
  async aiExtractTopics(text, branchId, semester) {
    try {
      const prompt = `
        Analyze this syllabus content for ${branchId.toUpperCase()} branch, semester ${semester}.
        Extract and organize the academic topics and subjects.

        Syllabus Content:
        ${text.substring(0, 2000)} // Limit to 2000 chars for API efficiency

        Please provide a JSON response with:
        {
          "subjects": [
            {
              "name": "Subject Name",
              "code": "Subject Code",
              "units": [
                {
                  "unitNumber": 1,
                  "title": "Unit Title",
                  "topics": ["topic1", "topic2", "topic3"],
                  "weightage": 25
                }
              ]
            }
          ],
          "allTopics": ["comprehensive list of all topics"],
          "difficulty_levels": ["Basic", "Intermediate", "Advanced"],
          "estimated_study_hours": 120
        }

        Focus on:
        - Extracting actual subject names and codes
        - Identifying unit-wise topic distribution
        - Determining appropriate weightage for each unit
        - Categorizing topics by difficulty level
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const aiText = response.text();

      // Parse AI response
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          topics: parsedData.allTopics || [],
          subjects: parsedData.subjects || [],
          estimatedHours: parsedData.estimated_study_hours || 100,
          difficultyLevels: parsedData.difficulty_levels || ['Basic', 'Intermediate', 'Advanced']
        };
      } else {
        throw new Error('Could not parse AI response');
      }
    } catch (error) {
      console.warn('AI extraction failed, falling back to intelligent parsing:', error);
      return await this.intelligentTopicExtraction(text, branchId, semester);
    }
  }

  // Intelligent topic extraction without AI
  async intelligentTopicExtraction(text, branchId, semester) {
    const analysis = {
      success: true,
      topics: [],
      subjects: [],
      estimatedHours: 0,
      difficultyLevels: ['Basic', 'Intermediate', 'Advanced']
    };

    // Enhanced topic extraction patterns
    const topicPatterns = [
      // Numbered lists
      /(?:^|\n)\s*(\d+\.?\d*)\s*[-.]?\s*([^\n]{10,80})/gm,
      // Bullet points
      /(?:^|\n)\s*[•\*\-]\s*([^\n]{10,80})/gm,
      // Unit/Chapter headings
      /(?:unit|chapter|section|module)\s*[-:]?\s*\d+\s*[-:]?\s*([^\n]{5,60})/gi,
      // Subject codes and names
      /([A-Z]{2,4}\s*\d{3})\s*[-:]?\s*([^\n]{10,60})/gm
    ];

    const extractedTopics = new Set();
    const extractedSubjects = new Set();

    // Extract using patterns
    topicPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const topic = match[match.length - 1].trim();
        if (this.isValidTopic(topic)) {
          extractedTopics.add(topic);
        }
      });
    });

    // Branch-specific subject identification
    const branchSubjects = this.getBranchSubjects(branchId, semester);
    const textLower = text.toLowerCase();

    branchSubjects.forEach(subject => {
      const subjectLower = subject.name.toLowerCase();
      const keywords = subjectLower.split(' ');
      
      let matchCount = 0;
      keywords.forEach(keyword => {
        if (keyword.length > 3 && textLower.includes(keyword)) {
          matchCount++;
        }
      });

      if (matchCount >= Math.ceil(keywords.length / 2)) {
        extractedSubjects.add(subject);
      }
    });

    // Organize topics into subjects
    const organizedSubjects = Array.from(extractedSubjects).map(subject => {
      const relatedTopics = Array.from(extractedTopics).filter(topic => 
        this.isTopicRelatedToSubject(topic, subject.name)
      );

      return {
        name: subject.name,
        code: subject.code,
        credits: subject.credits || 4,
        units: this.organizeTopicsIntoUnits(relatedTopics, subject.name),
        totalTopics: relatedTopics.length,
        estimatedHours: relatedTopics.length * 3
      };
    });

    analysis.topics = Array.from(extractedTopics);
    analysis.subjects = organizedSubjects;
    analysis.estimatedHours = organizedSubjects.reduce((sum, subject) => sum + subject.estimatedHours, 0);

    return analysis;
  }

  // Generate questions using AI or intelligent templates
  async generateQuestionsFromTopics(topics, subject, difficulty = 'medium', count = 5) {
    try {
      if (this.geminiApiKey && this.model) {
        return await this.aiGenerateQuestions(topics, subject, difficulty, count);
      } else {
        return await this.templateBasedQuestions(topics, subject, difficulty, count);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      return {
        success: false,
        error: error.message,
        questions: []
      };
    }
  }

  // AI-powered question generation
  async aiGenerateQuestions(topics, subject, difficulty, count) {
    try {
      const topicList = Array.isArray(topics) ? topics.join(', ') : topics;
      
      const prompt = `
        Generate ${count} multiple-choice questions for the subject "${subject}".
        Topics to cover: ${topicList}
        Difficulty level: ${difficulty}

        For each question, provide:
        {
          "question": "Question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Detailed explanation of the correct answer",
          "topic": "Specific topic this question covers",
          "difficulty": "${difficulty}",
          "bloomsLevel": "Remember/Understand/Apply/Analyze/Evaluate/Create",
          "estimatedTime": 60
        }

        Make questions:
        - Academically rigorous and relevant
        - Clear and unambiguous
        - Appropriate for the difficulty level
        - Covering different aspects of the topics
        - Include proper distractors in options

        Return as JSON array of question objects.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const aiText = response.text();

      // Parse AI response
      const jsonMatch = aiText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          questions: questions.map((q, index) => ({
            id: `ai_q_${Date.now()}_${index}`,
            ...q,
            createdAt: new Date().toISOString(),
            source: 'ai_generated'
          }))
        };
      } else {
        throw new Error('Could not parse AI question response');
      }
    } catch (error) {
      console.warn('AI question generation failed, using templates:', error);
      return await this.templateBasedQuestions(topics, subject, difficulty, count);
    }
  }

  // Template-based question generation
  async templateBasedQuestions(topics, subject, difficulty, count) {
    const questions = [];
    const questionTemplates = this.getQuestionTemplates(difficulty);
    const topicArray = Array.isArray(topics) ? topics : [topics];

    for (let i = 0; i < count && i < topicArray.length; i++) {
      const topic = topicArray[i];
      const template = questionTemplates[i % questionTemplates.length];
      
      const question = {
        id: `template_q_${Date.now()}_${i}`,
        question: template.format.replace('{topic}', topic).replace('{subject}', subject),
        options: template.options.map(opt => opt.replace('{topic}', topic)),
        correctAnswer: template.correctAnswer,
        explanation: template.explanation.replace('{topic}', topic),
        topic: topic,
        difficulty: difficulty,
        bloomsLevel: template.bloomsLevel,
        estimatedTime: template.estimatedTime,
        createdAt: new Date().toISOString(),
        source: 'template_based'
      };

      questions.push(question);
    }

    return {
      success: true,
      questions
    };
  }

  // Helper methods
  isValidTopic(topic) {
    return topic && 
           topic.length >= 5 && 
           topic.length <= 100 && 
           !/^\d+$/.test(topic) && 
           !topic.includes('Page') && 
           !topic.includes('www.');
  }

  isTopicRelatedToSubject(topic, subjectName) {
    const topicLower = topic.toLowerCase();
    const subjectWords = subjectName.toLowerCase().split(' ');
    
    return subjectWords.some(word => 
      word.length > 3 && topicLower.includes(word)
    );
  }

  organizeTopicsIntoUnits(topics, subjectName) {
    const unitsCount = Math.min(Math.max(Math.ceil(topics.length / 5), 2), 6);
    const topicsPerUnit = Math.ceil(topics.length / unitsCount);
    const units = [];

    for (let i = 0; i < unitsCount; i++) {
      const startIndex = i * topicsPerUnit;
      const endIndex = Math.min(startIndex + topicsPerUnit, topics.length);
      const unitTopics = topics.slice(startIndex, endIndex);

      if (unitTopics.length > 0) {
        units.push({
          unitNumber: i + 1,
          title: `Unit ${i + 1}: ${this.generateUnitTitle(unitTopics, subjectName)}`,
          topics: unitTopics,
          weightage: Math.round(100 / unitsCount),
          estimatedHours: unitTopics.length * 2
        });
      }
    }

    return units;
  }

  generateUnitTitle(topics, subjectName) {
    const commonWords = ['Introduction', 'Fundamentals', 'Advanced', 'Applications', 'Implementation'];
    const unitIndex = Math.floor(Math.random() * commonWords.length);
    return `${commonWords[unitIndex]} to ${subjectName.split(' ')[0]}`;
  }

  getBranchSubjects(branchId, semester) {
    const subjectDatabase = {
      cse: {
        1: [
          { name: 'Programming Fundamentals', code: 'CS101', credits: 4 },
          { name: 'Mathematics I', code: 'MA101', credits: 4 },
          { name: 'Physics', code: 'PH101', credits: 3 },
          { name: 'Chemistry', code: 'CH101', credits: 3 },
          { name: 'English Communication', code: 'EN101', credits: 2 }
        ],
        3: [
          { name: 'Data Structures', code: 'CS301', credits: 4 },
          { name: 'Database Management Systems', code: 'CS302', credits: 4 },
          { name: 'Computer Organization', code: 'CS303', credits: 3 },
          { name: 'Operating Systems', code: 'CS304', credits: 4 },
          { name: 'Discrete Mathematics', code: 'MA301', credits: 3 }
        ]
      }
    };

    return subjectDatabase[branchId]?.[semester] || [
      { name: 'General Subject', code: 'GEN101', credits: 4 }
    ];
  }

  getQuestionTemplates(difficulty) {
    const templates = {
      easy: [
        {
          format: "What is {topic} in the context of {subject}?",
          options: [
            "A fundamental concept in {topic}",
            "An advanced technique",
            "A deprecated method",
            "Not related to the subject"
          ],
          correctAnswer: 0,
          explanation: "{topic} is indeed a fundamental concept that forms the basis of understanding in this area.",
          bloomsLevel: "Remember",
          estimatedTime: 45
        }
      ],
      medium: [
        {
          format: "How does {topic} relate to other concepts in {subject}?",
          options: [
            "It operates independently",
            "It integrates with multiple related concepts",
            "It conflicts with other concepts",
            "It has no significant relationships"
          ],
          correctAnswer: 1,
          explanation: "{topic} typically integrates with and builds upon other related concepts in {subject}.",
          bloomsLevel: "Understand",
          estimatedTime: 60
        }
      ],
      hard: [
        {
          format: "Analyze the implementation challenges of {topic} in real-world {subject} applications.",
          options: [
            "No significant challenges exist",
            "Challenges include complexity, scalability, and integration issues",
            "Only theoretical challenges matter",
            "Implementation is always straightforward"
          ],
          correctAnswer: 1,
          explanation: "Real-world implementation of {topic} involves multiple challenges including complexity management, scalability concerns, and integration with existing systems.",
          bloomsLevel: "Analyze",
          estimatedTime: 90
        }
      ]
    };

    return templates[difficulty] || templates.medium;
  }
}

export default RealAIQuestionGenerator;
export { RealAIQuestionGenerator };
