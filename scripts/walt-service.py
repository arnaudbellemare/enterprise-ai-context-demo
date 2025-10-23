#!/usr/bin/env python3
"""
WALT Service - Python bridge for WALT tool discovery
Exposes WALT functionality via HTTP API for Node.js integration
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional

from flask import Flask, jsonify, request
from flask_cors import CORS

# Ensure WALT is installed
try:
    from walt.tools.discovery import propose, generate
    from walt.browser_use.custom.agent_zoo import VWA_Agent
    from walt.tools.discovery.register import register_tools_from_directory
except ImportError:
    print("ERROR: WALT not installed. Run: pip install sfr-walt", file=sys.stderr)
    sys.exit(1)

app = Flask(__name__)
CORS(app)

# Configuration
WALT_TOOLS_DIR = Path(__file__).parent.parent / "walt-tools"
WALT_TOOLS_DIR.mkdir(exist_ok=True)

# Health check endpoint
@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'walt-bridge',
        'version': '1.0.0',
        'walt_tools_dir': str(WALT_TOOLS_DIR)
    })

# Tool discovery endpoint
@app.route('/discover', methods=['POST'])
def discover_tools():
    """
    Discover tools from a website

    Request body:
    {
        "url": "https://example.com",
        "goal": "Optional goal description",
        "max_tools": 10,
        "headless": true
    }
    """
    try:
        data = request.json
        url = data.get('url')
        goal = data.get('goal', '')
        max_tools = data.get('max_tools', 10)
        headless = data.get('headless', True)

        if not url:
            return jsonify({'error': 'URL is required'}), 400

        # Parse domain from URL
        from urllib.parse import urlparse
        domain = urlparse(url).netloc.replace('www.', '').replace('.', '_')
        output_dir = WALT_TOOLS_DIR / domain
        output_dir.mkdir(exist_ok=True)

        # Run discovery asynchronously
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
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
            print(f"🔍 Discovering tools from {url}...")
            candidates = loop.run_until_complete(propose.discover_candidates(args))

            # Limit to max_tools
            candidates = candidates[:max_tools]

            # Generate tool definitions
            print(f"🔧 Generating {len(candidates)} tool definitions...")
            generated_tools = loop.run_until_complete(
                generate.generate_tools(args, candidates)
            )

            # Load generated tool files
            tool_files = list(output_dir.glob('*.json'))
            tools = []

            for tool_file in tool_files:
                with open(tool_file, 'r') as f:
                    tool_data = json.load(f)
                    tools.append({
                        'name': tool_file.stem,
                        'file_path': str(tool_file),
                        'definition': tool_data
                    })

            return jsonify({
                'success': True,
                'url': url,
                'domain': domain,
                'tools_discovered': len(tools),
                'tools': tools,
                'output_dir': str(output_dir)
            })

        finally:
            loop.close()

    except Exception as e:
        print(f"❌ Discovery error: {str(e)}", file=sys.stderr)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Tool generation endpoint (targeted)
@app.route('/generate', methods=['POST'])
def generate_tool():
    """
    Generate a specific tool from a website

    Request body:
    {
        "url": "https://example.com",
        "goal": "Search for products",
        "headless": true
    }
    """
    try:
        data = request.json
        url = data.get('url')
        goal = data.get('goal')
        headless = data.get('headless', True)

        if not url or not goal:
            return jsonify({'error': 'URL and goal are required'}), 400

        # Parse domain from URL
        from urllib.parse import urlparse
        domain = urlparse(url).netloc.replace('www.', '').replace('.', '_')
        output_dir = WALT_TOOLS_DIR / domain
        output_dir.mkdir(exist_ok=True)

        # Run generation asynchronously
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            # Create generation arguments
            class GenerationArgs:
                def __init__(self):
                    self.url = url
                    self.goal = goal
                    self.llm = os.getenv('OPENAI_API_KEY') and 'gpt-4o' or 'gpt-4o-mini'
                    self.headless = headless
                    self.output_dir = str(output_dir)
                    self.auth_file = None

            args = GenerationArgs()

            # Generate tool
            print(f"🔧 Generating tool for '{goal}' from {url}...")
            result = loop.run_until_complete(generate.generate_tool(args))

            # Load generated tool file
            tool_files = list(output_dir.glob('*.json'))
            if not tool_files:
                return jsonify({
                    'success': False,
                    'error': 'No tool generated'
                }), 500

            # Get the most recent tool file
            tool_file = max(tool_files, key=lambda p: p.stat().st_mtime)

            with open(tool_file, 'r') as f:
                tool_data = json.load(f)

            return jsonify({
                'success': True,
                'url': url,
                'goal': goal,
                'tool': {
                    'name': tool_file.stem,
                    'file_path': str(tool_file),
                    'definition': tool_data
                }
            })

        finally:
            loop.close()

    except Exception as e:
        print(f"❌ Generation error: {str(e)}", file=sys.stderr)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# List discovered tools endpoint
@app.route('/tools', methods=['GET'])
def list_tools():
    """List all discovered tools"""
    try:
        tools = []

        for domain_dir in WALT_TOOLS_DIR.iterdir():
            if domain_dir.is_dir():
                for tool_file in domain_dir.glob('*.json'):
                    with open(tool_file, 'r') as f:
                        tool_data = json.load(f)
                        tools.append({
                            'name': tool_file.stem,
                            'domain': domain_dir.name,
                            'file_path': str(tool_file),
                            'definition': tool_data
                        })

        return jsonify({
            'success': True,
            'total_tools': len(tools),
            'tools': tools
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Get specific tool endpoint
@app.route('/tools/<domain>/<tool_name>', methods=['GET'])
def get_tool(domain: str, tool_name: str):
    """Get a specific tool definition"""
    try:
        tool_file = WALT_TOOLS_DIR / domain / f"{tool_name}.json"

        if not tool_file.exists():
            return jsonify({
                'success': False,
                'error': f'Tool not found: {domain}/{tool_name}'
            }), 404

        with open(tool_file, 'r') as f:
            tool_data = json.load(f)

        return jsonify({
            'success': True,
            'tool': {
                'name': tool_name,
                'domain': domain,
                'file_path': str(tool_file),
                'definition': tool_data
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Delete tool endpoint
@app.route('/tools/<domain>/<tool_name>', methods=['DELETE'])
def delete_tool(domain: str, tool_name: str):
    """Delete a tool"""
    try:
        tool_file = WALT_TOOLS_DIR / domain / f"{tool_name}.json"

        if not tool_file.exists():
            return jsonify({
                'success': False,
                'error': f'Tool not found: {domain}/{tool_name}'
            }), 404

        tool_file.unlink()

        return jsonify({
            'success': True,
            'message': f'Tool deleted: {domain}/{tool_name}'
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('WALT_SERVICE_PORT', 5000))
    debug = os.getenv('WALT_SERVICE_DEBUG', 'false').lower() == 'true'

    print(f"🚀 Starting WALT Service on port {port}")
    print(f"📁 Tools directory: {WALT_TOOLS_DIR}")
    print(f"🔧 Debug mode: {debug}")

    app.run(host='0.0.0.0', port=port, debug=debug)
