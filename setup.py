"""
PERMUTATION - Advanced AI Research Stack
Setup script for pip installation
"""

import os
from setuptools import setup, find_packages
from setuptools.command.install import install
from setuptools.command.develop import develop

LOGO = """
╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                                               ║
║       ██████╗ ███████╗██████╗ ███╗   ███╗██╗   ██╗████████╗ █████╗ ████████╗██╗ ██████╗ ███╗   ██╗            ║
║       ██╔══██╗██╔════╝██╔══██╗████╗ ████║██║   ██║╚══██╔══╝██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║            ║
║       ██████╔╝█████╗  ██████╔╝██╔████╔██║██║   ██║   ██║   ███████║   ██║   ██║██║   ██║██╔██╗ ██║            ║
║       ██╔═══╝ ██╔══╝  ██╔══██╗██║╚██╔╝██║██║   ██║   ██║   ██╔══██║   ██║   ██║██║   ██║██║╚██╗██║            ║
║       ██║     ███████╗██║  ██║██║ ╚═╝ ██║╚██████╔╝   ██║   ██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║            ║
║       ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝            ║
║                                                                                                               ║
║                              Advanced AI Research Stack with Automatic Optimization                           ║
║                                                                                                               ║
║                  ACE Framework  │   GEPA Optimization  │   DSPy Composition  │   IRT Routing                  ║
║                  ReasoningBank  │   LoRA Adaptation    │   BAML (60% token reduction)                         ║
║                                                                                                               ║
║                                      Built for Researchers, by Researchers                                    ║
║                                      Fork it. Break it. Make it better.                                       ║
║                                                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════╝

🎉 PERMUTATION installed successfully!

Quick Start:
   Read QUICK_START.md for 5-minute setup
   Run: npm run dev
   Visit: http://localhost:3000

Documentation:
  • README.md - Overview
  • ARCHITECTURE.md - System design
  • BENCHMARKS.md - Performance results

Examples:
  • npm run example:basic
  • npm run example:multi-domain
  • npm run example:config

Happy researching! 🧪✨
"""


class PostInstallCommand(install):
    """Post-installation for installation mode."""
    def run(self):
        install.run(self)
        print(LOGO)


class PostDevelopCommand(develop):
    """Post-installation for development mode."""
    def run(self):
        develop.run(self)
        print(LOGO)


# Read requirements
def read_requirements(filename='requirements.txt'):
    if os.path.exists(filename):
        with open(filename) as f:
            return [line.strip() for line in f if line.strip() and not line.startswith('#')]
    return []


# Read long description
def read_long_description():
    if os.path.exists('README.md'):
        with open('README.md', 'r', encoding='utf-8') as f:
            return f.read()
    return ''


setup(
    name='permutation-ai',
    version='1.0.0',
    description='Advanced AI research stack with automatic optimization',
    long_description=read_long_description(),
    long_description_content_type='text/markdown',
    author='Your Name',
    author_email='research@permutation.ai',
    url='https://github.com/arnaudbellemare/enterprise-ai-context-demo',
    packages=find_packages(where='src'),
    package_dir={'': 'src'},
    install_requires=read_requirements(),
    python_requires='>=3.9',
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Science/Research',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
        'Programming Language :: Python :: 3.12',
        'Topic :: Scientific/Engineering :: Artificial Intelligence',
        'Topic :: Software Development :: Libraries :: Python Modules',
    ],
    keywords=[
        'ai', 'machine-learning', 'prompt-optimization', 'dspy', 'gepa',
        'ace-framework', 'irt', 'lora', 'research', 'llm', 'optimization'
    ],
    cmdclass={
        'install': PostInstallCommand,
        'develop': PostDevelopCommand,
    },
    entry_points={
        'console_scripts': [
            'permutation=cli:main',  # Future CLI tool
        ],
    },
    project_urls={
        'Documentation': 'https://github.com/arnaudbellemare/enterprise-ai-context-demo',
        'Source': 'https://github.com/arnaudbellemare/enterprise-ai-context-demo',
        'Bug Reports': 'https://github.com/arnaudbellemare/enterprise-ai-context-demo/issues',
    },
)

