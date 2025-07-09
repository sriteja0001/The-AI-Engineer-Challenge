# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
import os
from typing import Optional, Dict
import uuid
from aimakerspace.text_utils import PDFLoader, CharacterTextSplitter
from aimakerspace.openai_utils.embedding import EmbeddingModel
from aimakerspace.vectordatabase import VectorDatabase

# Initialize FastAPI application with a title
app = FastAPI(title="OpenAI Chat API")

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the API to be accessed from different domains/origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers in requests
)

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    developer_message: str  # Message from the developer/system
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-4.1-mini"  # Optional model selection with default
    api_key: str          # OpenAI API key for authentication

# In-memory store for session vector DBs
vector_db_store: Dict[str, VectorDatabase] = {}

class PDFChatRequest(BaseModel):
    session_id: str
    user_message: str
    api_key: str
    model: Optional[str] = "gpt-4.1-mini"
    system_prompt: Optional[str] = None

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # Initialize OpenAI client with the provided API key
        client = OpenAI(api_key=request.api_key)
        
        # Create an async generator function for streaming responses
        async def generate():
            # Create a streaming chat completion request
            stream = client.chat.completions.create(
                model=request.model,
                messages=[
                    {"role": "developer", "content": request.developer_message},
                    {"role": "user", "content": request.user_message}
                ],
                stream=True  # Enable streaming response
            )
            
            # Yield each chunk of the response as it becomes available
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        # Return a streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")
    
    except Exception as e:
        # Handle any errors that occur during processing
        raise HTTPException(status_code=500, detail=str(e))

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/upload_pdf")
async def upload_pdf(file: UploadFile = File(...), api_key: str = File(...)):
    temp_path = f"/tmp/{uuid.uuid4()}.pdf"
    with open(temp_path, "wb") as f:
        f.write(await file.read())
    loader = PDFLoader(temp_path)
    documents = loader.load_documents()
    splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_texts(documents)
    os.environ["OPENAI_API_KEY"] = api_key  # Patch: set API key for EmbeddingModel
    embedding_model = EmbeddingModel()
    vector_db = await VectorDatabase(embedding_model).abuild_from_list(chunks)
    session_id = str(uuid.uuid4())
    vector_db_store[session_id] = vector_db
    os.remove(temp_path)
    return {"session_id": session_id}

@app.post("/api/chat_pdf")
async def chat_pdf(request: PDFChatRequest):
    vector_db = vector_db_store.get(request.session_id)
    if not vector_db:
        raise HTTPException(status_code=404, detail="Session not found")
    relevant_chunks = vector_db.search_by_text(request.user_message, k=4, return_as_text=True)
    context = "\n".join(relevant_chunks)
    if request.system_prompt:
        prompt = f"{request.system_prompt}\n\nContext:\n{context}\n\nQuestion: {request.user_message}\nAnswer:"
    else:
        prompt = f"You are a helpful assistant. Use the following context from a PDF to answer the user's question.\n\nContext:\n{context}\n\nQuestion: {request.user_message}\nAnswer:"
    client = OpenAI(api_key=request.api_key)
    response = client.chat.completions.create(
        model=request.model,
        messages=[{"role": "system", "content": prompt}],
        stream=False
    )
    answer = response.choices[0].message.content
    return {"answer": answer}

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
