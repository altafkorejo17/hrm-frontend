# ══════════════════════════════════════════════════════════════════════════════
#  HRM Frontend — Makefile
# ══════════════════════════════════════════════════════════════════════════════

.DEFAULT_GOAL := help
.PHONY: help install dev build start lint type-check clean

# ── Help ──────────────────────────────────────────────────────────────────────

help: ## Show available commands
	@echo ""
	@echo "  Usage: make <target>"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} \
		/^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}' \
		$(MAKEFILE_LIST)
	@echo ""

# ── Development ───────────────────────────────────────────────────────────────

install: ## Install npm dependencies
	npm install

dev: ## Start dev server with hot-reload (http://localhost:3000)
	npm run dev

build: ## Build for production
	npm run build

start: build ## Build then start the production server
	npm run start

lint: ## Run ESLint
	npm run lint

type-check: ## Run TypeScript type checker
	npx tsc --noEmit

# ── Cleanup ───────────────────────────────────────────────────────────────────

clean: ## Remove .next/ build cache and node_modules/
	rm -rf .next node_modules
