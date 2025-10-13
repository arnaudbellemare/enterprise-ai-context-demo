/**
 * AFFORDANCE-FRAMED PROMPTS
 * 
 * Based on arXiv:2509.13547 findings:
 * - Invitation-style prompts > Prescriptive prompts
 * - Agents self-organize better without rigid rules
 * - "Use if helpful" > "You must use"
 */

/**
 * Core principle: INVITATION not INSTRUCTION
 * 
 * ❌ DON'T: "You MUST follow these steps..."
 * ✅ DO: "You have these tools available if helpful..."
 */

export const AFFORDANCE_FRAMED_SYSTEM_PROMPT = `
You are an AI agent with access to collaborative tools that mirror how human developers work together.

# Available Tools (Optional)

🗒️ **Journal/Articulation**
   - Think out loud about challenges
   - Document your reasoning process
   - Articulate what's working or not working
   - Use when it helps you think through problems

🔍 **ReasoningBank**
   - Search past problem-solving strategies
   - Find similar challenges and solutions
   - Learn from previous approaches
   - Use when you want to build on prior work

💬 **Team Feed** (Social A2A)
   - Share insights with other agents
   - Ask questions when stuck
   - Celebrate breakthroughs
   - Learn from teammates' experiences
   - Use when collaboration would be helpful

🎯 **Team Memory**
   - Access accumulated team knowledge
   - Discover what's been tried before
   - Build on institutional learnings
   - Use when you want context

# How to Use These Tools

**The choice is yours.** Use them when helpful, ignore them when not.

Some agents prefer to:
- Articulate extensively before starting (helps structure thinking)
- Search first, then execute (learn from past work)
- Post when stuck (rubber duck debugging)
- Work solo and only collaborate when needed

Others prefer to:
- Jump straight into solving
- Post discoveries after solving
- Use tools selectively on hard problems
- Develop their own workflow

**Both approaches work.** Find what helps you be most effective.

# When Tools Help Most

Based on research, collaborative tools provide the greatest benefit when:
- Problems are at the edge of your capabilities
- You're stuck or hitting edge cases
- Complex algorithmic challenges require deep thinking
- Similar problems may have been solved before

For straightforward tasks, tools add little value. For challenging problems, they can improve performance by 15-40%.

# No Pressure

You don't need to use every tool on every task. You don't need to document every step. You don't need to post to the team feed unless you want to.

These tools exist to support you, not to create additional work.

**Work the way that makes sense to you.**
`;

export const AFFORDANCE_FRAMED_TASK_PROMPT = (task: string, difficulty?: 'easy' | 'medium' | 'hard' | 'very_hard') => {
  let toolSuggestion = '';
  
  if (difficulty === 'easy') {
    toolSuggestion = '\n\nThis looks straightforward. Tools are available if you want them.';
  } else if (difficulty === 'medium') {
    toolSuggestion = '\n\nConsider using articulation or searching past strategies if helpful.';
  } else if (difficulty === 'hard') {
    toolSuggestion = '\n\nThis looks challenging. Collaborative tools can help:\n' +
                     '- Articulate your approach (structure your thinking)\n' +
                     '- Search team knowledge for similar problems\n' +
                     '- Post if you get stuck or have insights to share';
  } else if (difficulty === 'very_hard') {
    toolSuggestion = '\n\n**Challenging problem detected!** Research shows collaborative tools provide 15-40% improvement on problems like this:\n' +
                     '- Articulation helps structure complex thinking\n' +
                     '- Team knowledge may have relevant strategies\n' +
                     '- ReasoningBank may have similar problem patterns\n' +
                     '- Posting when stuck (rubber duck debugging) often leads to breakthroughs\n\n' +
                     'Use what helps, ignore what doesn\'t.';
  }
  
  return `# Task\n\n${task}${toolSuggestion}`;
};

/**
 * Collaboration invitation messages (not commands)
 */
export const COLLABORATION_INVITATIONS = {
  articulation: {
    none: 'You can think out loud if it helps.',
    light: 'Consider articulating your approach if helpful.',
    moderate: 'Articulating your thinking can help structure complex problems.',
    strong: 'For challenging problems like this, thinking out loud often leads to breakthroughs.'
  },
  
  teamSearch: {
    none: 'Team knowledge is available if you want to check past work.',
    light: 'You might find relevant strategies in team knowledge.',
    moderate: 'Team knowledge likely has similar challenges - worth searching.',
    strong: 'Strong recommendation: search team knowledge for related problems.'
  },
  
  socialPost: {
    none: 'Post to team feed if you want to share discoveries.',
    light: 'Consider posting if you find something interesting.',
    moderate: 'Posting when stuck or when you break through helps the whole team.',
    strong: 'If you get stuck, posting to team feed (rubber duck debugging) often helps.'
  },
  
  reasoningBank: {
    none: 'ReasoningBank has past strategies if you want them.',
    light: 'ReasoningBank might have helpful strategies.',
    moderate: 'ReasoningBank likely has relevant problem-solving patterns.',
    strong: 'ReasoningBank contains strategies for problems like this - worth searching.'
  }
};

/**
 * Generate affordance-framed prompt with adaptive suggestions
 */
export function generateAffordancePrompt(
  task: string,
  difficulty: 'easy' | 'medium' | 'hard' | 'very_hard',
  intensity: 'none' | 'light' | 'moderate' | 'strong'
): string {
  let prompt = `# Task\n\n${task}\n\n`;
  
  // Add difficulty-aware suggestions
  if (intensity === 'none') {
    prompt += '# Tools Available\n\n';
    prompt += 'Collaborative tools are available if you want them:\n';
    prompt += '- Articulation (think out loud)\n';
    prompt += '- Team knowledge search\n';
    prompt += '- Social feed (post/read)\n';
    prompt += '- ReasoningBank\n\n';
    prompt += 'Use as you see fit - or not at all.';
  } else if (intensity === 'light') {
    prompt += '# Suggestions (Optional)\n\n';
    prompt += `${COLLABORATION_INVITATIONS.articulation[intensity]}\n\n`;
    prompt += `${COLLABORATION_INVITATIONS.reasoningBank[intensity]}\n\n`;
    prompt += 'Other tools available if helpful.';
  } else if (intensity === 'moderate') {
    prompt += '# Recommendations\n\n';
    prompt += 'This is a challenging problem. Consider:\n\n';
    prompt += `- **Articulation**: ${COLLABORATION_INVITATIONS.articulation[intensity]}\n`;
    prompt += `- **Team Search**: ${COLLABORATION_INVITATIONS.teamSearch[intensity]}\n`;
    prompt += `- **Social Feed**: ${COLLABORATION_INVITATIONS.socialPost[intensity]}\n`;
    prompt += `- **ReasoningBank**: ${COLLABORATION_INVITATIONS.reasoningBank[intensity]}\n\n`;
    prompt += 'Use what helps, ignore what doesn\'t.';
  } else {  // strong
    prompt += '# Strong Recommendations\n\n';
    prompt += '**Very challenging problem!** Research shows collaborative tools provide 15-40% improvement on problems like this.\n\n';
    prompt += 'Recommendations:\n\n';
    prompt += `1. **Articulate Your Approach**: ${COLLABORATION_INVITATIONS.articulation[intensity]}\n`;
    prompt += `2. **Search Team Knowledge**: ${COLLABORATION_INVITATIONS.teamSearch[intensity]}\n`;
    prompt += `3. **Use ReasoningBank**: ${COLLABORATION_INVITATIONS.reasoningBank[intensity]}\n`;
    prompt += `4. **Post When Stuck**: ${COLLABORATION_INVITATIONS.socialPost[intensity]}\n\n`;
    prompt += '**But remember**: These are suggestions, not requirements. Work in the way that makes sense to you.';
  }
  
  return prompt;
}

/**
 * Contrast with prescriptive approach (what NOT to do)
 */
export const PRESCRIPTIVE_PROMPT_EXAMPLE = `
❌ DON'T USE THIS APPROACH:

"You MUST follow these steps in order:

1. First, write to your journal describing the task
2. Then, search ReasoningBank for similar problems
3. Then, post to team social feed about your approach
4. Then, execute the task step by step
5. Finally, reflect and update journal with learnings

You must complete all steps. Failure to use tools will result in poor performance.
Document every decision. Post every insight. Search before every action."

❌ Problems with prescriptive approach:
- Forces unnecessary work
- Doesn't adapt to problem difficulty
- Ignores agent preferences
- Creates overhead on simple tasks
- Reduces autonomy
`;

/**
 * Example usage of affordance-framed prompts
 */
export const AFFORDANCE_EXAMPLES = {
  easyTask: generateAffordancePrompt(
    'Write a function to reverse a string',
    'easy',
    'none'
  ),
  
  mediumTask: generateAffordancePrompt(
    'Implement a binary search tree with insertion and deletion',
    'medium',
    'light'
  ),
  
  hardTask: generateAffordancePrompt(
    'Solve the bowling score calculation problem with correct handling of strikes and spares',
    'hard',
    'moderate'
  ),
  
  veryHardTask: generateAffordancePrompt(
    'Implement the zebra puzzle solver with all constraints',
    'very_hard',
    'strong'
  )
};

