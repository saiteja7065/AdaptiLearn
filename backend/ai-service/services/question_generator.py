import json
import re
import random
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class QuestionGenerator:
    def __init__(self, gemini_model: Optional[Any] = None):
        self.gemini_model = gemini_model
        self.has_ai = bool(gemini_model)
        
    async def generate_questions(
        self,
        content: str,
        num_questions: int = 10,
        difficulty: str = "medium",
        question_type: str = "mcq",
        subject: str = "General",
        branch: str = "",
        semester: int = 1
    ) -> List[Dict[str, Any]]:
        """
        Generate questions from content using AI or fallback to rule-based generation
        """
        try:
            if self.has_ai:
                return await self._generate_ai_questions(
                    content, num_questions, difficulty, question_type, subject, branch, semester
                )
            else:
                return await self._generate_fallback_questions(
                    content, num_questions, difficulty, question_type, subject, branch, semester
                )
        except Exception as e:
            logger.error(f"Error in question generation: {str(e)}")
            # Always fallback to rule-based generation on error
            return await self._generate_fallback_questions(
                content, num_questions, difficulty, question_type, subject, branch, semester
            )
    
    async def _generate_ai_questions(
        self,
        content: str,
        num_questions: int,
        difficulty: str,
        question_type: str,
        subject: str,
        branch: str,
        semester: int
    ) -> List[Dict[str, Any]]:
        """Generate questions using AI (OpenAI or Gemini)"""
        
        prompt = self._create_question_prompt(
            content, num_questions, difficulty, question_type, subject, branch, semester
        )
        
        try:
            # Use Gemini for AI generation
            if self.gemini_model:
                response = await self._generate_with_gemini(prompt)
            else:
                raise Exception("No AI service available")
                
            # Parse AI response into structured questions
            questions = self._parse_ai_response(response, question_type)
            
            # Validate and clean questions
            validated_questions = self._validate_questions(questions, num_questions)
            
            return validated_questions[:num_questions]
            
        except Exception as e:
            logger.error(f"AI generation failed: {str(e)}")
            # Fallback to rule-based generation
            return await self._generate_fallback_questions(
                content, num_questions, difficulty, question_type, subject, branch, semester
            )
    
    async def _generate_with_gemini(self, prompt: str) -> str:
        """Generate content using Gemini AI"""
        try:
            if self.gemini_model is None:
                raise Exception("Gemini model is not initialized")
            response = self.gemini_model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini generation error: {str(e)}")
            raise
    
    def _create_question_prompt(
        self,
        content: str,
        num_questions: int,
        difficulty: str,
        question_type: str,
        subject: str,
        branch: str,
        semester: int
    ) -> str:
        """Create a detailed prompt for AI question generation"""
        
        # Define branch-specific context
        branch_contexts = {
            "CSE": "Computer Science Engineering focusing on programming, algorithms, data structures, software engineering, and computer systems",
            "MECH": "Mechanical Engineering focusing on thermodynamics, fluid mechanics, manufacturing processes, machine design, and mechanical systems",
            "ECE": "Electronics and Communication Engineering focusing on digital electronics, signal processing, communication systems, and microprocessors",
            "CIVIL": "Civil Engineering focusing on structural analysis, construction management, surveying, and environmental engineering",
            "EEE": "Electrical and Electronics Engineering focusing on circuit analysis, power systems, control systems, and electrical machines",
            "AUTOMOBILE": "Automobile Engineering focusing on vehicle dynamics, engine technology, automotive electronics, and vehicle design",
            "AEROSPACE": "Aerospace Engineering focusing on aerodynamics, flight mechanics, propulsion systems, and aircraft structures",
            "CHEMICAL": "Chemical Engineering focusing on process engineering, reaction engineering, process control, and mass transfer",
            "BIOTECH": "Biotechnology focusing on biochemistry, cell biology, bioprocess engineering, and molecular biology",
            "IT": "Information Technology focusing on software engineering, web technologies, network security, and mobile computing"
        }
        
        branch_context = branch_contexts.get(branch.upper(), f"{branch} Engineering")
        
        # Define subject-specific question examples
        subject_examples = {
            "Data Structures": "arrays, linked lists, stacks, queues, trees, graphs, hash tables, searching and sorting algorithms",
            "Algorithms": "time complexity, space complexity, sorting algorithms, graph algorithms, dynamic programming, greedy algorithms",
            "Thermodynamics": "heat transfer, energy conversion, entropy, enthalpy, thermodynamic cycles, laws of thermodynamics",
            "Fluid Mechanics": "fluid properties, flow measurement, Bernoulli's equation, flow through pipes, fluid statics",
            "Digital Electronics": "logic gates, Boolean algebra, combinational circuits, sequential circuits, flip-flops, counters",
            "Signal Processing": "Fourier transforms, filtering, sampling, digital signal processing, analog-to-digital conversion",
            "Database Systems": "SQL queries, normalization, relational algebra, ACID properties, indexing, database design",
            "Operating Systems": "process management, memory management, file systems, scheduling algorithms, deadlocks",
            "Circuit Analysis": "Ohm's law, Kirchhoff's laws, AC/DC circuits, network theorems, circuit analysis techniques",
            "Structural Analysis": "stress analysis, beam design, load calculations, structural mechanics, material properties"
        }
        
        subject_keywords = subject_examples.get(subject, f"{subject} concepts and principles")
        
        prompt = f"""
Generate {num_questions} high-quality {question_type.upper()} questions for {branch_context}.

ACADEMIC CONTEXT:
- Branch: {branch_context}
- Subject: {subject}
- Semester: {semester} (Semester {semester} level complexity)
- Difficulty: {difficulty}
- Question Type: {question_type}
- Subject Focus: {subject_keywords}

CONTENT TO ANALYZE:
{content[:2000] if content.strip() else f"Generate questions based on {subject} topics including: {subject_keywords}"}

SPECIFIC REQUIREMENTS:
1. Questions MUST be directly related to {subject} in {branch} engineering
2. Use {difficulty} difficulty appropriate for semester {semester} students
3. Include practical applications and real-world scenarios from {branch} field
4. For MCQ: 4 options with 1 clearly correct answer and 3 plausible distractors
5. Focus on understanding concepts, not just memorization
6. Include branch-specific terminology and applications

QUESTION DIFFICULTY GUIDELINES:
- Easy: Basic definitions, simple recall, fundamental concepts
- Medium: Application of concepts, problem-solving, analysis
- Hard: Complex problem-solving, synthesis, evaluation, design

OUTPUT FORMAT (JSON):
{{
    "questions": [
        {{
            "id": "q1",
            "question": "Question text here",
            "type": "{question_type}",
            "difficulty": "{difficulty}",
            "subject": "{subject}",
            "branch": "{branch}",
            "options": ["A", "B", "C", "D"],  // For MCQ only
            "correct_answer": 1,  // Index for MCQ, text for others
            "explanation": "Detailed explanation with {branch} context",
            "keywords": ["key1", "key2"],  // For short answer
            "topic": "Specific {subject} topic",
            "bloom_level": "remember/understand/apply/analyze/evaluate/create",
            "estimated_time": 2,  // Minutes to answer
            "practical_application": "Real-world {branch} application"
        }}
    ]
}}

EXAMPLE QUESTION STYLES for {subject}:
- Focus on {subject_keywords}
- Include calculations, diagrams, or code if appropriate
- Reference industry standards and practices in {branch}
- Connect theory to practical {branch} applications

Generate questions that a {branch} engineering student would encounter in their {subject} course.
"""
        
        return prompt
    
    def _parse_ai_response(self, response: str, question_type: str) -> List[Dict[str, Any]]:
        """Parse AI response into structured question format"""
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                data = json.loads(json_str)
                if "questions" in data:
                    return data["questions"]
            
            # If JSON parsing fails, try to parse manually
            return self._manual_parse_response(response, question_type)
            
        except Exception as e:
            logger.error(f"Error parsing AI response: {str(e)}")
            return []
    
    def _manual_parse_response(self, response: str, question_type: str) -> List[Dict[str, Any]]:
        """Manually parse AI response when JSON parsing fails"""
        questions: List[Dict[str, Any]] = []
        
        # Split response into question blocks
        question_blocks = re.split(r'\n\s*\d+[\.\)]\s*', response)
        
        for i, block in enumerate(question_blocks[1:], 1):  # Skip first empty block
            try:
                question_data = self._extract_question_data(block, question_type, i)
                if question_data is not None:
                    questions.append(question_data)
            except Exception as e:
                logger.warning(f"Failed to parse question block {i}: {str(e)}")
                continue
        
        return questions
    
    def _extract_question_data(self, block: str, question_type: str, index: int) -> Optional[Dict[str, Any]]:
        """Extract question data from a text block"""
        lines = [line.strip() for line in block.split('\n') if line.strip()]
        
        if not lines:
            return None
        
        question_text = lines[0]
        
        question_data: Dict[str, Any] = {
            "id": f"ai_q_{index}",
            "question": question_text,
            "type": question_type,
            "difficulty": "medium",
            "topic": "Generated Content",
            "bloom_level": "understand",
            "estimated_time": 2
        }
        
        if question_type == "mcq":
            # Extract options and correct answer
            options: List[str] = []
            correct_answer = 0
            
            for line in lines[1:]:
                if re.match(r'^[A-D][\.\)]\s*', line):
                    option_text = re.sub(r'^[A-D][\.\)]\s*', '', line)
                    options.append(option_text)
                elif "correct" in line.lower() or "answer" in line.lower():
                    # Try to find correct answer indicator
                    match = re.search(r'[A-D]', line)
                    if match:
                        correct_answer = ord(match.group()) - ord('A')
            
            if len(options) >= 4:
                question_data["options"] = options[:4]
                question_data["correct_answer"] = correct_answer
            else:
                return None  # Invalid MCQ
        
        return question_data
    
    def _validate_questions(self, questions: List[Dict[str, Any]], target_count: int) -> List[Dict[str, Any]]:
        """Validate and clean generated questions"""
        validated: List[Dict[str, Any]] = []
        
        for question in questions:
            if self._is_valid_question(question):
                validated.append(question)
        
        # If we don't have enough valid questions, generate fallback questions
        while len(validated) < target_count:
            fallback_q = self._create_fallback_question(len(validated) + 1)
            validated.append(fallback_q)
        
        return validated
    
    def _is_valid_question(self, question: Dict[str, Any]) -> bool:
        """Check if a question is valid"""
        required_fields = ["id", "question", "type"]
        
        for field in required_fields:
            if field not in question or not question[field]:
                return False
        
        # Additional validation for MCQ
        if question.get("type") == "mcq":
            if not question.get("options") or len(question["options"]) < 4:
                return False
            if "correct_answer" not in question:
                return False
        
        return True
    
    async def _generate_fallback_questions(
        self,
        content: str,
        num_questions: int,
        difficulty: str,
        question_type: str,
        subject: str,
        branch: str = "",
        semester: int = 1
    ) -> List[Dict[str, Any]]:
        """Generate fallback questions using rule-based approach with branch/subject specificity"""
        
        # Enhanced branch and subject-specific question templates
        branch_subject_questions: Dict[str, Dict[str, List[Dict[str, Any]]]] = {
            "CSE": {
                "Data Structures": [
                    {"q": "Which data structure follows LIFO principle?", "options": ["Stack", "Queue", "Array", "Tree"], "correct": 0},
                    {"q": "What is the time complexity of searching in a balanced binary search tree?", "options": ["O(log n)", "O(n)", "O(1)", "O(n²)"], "correct": 0},
                    {"q": "Which operation is NOT supported by a queue?", "options": ["Random access", "Enqueue", "Dequeue", "Front"], "correct": 0},
                    {"q": "In a linked list, what does the last node point to?", "options": ["NULL", "First node", "Previous node", "Next node"], "correct": 0}
                ],
                "Algorithms": [
                    {"q": "Which sorting algorithm has the best average case time complexity?", "options": ["Merge Sort", "Bubble Sort", "Selection Sort", "Insertion Sort"], "correct": 0},
                    {"q": "What is the space complexity of the recursive implementation of Fibonacci?", "options": ["O(n)", "O(1)", "O(log n)", "O(n²)"], "correct": 0},
                    {"q": "Which algorithm is used to find the shortest path in a graph?", "options": ["Dijkstra's Algorithm", "DFS", "BFS", "Kruskal's Algorithm"], "correct": 0}
                ],
                "Database Systems": [
                    {"q": "Which normal form eliminates partial dependencies?", "options": ["2NF", "1NF", "3NF", "BCNF"], "correct": 0},
                    {"q": "What does ACID stand for in database transactions?", "options": ["Atomicity, Consistency, Isolation, Durability", "Access, Control, Integration, Data", "Accuracy, Completeness, Integrity, Dependability", "Availability, Consistency, Isolation, Distribution"], "correct": 0}
                ],
                "Operating Systems": [
                    {"q": "Which scheduling algorithm can cause starvation?", "options": ["Priority Scheduling", "Round Robin", "FCFS", "SJF"], "correct": 0},
                    {"q": "What is the main purpose of virtual memory?", "options": ["Extend physical memory", "Increase CPU speed", "Improve disk access", "Enhance security"], "correct": 0}
                ]
            },
            "MECH": {
                "Thermodynamics": [
                    {"q": "Which law of thermodynamics states that energy cannot be created or destroyed?", "options": ["First Law", "Zeroth Law", "Second Law", "Third Law"], "correct": 0},
                    {"q": "What is the efficiency of a Carnot engine operating between 300K and 600K?", "options": ["50%", "25%", "75%", "100%"], "correct": 0},
                    {"q": "In which process does the temperature remain constant?", "options": ["Isothermal", "Adiabatic", "Isobaric", "Isochoric"], "correct": 0}
                ],
                "Fluid Mechanics": [
                    {"q": "Bernoulli's equation is based on which principle?", "options": ["Conservation of energy", "Conservation of mass", "Conservation of momentum", "Conservation of charge"], "correct": 0},
                    {"q": "What is the unit of dynamic viscosity?", "options": ["Pa⋅s", "m²/s", "kg/m³", "N/m²"], "correct": 0},
                    {"q": "Reynolds number determines which flow characteristic?", "options": ["Laminar or turbulent", "Steady or unsteady", "Compressible or incompressible", "Viscous or inviscid"], "correct": 0}
                ],
                "Manufacturing Processes": [
                    {"q": "Which machining process is used to create internal threads?", "options": ["Tapping", "Turning", "Milling", "Drilling"], "correct": 0},
                    {"q": "What is the primary advantage of CNC machining?", "options": ["High precision and repeatability", "Low cost", "Simple operation", "Manual control"], "correct": 0}
                ],
                "Machine Design": [
                    {"q": "What factor of safety is typically used for static loading in steel?", "options": ["2-3", "1-1.5", "4-5", "6-8"], "correct": 0},
                    {"q": "Which stress concentration factor applies to sharp corners?", "options": ["High", "Low", "Zero", "Negative"], "correct": 0}
                ]
            },
            "ECE": {
                "Digital Electronics": [
                    {"q": "How many input combinations are possible for a 3-input logic gate?", "options": ["8", "6", "4", "16"], "correct": 0},
                    {"q": "Which gate is known as the universal gate?", "options": ["NAND", "AND", "OR", "XOR"], "correct": 0},
                    {"q": "What is the output of an XOR gate when both inputs are the same?", "options": ["0", "1", "High impedance", "Undefined"], "correct": 0}
                ],
                "Signal Processing": [
                    {"q": "What is the Nyquist sampling frequency for a signal with maximum frequency of 1 kHz?", "options": ["2 kHz", "1 kHz", "500 Hz", "4 kHz"], "correct": 0},
                    {"q": "Which transform is used to analyze signals in the frequency domain?", "options": ["Fourier Transform", "Laplace Transform", "Z-Transform", "Wavelet Transform"], "correct": 0}
                ],
                "Communication Systems": [
                    {"q": "What does AM stand for in communication systems?", "options": ["Amplitude Modulation", "Angular Modulation", "Adaptive Modulation", "Automatic Modulation"], "correct": 0},
                    {"q": "Which modulation technique is most efficient in terms of power?", "options": ["SSB", "AM", "FM", "PM"], "correct": 0}
                ]
            },
            "CIVIL": {
                "Structural Analysis": [
                    {"q": "What is the deflection formula for a simply supported beam with point load at center?", "options": ["PL³/48EI", "PL³/3EI", "PL³/12EI", "PL³/24EI"], "correct": 0},
                    {"q": "Which method is used to analyze indeterminate structures?", "options": ["Moment distribution", "Method of joints", "Method of sections", "Graphical method"], "correct": 0}
                ],
                "Construction Management": [
                    {"q": "What is the critical path in project management?", "options": ["Longest duration path", "Shortest duration path", "Most expensive path", "Most resource-intensive path"], "correct": 0},
                    {"q": "Which document is used for quality control in construction?", "options": ["Specifications", "Drawings", "BOQ", "Tender"], "correct": 0}
                ]
            }
        }
        
        # Get subject-specific questions based on branch and subject
        branch_questions = branch_subject_questions.get(branch.upper(), {})
        subject_questions = branch_questions.get(subject, [])
        
        # Extract key terms and concepts from content
        key_terms = self._extract_key_terms(content)
        concepts = self._extract_concepts(content, subject)
        
        questions: List[Dict[str, Any]] = []
        
        for i in range(num_questions):
            try:
                # Use predefined questions if available
                if subject_questions and i < len(subject_questions):
                    predefined = subject_questions[i]
                    question: Dict[str, Any] = {
                        "id": f"predefined_{branch}_{subject}_{i+1}",
                        "question": predefined["q"],
                        "type": "mcq",
                        "difficulty": difficulty,
                        "subject": subject,
                        "branch": branch,
                        "semester": semester,
                        "options": predefined["options"],
                        "correct_answer": predefined["correct"],
                        "explanation": f"This is a fundamental concept in {subject} for {branch} engineering students.",
                        "topic": subject,
                        "bloom_level": "understand" if difficulty == "easy" else "apply" if difficulty == "medium" else "analyze",
                        "estimated_time": 2
                    }
                else:
                    # Generate custom question based on type
                    if question_type == "mcq":
                        question = self._create_fallback_mcq(i + 1, key_terms, concepts, difficulty, subject, branch)
                    elif question_type == "short_answer":
                        question = self._create_fallback_short_answer(i + 1, key_terms, concepts, difficulty, subject, branch)
                    else:
                        question = self._create_fallback_essay(i + 1, key_terms, concepts, difficulty, subject, branch)
                
                questions.append(question)
                
            except Exception as e:
                logger.warning(f"Error creating fallback question {i+1}: {str(e)}")
                # Create a basic question as last resort
                questions.append(self._create_basic_fallback_question(i+1, subject, branch))
        
        return questions
    
    def _extract_key_terms(self, content: str) -> List[str]:
        """Extract key terms from content using simple NLP"""
        # Remove common words and extract meaningful terms
        words = re.findall(r'\b[A-Z][a-z]+\b|\b[a-z]{4,}\b', content)
        
        # Common technical terms in computer science
        tech_terms = [
            "algorithm", "data structure", "database", "programming", "software",
            "network", "security", "machine learning", "artificial intelligence",
            "operating system", "compiler", "object oriented", "recursion"
        ]
        
        key_terms: List[str] = []
        for word in words:
            if word.lower() in tech_terms or len(word) > 6:
                key_terms.append(word)
        
        return list(set(key_terms))[:20]  # Limit to 20 terms
    
    def _extract_concepts(self, content: str, subject: str) -> List[str]:
        """Extract main concepts from content"""
        # Subject-specific concept patterns
        concept_patterns = {
            "Computer Science": [
                "algorithms", "data structures", "programming paradigms",
                "software engineering", "databases", "networks", "security"
            ],
            "Mathematics": [
                "calculus", "algebra", "statistics", "probability",
                "discrete mathematics", "linear algebra"
            ],
            "Physics": [
                "mechanics", "thermodynamics", "electromagnetism",
                "quantum physics", "optics"
            ]
        }
        
        default_concepts = [
            "fundamental principles", "core concepts", "practical applications",
            "theoretical foundations", "problem solving", "analysis methods"
        ]
        
        return concept_patterns.get(subject, default_concepts)
    
    def _create_fallback_mcq(
        self, index: int, key_terms: List[str], concepts: List[str], 
        difficulty: str, subject: str, branch: str = ""
    ) -> Dict[str, Any]:
        """Create a fallback MCQ question"""
        
        # Branch-specific templates
        if branch.upper() == "CSE":
            templates = [
                "What is the time complexity of {term} in {subject}?",
                "Which data structure is best suited for {concept}?",
                "In {subject}, {term} is implemented using:",
                "What is the space complexity of {term}?",
                "Which algorithm solves the {concept} problem efficiently?"
            ]
        elif branch.upper() == "MECH":
            templates = [
                "What is the unit of {term} in {subject}?",
                "Which principle governs {concept} in {subject}?",
                "In {subject}, {term} is measured using:",
                "What is the primary application of {term}?",
                "Which law explains {concept} behavior?"
            ]
        elif branch.upper() == "ECE":
            templates = [
                "What is the frequency response of {term} in {subject}?",
                "Which modulation technique uses {concept}?",
                "In {subject}, {term} operates in which domain:",
                "What is the bandwidth of {term}?",
                "Which circuit implements {concept}?"
            ]
        else:
            templates = [
                "What is the primary purpose of {term} in {subject}?",
                "Which of the following best describes {concept}?",
                "In {subject}, {term} is primarily used for:",
                "What is the main advantage of using {term}?",
                "Which statement about {concept} is correct?"
            ]
        
        term = random.choice(key_terms) if key_terms else "the main concept"
        concept = random.choice(concepts) if concepts else "the topic"
        
        template = random.choice(templates)
        question_text = template.format(term=term, concept=concept, subject=subject)
        
        # Generate plausible options
        options = self._generate_fallback_options(term, concept, subject, branch)
        
        return {
            "id": f"fallback_q_{index}",
            "question": question_text,
            "type": "mcq",
            "difficulty": difficulty,
            "subject": subject,
            "branch": branch,
            "options": options,
            "correct_answer": 0,  # First option is correct
            "explanation": f"This is the correct definition/application of {term} in {subject} for {branch} students.",
            "topic": concept,
            "bloom_level": "understand",
            "estimated_time": 2
        }
    
    def _generate_fallback_options(self, term: str, concept: str, subject: str, branch: str = "") -> List[str]:
        """Generate plausible MCQ options based on branch and subject"""
        
        # Branch-specific correct answers
        if branch.upper() == "CSE":
            correct_option = f"A computational approach in {subject} using {concept}"
        elif branch.upper() == "MECH":
            correct_option = f"A mechanical principle in {subject} related to {concept}"
        elif branch.upper() == "ECE":
            correct_option = f"An electronic/signal processing concept in {subject} involving {concept}"
        else:
            correct_option = f"A fundamental concept in {subject} related to {concept}"
        
        # Branch-specific wrong options
        if branch.upper() == "CSE":
            wrong_options = [
                f"A hardware-only solution not related to {subject}",
                f"A deprecated programming practice in {subject}",
                "A theoretical concept with no algorithmic applications"
            ]
        elif branch.upper() == "MECH":
            wrong_options = [
                "A purely theoretical concept with no practical applications",
                f"A concept used only in electrical engineering, not {subject}",
                f"An outdated manufacturing technique in {subject}"
            ]
        elif branch.upper() == "ECE":
            wrong_options = [
                f"A mechanical process not used in {subject}",
                "A software-only concept with no hardware applications",
                f"A low-frequency phenomenon irrelevant to {subject}"
            ]
        else:
            wrong_options = [
                "An outdated approach not used in modern {subject}".format(subject=subject),
                "A theoretical concept with no practical applications",
                "A concept primarily used in other fields, not {subject}".format(subject=subject)
            ]
        
        return [correct_option] + wrong_options
    
    def _create_fallback_short_answer(
        self, index: int, key_terms: List[str], concepts: List[str],
        difficulty: str, subject: str, branch: str = ""
    ) -> Dict[str, Any]:
        """Create a fallback short answer question"""
        
        # Branch-specific templates
        if branch.upper() == "CSE":
            templates = [
                "Explain the algorithm for {concept} in {subject}.",
                "Describe the implementation of {term} in {subject}.",
                "What are the complexity considerations of {concept}?",
                "List three applications of {term} in software development."
            ]
        elif branch.upper() == "MECH":
            templates = [
                "Explain the working principle of {concept} in {subject}.",
                "Describe how {term} affects system performance in {subject}.",
                "What are the design considerations for {concept}?",
                "List three practical applications of {term} in mechanical systems."
            ]
        elif branch.upper() == "ECE":
            templates = [
                "Explain the frequency response of {concept} in {subject}.",
                "Describe the signal processing aspects of {term} in {subject}.",
                "What are the circuit design considerations for {concept}?",
                "List three applications of {term} in electronic systems."
            ]
        else:
            templates = [
                "Explain the concept of {concept} in {subject}.",
                "Describe how {term} is used in {subject}.",
                "What are the main characteristics of {concept}?",
                "List three applications of {term} in {subject}."
            ]
        
        term = random.choice(key_terms) if key_terms else "the main concept"
        concept = random.choice(concepts) if concepts else "the topic"
        
        template = random.choice(templates)
        question_text = template.format(term=term, concept=concept, subject=subject)
        
        return {
            "id": f"fallback_sa_{index}",
            "question": question_text,
            "type": "short_answer",
            "difficulty": difficulty,
            "subject": subject,
            "branch": branch,
            "keywords": [term, concept, subject.lower()],
            "expected_answer": f"A comprehensive explanation covering {concept} and its applications in {subject} for {branch} engineering.",
            "topic": concept,
            "bloom_level": "understand",
            "estimated_time": 5
        }
    
    def _create_fallback_essay(
        self, index: int, key_terms: List[str], concepts: List[str],
        difficulty: str, subject: str, branch: str = ""
    ) -> Dict[str, Any]:
        """Create a fallback essay question"""
        
        # Branch-specific templates
        if branch.upper() == "CSE":
            templates = [
                "Discuss the algorithmic complexity and optimization of {concept} in {subject}.",
                "Analyze the scalability and performance implications of {term} in {subject}.",
                "Compare different data structures for implementing {concept} in {subject}.",
                "Evaluate the trade-offs between time and space complexity in {term} algorithms."
            ]
        elif branch.upper() == "MECH":
            templates = [
                "Discuss the thermodynamic principles governing {concept} in {subject}.",
                "Analyze the material properties affecting {term} performance in {subject}.",
                "Compare different manufacturing processes for {concept} in {subject}.",
                "Evaluate the efficiency and sustainability aspects of {term} in mechanical design."
            ]
        elif branch.upper() == "ECE":
            templates = [
                "Discuss the frequency domain analysis of {concept} in {subject}.",
                "Analyze the noise and distortion characteristics of {term} in {subject}.",
                "Compare analog and digital implementations of {concept} in {subject}.",
                "Evaluate the power consumption and bandwidth requirements of {term}."
            ]
        else:
            templates = [
                "Discuss the importance of {concept} in modern {subject}.",
                "Analyze the role of {term} in {subject} applications.",
                "Compare and contrast different approaches to {concept} in {subject}.",
                "Evaluate the impact of {term} on {subject} development."
            ]
        
        term = random.choice(key_terms) if key_terms else "key concepts"
        concept = random.choice(concepts) if concepts else "the main topic"
        
        template = random.choice(templates)
        question_text = template.format(term=term, concept=concept, subject=subject)
        
        return {
            "id": f"fallback_essay_{index}",
            "question": question_text,
            "type": "essay",
            "difficulty": difficulty,
            "subject": subject,
            "branch": branch,
            "grading_rubric": [
                f"Clear understanding of {concept}",
                f"Detailed examples from {subject}",
                "Logical organization and flow",
                "Critical analysis and evaluation"
            ],
            "topic": concept,
            "bloom_level": "analyze",
            "estimated_time": 15
        }
    
    def _create_basic_fallback_question(self, index: int, subject: str, branch: str = "") -> Dict[str, Any]:
        """Create a basic fallback question when all else fails"""
        
        # Very basic questions by branch
        if branch.upper() == "CSE":
            question_text = f"What is a fundamental concept in {subject} programming?"
            options = ["Variables and data types", "Color theory", "Chemical reactions", "Mechanical forces"]
        elif branch.upper() == "MECH":
            question_text = f"What is a basic principle in {subject}?"
            options = ["Force and motion", "Binary logic", "Signal processing", "Database normalization"]
        elif branch.upper() == "ECE":
            question_text = f"What is a fundamental concept in {subject}?"
            options = ["Voltage and current", "Object-oriented programming", "Thermodynamics", "Structural analysis"]
        else:
            question_text = f"What is an important concept in {subject}?"
            options = ["Core principles and applications", "Unrelated concepts", "Outdated theories", "Irrelevant information"]
        
        return {
            "id": f"basic_fallback_{index}",
            "question": question_text,
            "type": "mcq",
            "difficulty": "easy",
            "subject": subject,
            "branch": branch,
            "options": options,
            "correct_answer": 0,
            "explanation": f"This covers fundamental concepts in {subject} for {branch} students.",
            "topic": subject,
            "bloom_level": "remember",
            "estimated_time": 1
        }
    
    def _create_fallback_question(self, index: int) -> Dict[str, Any]:
        """Create a basic fallback question when all else fails"""
        return {
            "id": f"basic_fallback_{index}",
            "question": f"Question {index}: What is a key concept from the provided content?",
            "type": "mcq",
            "difficulty": "medium",
            "options": [
                "A fundamental principle covered in the material",
                "An unrelated concept from another field",
                "A deprecated method no longer in use",
                "A purely theoretical idea with no applications"
            ],
            "correct_answer": 0,
            "explanation": "This represents a core concept from the study material.",
            "topic": "General Knowledge",
            "bloom_level": "remember",
            "estimated_time": 2
        }
    
    async def generate_enhanced_feedback(
        self,
        performance_data: Dict[str, Any],
        test_results: List[Dict[str, Any]],
        learning_goals: List[str],
        weak_areas: List[str]
    ) -> Dict[str, Any]:
        """Generate AI-enhanced feedback for student performance"""
        
        try:
            if self.has_ai:
                return await self._generate_ai_feedback(
                    performance_data, test_results, learning_goals, weak_areas
                )
            else:
                return self._generate_rule_based_feedback(
                    performance_data, test_results, learning_goals, weak_areas
                )
        except Exception as e:
            logger.error(f"Error generating enhanced feedback: {str(e)}")
            return self._generate_rule_based_feedback(
                performance_data, test_results, learning_goals, weak_areas
            )
    
    async def _generate_ai_feedback(
        self,
        performance_data: Dict[str, Any],
        test_results: List[Dict[str, Any]],
        learning_goals: List[str],
        weak_areas: List[str]
    ) -> Dict[str, Any]:
        """Generate AI-powered personalized feedback"""
        
        prompt = f"""
Analyze the following student performance data and provide personalized learning feedback:

PERFORMANCE DATA:
{json.dumps(performance_data, indent=2)}

RECENT TEST RESULTS:
{json.dumps(test_results[-5:], indent=2)}  # Last 5 tests

LEARNING GOALS:
{', '.join(learning_goals)}

IDENTIFIED WEAK AREAS:
{', '.join(weak_areas)}

Provide detailed feedback in JSON format:
{{
    "overall_assessment": "General performance summary",
    "strengths": ["strength1", "strength2"],
    "areas_for_improvement": ["area1", "area2"],
    "personalized_recommendations": [
        {{
            "action": "Specific action to take",
            "reason": "Why this will help",
            "timeline": "When to implement",
            "resources": ["resource1", "resource2"]
        }}
    ],
    "study_plan": {{
        "daily_goals": ["goal1", "goal2"],
        "weekly_milestones": ["milestone1", "milestone2"],
        "focus_areas": ["area1", "area2"]
    }},
    "motivation_message": "Encouraging message for the student"
}}
"""
        
        try:
            if self.gemini_model:
                response = await self._generate_with_gemini(prompt)
            else:
                raise Exception("No AI service available")
            
            # Parse the AI response
            feedback_data = self._parse_feedback_response(response)
            return feedback_data
            
        except Exception as e:
            logger.error(f"AI feedback generation failed: {str(e)}")
            return self._generate_rule_based_feedback(
                performance_data, test_results, learning_goals, weak_areas
            )
    
    def _parse_feedback_response(self, response: str) -> Dict[str, Any]:
        """Parse AI feedback response"""
        try:
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except Exception as e:
            logger.warning(f"Failed to parse feedback response: {str(e)}")
        
        # Fallback to rule-based feedback if parsing fails
        return {
            "overall_assessment": "Based on your recent performance, there are several areas for improvement.",
            "strengths": ["Consistent effort", "Good attendance"],
            "areas_for_improvement": ["Study technique", "Time management"],
            "personalized_recommendations": [
                {
                    "action": "Focus on weak areas identified in recent tests",
                    "reason": "Targeted practice will improve overall scores",
                    "timeline": "Next 2 weeks",
                    "resources": ["Practice questions", "Study guides"]
                }
            ],
            "study_plan": {
                "daily_goals": ["Review 1 weak topic", "Practice 10 questions"],
                "weekly_milestones": ["Complete topic review", "Take practice test"],
                "focus_areas": ["Identified weak subjects"]
            },
            "motivation_message": "Keep up the good work! Consistent practice will lead to improvement."
        }
    
    def _generate_rule_based_feedback(
        self,
        performance_data: Dict[str, Any],
        test_results: List[Dict[str, Any]],
        learning_goals: List[str],
        weak_areas: List[str]
    ) -> Dict[str, Any]:
        """Generate feedback using rule-based approach"""
        
        avg_score = performance_data.get("average_score", 0)
        recent_trend = self._analyze_performance_trend(test_results)
        
        # Generate assessment based on score ranges
        if avg_score >= 80:
            overall_assessment = "Excellent performance! You're demonstrating strong understanding."
            motivation = "Keep up the outstanding work! You're on track for success."
        elif avg_score >= 60:
            overall_assessment = "Good progress with room for improvement in specific areas."
            motivation = "You're doing well! Focus on your weak areas to reach the next level."
        else:
            overall_assessment = "Significant improvement needed. Let's focus on building strong foundations."
            motivation = "Don't worry! With dedicated practice, you can improve significantly."
        
        return {
            "overall_assessment": overall_assessment,
            "strengths": self._identify_strengths(performance_data, test_results),
            "areas_for_improvement": weak_areas[:3],  # Top 3 weak areas
            "personalized_recommendations": self._generate_recommendations(weak_areas, avg_score),
            "study_plan": self._create_study_plan(weak_areas, learning_goals),
            "performance_trend": recent_trend,
            "motivation_message": motivation
        }
    
    def _analyze_performance_trend(self, test_results: List[Dict[str, Any]]) -> str:
        """Analyze recent performance trend"""
        if len(test_results) < 2:
            return "insufficient_data"
        
        recent_scores = [result.get("score", 0) for result in test_results[-3:]]
        
        if len(recent_scores) >= 2:
            if recent_scores[-1] > recent_scores[0]:
                return "improving"
            elif recent_scores[-1] < recent_scores[0]:
                return "declining"
            else:
                return "stable"
        
        return "stable"
    
    def _identify_strengths(
        self, performance_data: Dict[str, Any], test_results: List[Dict[str, Any]]
    ) -> List[str]:
        """Identify student strengths from performance data"""
        strengths: List[str] = []
        
        if performance_data.get("consistency_score", 0) > 0.7:
            strengths.append("Consistent performance across tests")
        
        if performance_data.get("improvement_rate", 0) > 0.1:
            strengths.append("Steady improvement over time")
        
        # Analyze subject-wise performance
        strong_subjects = performance_data.get("strong_subjects", [])
        if strong_subjects:
            strengths.extend([f"Strong grasp of {subject}" for subject in strong_subjects[:2]])
        
        if not strengths:
            strengths = ["Regular practice", "Engagement with material"]
        
        return strengths
    
    def _generate_recommendations(self, weak_areas: List[str], avg_score: float) -> List[Dict[str, Any]]:
        """Generate personalized recommendations"""
        recommendations: List[Dict[str, Any]] = []
        
        for area in weak_areas[:3]:
            if avg_score < 50:
                action = f"Focus on fundamental concepts in {area}"
                timeline = "Next 3 weeks"
            elif avg_score < 70:
                action = f"Practice intermediate problems in {area}"
                timeline = "Next 2 weeks"
            else:
                action = f"Master advanced topics in {area}"
                timeline = "Next 1 week"
            
            recommendations.append({
                "action": action,
                "reason": f"Improving {area} will significantly boost your overall score",
                "timeline": timeline,
                "resources": ["Practice questions", "Video tutorials", "Study notes"]
            })
        
        return recommendations
    
    def _create_study_plan(self, weak_areas: List[str], learning_goals: List[str]) -> Dict[str, Any]:
        """Create a personalized study plan"""
        
        daily_goals = [
            "Review one weak topic for 30 minutes",
            "Practice 10-15 questions",
            "Take notes on key concepts"
        ]
        
        weekly_milestones = [
            f"Complete review of {weak_areas[0] if weak_areas else 'priority topic'}",
            "Take a practice test",
            "Assess progress and adjust plan"
        ]
        
        focus_areas = weak_areas[:3] if weak_areas else ["Core concepts", "Problem solving"]
        
        return {
            "daily_goals": daily_goals,
            "weekly_milestones": weekly_milestones,
            "focus_areas": focus_areas
        }
