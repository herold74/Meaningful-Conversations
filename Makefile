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

# ============ MEANINGFUL CONVERSATIONS DEPLOYMENT ============

deploy-staging: ## Deploy to staging environment
	@./deploy-manualmode.sh -e staging

deploy-production: ## Deploy to production environment
	@./deploy-manualmode.sh -e production

deploy-staging-frontend: ## Deploy frontend to staging
	@./deploy-manualmode.sh -e staging -c frontend

deploy-production-frontend: ## Deploy frontend to production
	@./deploy-manualmode.sh -e production -c frontend

deploy-staging-backend: ## Deploy backend to staging
	@./deploy-manualmode.sh -e staging -c backend

deploy-production-backend: ## Deploy backend to production
	@./deploy-manualmode.sh -e production -c backend

deploy-staging-tts: ## Deploy TTS service to staging
	@./deploy-manualmode.sh -e staging -c tts

deploy-production-tts: ## Deploy TTS service to production
	@./deploy-manualmode.sh -e production -c tts

deploy-dry-run: ## Test deployment (no changes)
	@./deploy-manualmode.sh --dry-run

# Legacy aliases for backward compatibility
deploy-manualmode-staging: deploy-staging
deploy-manualmode-production: deploy-production
deploy-manualmode: deploy-staging

logs-staging: ## View logs from staging
	@ssh root@91.99.193.87 'cd /opt/manualmode-staging && podman-compose -f podman-compose-staging.yml logs -f'

logs-production: ## View logs from production
	@ssh root@91.99.193.87 'cd /opt/manualmode-production && podman-compose -f podman-compose-production.yml logs -f'

status-staging: ## Check status on staging
	@ssh root@91.99.193.87 'cd /opt/manualmode-staging && podman-compose -f podman-compose-staging.yml ps'

status-production: ## Check status on production
	@ssh root@91.99.193.87 'cd /opt/manualmode-production && podman-compose -f podman-compose-production.yml ps'

restart-staging: ## Restart staging with automatic Nginx IP update
	@echo "$(GREEN)Restarting staging with automatic Nginx update...$(NC)"
	@ssh root@91.99.193.87 'bash /opt/manualmode-production/scripts/restart-with-nginx-update.sh staging'

restart-production: ## Restart production with automatic Nginx IP update
	@echo "$(YELLOW)⚠ WARNING: This will restart production services!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		ssh root@91.99.193.87 'bash /opt/manualmode-production/scripts/restart-with-nginx-update.sh production'; \
	else \
		echo "$(BLUE)ℹ Restart cancelled$(NC)"; \
	fi

restart-staging-backend: ## Restart only staging backend with Nginx update
	@echo "$(GREEN)Restarting staging backend...$(NC)"
	@ssh root@91.99.193.87 'bash /opt/manualmode-production/scripts/restart-with-nginx-update.sh staging backend'

restart-production-backend: ## Restart only production backend with Nginx update
	@echo "$(YELLOW)⚠ WARNING: This will restart production backend!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		ssh root@91.99.193.87 'bash /opt/manualmode-production/scripts/restart-with-nginx-update.sh production backend'; \
	else \
		echo "$(BLUE)ℹ Restart cancelled$(NC)"; \
	fi

stop-staging: ## Stop staging services
	@ssh root@91.99.193.87 'cd /opt/manualmode-staging && podman-compose -f podman-compose-staging.yml down'

stop-production: ## Stop production services
	@ssh root@91.99.193.87 'cd /opt/manualmode-production && podman-compose -f podman-compose-production.yml down'

pod-status: ## Check pod status (both environments)
	@ssh root@91.99.193.87 'podman pod ps && echo "" && podman ps --pod'

db-shell-staging: ## Open MariaDB shell on staging
	@ssh root@91.99.193.87 'cd /opt/manualmode-staging && podman-compose -f podman-compose-staging.yml exec mariadb mariadb -u mcuser -p meaningful_conversations_staging'

db-shell-production: ## Open MariaDB shell on production
	@ssh root@91.99.193.87 'cd /opt/manualmode-production && podman-compose -f podman-compose-production.yml exec mariadb mariadb -u mcuser -p meaningful_conversations_production'

db-backup-staging: ## Backup MariaDB on staging
	@echo "Backing up staging database..."
	@ssh root@91.99.193.87 'cd /opt/manualmode-staging && podman-compose -f podman-compose-staging.yml exec -T mariadb mariadb-dump -u root -p$${DB_ROOT_PASSWORD} meaningful_conversations_staging' > backup-staging-$$(date +%Y%m%d-%H%M%S).sql
	@echo "Backup saved to: backup-staging-$$(date +%Y%m%d-%H%M%S).sql"

db-backup-production: ## Backup MariaDB on production
	@echo "Backing up production database..."
	@ssh root@91.99.193.87 'cd /opt/manualmode-production && podman-compose -f podman-compose-production.yml exec -T mariadb mariadb-dump -u root -p$${DB_ROOT_PASSWORD} meaningful_conversations_production' > backup-production-$$(date +%Y%m%d-%H%M%S).sql
	@echo "Backup saved to: backup-production-$$(date +%Y%m%d-%H%M%S).sql"

# Legacy aliases for backward compatibility
logs-manualmode-staging: logs-staging
logs-manualmode-production: logs-production
status-manualmode-staging: status-staging
status-manualmode-production: status-production
restart-manualmode-staging: restart-staging
restart-manualmode-production: restart-production
restart-manualmode-staging-backend: restart-staging-backend
restart-manualmode-production-backend: restart-production-backend
stop-manualmode-staging: stop-staging
stop-manualmode-production: stop-production
pod-status-manualmode: pod-status
db-shell-manualmode-staging: db-shell-staging
db-shell-manualmode-production: db-shell-production
db-backup-manualmode-staging: db-backup-staging
db-backup-manualmode-production: db-backup-production

# ============ MONITORING & RESOURCE MANAGEMENT ============

monitor-dashboard: ## Show interactive resource monitoring dashboard (local)
	@bash scripts/monitor-dashboard.sh

monitor-dashboard-remote: ## Show resource dashboard on remote server
	@ssh -t root@91.99.193.87 'bash /opt/manualmode-production/scripts/monitor-dashboard.sh'

monitor-stats: ## Show container stats on remote server
	@ssh root@91.99.193.87 'podman stats --no-stream'

monitor-system: ## Show system resources on remote server
	@ssh root@91.99.193.87 'free -h && echo "---" && uptime && echo "---" && df -h /'

setup-swap: ## Setup 4GB swap on remote server
	@echo "$(YELLOW)Setting up swap on remote server...$(NC)"
	@scp scripts/setup-swap.sh root@91.99.193.87:/tmp/
	@ssh root@91.99.193.87 'bash /tmp/setup-swap.sh && rm /tmp/setup-swap.sh'

# Legacy aliases
monitor-dashboard-manualmode: monitor-dashboard-remote
monitor-stats-manualmode: monitor-stats
monitor-system-manualmode: monitor-system
setup-swap-manualmode: setup-swap

.DEFAULT_GOAL := help

