# ══════════════════════════════════════════════════════════════════════════════
#  HRM Frontend (Next.js) — Makefile
# ══════════════════════════════════════════════════════════════════════════════

.DEFAULT_GOAL := help
.PHONY: help \
        install dev build start lint \
        docker-build docker-build-dev \
        docker-up docker-down docker-logs docker-shell \
        docker-dev docker-up-dev docker-down-dev docker-logs-dev docker-shell-dev \
        docker-prune clean

# ── Variables ─────────────────────────────────────────────────────────────────

APP_NAME  := hrm-frontend
IMAGE_TAG ?= latest

DC        := docker compose
DC_DEV    := docker compose -f docker-compose.dev.yml

# ── Help ──────────────────────────────────────────────────────────────────────

help: ## Show this help
	@echo ""
	@echo "  Usage: make <target>"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} \
		/^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-24s\033[0m %s\n", $$1, $$2}' \
		$(MAKEFILE_LIST)
	@echo ""

# ══════════════════════════════════════════════════════════════════════════════
#  LOCAL DEVELOPMENT
# ══════════════════════════════════════════════════════════════════════════════

install: ## Install npm dependencies
	npm install

dev: ## Start Next.js dev server locally (hot-reload)
	npm run dev

build: ## Build Next.js for production locally
	npm run build

start: build ## Build then start production server locally
	npm run start

lint: ## Run ESLint
	npm run lint

# ══════════════════════════════════════════════════════════════════════════════
#  DOCKER — BUILD
# ══════════════════════════════════════════════════════════════════════════════

docker-build: ## Build production image  (target: production)
	docker build \
		--file docker/Dockerfile \
		--target production \
		--tag $(APP_NAME):$(IMAGE_TAG) \
		.

docker-build-dev: ## Build development image  (target: deps)
	docker build \
		--file docker/Dockerfile \
		--target deps \
		--tag $(APP_NAME):dev \
		.

# ══════════════════════════════════════════════════════════════════════════════
#  DOCKER — PRODUCTION (docker-compose.yml)
# ══════════════════════════════════════════════════════════════════════════════

docker-up: ## Start production container (detached)
	$(DC) up -d

docker-down: ## Stop and remove production container
	$(DC) down

docker-logs: ## Tail production logs  (Ctrl-C to stop)
	$(DC) logs -f

docker-shell: ## Open shell in production container
	$(DC) exec app sh

# ══════════════════════════════════════════════════════════════════════════════
#  DOCKER — DEVELOPMENT (docker-compose.dev.yml)
# ══════════════════════════════════════════════════════════════════════════════

docker-dev: ## Build dev image, start container and tail logs
	$(DC_DEV) up -d --build
	$(DC_DEV) logs -f app

docker-up-dev: ## Start development container (detached)
	$(DC_DEV) up -d

docker-down-dev: ## Stop and remove development container
	$(DC_DEV) down

docker-logs-dev: ## Tail development logs  (Ctrl-C to stop)
	$(DC_DEV) logs -f

docker-shell-dev: ## Open shell in development container
	$(DC_DEV) exec app sh

# ══════════════════════════════════════════════════════════════════════════════
#  CLEANUP
# ══════════════════════════════════════════════════════════════════════════════

docker-prune: ## Remove stopped containers, unused images & volumes
	docker system prune -f
	docker volume prune -f

clean: ## Remove .next/ and node_modules/
	rm -rf .next node_modules
