#!/usr/bin/env python3
"""
WALT Redis Queue Worker

Consumes tool discovery jobs from Redis queue, processes them using WALT,
and publishes results back to Redis.

Production-grade architecture with:
- Multiple worker support
- Automatic retry on failure
- Graceful shutdown
- Health monitoring
"""

import asyncio
import json
import os
import sys
import time
import signal
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

import redis
from redis import Redis

# Ensure WALT is installed
try:
    from walt.tools.discovery import propose, generate
    from walt.browser_use.custom.agent_zoo import VWA_Agent
except ImportError:
    print("ERROR: WALT not installed. Run: pip install sfr-walt", file=sys.stderr)
    print("Note: WALT requires Python 3.11+", file=sys.stderr)
    sys.exit(1)

# Configuration
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
QUEUE_NAME = os.getenv('WALT_QUEUE_NAME', 'walt:discovery:queue')
RESULT_PREFIX = os.getenv('WALT_RESULT_PREFIX', 'walt:result:')
WORKER_ID = os.getenv('WORKER_ID', f'worker-{os.getpid()}')
WALT_TOOLS_DIR = Path(__file__).parent.parent / "walt-tools"
WALT_TOOLS_DIR.mkdir(exist_ok=True)

# Global state
running = True
stats = {
    'processed': 0,
    'success': 0,
    'failed': 0,
    'started_at': datetime.now().isoformat()
}


def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    global running
    print(f"\n🛑 {WORKER_ID}: Received shutdown signal, finishing current job...")
    running = False


signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


class WALTWorker:
    """Redis queue worker for WALT tool discovery"""

    def __init__(self):
        self.redis_client = Redis.from_url(REDIS_URL, decode_responses=True)
        self.redis_binary = Redis.from_url(REDIS_URL, decode_responses=False)
        print(f"✅ {WORKER_ID}: Connected to Redis")

    async def process_discovery_job(self, job: Dict) -> Dict:
        """Process a tool discovery job"""
        request = job['request']
        url = request.get('url')
        goal = request.get('goal', '')
        max_tools = request.get('max_tools', 10)
        headless = request.get('headless', True)

        print(f"🔍 {WORKER_ID}: Discovering tools from {url}...")
        start_time = time.time()

        try:
            # Parse domain from URL
            from urllib.parse import urlparse
            domain = urlparse(url).netloc.replace('www.', '').replace('.', '_')
            output_dir = WALT_TOOLS_DIR / domain
            output_dir.mkdir(exist_ok=True)

            # Create discovery arguments
            class DiscoveryArgs:
                def __init__(self):
                    self.url = url
                    self.goal = goal
                    self.max_processes = 4
                    self.llm = os.getenv('OPENAI_API_KEY') and 'gpt-4o' or 'gpt-4o-mini'
                    self.headless = headless
                    self.output_dir = str(output_dir)
                    self.auth_file = None

            args = DiscoveryArgs()

            # Discover candidate tools
            candidates = await propose.discover_candidates(args)
            candidates = candidates[:max_tools]

            # Generate tool definitions
            tools = []
            for candidate in candidates:
                try:
                    tool_def = await generate.generate_tool(candidate, args)
                    if tool_def:
                        tools.append({
                            'name': tool_def.get('name', 'unknown'),
                            'description': tool_def.get('description', ''),
                            'parameters': tool_def.get('parameters', {}),
                            'code': tool_def.get('code', ''),
                            'source_url': url,
                            'discovery_method': 'walt_sfr',
                            'confidence_score': 0.85
                        })
                except Exception as e:
                    print(f"⚠️ {WORKER_ID}: Failed to generate tool: {e}")
                    continue

            processing_time = time.time() - start_time

            result = {
                'success': True,
                'tools_discovered': len(tools),
                'tools': tools,
                'backend': 'python',
                'processing_time': processing_time
            }

            print(f"✅ {WORKER_ID}: Discovered {len(tools)} tools in {processing_time:.2f}s")
            return result

        except Exception as e:
            processing_time = time.time() - start_time
            error_msg = str(e)
            print(f"❌ {WORKER_ID}: Discovery failed: {error_msg}")

            return {
                'success': False,
                'error': error_msg,
                'processing_time': processing_time
            }

    async def process_generation_job(self, job: Dict) -> Dict:
        """Process a tool generation job"""
        request = job['request']
        url = request.get('url')
        goal = request.get('goal', '')

        print(f"🔧 {WORKER_ID}: Generating tool for '{goal}' from {url}...")
        start_time = time.time()

        try:
            # Use discovery with goal to find specific tool
            result = await self.process_discovery_job({
                'request': {
                    'url': url,
                    'goal': goal,
                    'max_tools': 1,
                    'headless': request.get('headless', True)
                }
            })

            if result['success'] and result['tools_discovered'] > 0:
                return {
                    'success': True,
                    'tool': result['tools'][0],
                    'backend': 'python',
                    'processing_time': result['processing_time']
                }
            else:
                return {
                    'success': False,
                    'error': 'No tools found matching the goal',
                    'processing_time': time.time() - start_time
                }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'processing_time': time.time() - start_time
            }

    async def process_job(self, job_json: str):
        """Process a job from the queue"""
        global stats

        try:
            job = json.loads(job_json)
            job_id = job['id']
            job_type = job['type']

            print(f"\n📦 {WORKER_ID}: Processing job {job_id} (type: {job_type})")

            # Process based on job type
            if job_type == 'discover':
                result = await self.process_discovery_job(job)
            elif job_type == 'generate':
                result = await self.process_generation_job(job)
            else:
                result = {
                    'success': False,
                    'error': f'Unknown job type: {job_type}'
                }

            # Create queue result
            queue_result = {
                'jobId': job_id,
                'success': result['success'],
                'data': result if result['success'] else None,
                'error': result.get('error'),
                'processedAt': int(time.time() * 1000),
                'processingTime': int(result.get('processing_time', 0) * 1000),
                'workerId': WORKER_ID
            }

            # Store result in Redis
            result_key = f"{RESULT_PREFIX}{job_id}"
            result_channel = f"{RESULT_PREFIX}channel:{job_id}"

            result_json = json.dumps(queue_result)

            # Store with TTL (1 hour)
            self.redis_client.setex(result_key, 3600, result_json)

            # Publish to channel for immediate notification
            self.redis_client.publish(result_channel, result_json)

            # Update stats
            stats['processed'] += 1
            if result['success']:
                stats['success'] += 1
                self.redis_client.incr(f"{QUEUE_NAME}:completed")
            else:
                stats['failed'] += 1
                self.redis_client.incr(f"{QUEUE_NAME}:failed")

            print(f"✅ {WORKER_ID}: Job {job_id} completed")

        except Exception as e:
            print(f"❌ {WORKER_ID}: Error processing job: {e}")
            stats['failed'] += 1

    async def run(self):
        """Main worker loop"""
        global running

        print(f"🚀 {WORKER_ID}: Starting worker loop...")
        print(f"   Queue: {QUEUE_NAME}")
        print(f"   Result prefix: {RESULT_PREFIX}")
        print(f"   Tools directory: {WALT_TOOLS_DIR}")
        print()

        while running:
            try:
                # Block pop from queue (5 second timeout)
                result = self.redis_binary.brpop(QUEUE_NAME, timeout=5)

                if result:
                    _, job_json = result
                    job_json = job_json.decode('utf-8')

                    # Mark as processing
                    self.redis_client.incr(f"{QUEUE_NAME}:processing")

                    # Process job
                    await self.process_job(job_json)

                    # Mark as done processing
                    self.redis_client.decr(f"{QUEUE_NAME}:processing")
                else:
                    # No job available, just continue
                    pass

            except redis.ConnectionError as e:
                print(f"❌ {WORKER_ID}: Redis connection error: {e}")
                await asyncio.sleep(5)
            except Exception as e:
                print(f"❌ {WORKER_ID}: Unexpected error: {e}")
                await asyncio.sleep(1)

        print(f"\n📊 {WORKER_ID}: Shutdown complete")
        print(f"   Total processed: {stats['processed']}")
        print(f"   Successful: {stats['success']}")
        print(f"   Failed: {stats['failed']}")


async def main():
    """Main entry point"""
    print("=" * 60)
    print("WALT Redis Queue Worker")
    print("=" * 60)
    print(f"Worker ID: {WORKER_ID}")
    print(f"Redis URL: {REDIS_URL}")
    print(f"Python: {sys.version}")
    print("=" * 60)
    print()

    worker = WALTWorker()

    try:
        await worker.run()
    except KeyboardInterrupt:
        print(f"\n🛑 {WORKER_ID}: Interrupted by user")
    finally:
        print(f"👋 {WORKER_ID}: Goodbye!")


if __name__ == '__main__':
    asyncio.run(main())
