# 🤖 Specialized Agents Guide

## Overview

20 new specialized agents across 5 domains have been added to extend your AI system capabilities.

---

## 📦 Domains & Agents

### **1. Product Domain** (2 agents)

#### **Trend Researcher**
```typescript
POST /api/ax-dspy/specialized-agents
{
  "agentName": "trend_researcher",
  "inputs": {
    "industry": "AI/Machine Learning",
    "timeframe": "Q1 2025",
    "sources": ["tech blogs", "research papers", "startup funding data"]
  }
}
```

**Output:**
- Emerging trends (top 3-5)
- Confidence scores
- Supporting evidence
- Market implications
- Recommended actions

#### **Feedback Synthesizer**
```typescript
{
  "agentName": "feedback_synthesizer",
  "inputs": {
    "feedback_sources": ["user interviews", "support tickets", "app reviews"],
    "product_area": "onboarding flow",
    "priority_themes": ["usability", "performance", "features"]
  }
}
```

**Output:**
- Key insights
- Sentiment analysis
- Pain points ranked
- Feature requests with counts
- Priority recommendations

---

### **2. Marketing Domain** (7 agents)

#### **TikTok Strategist**
```typescript
{
  "agentName": "tiktok_strategist",
  "inputs": {
    "brand_context": "B2B SaaS productivity tool",
    "target_audience": "Gen Z professionals",
    "campaign_goals": "brand awareness and app downloads"
  }
}
```

**Output:**
- 5-7 viral content hooks
- Detailed video concepts
- Trending sounds to use
- Hashtag strategy
- Posting schedule
- Engagement tactics

#### **Instagram Curator**
```typescript
{
  "agentName": "instagram_curator",
  "inputs": {
    "brand_identity": "minimalist, professional, innovative",
    "content_pillars": ["product tips", "user stories", "behind the scenes"],
    "audience_demographics": "25-40, tech-savvy, urban"
  }
}
```

**Output:**
- Feed aesthetic guidelines
- 30-day content calendar
- Story series concepts
- Reel ideas
- Caption templates
- Grid layout strategy

#### **Twitter Engager**
```typescript
{
  "agentName": "twitter_engager",
  "inputs": {
    "brand_voice": "helpful, witty, authentic",
    "industry": "developer tools",
    "engagement_goals": "community building and product education"
  }
}
```

**Output:**
- Viral thread concepts
- Daily tweet ideas
- Reply strategies
- Trending opportunities
- Scheduling strategy

#### **Reddit Community Builder**
```typescript
{
  "agentName": "reddit_community_builder",
  "inputs": {
    "product_niche": "AI development tools",
    "target_subreddits": ["r/MachineLearning", "r/LocalLLaMA", "r/startups"],
    "community_goals": "establish thought leadership"
  }
}
```

**Output:**
- Subreddit-specific strategies
- Value-driven content ideas
- AMA preparation
- Comment engagement tactics
- Karma building strategy

#### **App Store Optimizer**
```typescript
{
  "agentName": "app_store_optimizer",
  "inputs": {
    "app_name": "TaskFlow Pro",
    "category": "Productivity",
    "current_keywords": ["task manager", "productivity", "todo"],
    "competitor_analysis": "Top 3 competitors have X, Y, Z"
  }
}
```

**Output:**
- Optimized app title (30 chars)
- Compelling subtitle
- High-value keyword strategy
- Conversion-optimized description
- Screenshot strategy
- Icon recommendations
- A/B test ideas

#### **Content Creator**
```typescript
{
  "agentName": "content_creator",
  "inputs": {
    "topic": "How AI is transforming remote work",
    "content_type": "blog post",
    "target_audience": "remote team managers",
    "brand_voice": "authoritative yet approachable"
  }
}
```

**Output:**
- Content outline
- Key messages
- Hook options
- Call to action
- SEO keywords
- Visual suggestions

#### **Growth Hacker**
```typescript
{
  "agentName": "growth_hacker",
  "inputs": {
    "product_stage": "early growth",
    "current_metrics": "1000 MAU, 5% activation, 20% retention",
    "growth_goal": "10x users in 6 months",
    "constraints": "limited budget, small team"
  }
}
```

**Output:**
- 5-7 high-impact experiments
- Viral loop mechanisms
- Acquisition channels ranked
- Activation optimization tactics
- Retention strategies
- Referral program design
- Quick wins

---

### **3. Design Domain** (3 agents)

#### **UI Designer**
```typescript
{
  "agentName": "ui_designer",
  "inputs": {
    "design_brief": "Mobile app for habit tracking",
    "platform": "iOS and Android",
    "user_needs": ["quick entry", "visual progress", "motivation"]
  }
}
```

**Output:**
- Design system components
- Layout structure
- Color palette (with accessibility)
- Typography scale
- Component library
- Interaction patterns
- Responsive strategy

#### **UX Researcher**
```typescript
{
  "agentName": "ux_researcher",
  "inputs": {
    "research_question": "Why do users abandon onboarding?",
    "user_segment": "new sign-ups (0-7 days)",
    "research_methods": ["user interviews", "usability tests", "analytics"]
  }
}
```

**Output:**
- Research plan
- Interview guide
- Survey questions
- Usability test scenarios
- Participant criteria
- Analysis framework
- Timeline

#### **Brand Guardian**
```typescript
{
  "agentName": "brand_guardian",
  "inputs": {
    "brand_guidelines": "https://brand.example.com/guidelines",
    "content_to_review": "Social media post draft",
    "channel": "LinkedIn"
  }
}
```

**Output:**
- Brand alignment score (0-100)
- Voice and tone assessment
- Visual compliance check
- Messaging consistency
- Improvement recommendations
- Flagged issues

---

### **4. Project Management Domain** (3 agents)

#### **Experiment Tracker**
```typescript
{
  "agentName": "experiment_tracker",
  "inputs": {
    "experiment_type": "A/B test",
    "hypothesis": "New onboarding flow increases activation by 15%",
    "current_status": "planning",
    "metrics": ["activation rate", "time to first action", "drop-off points"]
  }
}
```

**Output:**
- Experiment design
- Success criteria
- Required sample size
- Duration estimate
- Risk assessment
- Tracking setup
- Statistical method

#### **Project Shipper**
```typescript
{
  "agentName": "project_shipper",
  "inputs": {
    "project_name": "Mobile App V2",
    "current_stage": "testing",
    "blockers": ["API performance", "iOS review pending"],
    "deadline": "2025-02-15"
  }
}
```

**Output:**
- Launch readiness score (0-100)
- Critical path items
- Blocker resolution strategies
- Pre-launch checklist
- Rollout strategy
- Success metrics
- Contingency plans

#### **Studio Producer**
```typescript
{
  "agentName": "studio_producer",
  "inputs": {
    "project_scope": "Brand refresh campaign",
    "team_composition": ["2 designers", "1 copywriter", "1 PM"],
    "budget": "$50,000",
    "timeline": "8 weeks"
  }
}
```

**Output:**
- Project plan with phases
- Resource allocation
- Budget breakdown
- Risk register
- Communication cadence
- Quality gates
- Dependencies

---

### **5. Studio Operations Domain** (5 agents)

#### **Support Responder**
```typescript
{
  "agentName": "support_responder",
  "inputs": {
    "support_ticket": "Can't sync my data across devices",
    "customer_context": "Premium user, iOS + Windows",
    "knowledge_base": ["Sync troubleshooting guide", "Device compatibility"]
  }
}
```

**Output:**
- Complete support response
- Resolution steps
- Escalation needed? (boolean)
- Related articles
- Follow-up actions
- Customer sentiment
- Priority level

#### **Analytics Reporter**
```typescript
{
  "agentName": "analytics_reporter",
  "inputs": {
    "metrics_data": "January 2025 product metrics",
    "reporting_period": "monthly",
    "stakeholder_audience": "executive team"
  }
}
```

**Output:**
- Executive summary
- Key metrics with changes
- Trends identified
- Actionable insights
- Recommendations
- Anomalies
- Visualization suggestions

#### **Infrastructure Maintainer**
```typescript
{
  "agentName": "infrastructure_maintainer",
  "inputs": {
    "system_component": "API server cluster",
    "current_state": "running, 80% CPU usage",
    "monitoring_data": "response times, error rates, throughput"
  }
}
```

**Output:**
- Health assessment
- Performance bottlenecks
- Optimization opportunities
- Scaling recommendations
- Cost optimization
- Security concerns
- Maintenance schedule

#### **Legal Compliance Checker**
```typescript
{
  "agentName": "legal_compliance_checker",
  "inputs": {
    "document_content": "Terms of Service draft",
    "regulation_type": "GDPR",
    "jurisdiction": "European Union"
  }
}
```

**Output:**
- Compliance status
- Issues identified
- Regulatory requirements
- Risk level
- Remediation steps
- Required disclosures
- Expert review needed?

#### **Finance Tracker**
```typescript
{
  "agentName": "finance_tracker",
  "inputs": {
    "financial_data": "Q4 2024 financial report",
    "reporting_period": "quarterly",
    "budget_vs_actual": "10% over budget on marketing"
  }
}
```

**Output:**
- Financial health assessment
- Budget variance analysis
- Cash flow analysis
- Cost category breakdown
- Anomalies detected
- Forecasting
- Optimization opportunities

---

## 🚀 Usage Examples

### **Example 1: Complete Marketing Campaign**

```typescript
// 1. Research trends
const trends = await fetch('/api/ax-dspy/specialized-agents', {
  method: 'POST',
  body: JSON.stringify({
    agentName: 'trend_researcher',
    inputs: { industry: 'SaaS', timeframe: 'Q1 2025', sources: ['tech blogs'] }
  })
});

// 2. Create TikTok strategy
const tiktok = await fetch('/api/ax-dspy/specialized-agents', {
  method: 'POST',
  body: JSON.stringify({
    agentName: 'tiktok_strategist',
    inputs: { 
      brand_context: 'B2B productivity tool',
      target_audience: 'Gen Z professionals',
      campaign_goals: 'brand awareness'
    }
  })
});

// 3. Design Instagram content
const instagram = await fetch('/api/ax-dspy/specialized-agents', {
  method: 'POST',
  body: JSON.stringify({
    agentName: 'instagram_curator',
    inputs: {
      brand_identity: 'modern, professional',
      content_pillars: ['tips', 'stories', 'behind the scenes'],
      audience_demographics: '25-40, tech-savvy'
    }
  })
});

// 4. Create content
const content = await fetch('/api/ax-dspy/specialized-agents', {
  method: 'POST',
  body: JSON.stringify({
    agentName: 'content_creator',
    inputs: {
      topic: 'Productivity hacks for remote teams',
      content_type: 'blog post',
      target_audience: 'remote workers',
      brand_voice: 'helpful and inspiring'
    }
  })
});
```

### **Example 2: Product Launch Pipeline**

```typescript
// 1. Synthesize feedback
const feedback = await runAgent('feedback_synthesizer', {
  feedback_sources: ['beta testers', 'surveys'],
  product_area: 'new feature',
  priority_themes: ['usability', 'value']
});

// 2. Design UI
const ui = await runAgent('ui_designer', {
  design_brief: feedback.pain_points[0],
  platform: 'web',
  user_needs: feedback.key_insights
});

// 3. Track experiment
const experiment = await runAgent('experiment_tracker', {
  experiment_type: 'feature flag test',
  hypothesis: 'New UI increases engagement by 20%',
  current_status: 'running',
  metrics: ['engagement', 'conversion']
});

// 4. Ship project
const launch = await runAgent('project_shipper', {
  project_name: 'Feature X',
  current_stage: 'ready',
  blockers: [],
  deadline: '2025-02-01'
});
```

### **Example 3: Operations Dashboard**

```typescript
// Monitor all operations
const operations = await Promise.all([
  runAgent('support_responder', { /* support data */ }),
  runAgent('analytics_reporter', { /* metrics data */ }),
  runAgent('infrastructure_maintainer', { /* system data */ }),
  runAgent('finance_tracker', { /* financial data */ })
]);

// Generate comprehensive ops report
const opsReport = {
  support: operations[0],
  analytics: operations[1],
  infrastructure: operations[2],
  finance: operations[3]
};
```

---

## 🎯 Integration with Existing System

### **Add to Workflow Builder**

Update `frontend/app/workflow/page.tsx`:

```typescript
const SPECIALIZED_NODE_TYPES = [
  // Product
  { id: 'trend-research', label: 'Trend Researcher', apiEndpoint: '/api/ax-dspy/specialized-agents', config: { agentName: 'trend_researcher' } },
  { id: 'feedback-synthesis', label: 'Feedback Synthesizer', apiEndpoint: '/api/ax-dspy/specialized-agents', config: { agentName: 'feedback_synthesizer' } },
  
  // Marketing
  { id: 'tiktok-strategy', label: 'TikTok Strategist', apiEndpoint: '/api/ax-dspy/specialized-agents', config: { agentName: 'tiktok_strategist' } },
  { id: 'instagram-curator', label: 'Instagram Curator', apiEndpoint: '/api/ax-dspy/specialized-agents', config: { agentName: 'instagram_curator' } },
  // ... add all 20 agents
];
```

### **List All Agents**

```typescript
// Get all available specialized agents
const response = await fetch('/api/ax-dspy/specialized-agents');
const data = await response.json();

console.log(`Total agents: ${data.totalAgents}`);
console.log('By domain:', data.agentsByDomain);
```

---

## 📊 Agent Capabilities Matrix

| Domain | Agent | Use Case | Output Type | Avg Time |
|--------|-------|----------|-------------|----------|
| **Product** | Trend Researcher | Market intelligence | Insights + Evidence | 3-5s |
| | Feedback Synthesizer | User research | Prioritized insights | 2-4s |
| **Marketing** | TikTok Strategist | Social strategy | Content plan | 4-6s |
| | Instagram Curator | Visual strategy | Content calendar | 4-6s |
| | Twitter Engager | Community building | Engagement plan | 3-5s |
| | Reddit Builder | Community growth | Subreddit strategy | 4-6s |
| | ASO Optimizer | App discovery | Keywords + Copy | 3-5s |
| | Content Creator | Content production | Full content | 5-8s |
| | Growth Hacker | User acquisition | Experiment ideas | 4-6s |
| **Design** | UI Designer | Interface design | Design system | 5-7s |
| | UX Researcher | User research | Research plan | 4-6s |
| | Brand Guardian | Brand compliance | Alignment score | 2-3s |
| **PM** | Experiment Tracker | A/B testing | Test design | 3-5s |
| | Project Shipper | Launch management | Readiness checklist | 3-5s |
| | Studio Producer | Project planning | Project plan | 4-6s |
| **Operations** | Support Responder | Customer support | Response draft | 2-4s |
| | Analytics Reporter | Business intelligence | Insights report | 4-6s |
| | Infrastructure Maintainer | DevOps | Health assessment | 3-5s |
| | Legal Checker | Compliance | Risk analysis | 4-6s |
| | Finance Tracker | Financial analysis | Financial insights | 3-5s |

---

## 🎉 Benefits

- ✅ **20 specialized agents** for 5 domains
- ✅ **Production-ready** DSPy signatures
- ✅ **Type-safe** inputs and outputs
- ✅ **Composable** - chain agents together
- ✅ **Cost-effective** - uses Ollama by default
- ✅ **Extensible** - easy to add more agents

---

## 🚀 Next Steps

1. **Try the agents**: Test with your use cases
2. **Create workflows**: Combine agents for complex tasks
3. **Train LoRA adapters**: Fine-tune for your domains
4. **Monitor performance**: Use the monitoring dashboard
5. **Extend**: Add your own specialized agents

Your system now has 60+ total agents (40 existing + 20 new)! 🎉

