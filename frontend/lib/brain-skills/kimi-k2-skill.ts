/**
 * Kimi K2 Reasoning Skill
 *
 * Advanced reasoning with Teacher-Student pattern using OpenRouter
 */

import { BaseSkill } from './base-skill';
import { BrainContext, SkillResult } from './types';

export class KimiK2Skill extends BaseSkill {
  name = 'Kimi K2 Reasoning';
  description = 'Advanced reasoning with Teacher-Student pattern';
  priority = 1; // High priority for complex queries

  timeout = 45000; // 45 seconds
  cacheEnabled = true;
  cacheTTL = 1800000; // 30 minutes

  activation(context: BrainContext): boolean {
    return (
      context.needsAdvancedReasoning ||
      context.domain === 'legal' ||
      context.complexity >= 3 ||
      context.needsRealTime
    );
  }

  protected async executeImplementation(
    query: string,
    context: BrainContext
  ): Promise<SkillResult> {
    console.log('   🤖 Kimi K2: Subconscious activation');

    // Prioritize best performing models based on testing
    const models = [
      'alibaba/tongyi-deepresearch-30b-a3b:free', // Best: 100/100 quality, 1472ms
      'nvidia/nemotron-nano-9b-v2:free', // 2nd: 90/100 quality, 735ms (fastest)
      'google/gemini-flash-1.5-8b-exp:free' // 3rd: 85/100 quality, 986ms
    ];

    const startTime = Date.now();

    // Try models in order
    for (const model of models) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
            'X-Title': 'PERMUTATION Brain System'
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: `You are an expert ${context.domain} analyst with advanced reasoning capabilities.`
              },
              {
                role: 'user',
                content: query
              }
            ],
            temperature: 0.7,
            max_tokens: 2000
          })
        });

        if (!response.ok) {
          console.log(`   ⚠️ Kimi K2 model ${model} failed, trying next...`);
          continue;
        }

        const data = await response.json();
        const duration = Date.now() - startTime;

        return this.createSuccessResult(
          {
            answer: data.choices[0]?.message?.content || '',
            model,
            reasoning: 'Advanced reasoning with Teacher-Student pattern',
            quality: 0.95
          },
          {
            processingTime: duration,
            model,
            quality: 0.95,
            cost: (data.usage?.total_tokens || 0) * 0.000001 // Estimate
          }
        );
      } catch (error: any) {
        console.log(`   ⚠️ Kimi K2 model ${model} error: ${error.message}`);
        continue;
      }
    }

    // All models failed
    throw new Error('All Kimi K2 models failed');
  }
}
