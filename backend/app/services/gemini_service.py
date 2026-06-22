import json
import logging
import re
from typing import Any, Dict, Optional, List
from app.config import settings

logger = logging.getLogger(__name__)

# Initialize Gemini if key is provided and is not the default placeholder
is_gemini_available = False
if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip() and "here" not in settings.GEMINI_API_KEY.lower():
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        is_gemini_available = True
        logger.info("Gemini API successfully configured.")
    except Exception as e:
        logger.error(f"Failed to configure Gemini: {e}")
else:
    logger.warning("Gemini API key not configured or using placeholder. Running in Fallback Mode.")

class GeminiService:
    @staticmethod
    def generate_content(prompt: str, json_mode: bool = False) -> Optional[str]:
        if not is_gemini_available:
            return None
        try:
            import google.generativeai as genai
            model = genai.GenerativeModel("gemini-1.5-flash")
            
            if json_mode:
                # Use generation config to enforce JSON response
                response = model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        response_mime_type="application/json"
                    )
                )
            else:
                response = model.generate_content(prompt)
                
            return response.text.strip()
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            return None

    @staticmethod
    def classify_transaction_fallback(merchant: str) -> str:
        merchant_lower = merchant.lower()
        
        # Local rule-based classification heuristics
        food_keys = ["zomato", "swiggy", "starbucks", "mcdonalds", "kfc", "restaurant", "burger", "pizza", "cafe", "food", "dine"]
        travel_keys = ["uber", "ola", "irctc", "indigo", "metro", "airline", "cab", "taxi", "makemytrip", "travel", "fuel", "petrol", "hpcl", "bpcl"]
        shopping_keys = ["amazon", "flipkart", "myntra", "ajio", "retail", "supermarket", "grocery", "dmart", "spencers", "reliance", "fashion", "mall"]
        bills_keys = ["electricity", "water", "gas", "bsnl", "airtel", "jio", "recharge", "broadband", "act", "insurance", "lic"]
        healthcare_keys = ["apollo", "pharmacy", "chemist", "hospital", "clinic", "medical", "lenskart", "doctor"]
        education_keys = ["udemy", "coursera", "school", "college", "tuition", "university"]
        entertainment_keys = ["netflix", "prime", "hotstar", "spotify", "bookmyshow", "theater", "gaming", "steam"]
        investments_keys = ["zerodha", "groww", "mutual", "stock", "etf", "invest", "sip", "deposit"]
        
        # Specific category keys checked first
        if any(k in merchant_lower for k in entertainment_keys):
            return "Entertainment"
        if any(k in merchant_lower for k in investments_keys):
            return "Investments"
        if any(k in merchant_lower for k in food_keys):
            return "Food"
        if any(k in merchant_lower for k in travel_keys):
            return "Travel"
        if any(k in merchant_lower for k in shopping_keys):
            return "Shopping"
        if any(k in merchant_lower for k in bills_keys):
            return "Bills"
        if any(k in merchant_lower for k in healthcare_keys):
            return "Healthcare"
        if any(k in merchant_lower for k in education_keys):
            return "Education"
            
        return "Others"

    @staticmethod
    def simplify_offer_fallback(original_terms: str) -> str:
        original_terms_clean = original_terms.strip()
        
        # Look for cashback percentage, cap, and min transaction with flexible matching
        pct_match = re.search(r'(\d+)%\s*(?:cashback|discount|off)', original_terms_clean, re.IGNORECASE)
        cap_match = re.search(r'(?:up to|max|maximum|cap)\s*(?:₹|rs\.?)\s*(\d+)', original_terms_clean, re.IGNORECASE)
        
        # Match min spend allowing up to 4 words in between: e.g. "minimum transaction of Rs 1000"
        min_match = re.search(
            r'(?:min|minimum|above|spent|spend|greater)(?:\s+[a-z]+){0,4}\s*(?:₹|rs\.?|inr)?\s*(\d+)', 
            original_terms_clean, 
            re.IGNORECASE
        )
        
        pct = pct_match.group(1) if pct_match else None
        cap = cap_match.group(1) if cap_match else None
        min_spend = min_match.group(1) if min_match else None
        
        if pct and cap and min_spend:
            return f"Spend at least ₹{min_spend} and receive {pct}% cashback, capped at a maximum of ₹{cap}."
        elif pct and min_spend:
            return f"Spend at least ₹{min_spend} and receive {pct}% cashback on your transaction."
        elif pct and cap:
            return f"Get {pct}% cashback on your transaction, up to a maximum of ₹{cap}."
        elif pct:
            return f"Get {pct}% cashback on your transaction."
            
        return f"Promo Terms: {original_terms_clean} (No standard patterns detected, please read terms carefully)."
