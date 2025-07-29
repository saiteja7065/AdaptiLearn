from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.question_generator import QuestionGenerator
import os
from dotenv import load_dotenv
import google.generativeai as genai
from typing import Dict, Any
import logging
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AdaptiLearn AI Service",
    description="AI-powered question generation and content analysis for adaptive learning using Gemini AI",
    version="1.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React development server
        "http://localhost:3001",  # Alternative port
        "https://localhost:3000",
        "https://your-firebase-app.web.app",  # Production frontend URL
        "https://your-custom-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Initialize Gemini AI service
gemini_api_key = os.getenv("GEMINI_API_KEY")

if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
    gemini_model = genai.GenerativeModel('gemini-pro')
    logger.info("Gemini AI service initialized successfully")
else:
    logger.warning("GEMINI_API_KEY not found. AI features will be limited.")
    gemini_model = None

# Initialize services (Gemini only)
question_generator = QuestionGenerator(gemini_model=gemini_model)

# Dependency for Firebase Auth verification
async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict[str, str]:
    """
    Verify Firebase ID token from the frontend
    In production, implement proper Firebase Admin SDK token verification
    """
    token = credentials.credentials
    
    # TODO: Implement Firebase Admin SDK token verification
    # For now, accept any token for development
    if not token or len(token) < 10:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    
    return {"uid": "demo-user", "email": "demo@example.com"}

# Health check endpoint
@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint for service monitoring"""
    ai_services_status = {
        "gemini": bool(gemini_model),
        "question_generator": bool(question_generator),
        "timestamp": datetime.now().isoformat()
    }
    
    return {
        "status": "healthy",
        "ai_services": ai_services_status,
        "version": "1.0.0"
    }

# Question Generation Endpoints
@app.post("/api/ai/generate-questions")
async def generate_questions(
    request: Dict[str, Any],
    user: Dict[str, str] = Depends(verify_firebase_token)
) -> Dict[str, Any]:
    """
    Generate questions from provided content using AI
    
    Request body:
    {
        "content": "string - Text content to generate questions from",
        "num_questions": "int - Number of questions to generate (default: 10)",
        "difficulty": "string - easy/medium/hard (default: medium)",
        "question_type": "string - mcq/short_answer/essay (default: mcq)",
        "subject": "string - Subject context",
        "branch": "string - Academic branch (CSE, ECE, etc.)",
        "semester": "int - Semester number"
    }
    """
    try:
        content = request.get("content")
        if not content:
            raise HTTPException(status_code=400, detail="Content is required")
        
        # Extract parameters with defaults
        num_questions = request.get("num_questions", 10)
        difficulty = request.get("difficulty", "medium")
        question_type = request.get("question_type", "mcq")
        subject = request.get("subject", "General")
        branch = request.get("branch", "")
        semester = request.get("semester", 1)
        
        # Generate questions using AI service
        questions = await question_generator.generate_questions(
            content=content,
            num_questions=num_questions,
            difficulty=difficulty,
            question_type=question_type,
            subject=subject,
            branch=branch,
            semester=semester
        )
        
        logger.info(f"Generated {len(questions)} questions for user {user['uid']}")
        
        return {
            "success": True,
            "questions": questions,
            "metadata": {
                "total_questions": len(questions),
                "difficulty": difficulty,
                "question_type": question_type,
                "subject": subject,
                "generated_at": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating questions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")

# Content Analysis Endpoints
@app.post("/api/ai/analyze-content")
async def analyze_content(
    request: Dict[str, Any],
    user: Dict[str, str] = Depends(verify_firebase_token)
) -> Dict[str, Any]:
    """
    Analyze content and extract topics, keywords, and structure
    
    Request body:
    {
        "content": "string - Text content to analyze",
        "content_type": "string - syllabus/notes/textbook (default: syllabus)",
        "branch": "string - Academic branch",
        "semester": "int - Semester number"
    }
    """
    try:
        content = request.get("content")
        if not content:
            raise HTTPException(status_code=400, detail="Content is required")
        
        content_type = request.get("content_type", "syllabus")
        branch = request.get("branch", "")
        semester = request.get("semester", 1)
        
        # TODO: Implement content analyzer service
        # For now, return a basic analysis structure
        analysis = {
            "topics": ["Machine Learning", "Data Structures", "Algorithms"],
            "keywords": ["python", "programming", "computer science"],
            "difficulty_level": "intermediate",
            "estimated_study_time": "40 hours",
            "structure": {
                "chapters": 5,
                "sections": 15,
                "subsections": 45
            }
        }
        
        logger.info(f"Analyzed content for user {user['uid']}")
        
        return {
            "success": True,
            "analysis": analysis,
            "metadata": {
                "content_type": content_type,
                "branch": branch,
                "semester": semester,
                "analyzed_at": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error analyzing content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze content: {str(e)}")

# AI Tutoring Endpoints
@app.post("/api/ai/chat-tutor")
async def chat_tutor(
    request: Dict[str, Any],
    user: Dict[str, str] = Depends(verify_firebase_token)
) -> Dict[str, Any]:
    """
    AI tutoring chatbot for answering student questions
    
    Request body:
    {
        "message": "string - Student's question or message",
        "context": "object - Optional context about the student's current topic/subject",
        "conversation_history": "array - Previous messages in the conversation"
    }
    """
    try:
        message = request.get("message")
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        conversation_history = request.get("conversation_history", [])
        
        # TODO: Implement chat tutor service
        # For now, return a mock response
        response = {
            "message": f"Thank you for your question: '{message}'. This is a helpful response from the AI tutor.",
            "confidence": 0.95,
            "sources": ["Textbook Chapter 3", "Lecture Notes"],
            "follow_up_questions": [
                "Would you like me to explain this concept further?",
                "Do you have any related questions?"
            ]
        }
        
        logger.info(f"AI tutor responded to user {user['uid']}")
        
        return {
            "success": True,
            "response": response,
            "metadata": {
                "responded_at": datetime.now().isoformat(),
                "conversation_length": len(conversation_history) + 1
            }
        }
        
    except Exception as e:
        logger.error(f"Error in AI tutor: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI tutor error: {str(e)}")

# PDF Processing Endpoints
@app.post("/api/ai/process-pdf")
async def process_pdf(
    request: Dict[str, Any],
    user: Dict[str, str] = Depends(verify_firebase_token)
) -> Dict[str, Any]:
    """
    Process PDF file and extract text content for analysis
    
    Request body:
    {
        "pdf_url": "string - URL of the PDF file to process",
        "pdf_base64": "string - Base64 encoded PDF content (alternative to URL)",
        "extract_images": "boolean - Whether to extract images/diagrams",
        "analyze_structure": "boolean - Whether to analyze document structure"
    }
    """
    try:
        pdf_url = request.get("pdf_url")
        pdf_base64 = request.get("pdf_base64")
        
        if not pdf_url and not pdf_base64:
            raise HTTPException(status_code=400, detail="Either pdf_url or pdf_base64 is required")
        
        extract_images = request.get("extract_images", False)
        analyze_structure = request.get("analyze_structure", True)
        
        # TODO: Implement PDF processor service
        # For now, return a mock result
        result = {
            "text_content": "Sample PDF content extracted",
            "images": [] if not extract_images else ["image1.png", "image2.png"],
            "structure": {
                "pages": 10,
                "sections": ["Introduction", "Chapter 1", "Chapter 2", "Conclusion"]
            } if analyze_structure else None,
            "metadata": {
                "pages": 10,
                "file_size": "2.5MB"
            }
        }
        
        logger.info(f"Processed PDF for user {user['uid']}")
        
        return {
            "success": True,
            "extracted_content": result,
            "metadata": {
                "processed_at": datetime.now().isoformat(),
                "extract_images": extract_images,
                "analyze_structure": analyze_structure
            }
        }
        
    except Exception as e:
        logger.error(f"Error processing PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

# Enhanced Feedback Endpoints
@app.post("/api/ai/enhance-feedback")
async def enhance_feedback(
    request: Dict[str, Any],
    user: Dict[str, str] = Depends(verify_firebase_token)
) -> Dict[str, Any]:
    """
    Enhance performance feedback using AI insights
    
    Request body:
    {
        "performance_data": "object - Student's performance metrics",
        "test_results": "array - Recent test results",
        "learning_goals": "array - Student's learning objectives",
        "weak_areas": "array - Identified weak areas"
    }
    """
    try:
        performance_data = request.get("performance_data", {})
        test_results = request.get("test_results", [])
        learning_goals = request.get("learning_goals", [])
        weak_areas = request.get("weak_areas", [])
        
        # Generate enhanced feedback using AI
        enhanced_feedback = await question_generator.generate_enhanced_feedback(
            performance_data=performance_data,
            test_results=test_results,
            learning_goals=learning_goals,
            weak_areas=weak_areas
        )
        
        logger.info(f"Generated enhanced feedback for user {user['uid']}")
        
        return {
            "success": True,
            "enhanced_feedback": enhanced_feedback,
            "metadata": {
                "generated_at": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error enhancing feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to enhance feedback: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
