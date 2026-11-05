import os
import json
import logging
from typing import Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

MODELS_PRIORITY = [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
]


class AIService:
    def __init__(self):
        pass

    @property
    def api_key(self) -> Optional[str]:
        return settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")

    @property
    def available(self) -> bool:
        return bool(self.api_key)

    async def analyze_meeting(self, meeting_notes: str, context: str = "") -> dict:
        """Analyze meeting notes and return structured JSON output."""
        key = self.api_key
        if not key:
            logger.warning("GEMINI_API_KEY not set. Running in demo mode.")
            return self._demo_response()

        context_block = ""
        if context.strip():
            context_block = f"\nRELEVANT CONTEXT FROM PREVIOUS MEETINGS:\n{context}\n"

        prompt = f"""You are an expert meeting analyst. Carefully analyze the meeting notes below and extract structured information.
{context_block}
MEETING NOTES:
{meeting_notes}

Return a JSON object with EXACTLY this structure (no markdown, no explanation, only valid JSON):
{{
  "executive_summary": "2-3 sentence executive summary of the meeting",
  "discussion_points": ["point 1", "point 2"],
  "topics": ["topic 1", "topic 2"],
  "decisions": [
    {{
      "content": "exact decision made",
      "context": "supporting quote from notes",
      "decision_type": "approved"
    }}
  ],
  "action_items": [
    {{
      "title": "concise task title",
      "description": "detailed task description",
      "assigned_to": "Person Name or Unassigned",
      "deadline": "YYYY-MM-DD or null",
      "priority": "High",
      "confidence": 0.9,
      "source_context": "exact quote from notes supporting this task"
    }}
  ],
  "important_dates": [
    {{
      "date_text": "date as mentioned in notes",
      "context": "what this date refers to"
    }}
  ],
  "participants": ["Name1", "Name2"],
  "follow_ups": [
    {{
      "question": "unresolved question or topic",
      "context": "why this needs follow-up"
    }}
  ]
}}

STRICT RULES:
- assigned_to: Use exact name if mentioned. Use "Unassigned" if not mentioned. NEVER invent names.
- deadline: Use ISO date format if clearly mentioned. Use null if not mentioned. NEVER guess or fabricate dates.
- priority: "High" if urgent/critical, "Medium" if normal, "Low" if nice-to-have.
- confidence: 0.0-1.0 based on how explicitly the action item is stated in the notes.
- Only extract ACTUAL decisions, not suggestions or discussions.
- decision_type must be one of: "approved", "rejected", "deferred".
- Return ONLY valid JSON. No markdown code fences."""

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "response_mime_type": "application/json",
            },
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            last_error = None
            for model_name in MODELS_PRIORITY:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={key}"
                try:
                    logger.info(f"Attempting AI analysis with Gemini model: {model_name}")
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                        if text.startswith("```"):
                            start = text.find("{")
                            end = text.rfind("}") + 1
                            text = text[start:end]
                        result = json.loads(text)
                        logger.info(f"AI analysis completed successfully using {model_name}")
                        return result
                    else:
                        logger.warning(
                            f"Gemini model {model_name} failed with status {resp.status_code}: {resp.text[:150]}"
                        )
                        last_error = f"Status {resp.status_code}: {resp.text[:150]}"
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON from {model_name}: {e}")
                    last_error = f"JSON decode error: {e}"
                except Exception as e:
                    logger.error(f"Exception calling Gemini model {model_name}: {e}")
                    last_error = str(e)

        logger.error(f"All Gemini models failed. Last error: {last_error}")
        return self._demo_response()

    def _demo_response(self) -> dict:
        """Return a clearly labeled demo response when AI is not configured."""
        return {
            "executive_summary": (
                "⚠️ AI analysis requires a valid Gemini API key. "
                "Please add your GEMINI_API_KEY to the backend/.env file. "
                "Get a free key at https://aistudio.google.com/app/apikey"
            ),
            "discussion_points": [
                "Configure Gemini API key to enable real AI analysis",
                "This is a demo response showing the expected output structure",
            ],
            "topics": ["Setup Required", "Demo Mode"],
            "decisions": [],
            "action_items": [
                {
                    "title": "Configure Gemini API Key",
                    "description": (
                        "Add GEMINI_API_KEY=your-key to backend/.env file. "
                        "Restart the backend server after adding the key."
                    ),
                    "assigned_to": "System Administrator",
                    "deadline": None,
                    "priority": "High",
                    "confidence": 1.0,
                    "source_context": "System requirement for AI functionality",
                }
            ],
            "important_dates": [],
            "participants": [],
            "follow_ups": [
                {
                    "question": "Has the Gemini API key been configured?",
                    "context": "Required for AI-powered meeting analysis",
                }
            ],
        }
