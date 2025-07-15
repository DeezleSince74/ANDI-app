"""
ANDI Ollama Component for Langflow
Integrates local Ollama LLM server with ANDI-specific models
"""

import os
import requests
import json
from typing import Optional, Dict, Any
from langflow import CustomComponent
from langflow.field_typing import Text
from langflow.inputs import MessageTextInput, DropdownInput, IntInput, FloatInput
from langflow.outputs import TextOutput
from langflow.schema import Data


class AndiOllamaComponent(CustomComponent):
    display_name = "ANDI Ollama"
    description = "Local LLM inference using Ollama with ANDI-optimized models"
    icon = "🤖"

    inputs = [
        MessageTextInput(
            name="prompt",
            display_name="Prompt",
            info="The prompt to send to the local LLM model",
        ),
        DropdownInput(
            name="model",
            display_name="ANDI Model",
            options=[
                "andi-ciq-analyzer",
                "andi-coach", 
                "andi-realtime",
                "llama3.1:8b",
                "llama3.1:7b-instruct",
                "llama3.2:3b"
            ],
            value="andi-ciq-analyzer",
            info="Select the ANDI-optimized model for your use case",
        ),
        IntInput(
            name="max_tokens",
            display_name="Max Tokens",
            value=1024,
            info="Maximum number of tokens to generate",
        ),
        FloatInput(
            name="temperature",
            display_name="Temperature",
            value=0.3,
            info="Sampling temperature (0.0 to 1.0)",
        ),
        IntInput(
            name="timeout",
            display_name="Timeout (seconds)",
            value=60,
            info="Request timeout in seconds",
        ),
    ]

    outputs = [
        TextOutput(
            name="response",
            display_name="LLM Response",
        ),
        TextOutput(
            name="model_info",
            display_name="Model Info",
        ),
    ]

    def build_config(self):
        return {
            "prompt": {"multiline": True, "placeholder": "Enter your prompt here..."},
            "model": {"info": "Choose model based on use case:\n• andi-ciq-analyzer: Deep classroom analysis\n• andi-coach: Teacher recommendations\n• andi-realtime: Fast responses"},
            "temperature": {"step": 0.1, "min": 0.0, "max": 1.0},
            "max_tokens": {"min": 1, "max": 4096},
            "timeout": {"min": 10, "max": 300},
        }

    def build(
        self,
        prompt: str,
        model: str,
        max_tokens: int = 1024,
        temperature: float = 0.3,
        timeout: int = 60,
    ) -> Data:
        """
        Build the Ollama request and return the response
        """
        try:
            # Get Ollama base URL from environment or default
            ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
            
            # Prepare the request payload
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens,
                }
            }
            
            # Make request to Ollama API
            response = requests.post(
                f"{ollama_url}/api/generate",
                json=payload,
                timeout=timeout,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                llm_response = result.get("response", "")
                
                # Extract model information
                model_info = {
                    "model": result.get("model", model),
                    "created_at": result.get("created_at", ""),
                    "total_duration": result.get("total_duration", 0),
                    "load_duration": result.get("load_duration", 0),
                    "prompt_eval_count": result.get("prompt_eval_count", 0),
                    "eval_count": result.get("eval_count", 0),
                }
                
                model_info_str = json.dumps(model_info, indent=2)
                
                self.status = f"✅ Generated {model_info.get('eval_count', 0)} tokens"
                
                return Data(
                    data={
                        "response": llm_response,
                        "model_info": model_info_str,
                        "model": model,
                        "prompt": prompt,
                    }
                )
            else:
                error_msg = f"Ollama API error: {response.status_code} - {response.text}"
                self.status = f"❌ {error_msg}"
                return Data(
                    data={
                        "response": f"Error: {error_msg}",
                        "model_info": "Error occurred",
                        "model": model,
                        "prompt": prompt,
                    }
                )
                
        except requests.exceptions.ConnectionError:
            error_msg = f"Cannot connect to Ollama at {ollama_url}. Is Ollama running?"
            self.status = f"❌ {error_msg}"
            return Data(
                data={
                    "response": f"Connection Error: {error_msg}",
                    "model_info": "Connection failed",
                    "model": model,
                    "prompt": prompt,
                }
            )
        except requests.exceptions.Timeout:
            error_msg = f"Request timed out after {timeout} seconds"
            self.status = f"❌ {error_msg}"
            return Data(
                data={
                    "response": f"Timeout Error: {error_msg}",
                    "model_info": "Request timed out",
                    "model": model,
                    "prompt": prompt,
                }
            )
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            self.status = f"❌ {error_msg}"
            return Data(
                data={
                    "response": f"Error: {error_msg}",
                    "model_info": "Error occurred",
                    "model": model,
                    "prompt": prompt,
                }
            )


class AndiCiqAnalyzer(CustomComponent):
    """Specialized component for CIQ analysis using andi-ciq-analyzer model"""
    
    display_name = "ANDI CIQ Analyzer"
    description = "Analyze classroom interactions for CIQ metrics using local LLM"
    icon = "🎯"

    inputs = [
        MessageTextInput(
            name="transcript",
            display_name="Classroom Transcript",
            info="Classroom audio transcript to analyze for CIQ metrics",
        ),
        MessageTextInput(
            name="context",
            display_name="Context (Optional)",
            info="Additional context about the lesson, subject, grade level, etc.",
            value="",
        ),
    ]

    outputs = [
        TextOutput(name="ciq_analysis", display_name="CIQ Analysis"),
        TextOutput(name="equity_score", display_name="Equity Insights"),
        TextOutput(name="creativity_score", display_name="Creativity Insights"),
        TextOutput(name="innovation_score", display_name="Innovation Insights"),
    ]

    def build(self, transcript: str, context: str = "") -> Data:
        """Analyze transcript for CIQ metrics"""
        
        # Construct CIQ-specific prompt
        prompt = f"""
Analyze this classroom transcript for Classroom Impact Quotient (CIQ) metrics:

TRANSCRIPT:
{transcript}

CONTEXT:
{context if context else "No additional context provided"}

Please provide a comprehensive CIQ analysis covering:

1. EQUITY (0-100): Psychological safety, equal access, and voice for all students
   - Wait time patterns
   - Student participation distribution
   - Inclusive language and practices

2. CREATIVITY (0-100): Self-expression, experimentation, and skill development
   - Open-ended questioning
   - Student-generated ideas
   - Problem-solving approaches

3. INNOVATION (0-100): Real-world connections and continuous improvement
   - Authentic applications
   - Future-focused thinking
   - Adaptive teaching strategies

For each dimension, provide:
- Numerical score (0-100)
- Specific evidence from the transcript
- Actionable recommendations for improvement
- Celebration of strengths observed

Format your response with clear sections for each CIQ dimension.
"""

        try:
            ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
            model = os.getenv("OLLAMA_CIQ_MODEL", "andi-ciq-analyzer")
            
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3,
                    "num_predict": 2048,
                }
            }
            
            response = requests.post(
                f"{ollama_url}/api/generate",
                json=payload,
                timeout=90,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                analysis = result.get("response", "")
                
                # Extract scores and insights (basic parsing)
                lines = analysis.split('\n')
                equity_insights = ""
                creativity_insights = ""
                innovation_insights = ""
                
                current_section = ""
                for line in lines:
                    line_lower = line.lower()
                    if "equity" in line_lower:
                        current_section = "equity"
                    elif "creativity" in line_lower:
                        current_section = "creativity"
                    elif "innovation" in line_lower:
                        current_section = "innovation"
                    
                    if current_section == "equity":
                        equity_insights += line + "\n"
                    elif current_section == "creativity":
                        creativity_insights += line + "\n"
                    elif current_section == "innovation":
                        innovation_insights += line + "\n"
                
                self.status = "✅ CIQ analysis completed"
                
                return Data(
                    data={
                        "ciq_analysis": analysis,
                        "equity_score": equity_insights.strip(),
                        "creativity_score": creativity_insights.strip(),
                        "innovation_score": innovation_insights.strip(),
                    }
                )
            else:
                error_msg = f"CIQ Analysis failed: {response.status_code}"
                self.status = f"❌ {error_msg}"
                return Data(
                    data={
                        "ciq_analysis": f"Error: {error_msg}",
                        "equity_score": "Analysis failed",
                        "creativity_score": "Analysis failed", 
                        "innovation_score": "Analysis failed",
                    }
                )
                
        except Exception as e:
            error_msg = f"CIQ Analysis error: {str(e)}"
            self.status = f"❌ {error_msg}"
            return Data(
                data={
                    "ciq_analysis": f"Error: {error_msg}",
                    "equity_score": "Error occurred",
                    "creativity_score": "Error occurred",
                    "innovation_score": "Error occurred",
                }
            )