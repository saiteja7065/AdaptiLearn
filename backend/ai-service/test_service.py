#!/usr/bin/env python3
"""
Test script for the AI service
"""
import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.question_generator import QuestionGenerator

async def test_question_generator():
    """Test the question generator without Gemini"""
    print("Testing Question Generator...")
    
    # Test without AI (fallback mode)
    generator = QuestionGenerator(gemini_model=None)
    
    content = """
    Data structures are fundamental building blocks in computer science.
    Arrays store elements in contiguous memory locations.
    Linked lists use pointers to connect nodes.
    Stacks follow LIFO (Last In, First Out) principle.
    Queues follow FIFO (First In, First Out) principle.
    """
    
    try:
        questions = await generator.generate_questions(
            content=content,
            num_questions=3,
            difficulty="medium",
            question_type="mcq",
            subject="Data Structures",
            branch="Computer Science",
            semester=3
        )
        
        print(f"\n✅ Generated {len(questions)} questions successfully!")
        
        for i, q in enumerate(questions, 1):
            print(f"\nQuestion {i}:")
            print(f"ID: {q['id']}")
            print(f"Text: {q['question']}")
            print(f"Type: {q['type']}")
            print(f"Difficulty: {q['difficulty']}")
            if 'options' in q:
                for j, option in enumerate(q['options']):
                    marker = "✓" if j == q['correct_answer'] else " "
                    print(f"  {chr(65+j)}) {option} {marker}")
            print(f"Topic: {q['topic']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error generating questions: {str(e)}")
        return False

async def main():
    """Main test function"""
    print("🚀 Starting AI Service Tests...\n")
    
    success = await test_question_generator()
    
    if success:
        print("\n🎉 All tests passed! The AI service is working correctly.")
    else:
        print("\n💥 Some tests failed. Check the error messages above.")
    
    return success

if __name__ == "__main__":
    result = asyncio.run(main())
    sys.exit(0 if result else 1)
