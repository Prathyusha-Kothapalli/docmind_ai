# DocMind AI Platform Makefile

.PHONY: all setup seed start dev test test-python docker-up docker-down clean

all: setup seed start

setup:
	@echo "Installing Node.js dependencies..."
	npm install
	@echo "Installing Python dependencies..."
	pip install -r requirements.txt || true

seed:
	@echo "Seeding SQLite database with demo data & sample documents..."
	node scripts/seed.js

start:
	@echo "Starting DocMind AI Server on http://localhost:3000..."
	node server.js

dev:
	@echo "Starting DocMind AI Development Mode..."
	node --watch server.js

test:
	@echo "Running Node.js Jest automated test suite..."
	npm test

test-python:
	@echo "Running Python 3.10 Pytest NLP test suite..."
	python -m pytest tests/test_python_ai.py

docker-up:
	@echo "Launching DocMind AI Docker stack..."
	docker-compose up --build -d

docker-down:
	@echo "Stopping DocMind AI Docker stack..."
	docker-compose down

clean:
	@echo "Cleaning temporary files & test logs..."
	rm -rf data/ uploads/* coverage .pytest_cache
