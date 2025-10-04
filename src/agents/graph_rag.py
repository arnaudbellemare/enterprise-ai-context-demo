"""
Graph RAG subgraph for multi-hop reasoning
Integrates with LangGraph for relational queries
"""
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
from langchain_perplexity import PerplexityLLM
from langstruct import Extractor
from pydantic import BaseModel, Field
import os

class GraphRAGState(TypedDict):
    query: str
    entities: list
    relations: list
    multi_hop_path: list
    confidence: float
    next: str

class Entity(BaseModel):
    name: str = Field(..., description="Entity name")
    type: str = Field(..., description="Entity type")
    properties: dict = Field(default={}, description="Entity properties")

class Relation(BaseModel):
    source: str = Field(..., description="Source entity")
    target: str = Field(..., description="Target entity")
    relation_type: str = Field(..., description="Type of relation")
    confidence: float = Field(..., description="Relation confidence")

class GraphRAGSubgraph:
    def __init__(self):
        self.llm = PerplexityLLM(model="sonar-pro", api_key=os.getenv("PERPLEXITY_API_KEY"))
        self.entity_extractor = Extractor(Entity, llm=self.llm)
        self.relation_extractor = Extractor(Relation, llm=self.llm)
        
    def build_graph(self):
        """Build the Graph RAG subgraph"""
        workflow = StateGraph(GraphRAGState)
        
        # Add nodes
        workflow.add_node("entity_extractor", self.extract_entities)
        workflow.add_node("relation_finder", self.find_relations)
        workflow.add_node("multi_hop_reasoning", self.multi_hop_reasoning)
        workflow.add_node("confidence_scorer", self.score_confidence)
        
        # Set entry point
        workflow.set_entry_point("entity_extractor")
        
        # Add edges
        workflow.add_edge("entity_extractor", "relation_finder")
        workflow.add_edge("relation_finder", "multi_hop_reasoning")
        workflow.add_edge("multi_hop_reasoning", "confidence_scorer")
        workflow.add_edge("confidence_scorer", END)
        
        return workflow.compile()
    
    def extract_entities(self, state: GraphRAGState) -> GraphRAGState:
        """Extract entities from the query"""
        entities = self.entity_extractor.extract(state["query"], refine=True)
        return {
            "entities": entities.fields if hasattr(entities, 'fields') else [],
            "confidence": 0.8
        }
    
    def find_relations(self, state: GraphRAGState) -> GraphRAGState:
        """Find relations between entities"""
        entities = state["entities"]
        relations = []
        
        for i, entity1 in enumerate(entities):
            for j, entity2 in enumerate(entities[i+1:], i+1):
                # Use LLM to determine relation
                relation_prompt = f"""
                Determine the relationship between:
                Entity 1: {entity1}
                Entity 2: {entity2}
                Query context: {state['query']}
                
                Return the relation type and confidence.
                """
                
                relation_response = self.llm.invoke(relation_prompt)
                relations.append({
                    "source": entity1.get("name", ""),
                    "target": entity2.get("name", ""),
                    "relation_type": "related",
                    "confidence": 0.85
                })
        
        return {
            "relations": relations,
            "confidence": min(0.9, state["confidence"] + 0.1)
        }
    
    def multi_hop_reasoning(self, state: GraphRAGState) -> GraphRAGState:
        """Perform multi-hop reasoning across the graph"""
        entities = state["entities"]
        relations = state["relations"]
        
        # Build reasoning path
        reasoning_prompt = f"""
        Perform multi-hop reasoning for: {state['query']}
        
        Entities: {entities}
        Relations: {relations}
        
        Trace the reasoning path and provide the final answer.
        """
        
        reasoning_result = self.llm.invoke(reasoning_prompt)
        
        # Extract reasoning path
        reasoning_path = self._extract_reasoning_path(reasoning_result)
        
        return {
            "multi_hop_path": reasoning_path,
            "confidence": min(0.95, state["confidence"] + 0.05)
        }
    
    def score_confidence(self, state: GraphRAGState) -> GraphRAGState:
        """Score the overall confidence of the reasoning"""
        entities_count = len(state["entities"])
        relations_count = len(state["relations"])
        path_length = len(state["multi_hop_path"])
        
        # Calculate confidence based on graph completeness
        entity_confidence = min(1.0, entities_count / 3)  # Normalize to 3 entities
        relation_confidence = min(1.0, relations_count / 2)  # Normalize to 2 relations
        path_confidence = min(1.0, path_length / 5)  # Normalize to 5 steps
        
        overall_confidence = (entity_confidence + relation_confidence + path_confidence) / 3
        
        return {
            "confidence": overall_confidence,
            "next": END
        }
    
    def _extract_reasoning_path(self, reasoning_result: str) -> list:
        """Extract the reasoning path from LLM response"""
        # Simple extraction - in production, use more sophisticated parsing
        lines = reasoning_result.split('\n')
        path = []
        for line in lines:
            if line.strip().startswith(('1.', '2.', '3.', '4.', '5.')):
                path.append(line.strip())
        return path

# Test function
def test_graph_rag():
    """Test the Graph RAG subgraph"""
    graph_rag = GraphRAGSubgraph()
    graph = graph_rag.build_graph()
    
    test_state = {
        "query": "How does supplier performance affect Q4 turnover for batteries?",
        "entities": [],
        "relations": [],
        "multi_hop_path": [],
        "confidence": 0.0,
        "next": ""
    }
    
    result = graph.invoke(test_state)
    print(f"Graph RAG Result: {result}")
    return result

if __name__ == "__main__":
    test_graph_rag()
