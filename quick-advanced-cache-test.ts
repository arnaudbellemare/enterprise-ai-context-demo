#!/usr/bin/env tsx
import { getAdvancedCache } from './frontend/lib/advanced-cache-system';
async function main(){
  const cache = getAdvancedCache();
  await cache.set('unit-key','unit-value',60,{component:'Test',task_type:'unit',priority:'low',cost_saved:0.001,latency_saved_ms:5});
  const v = await cache.get<string>('unit-key');
  console.log('value=', v);
  console.log('stats=', cache.getStats());
}
main().catch(console.error)
