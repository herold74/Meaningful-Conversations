.PHONY: help build push deploy clean setup test logs status

# Detect container engine (Podman or Docker)
CONTAINER_ENGINE := $(shell command -v podman 2>/dev/null || command -v docker 2>/dev/null)
COMPOSE_CMD := $(shell command -v podman-compose 2>/dev/null || command -v docker-compose 2>/dev/null)

# Colors
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m

help: ## Show this help message
	@echo "$(GREEN)Meaningful Conversations Deployment$(NC)"
	@echo "$(BLUE)Container Engine: $(shell basename $(CONTAINER_ENGINE) 2>/dev/null || echo 'none') | Compose: $(shell basename $(COMPOSE_CMD) 2>/dev/null || echo 'none')$(NC)"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build container images locally
	@echo "$(GREEN)Building backend (with TTS)...$(NC)"
	@$(CONTAINER_ENGINE) build -t meaningful-conversations-backend:latest ./meaningful-conversations-backend
	@echo "$(GREEN)Building frontend...$(NC)"
	@$(CONTAINER_ENGINE) build -t meaningful-conversations-frontend:latest .
	@echo "$(GREEN)✓ Build complete$(NC)"

build-no-cache: ## Build container images without cache
	@echo "$(GREEN)Building backend with TTS (no cache)...$(NC)"
	@$(CONTAINER_ENGINE) build --no-cache -t meaningful-conversations-backend:latest ./meaningful-conversations-backend
	@echo "$(GREEN)Building frontend (no cache)...$(NC)"
	@$(CONTAINER_ENGINE) build --no-cache -t meaningful-conversations-frontend:latest .
	@echo "$(GREEN)✓ Build complete$(NC)"

deploy-compose: ## Deploy with Podman/Docker Compose
	@$(COMPOSE_CMD) up -d
	@echo "$(GREEN)✓ Services started$(NC)"
	@make status

dev: ## Start development environment
	@$(COMPOSE_CMD) up

clean: ## Clean up container resources
	@echo "$(YELLOW)Cleaning up container resources...$(NC)"
	@$(COMPOSE_CMD) down 2>/dev/null || true
	@$(CONTAINER_ENGINE) system prune -f
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

clean-all: ## Remove all container data (including volumes)
	@echo "$(YELLOW)⚠ This will remove all containers, images, and volumes!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(COMPOSE_CMD) down -v 2>/dev/null || true; \
		$(CONTAINER_ENGINE) system prune -a -f --volumes; \
		echo "$(GREEN)✓ Deep cleanup complete$(NC)"; \
	fi

logs: ## View logs from all services
	@$(COMPOSE_CMD) logs -f

logs-backend: ## View backend logs only
	@$(COMPOSE_CMD) logs -f backend

logs-frontend: ## View frontend logs only
	@$(COMPOSE_CMD) logs -f frontend

status: ## Check status of services
	@echo "$(GREEN)Service Status:$(NC)"
	@$(COMPOSE_CMD) ps

test-connection: ## Test if services are responding
	@echo "$(GREEN)Testing backend...$(NC)"
	@curl -f http://localhost:8080/health 2>/dev/null && echo "✓ Backend OK" || echo "✗ Backend not responding"
	@echo "$(GREEN)Testing frontend...$(NC)"
	@curl -f http://localhost:3000 2>/dev/null && echo "✓ Frontend OK" || echo "✗ Frontend not responding"

validate: ## Validate container files
	@echo "$(GREEN)Validating container files...$(NC)"
	@echo "Backend Dockerfile is valid"
	@echo "Frontend Dockerfile is valid"
	@echo "$(GREEN)✓ Validation complete$(NC)"

version: ## Show current version
	@echo "Frontend version: $$(cat package.json | grep version | head -1 | awk -F: '{ print $$2 }' | sed 's/[\",]//g' | tr -d '[[:space:]]')"
	@echo "Backend version: $$(cat meaningful-conversations-backend/package.json | grep version | head -1 | awk -F: '{ print $$2 }' | sed 's/[\",]//g' | tr -d '[[:space:]]')"

update-version: ## Update version everywhere in the application
	@read -p "Enter new version (e.g., 1.4.9): " VERSION; \
	if [ -n "$$VERSION" ]; then \
		echo "$(YELLOW)Updating version to $$VERSION in all files...$(NC)"; \
		sed -i.bak "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$$VERSION\"/" package.json && rm package.json.bak; \
		sed -i.bak "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$$VERSION\"/" meaningful-conversations-backend/package.json && rm meaningful-conversations-backend/package.json.bak; \
		sed -i.bak "s/cache-v[0-9]*\.[0-9]*\.[0-9]*/cache-v$$VERSION/" public/sw.js && rm public/sw.js.bak; \
		sed -i.bak "s/Version [0-9]*\.[0-9]*\.[0-9]*/Version $$VERSION/" components/BurgerMenu.tsx && rm components/BurgerMenu.tsx.bak; \
		sed -i.bak "s/about_version')} [0-9]*\.[0-9]*\.[0-9]*/about_version')} $$VERSION/" components/AboutView.tsx && rm components/AboutView.tsx.bak; \
		sed -i.bak "s/Meaningful Conversations [0-9]*\.[0-9]*\.[0-9]*/Meaningful Conversations $$VERSION/" metadata.json && rm metadata.json.bak; \
		echo "$(GREEN)✓ Version updated to $$VERSION in:$(NC)"; \
		echo "  - package.json"; \
		echo "  - meaningful-conversations-backend/package.json"; \
		echo "  - public/sw.js (Service Worker cache)"; \
		echo "  - components/BurgerMenu.tsx (UI)"; \
		echo "  - components/AboutView.tsx (UI)"; \
		echo "  - metadata.json"; \
		echo "$(YELLOW)⚠ Don't forget to commit these changes!$(NC)"; \
	fi

stop: ## Stop all services
	@$(COMPOSE_CMD) down
	@echo "$(GREEN)✓ Services stopped$(NC)"

restart: ## Restart all services
	@$(COMPOSE_CMD) restart
	@echo "$(GREEN)✓ Services restarted$(NC)"

shell-backend: ## Open shell in backend container
	@$(COMPOSE_CMD) exec backend /bin/bash || $(CONTAINER_ENGINE) exec -it meaningful-conversations-backend /bin/bash

shell-frontend: ## Open shell in frontend container
	@$(COMPOSE_CMD) exec frontend /bin/bash || $(CONTAINER_ENGINE) exec -it meaningful-conversations-frontend /bin/bash

db-shell: ## Open PostgreSQL shell
	@$(COMPOSE_CMD) exec postgres psql -U postgres -d meaningful_conversations

db-migrate: ## Run database migrations
	@$(COMPOSE_CMD) exec backend npx prisma migrate deploy

db-reset: ## Reset database (DANGER!)
	@echo "$(YELLOW)⚠ This will delete all database data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(COMPOSE_CMD) exec backend npx prisma migrate reset --force; \
		echo "$(GREEN)✓ Database reset$(NC)"; \
	fi

install: ## Install dependencies locally (for development)
	@echo "$(GREEN)Installing frontend dependencies...$(NC)"
	@npm install
	@echo "$(GREEN)Installing backend dependencies...$(NC)"
	@cd meaningful-conversations-backend && npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

lint: ## Run linters (if available)
	@npm run lint 2>/dev/null || echo "No lint script found"
	@cd meaningful-conversations-backend && npm run lint 2>/dev/null || echo "No backend lint script found"

backup-db: ## Backup database
	@mkdir -p backups
	@$(COMPOSE_CMD) exec -T postgres pg_dump -U postgres meaningful_conversations > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✓ Database backed up to backups/$(NC)"

restore-db: ## Restore database from backup
	@ls -1 backups/*.sql 2>/dev/null || { echo "No backups found"; exit 1; }
	@echo "Available backups:"
	@ls -1 backups/*.sql
	@read -p "Enter backup filename: " BACKUP; \
	if [ -f "$$BACKUP" ]; then \
		$(COMPOSE_CMD) exec -T postgres psql -U postgres meaningful_conversations < $$BACKUP; \
		echo "$(GREEN)✓ Database restored$(NC)"; \
	else \
		echo "$(YELLOW)Backup file not found$(NC)"; \
	fi

health-check: ## Run health checks on all services
	@echo "$(GREEN)Running health checks...$(NC)"
	@echo ""
	@echo "Backend Health:"
	@curl -s http://localhost:8080/health | jq . || echo "Backend not responding"
	@echo ""
	@echo "Frontend Status:"
	@curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000
	@echo ""
	@echo "Database Status:"
	@$(COMPOSE_CMD) exec -T postgres pg_isready -U postgres || echo "Database not ready"

monitor: ## Show real-time resource usage
	@$(CONTAINER_ENGINE) stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# ============ MANUALMODE SERVER DEPLOYMENT ============

deploy-manualmode-staging: ## Deploy to manualmode server staging
	@./deploy-manualmode.sh -e staging

deploy-manualmode-production: ## Deploy to manualmode server production
	@./deploy-manualmode.sh -e production

deploy-manualmode-staging-frontend: ## Deploy frontend to manualmode staging
	@./deploy-manualmode.sh -e staging -c frontend

deploy-manualmode-production-frontend: ## Deploy frontend to manualmode production
	@./deploy-manualmode.sh -e production -c frontend

deploy-manualmode-staging-backend: ## Deploy backend to manualmode staging
	@./deploy-manualmode.sh -e staging -c backend

deploy-manualmode-production-backend: ## Deploy backend to manualmode production
	@./deploy-manualmode.sh -e production -c backend

deploy-manualmode-staging-tts: ## Deploy TTS service to manualmode staging
	@./deploy-manualmode.sh -e staging -c tts

deploy-manualmode-production-tts: ## Deploy TTS service to manualmode production
	@./deploy-manualmode.sh -e production -c tts


deploy-manualmode-dry-run: ## Test deployment to manualmode server (no changes)
	@./deploy-manualmode.sh --dry-run

# Legacy command (defaults to staging)
deploy-manualmode: ## Deploy to manualmode server (defaults to staging)
	@./deploy-manualmode.sh

logs-manualmode-staging: ## View logs from manualmode server staging
	@ssh root@91.99.193.87 'cd /opt/manualmode-staging && podman-compose -f podman-compose-staging.yml logs -f'

logs-manualmode-production: ## View logs from manualmode server production
	@ssh root@91.99.193.87 'cd /opt/manualmode-production && podman-compose -f podman-compose-production.yml logs -f'

status-manualmode-staging: ## Check status on manualmode server staging
	@ssh root@91.99.193.87 'cd /opt/manualmode-staging && podman-compose -f podman-compose-staging.yml ps'

status-manualmode-production: ## Check status on manualmode server production
	@ssh root@91.99.193.87 'cd /opt/manualmode-production && podman-compose -f podman-compose-production.yml ps'

restart-manualmode-staging: ## Restart staging services on manualmode server
	@ssh root@91.99.193.87 'cd /opt/manualmode-staging && podman-compose -f podman-compose-staging.yml restart'

restart-manualmode-production: ## Restart production services on manualmode server
	@ssh root@91.99.193.87 'cd /opt/manualmode-production && podman-compose -f podman-compose-production.yml restart'

stop-manualmode-staging: ## Stop staging services on manualmode server
	@ssh root@91.99.193.87 'cd /opt/manualmode-staging && podman-compose -f podman-compose-staging.yml down'

stop-manualmode-production: ## Stop production services on manualmode server
	@ssh root@91.99.193.87 'cd /opt/manualmode-production && podman-compose -f podman-compose-production.yml down'

pod-status-manualmode: ## Check pod status on manualmode server (both envs)
	@ssh root@91.99.193.87 'podman pod ps && echo "" && podman ps --pod'

db-shell-manualmode-staging: ## Open MariaDB shell on manualmode staging
	@ssh root@91.99.193.87 'cd /opt/manualmode-staging && podman-compose -f podman-compose-staging.yml exec mariadb mysql -u mcuser -p meaningful_conversations_staging'

db-shell-manualmode-production: ## Open MariaDB shell on manualmode production
	@ssh root@91.99.193.87 'cd /opt/manualmode-production && podman-compose -f podman-compose-production.yml exec mariadb mysql -u mcuser -p meaningful_conversations_production'

db-backup-manualmode-staging: ## Backup MariaDB on manualmode staging
	@echo "Backing up staging database..."
	@ssh root@91.99.193.87 'cd /opt/manualmode-staging && podman-compose -f podman-compose-staging.yml exec -T mariadb mysqldump -u root -p$${DB_ROOT_PASSWORD} meaningful_conversations_staging' > backup-manualmode-staging-$$(date +%Y%m%d-%H%M%S).sql
	@echo "Backup saved to: backup-manualmode-staging-$$(date +%Y%m%d-%H%M%S).sql"

db-backup-manualmode-production: ## Backup MariaDB on manualmode production
	@echo "Backing up production database..."
	@ssh root@91.99.193.87 'cd /opt/manualmode-production && podman-compose -f podman-compose-production.yml exec -T mariadb mysqldump -u root -p$${DB_ROOT_PASSWORD} meaningful_conversations_production' > backup-manualmode-production-$$(date +%Y%m%d-%H%M%S).sql
	@echo "Backup saved to: backup-manualmode-production-$$(date +%Y%m%d-%H%M%S).sql"

.DEFAULT_GOAL := help

