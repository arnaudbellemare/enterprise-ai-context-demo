import { createClient } from '@supabase/supabase-js';

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const docs = [
    {
      content: 'Scheduled Personal Property coverage provides open-perils protection for high-value jewelry. Loss settlement is typically at the least of: (1) cost to repair, (2) cost to replace, or (3) the amount of insurance (scheduled limit). Agreed value endorsements may stipulate a fixed payout at the agreed amount.',
      metadata: { domain: 'insurance', topic: 'scheduled_personal_property', jurisdiction: 'US' }
    },
    {
      content: 'Agreed Value Endorsement (Fine Arts): Insurer agrees to pay the agreed value shown for each item in the schedule in the event of a covered total loss. Partial losses are settled at the cost to restore the property to its condition immediately before the loss.',
      metadata: { domain: 'insurance', topic: 'agreed_value', product: 'fine_arts' }
    },
    {
      content: 'Exclusions: Wear and tear, gradual deterioration, inherent vice, marring or scratching. Loss caused by repairing, restoration, or retouching is excluded unless resulting fire or explosion ensues. Mysterious disappearance may be covered only if specifically included.',
      metadata: { domain: 'insurance', topic: 'exclusions' }
    },
    {
      content: 'Cartier Art Deco bracelet, circa 1930s, platinum with natural diamonds. Provenance increases insurable interest and may warrant appraisal updates. For premium calculation, insurers consider replacement cost, scarcity, and market volatility. Risk management includes secure storage and periodic inspections.',
      metadata: { domain: 'valuation', topic: 'art_deco_cartier', category: 'jewelry' }
    },
    {
      content: 'Policy Language: This policy pays for direct physical loss to covered property caused by a peril not otherwise excluded. For items on the schedule, the most we will pay is the amount shown for that item unless an agreed value endorsement applies.',
      metadata: { domain: 'insurance', topic: 'policy_language' }
    },
    {
      content: 'Appraisal Standards: USPAP-compliant jewelry appraisals should note maker (Cartier), period (Art Deco), materials (platinum, natural diamonds), craftsmanship, condition, provenance, and comparable sales. Insurers rely on current appraisals for underwriting and claim settlement.',
      metadata: { domain: 'valuation', topic: 'appraisal_standards' }
    }
  ];

  const { error } = await supabase.from('documents').insert(docs);
  if (error) {
    console.error('Insert failed:', error);
    process.exit(1);
  }

  console.log('Seeded legal/insurance documents:', docs.length);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
