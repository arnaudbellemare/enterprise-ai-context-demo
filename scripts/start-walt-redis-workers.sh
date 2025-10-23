#!/bin/bash
# Start WALT Redis Queue Workers
#
# Supports running multiple workers for scalability

set -e

# Configuration
NUM_WORKERS=${WALT_NUM_WORKERS:-2}
REDIS_URL=${REDIS_URL:-redis://localhost:6379}

echo "🚀 Starting WALT Redis Workers..."
echo "   Workers: $NUM_WORKERS"
echo "   Redis: $REDIS_URL"
echo ""

# Check if virtual environment exists
if [ ! -d "venv-walt" ]; then
    echo "❌ Virtual environment not found. Run ./scripts/setup-walt.sh first."
    exit 1
fi

# Activate virtual environment
source venv-walt/bin/activate

# Check Redis connection
echo "🔍 Checking Redis connection..."
python3 -c "import redis; r = redis.from_url('$REDIS_URL'); r.ping(); print('✅ Redis connected')" || {
    echo "❌ Cannot connect to Redis at $REDIS_URL"
    echo "   Make sure Redis is running:"
    echo "   - Docker: docker run -d -p 6379:6379 redis:alpine"
    echo "   - Homebrew: brew services start redis"
    echo "   - Manual: redis-server"
    exit 1
}

# Create PID directory
mkdir -p .walt-workers

# Start workers
for i in $(seq 1 $NUM_WORKERS); do
    WORKER_ID="worker-$i"
    PID_FILE=".walt-workers/${WORKER_ID}.pid"
    LOG_FILE=".walt-workers/${WORKER_ID}.log"

    echo "🚀 Starting $WORKER_ID..."

    WORKER_ID=$WORKER_ID REDIS_URL=$REDIS_URL \
        nohup python3 scripts/walt-redis-worker.py > "$LOG_FILE" 2>&1 &

    echo $! > "$PID_FILE"
    echo "   PID: $(cat $PID_FILE)"
    echo "   Log: $LOG_FILE"
done

echo ""
echo "✅ All workers started!"
echo ""
echo "📝 Management commands:"
echo "   Stop all:   ./scripts/stop-walt-redis-workers.sh"
echo "   Status:     ./scripts/status-walt-redis-workers.sh"
echo "   Logs:       tail -f .walt-workers/*.log"
echo ""
