from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
import PyPDF2
import google.generativeai as genai
import io
import json
import os
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
# Load environment variables (optional)
load_dotenv()


# Initialize FastAPI app
app = FastAPI(title="PDF Syllabus to Timetable API", 
              description="API to extract text from PDF files and generate timetables using Google's Gemini API")




# cors error fix
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, change to specific domains if needed
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers
)
# Configure Google Generative AI
API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDzRk9cNGYxkoqQzW2iS5ZrtNdK5RIKR0w")
genai.configure(api_key=API_KEY)

class TimetableRequest(BaseModel):
    num_weeks: int = 2
    start_time: str = "09:00"
    end_time: str = "14:00"
    model_name: str = "gemini-2.0-flash"
    list_of_days: List[str]
    lecture_duration: float

def extract_text_from_pdf_bytes(pdf_bytes):
    """Extracts text from a PDF file bytes."""
    text = ""
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        for page in reader.pages:
            text += page.extract_text() or ""  # or "" handles pages without text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing PDF: {str(e)}")
    return text

@app.post("/generate-timetable/")
async def generate_timetable(
    files: List[UploadFile] = File(...),
    request: str = Form(...),
):
    """
    Generate a timetable from uploaded PDF syllabus files.
    
    - Upload multiple PDF files containing syllabi
    - Provide timetable parameters as a JSON string in the 'request' form field
    """
    # Parse request parameters
    try:
        params = json.loads(request)
        timetable_request = TimetableRequest(**params)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in request parameter")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid request parameters: {str(e)}")
    
    # Extract text from all uploaded PDFs
    all_pdf_text = ""
    for file in files:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail=f"File {file.filename} is not a PDF")
        
        content = await file.read()
        all_pdf_text += extract_text_from_pdf_bytes(content)
        
    if not all_pdf_text:
        raise HTTPException(status_code=400, detail="No text extracted from PDFs")
    
    # Create JSON schema for timetable
    json_schema = """
    {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "timetable": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "week": { "type": "integer", "minimum": 1 },
              "days": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "day": {
                      "type": "string",
                      "enum": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
                    },
                    "schedule": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "time": { "type": "string", "pattern": "^\\d{2}:\\d{2}-\\d{2}:\\d{2}$" },
                          "subject": { "type": "string" },
                          "topic": { "type": "string" }
                        },
                        "required": ["time", "subject", "topic"]
                      }
                    }
                  },
                  "required": ["day", "schedule"]
                }
              }
            },
            "required": ["week", "days"]
          }
        }
      },
      "required": ["timetable"]
    }
    """
    
    # Generate the prompt for Gemini
    prompt = f"""Create a topic time table for each subject in JSON format(follow this JSON schema: {json_schema}) 
    of {timetable_request.num_weeks} weeks, each week on {', '.join(timetable_request.list_of_days)},
    each day from {timetable_request.start_time} to {timetable_request.end_time}, each lecture lasting {timetable_request.lecture_duration} hours, lunch break from 12:00 to 13:00 with the following syllabus. 
    Keep the time table such that number of consecutive lectures of same subjects are minimized.
    
    {all_pdf_text}
    
    Return ONLY the JSON object without any explanations or markdown formatting.
    
    """
    
    try:
        # Initialize Gemini model
        model = genai.GenerativeModel(timetable_request.model_name)
        
        # Generate timetable
        response = model.generate_content(prompt)
        
        # Parse the response to ensure it's valid JSON
        try:
            result = json.loads(response.text)
            return JSONResponse(content=result)
        except json.JSONDecodeError:
            # If the response isn't valid JSON, try to extract just the JSON part
            import re
            json_pattern = r'({[\s\S]*})'
            match = re.search(json_pattern, response.text)
            if match:
                try:
                    result = json.loads(match.group(1))
                    return JSONResponse(content=result)
                except:
                    pass
            
            # Return the raw text if JSON parsing fails
            return {"raw_response": response.text}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating timetable: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Welcome to the PDF Syllabus to Timetable API. Use /generate-timetable/ endpoint to upload PDFs and generate a timetable."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)