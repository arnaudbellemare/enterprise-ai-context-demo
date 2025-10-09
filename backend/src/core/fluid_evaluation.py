"""
Fluid Benchmarking for Entity Extraction
Based on AllenAI's fluid-benchmarking using IRT (Item Response Theory)

Reference: https://github.com/allenai/fluid-benchmarking
Paper: https://arxiv.org/abs/2509.11106

Use IRT to:
1. Estimate extraction difficulty per test case
2. Identify mislabeled training data
3. Adaptively select test cases for evaluation
4. Reduce evaluation overhead
"""

import json
import math
from typing import Dict, List, Any, Tuple, Optional
from dataclasses import dataclass
import random


@dataclass
class IRTItem:
    """
    IRT 2PL (Two-Parameter Logistic) Model Item
    
    difficulty: How hard the item is (theta in IRT)
    discrimination: How well item distinguishes ability levels
    """
    id: str
    text: str
    expected_entities: List[Dict[str, Any]]
    difficulty: float = 0.0  # Range: -3 to 3 (0 = average)
    discrimination: float = 1.0  # Range: 0 to 3 (higher = better)
    mislabeled_probability: float = 0.0  # Estimated prob of mislabeling


@dataclass
class ExtractionAbility:
    """
    Model's ability to extract entities
    theta: Ability parameter (-3 to 3, higher = better)
    """
    method: str  # 'knowledge_graph' or 'langstruct'
    theta: float = 0.0
    standard_error: float = 1.0
    num_items_tested: int = 0


class FluidEvaluator:
    """
    Fluid Benchmarking for Entity Extraction
    
    Uses IRT to adaptively evaluate extraction methods
    and identify mislabeled test cases
    """
    
    def __init__(self, test_items: List[IRTItem] = None):
        self.test_items = test_items or []
        self.abilities: Dict[str, ExtractionAbility] = {}
        self.response_history: List[Dict[str, Any]] = []
        
    def probability_correct(
        self, 
        ability: float, 
        difficulty: float, 
        discrimination: float
    ) -> float:
        """
        2PL IRT model: P(correct) = 1 / (1 + exp(-discrimination * (ability - difficulty)))
        
        This is the core of Item Response Theory
        """
        exponent = -discrimination * (ability - difficulty)
        return 1.0 / (1.0 + math.exp(exponent))
    
    def estimate_ability(
        self,
        responses: List[Tuple[IRTItem, bool]],
        method: str = 'map'
    ) -> ExtractionAbility:
        """
        Estimate extraction ability using Maximum A Posteriori (MAP)
        
        method: 'map' (default) or 'ml' (maximum likelihood)
        """
        if not responses:
            return ExtractionAbility(method='unknown', theta=0.0)
        
        # MAP estimation with Newton-Raphson
        theta = 0.0  # Start at average ability
        
        for iteration in range(20):  # Max 20 iterations
            # Calculate gradient (first derivative of log-likelihood)
            gradient = 0.0
            hessian = 0.0
            
            for item, correct in responses:
                p = self.probability_correct(theta, item.difficulty, item.discrimination)
                
                # Gradient contribution
                if correct:
                    gradient += item.discrimination * (1 - p)
                else:
                    gradient -= item.discrimination * p
                
                # Hessian contribution (for Newton-Raphson)
                hessian -= item.discrimination ** 2 * p * (1 - p)
            
            # Add prior (MAP vs ML)
            if method == 'map':
                gradient -= theta  # Normal(0,1) prior
                hessian -= 1.0
            
            # Newton-Raphson update
            if abs(hessian) > 1e-6:
                theta_new = theta - gradient / hessian
                
                # Check convergence
                if abs(theta_new - theta) < 1e-4:
                    theta = theta_new
                    break
                    
                theta = theta_new
        
        # Calculate standard error
        fisher_info = sum(
            item.discrimination ** 2 * 
            self.probability_correct(theta, item.difficulty, item.discrimination) *
            (1 - self.probability_correct(theta, item.difficulty, item.discrimination))
            for item, _ in responses
        )
        
        standard_error = 1.0 / math.sqrt(fisher_info) if fisher_info > 0 else 1.0
        
        return ExtractionAbility(
            method=responses[0][0].id.split('-')[0] if responses else 'unknown',
            theta=theta,
            standard_error=standard_error,
            num_items_tested=len(responses)
        )
    
    def select_next_item(
        self,
        current_ability: ExtractionAbility,
        administered_items: List[str]
    ) -> Optional[IRTItem]:
        """
        Adaptively select next item for maximum information
        
        Fisher Information is maximized when difficulty ≈ ability
        """
        available_items = [
            item for item in self.test_items 
            if item.id not in administered_items
        ]
        
        if not available_items:
            return None
        
        # Calculate Fisher Information for each item
        item_information = []
        for item in available_items:
            p = self.probability_correct(
                current_ability.theta,
                item.difficulty,
                item.discrimination
            )
            # Fisher Information: I(θ) = a² * p * (1-p)
            info = item.discrimination ** 2 * p * (1 - p)
            item_information.append((item, info))
        
        # Select item with maximum information
        item_information.sort(key=lambda x: x[1], reverse=True)
        return item_information[0][0]
    
    async def fluid_benchmarking(
        self,
        extraction_method: str,
        start_ability: float = 0.0,
        n_max: int = 100,
        estimation_method: str = 'map'
    ) -> Dict[str, Any]:
        """
        Run adaptive fluid benchmarking
        
        Args:
            extraction_method: 'knowledge_graph' or 'langstruct'
            start_ability: Initial ability estimate (default: 0.0 = average)
            n_max: Maximum number of items to administer
            estimation_method: 'map' or 'ml'
        
        Returns:
            Final ability estimate and administered items
        """
        print(f"🧪 Starting Fluid Benchmarking for: {extraction_method}")
        
        current_ability = ExtractionAbility(
            method=extraction_method,
            theta=start_ability
        )
        
        responses = []
        administered_items = []
        
        for i in range(n_max):
            # Select next item adaptively
            next_item = self.select_next_item(current_ability, administered_items)
            
            if next_item is None:
                print(f"  All items exhausted at iteration {i}")
                break
            
            # Administer item (test extraction on this case)
            is_correct = await self._test_extraction(extraction_method, next_item)
            
            responses.append((next_item, is_correct))
            administered_items.append(next_item.id)
            
            # Update ability estimate
            current_ability = self.estimate_ability(responses, estimation_method)
            
            print(f"  Item {i+1}: {next_item.id} - {'✓' if is_correct else '✗'} "
                  f"(difficulty: {next_item.difficulty:.2f}, ability: {current_ability.theta:.2f})")
            
            # Early stopping if confidence is high
            if current_ability.standard_error < 0.3 and i >= 10:
                print(f"  Early stop: High confidence achieved (SE: {current_ability.standard_error:.2f})")
                break
        
        return {
            'method': extraction_method,
            'final_ability': current_ability.theta,
            'standard_error': current_ability.standard_error,
            'items_administered': len(administered_items),
            'items_correct': sum(1 for _, correct in responses if correct),
            'accuracy': sum(1 for _, correct in responses if correct) / len(responses) if responses else 0,
            'administered_items': administered_items,
            'ability_estimate': current_ability
        }
    
    async def _test_extraction(
        self,
        method: str,
        item: IRTItem
    ) -> bool:
        """
        Test extraction method on a specific item
        Returns True if extraction matches expected entities
        """
        # In production, call actual extraction APIs
        # For now, simulate based on difficulty and method ability
        
        # Mock: Knowledge Graph has ability ≈ 0.5, LangStruct ≈ 1.5
        method_ability = 0.5 if method == 'knowledge_graph' else 1.5
        
        # Calculate probability of success using IRT
        p_correct = self.probability_correct(
            method_ability,
            item.difficulty,
            item.discrimination
        )
        
        # Simulate response
        return random.random() < p_correct
    
    def identify_mislabeled_items(
        self,
        responses_across_models: Dict[str, List[Tuple[IRTItem, bool]]],
        threshold: float = 0.3
    ) -> List[IRTItem]:
        """
        Identify potentially mislabeled items using IRT
        
        Mislabeled items show unexpected response patterns:
        - High-ability models fail unexpectedly
        - Low-ability models succeed unexpectedly
        """
        mislabeled = []
        
        for item in self.test_items:
            # Collect all responses to this item
            item_responses = []
            
            for method, responses in responses_across_models.items():
                for response_item, correct in responses:
                    if response_item.id == item.id:
                        ability = self.abilities.get(method, ExtractionAbility(method=method))
                        item_responses.append((ability.theta, correct))
            
            if not item_responses:
                continue
            
            # Calculate expected vs actual pattern
            expected_correct = []
            actual_correct = []
            
            for ability, correct in item_responses:
                expected_p = self.probability_correct(ability, item.difficulty, item.discrimination)
                expected_correct.append(expected_p)
                actual_correct.append(1.0 if correct else 0.0)
            
            # Calculate discrepancy
            discrepancy = sum(
                abs(expected - actual) 
                for expected, actual in zip(expected_correct, actual_correct)
            ) / len(item_responses)
            
            # Flag if high discrepancy
            if discrepancy > threshold:
                item.mislabeled_probability = discrepancy
                mislabeled.append(item)
        
        # Sort by mislabeling probability
        mislabeled.sort(key=lambda x: x.mislabeled_probability, reverse=True)
        
        return mislabeled


def create_test_dataset() -> List[IRTItem]:
    """
    Create test dataset with IRT-calibrated difficulty levels
    """
    return [
        # EASY items (difficulty: -1.5 to -0.5)
        IRTItem(
            id='easy-1',
            text='Sarah is working on the AI project.',
            expected_entities=[
                {'type': 'person', 'name': 'Sarah'},
                {'type': 'project', 'name': 'AI project'}
            ],
            difficulty=-1.0,
            discrimination=1.5
        ),
        
        IRTItem(
            id='easy-2',
            text='John leads the Sales Dashboard.',
            expected_entities=[
                {'type': 'person', 'name': 'John'},
                {'type': 'project', 'name': 'Sales Dashboard'}
            ],
            difficulty=-0.8,
            discrimination=1.2
        ),
        
        # MEDIUM items (difficulty: -0.5 to 0.5)
        IRTItem(
            id='medium-1',
            text='The Q3 2024 optimization initiative, led by Dr. Smith, improved efficiency by 40%.',
            expected_entities=[
                {'type': 'person', 'name': 'Dr. Smith'},
                {'type': 'project', 'name': 'optimization initiative'},
                {'type': 'concept', 'name': 'efficiency'}
            ],
            difficulty=0.0,
            discrimination=1.8
        ),
        
        IRTItem(
            id='medium-2',
            text='Sarah collaborates with the engineering team on implementing machine learning algorithms.',
            expected_entities=[
                {'type': 'person', 'name': 'Sarah'},
                {'type': 'organization', 'name': 'engineering team'},
                {'type': 'concept', 'name': 'machine learning'}
            ],
            difficulty=0.3,
            discrimination=1.5
        ),
        
        # HARD items (difficulty: 0.5 to 1.5)
        IRTItem(
            id='hard-1',
            text='Invoice #INV-2024-001 from Acme Corp (123 Business St, SF, CA) for consulting services ($12,450.75) with Net 30 payment terms.',
            expected_entities=[
                {'type': 'document', 'name': 'INV-2024-001'},
                {'type': 'organization', 'name': 'Acme Corp'},
                {'type': 'concept', 'name': 'consulting services'}
            ],
            difficulty=1.0,
            discrimination=2.0
        ),
        
        IRTItem(
            id='hard-2',
            text='Patient Jane Doe (MRN: 12345) presents with dyspnea. PMH: T2DM (2015), HTN (2018). Meds: Metformin 1000mg BID, Lisinopril 20mg daily.',
            expected_entities=[
                {'type': 'person', 'name': 'Jane Doe'},
                {'type': 'concept', 'name': 'dyspnea'},
                {'type': 'concept', 'name': 'T2DM'},
                {'type': 'concept', 'name': 'HTN'}
            ],
            difficulty=1.5,
            discrimination=2.2
        ),
        
        # VERY HARD items (difficulty: 1.5+)
        IRTItem(
            id='very-hard-1',
            text='The polymorphic implementation leverages dependency injection via the factory pattern, enabling runtime strategy selection for the visitor pattern applied to the AST traversal.',
            expected_entities=[
                {'type': 'concept', 'name': 'dependency injection'},
                {'type': 'concept', 'name': 'factory pattern'},
                {'type': 'concept', 'name': 'visitor pattern'},
                {'type': 'concept', 'name': 'AST traversal'}
            ],
            difficulty=2.0,
            discrimination=1.8
        )
    ]


# Example usage
async def demo_fluid_evaluation():
    """
    Demo: Evaluate Knowledge Graph vs LangStruct using Fluid Benchmarking
    """
    print("🧪 Fluid Benchmarking Demo\n")
    print("=" * 80)
    
    # Create test dataset
    test_items = create_test_dataset()
    evaluator = FluidEvaluator(test_items)
    
    # Evaluate Knowledge Graph
    print("\n📊 Evaluating Knowledge Graph (pattern-based)...")
    kg_results = await evaluator.fluid_benchmarking(
        extraction_method='knowledge_graph',
        start_ability=0.0,
        n_max=50
    )
    
    print(f"\n  Final Ability: θ = {kg_results['final_ability']:.2f}")
    print(f"  Standard Error: {kg_results['standard_error']:.2f}")
    print(f"  Items Tested: {kg_results['items_administered']}")
    print(f"  Accuracy: {kg_results['accuracy']*100:.1f}%")
    
    # Evaluate LangStruct
    print("\n📊 Evaluating LangStruct (LLM-based)...")
    ls_results = await evaluator.fluid_benchmarking(
        extraction_method='langstruct',
        start_ability=0.0,
        n_max=50
    )
    
    print(f"\n  Final Ability: θ = {ls_results['final_ability']:.2f}")
    print(f"  Standard Error: {ls_results['standard_error']:.2f}")
    print(f"  Items Tested: {ls_results['items_administered']}")
    print(f"  Accuracy: {ls_results['accuracy']*100:.1f}%")
    
    # Compare
    print("\n" + "=" * 80)
    print("\n🏆 Comparison:")
    print(f"  Knowledge Graph ability: {kg_results['final_ability']:.2f} ± {kg_results['standard_error']:.2f}")
    print(f"  LangStruct ability: {ls_results['final_ability']:.2f} ± {ls_results['standard_error']:.2f}")
    
    ability_diff = ls_results['final_ability'] - kg_results['final_ability']
    print(f"\n  Difference: {ability_diff:.2f}")
    
    if ability_diff > 0.5:
        print("  → LangStruct significantly better for complex extractions")
    elif ability_diff < -0.5:
        print("  → Knowledge Graph surprisingly effective!")
    else:
        print("  → Methods have similar performance")
    
    # Identify mislabeled items
    print("\n🔍 Checking for mislabeled test cases...")
    all_responses = {
        'knowledge_graph': [(item, bool(random.random() > 0.3)) for item in test_items[:5]],
        'langstruct': [(item, bool(random.random() > 0.2)) for item in test_items[:5]]
    }
    
    mislabeled = evaluator.identify_mislabeled_items(all_responses, threshold=0.3)
    
    if mislabeled:
        print(f"\n  Found {len(mislabeled)} potentially mislabeled items:")
        for item in mislabeled[:3]:
            print(f"    • {item.id}: {item.text[:50]}...")
            print(f"      Mislabel probability: {item.mislabeled_probability:.2%}")
    else:
        print("  ✅ No mislabeled items detected")


if __name__ == '__main__':
    import asyncio
    asyncio.run(demo_fluid_evaluation())

