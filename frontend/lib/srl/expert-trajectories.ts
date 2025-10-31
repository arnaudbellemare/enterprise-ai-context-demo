/**
 * Expert Trajectories for SRL Training
 * 
 * Pre-defined expert trajectories for common domains.
 * In production, these would be loaded from a database or file system.
 */

import { ExpertTrajectory } from './swirl-srl-enhancer';

export const EXPERT_TRAJECTORIES: ExpertTrajectory[] = [
  // Financial Multi-Step Reasoning
  {
    query: 'Calculate Bitcoin ROI 2020-2024 vs S&P 500, adjust for inflation, and explain which was better for a tax-advantaged account.',
    domain: 'financial',
    steps: [
      {
        stepNumber: 1,
        internalReasoning: 'First, I need to retrieve Bitcoin price data from 2020 and 2024 to calculate ROI. This requires historical price data.',
        action: 'Retrieve Bitcoin price data for 2020 and 2024',
        tool: 'web_search',
        expectedResult: 'Bitcoin prices: 2020 start ~$7,200, 2024 end ~$43,000',
        actionType: 'retrieve'
      },
      {
        stepNumber: 2,
        internalReasoning: 'Now I need S&P 500 data for the same period to compare. This will show traditional market performance.',
        action: 'Retrieve S&P 500 index data for 2020-2024',
        tool: 'web_search',
        expectedResult: 'S&P 500: 2020 start ~3,200, 2024 end ~4,800',
        actionType: 'retrieve'
      },
      {
        stepNumber: 3,
        internalReasoning: 'Calculate ROI for both investments. ROI = (End - Start) / Start * 100%. Need to compute this for Bitcoin and S&P 500.',
        action: 'Calculate Bitcoin ROI and S&P 500 ROI',
        tool: 'calculator',
        expectedResult: 'Bitcoin ROI: ~497%, S&P 500 ROI: ~50%',
        actionType: 'calculate'
      },
      {
        stepNumber: 4,
        internalReasoning: 'Adjust both ROIs for inflation. Need to account for purchasing power loss over 4 years.',
        action: 'Adjust ROIs for inflation (approx 3-4% annual)',
        tool: 'calculator',
        expectedResult: 'Real ROI after inflation adjustment',
        actionType: 'calculate'
      },
      {
        stepNumber: 5,
        internalReasoning: 'Consider tax implications. Tax-advantaged accounts (IRA, 401k) defer or eliminate capital gains taxes.',
        action: 'Analyze tax implications for tax-advantaged accounts',
        actionType: 'analyze',
        expectedResult: 'Tax advantage analysis'
      },
      {
        stepNumber: 6,
        internalReasoning: 'Synthesize all information to provide final recommendation with reasoning.',
        action: 'Synthesize comparison and provide recommendation',
        actionType: 'synthesize',
        expectedResult: 'Final answer with recommendation'
      }
    ],
    finalAnswer: 'Bitcoin showed ~497% ROI vs S&P 500\'s ~50% over 2020-2024. After inflation adjustment, Bitcoin remains significantly higher. For tax-advantaged accounts, both avoid capital gains taxes, making Bitcoin\'s higher return more attractive, but with much higher volatility risk.',
    quality: 0.9
  },

  // Legal Multi-Step Reasoning
  {
    query: 'Analyze the legal implications of a non-compete clause in an employment contract where the employee works remotely from California but the company is based in New York.',
    domain: 'legal',
    steps: [
      {
        stepNumber: 1,
        internalReasoning: 'First, I need to identify the relevant jurisdictions. California has specific non-compete laws that differ from New York.',
        action: 'Identify applicable jurisdictions and their non-compete laws',
        actionType: 'retrieve',
        expectedResult: 'California: Non-competes generally unenforceable; New York: More permissive but limited'
      },
      {
        stepNumber: 2,
        internalReasoning: 'Determine which state\'s laws apply. Typically the state where work is performed (California in this case).',
        action: 'Determine choice of law for remote worker',
        actionType: 'analyze',
        expectedResult: 'California law likely applies due to work location'
      },
      {
        stepNumber: 3,
        internalReasoning: 'Analyze enforceability under California law. California Business and Professions Code Section 16600 generally voids non-competes.',
        action: 'Analyze enforceability under California law',
        actionType: 'analyze',
        expectedResult: 'Non-compete likely unenforceable under California law'
      },
      {
        stepNumber: 4,
        internalReasoning: 'Consider exceptions and edge cases (e.g., sale of business, trade secrets).',
        action: 'Evaluate exceptions and edge cases',
        actionType: 'analyze',
        expectedResult: 'Limited exceptions may apply'
      }
    ],
    finalAnswer: 'Under California law (which likely applies since work is performed in California), non-compete clauses are generally unenforceable per Business and Professions Code Section 16600, except for limited exceptions like sale of business. The New York company cannot enforce a non-compete against a California remote worker unless specific exceptions apply.',
    quality: 0.85
  }
];

/**
 * Load expert trajectories for a domain
 */
export async function loadExpertTrajectories(domain: string): Promise<ExpertTrajectory[]> {
  return EXPERT_TRAJECTORIES.filter(t => t.domain === domain);
}


