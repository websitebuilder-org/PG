from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json
from groq import AsyncGroq

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============ MODELS ============

class GeneratePromptRequest(BaseModel):
    keyword: str
    style: Literal["photo", "illustration", "vector", "logo"]
    provider: Literal["openai", "claude", "gemini", "groq"]
    model: str
    quantity: int
    output_format: Literal["json", "text"]
    api_key: Optional[str] = None
    use_emergent_key: bool = False

class PromptGeneration(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    keyword: str
    style: str
    provider: str
    model: str
    quantity: int
    prompts: List[str]
    output_format: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FavoritePrompt(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    prompt_generation_id: str
    prompt_text: str
    keyword: str
    style: str
    saved_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SaveFavoriteRequest(BaseModel):
    prompt_generation_id: str
    prompt_text: str
    keyword: str
    style: str

# ============ HELPER FUNCTIONS ============

async def generate_with_emergent_integrations(provider: str, model: str, api_key: str, prompt: str) -> str:
    """Generate using emergentintegrations for OpenAI, Claude, Gemini"""
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"prompt-gen-{uuid.uuid4()}",
            system_message="You are an expert at creating detailed, professional prompts for microstock platforms like Shutterstock, Adobe Stock, and Getty Images. Generate prompts that are descriptive, keyword-rich, and optimized for discoverability."
        )
        
        chat.with_model(provider, model)
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        return response
    except Exception as e:
        logger.error(f"Error generating with {provider}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating prompts: {str(e)}")

async def generate_with_groq(api_key: str, model: str, prompt: str) -> str:
    """Generate using Groq"""
    try:
        groq_client = AsyncGroq(api_key=api_key)
        
        response = await groq_client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at creating detailed, professional prompts for microstock platforms like Shutterstock, Adobe Stock, and Getty Images. Generate prompts that are descriptive, keyword-rich, and optimized for discoverability."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=2000
        )
        
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Error generating with Groq: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating with Groq: {str(e)}")

# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Microstock Prompt Generator API"}

@api_router.post("/generate", response_model=PromptGeneration)
async def generate_prompts(request: GeneratePromptRequest):
    try:
        # Determine API key
        if request.use_emergent_key:
            api_key = os.environ.get('EMERGENT_LLM_KEY')
            if not api_key:
                raise HTTPException(status_code=500, detail="Emergent LLM key not configured")
        elif request.api_key:
            api_key = request.api_key
        else:
            raise HTTPException(status_code=400, detail="API key required")
        
        # Build the generation prompt
        style_descriptions = {
            "photo": "realistic photography",
            "illustration": "digital illustration or artwork",
            "vector": "vector graphics with clean lines and shapes",
            "logo": "logo design with branding elements"
        }
        
        generation_prompt = f"""Generate {request.quantity} unique, detailed prompts for {style_descriptions[request.style]} based on the keyword: "{request.keyword}"

Each prompt should:
- Be descriptive and specific
- Include relevant keywords for microstock discoverability
- Mention composition, lighting, mood, and technical aspects
- Be optimized for search engines
- Be suitable for {request.style} style

Format: Return ONLY a JSON array of strings, nothing else. Example: ["prompt 1", "prompt 2", ...]"""
        
        # Generate based on provider
        if request.provider in ["openai", "claude", "gemini"]:
            response_text = await generate_with_emergent_integrations(
                request.provider, 
                request.model, 
                api_key, 
                generation_prompt
            )
        elif request.provider == "groq":
            response_text = await generate_with_groq(
                api_key,
                request.model,
                generation_prompt
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid provider")
        
        # Parse response
        try:
            # Try to extract JSON from markdown code blocks
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            
            prompts_list = json.loads(response_text)
            
            if not isinstance(prompts_list, list):
                raise ValueError("Response is not a list")
        except Exception as e:
            logger.error(f"Error parsing response: {str(e)}")
            # Fallback: split by newlines
            prompts_list = [line.strip() for line in response_text.split('\n') if line.strip()]
            prompts_list = [p.lstrip('0123456789.-) ') for p in prompts_list if p]
        
        # Create generation object
        generation = PromptGeneration(
            keyword=request.keyword,
            style=request.style,
            provider=request.provider,
            model=request.model,
            quantity=request.quantity,
            prompts=prompts_list,
            output_format=request.output_format
        )
        
        # Save to database
        doc = generation.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.prompt_generations.insert_one(doc)
        
        return generation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in generate_prompts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/history", response_model=List[PromptGeneration])
async def get_history():
    try:
        generations = await db.prompt_generations.find(
            {}, 
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        for gen in generations:
            if isinstance(gen['created_at'], str):
                gen['created_at'] = datetime.fromisoformat(gen['created_at'])
        
        return generations
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/favorites", response_model=FavoritePrompt)
async def save_favorite(request: SaveFavoriteRequest):
    try:
        favorite = FavoritePrompt(
            prompt_generation_id=request.prompt_generation_id,
            prompt_text=request.prompt_text,
            keyword=request.keyword,
            style=request.style
        )
        
        doc = favorite.model_dump()
        doc['saved_at'] = doc['saved_at'].isoformat()
        await db.favorites.insert_one(doc)
        
        return favorite
    except Exception as e:
        logger.error(f"Error saving favorite: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/favorites", response_model=List[FavoritePrompt])
async def get_favorites():
    try:
        favorites = await db.favorites.find(
            {},
            {"_id": 0}
        ).sort("saved_at", -1).to_list(100)
        
        for fav in favorites:
            if isinstance(fav['saved_at'], str):
                fav['saved_at'] = datetime.fromisoformat(fav['saved_at'])
        
        return favorites
    except Exception as e:
        logger.error(f"Error fetching favorites: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/favorites/{favorite_id}")
async def delete_favorite(favorite_id: str):
    try:
        result = await db.favorites.delete_one({"id": favorite_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Favorite not found")
        
        return {"message": "Favorite deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting favorite: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()