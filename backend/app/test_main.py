import unittest
from decimal import Decimal
from datetime import datetime
from app.services.gemini_service import GeminiService
from app.services.agents import CashbackEligibilityAgent, TransactionClassificationAgent, OfferSimplificationAgent
from app.models import CashbackRule

class TestFinSightCore(unittest.TestCase):
    def test_local_classification_fallback(self):
        # Test heuristic categorization keyword matching
        self.assertEqual(GeminiService.classify_transaction_fallback("Uber Ride India"), "Travel")
        self.assertEqual(GeminiService.classify_transaction_fallback("Zomato food delivery"), "Food")
        self.assertEqual(GeminiService.classify_transaction_fallback("Amazon Prime Video subscription"), "Entertainment")
        self.assertEqual(GeminiService.classify_transaction_fallback("SBI Mutual Fund SIP"), "Investments")
        self.assertEqual(GeminiService.classify_transaction_fallback("Random Merchant Name"), "Others")

    def test_local_offer_simplifier_fallback(self):
        # Test heuristic offer simplifier regex engine
        terms1 = "Get 10% cashback up to Rs 200 on minimum transaction of Rs 1000"
        terms2 = "Get 5% discount on bills above Rs 500"
        
        simplified1 = GeminiService.simplify_offer_fallback(terms1)
        simplified2 = GeminiService.simplify_offer_fallback(terms2)
        
        self.assertIn("Spend at least ₹1000 and receive 10% cashback, capped at a maximum of ₹200.", simplified1)
        self.assertIn("Spend at least ₹500 and receive 5% cashback on your transaction.", simplified2)

    def test_cashback_evaluator(self):
        # Mock active credit card cashback rules
        rules = [
            CashbackRule(card_name="Amazon Pay ICICI", merchant_pattern="Amazon", category_pattern="*", cashback_percentage=Decimal("5.0")),
            CashbackRule(card_name="Amazon Pay ICICI", merchant_pattern="*", category_pattern="*", cashback_percentage=Decimal("1.0")),
            CashbackRule(card_name="Axis Ace", merchant_pattern="*", category_pattern="Bills", cashback_percentage=Decimal("5.0")),
            CashbackRule(card_name="Axis Ace", merchant_pattern="*", category_pattern="*", cashback_percentage=Decimal("2.0")),
        ]
        
        # Scenario 1: User bought on Amazon with Axis Ace (missed higher cashback card Amazon ICICI)
        result1 = CashbackEligibilityAgent.evaluate_transaction(
            merchant="Amazon Purchase",
            category="Shopping",
            amount=Decimal("2000.00"),
            payment_method="Axis Ace",
            rules=rules
        )
        self.assertEqual(result1["cashback_earned"], Decimal("40.00")) # Axis Ace gives 2% on Amazon
        self.assertEqual(result1["potential_cashback"], Decimal("100.00")) # Amazon ICICI gives 5% on Amazon
        self.assertEqual(result1["best_payment_method"], "Amazon Pay ICICI")

        # Scenario 2: User paid Electricity Bill with Axis Ace (maximized cashback)
        result2 = CashbackEligibilityAgent.evaluate_transaction(
            merchant="Electricity Bill",
            category="Bills",
            amount=Decimal("3000.00"),
            payment_method="Axis Ace",
            rules=rules
        )
        self.assertEqual(result2["cashback_earned"], Decimal("150.00")) # Axis Ace gives 5% on Bills
        self.assertEqual(result2["potential_cashback"], Decimal("150.00")) 
        self.assertEqual(result2["best_payment_method"], "Axis Ace")
        
        # Scenario 3: User paid on Zomato using UPI
        result3 = CashbackEligibilityAgent.evaluate_transaction(
            merchant="Zomato",
            category="Food",
            amount=Decimal("500.00"),
            payment_method="UPI",
            rules=rules
        )
        self.assertEqual(result3["cashback_earned"], Decimal("0.00")) # UPI gives 0%
        self.assertEqual(result3["potential_cashback"], Decimal("10.00")) # Axis Ace gives 2% flat
        self.assertEqual(result3["best_payment_method"], "Axis Ace")

if __name__ == "__main__":
    unittest.main()
