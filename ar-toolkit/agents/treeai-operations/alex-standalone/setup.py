#!/usr/bin/env python3
"""
Alex TreeAI Operations Agent Setup Script
Installs and configures Alex as a standalone agent
"""

from setuptools import setup, find_packages
import os

# Read README if available
long_description = ""
if os.path.exists("README.md"):
    with open("README.md", "r", encoding="utf-8") as fh:
        long_description = fh.read()

setup(
    name="alex-treeai-agent",
    version="1.0.0",
    author="TreeAI Agent Kit",
    author_email="support@treeai.com",
    description="Alex - Autonomous TreeAI Operations Commander using Anthropic Claude",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/treeai/alex-agent",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Office/Business :: Financial :: Accounting",
    ],
    python_requires=">=3.9",
    install_requires=[
        # Core Anthropic & LangChain
        "anthropic>=0.18.0",
        "langchain>=0.1.0", 
        "langchain-anthropic>=0.1.0",
        "langchain-core>=0.1.0",
        
        # Vector Database & Embeddings
        "sentence-transformers>=2.2.0",
        "chromadb>=0.4.0",
        
        # Data Science
        "numpy>=1.24.0",
        "pandas>=2.0.0", 
        "scikit-learn>=1.3.0",
        
        # Async & Networking
        "aiohttp>=3.8.0",
        "httpx>=0.24.0",
        
        # Data Validation
        "pydantic>=2.0.0",
        "python-dotenv>=1.0.0",
        
        # Logging
        "structlog>=23.0.0"
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-asyncio>=0.21.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
        ],
        "database": [
            "psycopg2-binary>=2.9.0",
            "redis>=4.5.0",
            "asyncpg>=0.28.0"
        ],
        "monitoring": [
            "prometheus-client>=0.17.0",
            "grafana-client>=3.5.0"
        ]
    },
    entry_points={
        "console_scripts": [
            "alex=alex_cli:main",
            "alex-anthropic=alex_anthropic:main",
        ],
    },
    include_package_data=True,
    package_data={
        "alex": ["*.txt", "*.md", "*.json", "*.yaml"],
    },
    zip_safe=False,
)