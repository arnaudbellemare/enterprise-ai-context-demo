/**
 * Specialized Domain Agents
 * Extended agent library for Product, Marketing, Design, PM, and Operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { ai, ax } from '@ax-llm/ax';

// ============================================================================
// PRODUCT DOMAIN AGENTS
// ============================================================================

const PRODUCT_AGENTS = {
  trend_researcher: `
    industry:string,
    timeframe:string,
    sources:string[] ->
    emerging_trends:string[] "Top 3-5 emerging trends identified",
    trend_confidence:number[] "Confidence scores (0-100) for each trend",
    supporting_evidence:string[] "Evidence and data points for each trend",
    market_implications:string "Business implications and opportunities",
    recommended_actions:string[] "Actionable next steps based on trends",
    trend_timeline:string "Expected evolution timeline"
  `,

  feedback_synthesizer: `
    feedback_sources:string[],
    product_area:string,
    priority_themes:string[] ->
    key_insights:string[] "Top insights from feedback synthesis",
    sentiment_analysis:class "positive, neutral, negative, mixed" "Overall sentiment",
    pain_points:string[] "Critical user pain points ranked by frequency",
    feature_requests:string[] "Most requested features with counts",
    user_segments:string[] "Different user segments identified",
    priority_recommendations:string[] "Prioritized recommendations for product team",
    urgency_level:class "critical, high, medium, low" "Overall urgency"
  `
};

// ============================================================================
// MARKETING DOMAIN AGENTS
// ============================================================================

const MARKETING_AGENTS = {
  tiktok_strategist: `
    brand_context:string,
    target_audience:string,
    campaign_goals:string ->
    content_hooks:string[] "5-7 viral content hooks",
    video_concepts:string[] "Detailed TikTok video concepts",
    trending_sounds:string[] "Recommended trending sounds/audio",
    hashtag_strategy:string[] "Optimal hashtag combinations",
    posting_schedule:string "Best times to post for target audience",
    engagement_tactics:string[] "Tactics to boost engagement rate",
    influencer_collab_ideas:string[] "Potential influencer collaboration concepts"
  `,

  instagram_curator: `
    brand_identity:string,
    content_pillars:string[],
    audience_demographics:string ->
    feed_aesthetic:string "Overall feed aesthetic and visual direction",
    content_calendar:string[] "30-day content calendar with themes",
    story_series:string[] "Instagram Story series concepts",
    reel_ideas:string[] "5-7 high-engagement Reel concepts",
    caption_templates:string[] "Engagement-optimized caption templates",
    grid_layout:string "Recommended grid layout strategy",
    growth_tactics:string[] "Organic growth strategies"
  `,

  twitter_engager: `
    brand_voice:string,
    industry:string,
    engagement_goals:string ->
    tweet_threads:string[] "3-5 viral thread concepts",
    daily_tweets:string[] "10 tweet ideas for the week",
    reply_strategies:string[] "Community engagement strategies",
    trending_opportunities:string[] "Current trending topics to leverage",
    scheduling_strategy:string "Optimal posting times and frequency",
    hashtag_recommendations:string[] "Relevant hashtags for visibility",
    influencer_targets:string[] "Accounts to engage with for growth"
  `,

  reddit_community_builder: `
    product_niche:string,
    target_subreddits:string[],
    community_goals:string ->
    subreddit_strategy:string[] "Strategies for each target subreddit",
    content_ideas:string[] "Value-driven post ideas (non-promotional)",
    ama_preparation:string[] "AMA (Ask Me Anything) preparation guide",
    comment_engagement:string[] "Community engagement tactics",
    karma_building:string "Strategy to build community trust",
    red_flags:string[] "Things to avoid in each community",
    long_term_plan:string "6-month community building roadmap"
  `,

  app_store_optimizer: `
    app_name:string,
    category:string,
    current_keywords:string[],
    competitor_analysis:string ->
    optimized_title:string "ASO-optimized app title (30 chars)",
    subtitle:string "Compelling subtitle for visibility",
    keyword_strategy:string[] "High-value keywords ranked by priority",
    description:string "Conversion-optimized app description",
    screenshot_strategy:string[] "Screenshot sequence and messaging",
    icon_recommendations:string "App icon design recommendations",
    a_b_test_ideas:string[] "Elements to A/B test for optimization",
    competitor_gaps:string[] "Opportunities competitors are missing"
  `,

  content_creator: `
    topic:string,
    content_type:string,
    target_audience:string,
    brand_voice:string ->
    content_outline:string[] "Detailed content structure",
    key_messages:string[] "Core messages to convey",
    hook_options:string[] "3-5 attention-grabbing hooks",
    call_to_action:string "Strong CTA for desired outcome",
    seo_keywords:string[] "Keywords to incorporate naturally",
    visual_suggestions:string[] "Recommended visuals/media",
    distribution_channels:string[] "Optimal channels for this content"
  `,

  growth_hacker: `
    product_stage:string,
    current_metrics:string,
    growth_goal:string,
    constraints:string ->
    growth_experiments:string[] "5-7 high-impact experiments to run",
    viral_loops:string[] "Potential viral loop mechanisms",
    acquisition_channels:string[] "Prioritized acquisition channels",
    activation_optimization:string[] "Tactics to improve user activation",
    retention_strategies:string[] "Retention and re-engagement tactics",
    referral_program:string "Referral/invite program design",
    metrics_to_track:string[] "Key metrics for each growth lever",
    quick_wins:string[] "Immediate actions with high ROI"
  `
};

// ============================================================================
// DESIGN DOMAIN AGENTS
// ============================================================================

const DESIGN_AGENTS = {
  ui_designer: `
    design_brief:string,
    platform:string,
    user_needs:string[] ->
    design_system:string[] "Core design system components",
    layout_structure:string "Recommended layout and hierarchy",
    color_palette:string[] "Color scheme with accessibility notes",
    typography:string[] "Font selections and sizing scale",
    component_library:string[] "Key UI components needed",
    interaction_patterns:string[] "Interaction and animation guidelines",
    responsive_strategy:string "Mobile/tablet/desktop considerations",
    accessibility_checklist:string[] "WCAG compliance requirements"
  `,

  ux_researcher: `
    research_question:string,
    user_segment:string,
    research_methods:string[] ->
    research_plan:string "Detailed research methodology",
    interview_guide:string[] "Interview questions by theme",
    survey_questions:string[] "Validated survey questions",
    usability_test_scenarios:string[] "Task scenarios for usability testing",
    participant_criteria:string "Recruitment criteria for participants",
    analysis_framework:string "Framework for analyzing findings",
    expected_insights:string[] "Hypotheses to validate/invalidate",
    timeline:string "Research timeline and milestones"
  `,

  brand_guardian: `
    brand_guidelines:string,
    content_to_review:string,
    channel:string ->
    brand_alignment_score:number "Alignment score (0-100)",
    voice_and_tone_assessment:string "Voice and tone analysis",
    visual_compliance:string[] "Visual brand compliance check",
    messaging_consistency:string "Consistency with brand messaging",
    recommendations:string[] "Specific improvement recommendations",
    approved_elements:string[] "Elements that align well with brand",
    flagged_issues:string[] "Issues requiring revision",
    alternative_suggestions:string[] "Brand-aligned alternatives"
  `
};

// ============================================================================
// PROJECT MANAGEMENT DOMAIN AGENTS
// ============================================================================

const PROJECT_MANAGEMENT_AGENTS = {
  experiment_tracker: `
    experiment_type:string,
    hypothesis:string,
    current_status:string,
    metrics:string[] ->
    experiment_design:string "Detailed experimental design",
    success_criteria:string[] "Measurable success criteria",
    sample_size:number "Required sample size for significance",
    duration_estimate:number "Recommended test duration (days)",
    risk_assessment:string[] "Potential risks and mitigation",
    tracking_setup:string[] "Analytics and tracking requirements",
    statistical_method:string "Statistical analysis method to use",
    next_actions:string[] "Immediate next steps"
  `,

  project_shipper: `
    project_name:string,
    current_stage:string,
    blockers:string[],
    deadline:string ->
    launch_readiness:number "Launch readiness score (0-100)",
    critical_path:string[] "Critical path items to completion",
    blocker_resolution:string[] "Strategies to resolve each blocker",
    pre_launch_checklist:string[] "Complete pre-launch checklist",
    rollout_strategy:string "Recommended rollout approach",
    success_metrics:string[] "Key metrics to track post-launch",
    contingency_plan:string[] "Backup plans if issues arise",
    communication_plan:string "Stakeholder communication strategy"
  `,

  studio_producer: `
    project_scope:string,
    team_composition:string[],
    budget:string,
    timeline:string ->
    project_plan:string[] "Detailed project phases and milestones",
    resource_allocation:string[] "Team member assignments",
    budget_breakdown:string[] "Budget allocation by category",
    risk_register:string[] "Project risks and mitigation plans",
    communication_cadence:string "Meeting and update schedule",
    quality_gates:string[] "Quality checkpoints and criteria",
    dependencies:string[] "Critical dependencies to manage",
    escalation_process:string "Issue escalation procedures"
  `
};

// ============================================================================
// STUDIO OPERATIONS DOMAIN AGENTS
// ============================================================================

const OPERATIONS_AGENTS = {
  support_responder: `
    support_ticket:string,
    customer_context:string,
    knowledge_base:string[] ->
    response_draft:string "Complete, empathetic support response",
    resolution_steps:string[] "Step-by-step resolution instructions",
    escalation_needed:boolean "Whether to escalate to human agent",
    related_articles:string[] "Helpful knowledge base articles",
    follow_up_actions:string[] "Required follow-up actions",
    customer_sentiment:class "satisfied, neutral, frustrated, angry" "Customer sentiment",
    estimated_resolution_time:string "Expected time to resolve",
    priority_level:class "critical, high, medium, low" "Support priority"
  `,

  analytics_reporter: `
    metrics_data:string,
    reporting_period:string,
    stakeholder_audience:string ->
    executive_summary:string "High-level insights for executives",
    key_metrics:string[] "Top metrics with period-over-period changes",
    trends_identified:string[] "Significant trends and patterns",
    insights:string[] "Actionable insights from the data",
    recommendations:string[] "Data-driven recommendations",
    anomalies:string[] "Unusual patterns requiring attention",
    visualization_suggestions:string[] "Recommended charts and graphs",
    next_period_forecast:string "Predictions for next period"
  `,

  infrastructure_maintainer: `
    system_component:string,
    current_state:string,
    monitoring_data:string ->
    health_assessment:string "Overall system health evaluation",
    performance_bottlenecks:string[] "Identified performance issues",
    optimization_opportunities:string[] "Infrastructure optimization suggestions",
    scaling_recommendations:string[] "Scaling strategies for growth",
    cost_optimization:string[] "Cost reduction opportunities",
    security_concerns:string[] "Security issues to address",
    maintenance_schedule:string "Recommended maintenance tasks",
    upgrade_priorities:string[] "Prioritized upgrade roadmap"
  `,

  legal_compliance_checker: `
    document_content:string,
    regulation_type:string,
    jurisdiction:string ->
    compliance_status:class "compliant, needs_review, non_compliant" "Overall status",
    issues_identified:string[] "Specific compliance issues found",
    regulatory_requirements:string[] "Applicable regulations",
    risk_level:class "critical, high, medium, low" "Overall risk level",
    remediation_steps:string[] "Steps to achieve compliance",
    required_disclosures:string[] "Necessary legal disclosures",
    expert_review_needed:boolean "Whether legal expert review required",
    documentation_needs:string[] "Additional documentation required"
  `,

  finance_tracker: `
    financial_data:string,
    reporting_period:string,
    budget_vs_actual:string ->
    financial_health:string "Overall financial health assessment",
    budget_variance:string[] "Significant variances explained",
    cash_flow_analysis:string "Cash flow trends and projections",
    cost_categories:string[] "Breakdown by cost category",
    anomalies_detected:string[] "Unusual transactions or patterns",
    forecasting:string "Financial forecast for next period",
    optimization_opportunities:string[] "Cost optimization suggestions",
    action_items:string[] "Financial action items for leadership"
  `
};

// Combine all agent signatures
const ALL_SPECIALIZED_AGENTS = {
  ...PRODUCT_AGENTS,
  ...MARKETING_AGENTS,
  ...DESIGN_AGENTS,
  ...PROJECT_MANAGEMENT_AGENTS,
  ...OPERATIONS_AGENTS
};

/**
 * POST: Execute specialized agent
 */
export async function POST(req: NextRequest) {
  try {
    const { agentName, inputs, provider = 'ollama' } = await req.json();

    if (!agentName || !inputs) {
      return NextResponse.json(
        { error: 'agentName and inputs are required', success: false },
        { status: 400 }
      );
    }

    // Get agent signature
    const signature = ALL_SPECIALIZED_AGENTS[agentName as keyof typeof ALL_SPECIALIZED_AGENTS];
    if (!signature) {
      return NextResponse.json(
        { 
          error: `Agent "${agentName}" not found`,
          availableAgents: Object.keys(ALL_SPECIALIZED_AGENTS),
          success: false
        },
        { status: 404 }
      );
    }

    // Initialize LLM
    const llm = ai({
      name: provider,
      model: provider === 'ollama' ? 'gemma3:4b' : 'gpt-4o-mini',
      url: provider === 'ollama' ? 'http://localhost:11434' : undefined,
      apiKey: provider === 'ollama' ? 'ollama' : process.env.OPENAI_API_KEY
    });

    // Create and execute agent
    const startTime = Date.now();
    const agent = ax(signature);
    
    console.log(`🤖 Executing specialized agent: ${agentName}`);
    console.log(`📝 Inputs:`, JSON.stringify(inputs, null, 2));
    
    const result = await agent.forward(llm, inputs);
    const executionTime = Date.now() - startTime;
    
    console.log(`✅ Agent completed in ${executionTime}ms`);

    return NextResponse.json({
      success: true,
      agentName,
      domain: getDomain(agentName),
      outputs: result,
      executionTime,
      provider,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Specialized agent error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Agent execution failed',
        success: false,
        details: error.stack
      },
      { status: 500 }
    );
  }
}

/**
 * GET: List all specialized agents
 */
export async function GET() {
  const agents = Object.entries(ALL_SPECIALIZED_AGENTS).map(([name, signature]) => ({
    name,
    domain: getDomain(name),
    signature: signature.trim(),
    description: getAgentDescription(name)
  }));

  // Group by domain
  const byDomain = {
    product: agents.filter(a => a.domain === 'product'),
    marketing: agents.filter(a => a.domain === 'marketing'),
    design: agents.filter(a => a.domain === 'design'),
    project_management: agents.filter(a => a.domain === 'project_management'),
    operations: agents.filter(a => a.domain === 'operations')
  };

  return NextResponse.json({
    success: true,
    totalAgents: agents.length,
    agentsByDomain: byDomain,
    allAgents: agents,
    framework: 'ax-llm (DSPy)'
  });
}

// Helper functions
function getDomain(agentName: string): string {
  if (agentName in PRODUCT_AGENTS) return 'product';
  if (agentName in MARKETING_AGENTS) return 'marketing';
  if (agentName in DESIGN_AGENTS) return 'design';
  if (agentName in PROJECT_MANAGEMENT_AGENTS) return 'project_management';
  if (agentName in OPERATIONS_AGENTS) return 'operations';
  return 'unknown';
}

function getAgentDescription(agentName: string): string {
  const descriptions: Record<string, string> = {
    trend_researcher: 'Research and analyze emerging industry trends',
    feedback_synthesizer: 'Synthesize user feedback into actionable insights',
    tiktok_strategist: 'Create viral TikTok content strategies',
    instagram_curator: 'Design Instagram content and aesthetic strategy',
    twitter_engager: 'Build Twitter presence and engagement',
    reddit_community_builder: 'Grow and engage Reddit communities',
    app_store_optimizer: 'Optimize app store listings for discovery',
    content_creator: 'Generate high-quality content for any platform',
    growth_hacker: 'Design and execute growth experiments',
    ui_designer: 'Create user interface designs and systems',
    ux_researcher: 'Conduct UX research and analysis',
    brand_guardian: 'Ensure brand consistency across channels',
    experiment_tracker: 'Design and track product experiments',
    project_shipper: 'Ship projects on time and on budget',
    studio_producer: 'Manage studio projects and resources',
    support_responder: 'Handle customer support tickets',
    analytics_reporter: 'Generate insights from analytics data',
    infrastructure_maintainer: 'Maintain and optimize infrastructure',
    legal_compliance_checker: 'Check legal compliance and risks',
    finance_tracker: 'Track and analyze financial data'
  };
  
  return descriptions[agentName] || 'Specialized domain agent';
}

export const runtime = 'nodejs';
export const maxDuration = 60;

