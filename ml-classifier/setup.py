#!/usr/bin/env python3
"""
Setup script for BERT Medical Classifier
"""

from setuptools import setup, find_packages

with open("requirements.txt", "r") as f:
    requirements = [line.strip() for line in f if line.strip() and not line.startswith("#")]

setup(
    name="bert-medical-classifier",
    version="1.0.0",
    description="BERT-based medical symptom classifier for hospital triage",
    author="HolyBed Medical AI",
    author_email="ai@holybed.com",
    packages=find_packages(),
    install_requires=requirements,
    python_requires=">=3.8",
    entry_points={
        "console_scripts": [
            "train-medical-bert=bert_symptom_classifier:main",
            "serve-medical-api=ml_api_server:main",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Healthcare Industry",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
    ],
)
