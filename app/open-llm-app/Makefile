.PHONY: help gpu cpu webui stop logs status clean models health pull-llama setup-models

# Default target
help:
	@echo "ANDI Ollama Management Commands:"
	@echo "  make gpu          - Start Ollama with GPU support"
	@echo "  make cpu          - Start Ollama with CPU only"
	@echo "  make webui        - Start Ollama with Web UI"
	@echo "  make stop         - Stop all Ollama services"
	@echo "  make logs         - View Ollama logs"
	@echo "  make status       - Check service status"
	@echo "  make health       - Check Ollama health"
	@echo "  make models       - List installed models"
	@echo "  make pull-llama   - Download Meta Llama models"
	@echo "  make setup-models - Download and configure ANDI models"
	@echo "  make clean        - Remove all containers and volumes"

# Check for GPU support
check-gpu:
	@if command -v nvidia-smi > /dev/null 2>&1; then \
		echo "✓ NVIDIA GPU detected"; \
		nvidia-smi --query-gpu=name --format=csv,noheader; \
	else \
		echo "⚠ No NVIDIA GPU detected, using CPU mode"; \
	fi

# Start with GPU support
gpu: check-gpu
	@echo "Starting Ollama with GPU support..."
	docker-compose --profile gpu up -d
	@echo "Ollama GPU is starting... Access at http://localhost:11434"

# Start with CPU only
cpu:
	@echo "Starting Ollama with CPU support..."
	docker-compose --profile cpu up -d
	@echo "Ollama CPU is starting... Access at http://localhost:11434"

# Start with Web UI
webui: gpu
	@echo "Starting Ollama with Web UI..."
	docker-compose --profile gpu --profile webui up -d
	@echo "Ollama Web UI: http://localhost:8080"
	@echo "Ollama API: http://localhost:11434"

# Stop services
stop:
	@echo "Stopping Ollama services..."
	docker-compose --profile gpu --profile cpu --profile webui down

# View logs
logs:
	docker-compose logs -f ollama

# Check status
status:
	@echo "Ollama Service Status:"
	@docker ps --filter "name=andi_ollama" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Health check
health:
	@echo "Checking Ollama services health..."
	@curl -s http://localhost:11434/api/version || echo "Ollama API is not responding"
	@echo ""
	@curl -s http://localhost:11434/api/tags | jq '.models[]?.name' 2>/dev/null || echo "No models installed yet"

# List models
models:
	@echo "Installed Ollama models:"
	@curl -s http://localhost:11434/api/tags | jq '.models[]?.name' 2>/dev/null || echo "No models installed"

# Download Meta Llama models
pull-llama:
	@echo "Downloading Meta Llama models for ANDI..."
	@echo "This may take 30+ minutes depending on your internet connection..."
	
	@echo "1. Downloading Llama 3.1 8B (4.7GB) - General analysis..."
	docker exec andi_ollama ollama pull llama3.1:8b
	
	@echo "2. Downloading Llama 3.1 7B Instruct (4.1GB) - Instruction following..."
	docker exec andi_ollama ollama pull llama3.1:7b-instruct
	
	@echo "3. Downloading Llama 3.2 3B (2.0GB) - Fast responses..."
	docker exec andi_ollama ollama pull llama3.2:3b
	
	@echo "✓ Meta Llama models downloaded successfully!"

# Setup ANDI-specific models
setup-models: pull-llama
	@echo "Setting up ANDI-optimized model configurations..."
	@./scripts/setup-andi-models.sh
	@echo "✓ ANDI models configured for:"
	@echo "  - CIQ Analysis (llama3.1:8b)"
	@echo "  - Teacher Recommendations (llama3.1:7b-instruct)"
	@echo "  - Real-time Processing (llama3.2:3b)"

# Clean everything
clean:
	@echo "WARNING: This will remove all Ollama data and downloaded models!"
	@read -p "Are you sure? [y/N] " confirm && [ "$${confirm}" = "y" ] || exit 1
	@echo "Cleaning Ollama containers and volumes..."
	docker-compose --profile gpu --profile cpu --profile webui down -v
	@echo "Cleaned all Ollama containers and volumes"

# Test model inference
test:
	@echo "Testing Ollama with simple query..."
	@curl -s http://localhost:11434/api/generate -d '{"model": "llama3.2:3b", "prompt": "Hello! Can you help analyze classroom interactions?", "stream": false}' | jq '.response' || echo "Test failed - check if models are loaded"