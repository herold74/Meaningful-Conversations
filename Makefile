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

setup: ## Initial setup - copy config template
	@if [ ! -f deploy-config.env ]; then \
		cp deploy-config.env.example deploy-config.env; \
		echo "$(GREEN)✓ Created deploy-config.env - Please edit with your values$(NC)"; \
		echo "$(YELLOW)⚠ Don't forget to fill in:$(NC)"; \
		echo "  - DOCKER_USERNAME"; \
		echo "  - GCLOUD_PROJECT (if using Cloud Run)"; \
		echo "  - SSH_HOST (if using SSH)"; \
	else \
		echo "$(YELLOW)deploy-config.env already exists$(NC)"; \
	fi
	@if [ ! -f .env ]; then \
		echo "DB_PASSWORD=changeme" > .env; \
		echo "JWT_SECRET=changeme" >> .env; \
		echo "GEMINI_API_KEY=changeme" >> .env; \
		echo "$(GREEN)✓ Created .env - Please edit with your values$(NC)"; \
	else \
		echo "$(YELLOW).env already exists$(NC)"; \
	fi

build: ## Build container images locally
	@echo "$(GREEN)Building backend...$(NC)"
	@$(CONTAINER_ENGINE) build -t meaningful-conversations-backend:latest ./meaningful-conversations-backend
	@echo "$(GREEN)Building frontend...$(NC)"
	@$(CONTAINER_ENGINE) build -t meaningful-conversations-frontend:latest .
	@echo "$(GREEN)✓ Build complete$(NC)"

build-no-cache: ## Build container images without cache
	@echo "$(GREEN)Building backend (no cache)...$(NC)"
	@$(CONTAINER_ENGINE) build --no-cache -t meaningful-conversations-backend:latest ./meaningful-conversations-backend
	@echo "$(GREEN)Building frontend (no cache)...$(NC)"
	@$(CONTAINER_ENGINE) build --no-cache -t meaningful-conversations-frontend:latest .
	@echo "$(GREEN)✓ Build complete$(NC)"

deploy: ## Full deployment (build, push, deploy)
	@./deploy.sh

deploy-gcloud: ## Deploy to Google Cloud Run
	@./deploy.sh --target gcloud

deploy-ssh: ## Deploy via SSH to remote server
	@./deploy.sh --target ssh

# ============ AUTOMATED DEPLOYMENT (NEW) ============

deploy-staging: ## Deploy all to staging (automated)
	@./deploy-auto.sh -e staging

deploy-production: ## Deploy all to production (automated)
	@./deploy-auto.sh -e production

deploy-frontend-staging: ## Deploy only frontend to staging (fast)
	@./deploy-auto.sh -e staging -c frontend

deploy-frontend-prod: ## Deploy only frontend to production
	@./deploy-auto.sh -e production -c frontend

deploy-backend-staging: ## Deploy only backend to staging
	@./deploy-auto.sh -e staging -c backend

deploy-backend-prod: ## Deploy only backend to production
	@./deploy-auto.sh -e production -c backend

quick-deploy-frontend: ## Quick deploy frontend to staging (no rebuild)
	@./deploy-auto.sh -e staging -c frontend --skip-build

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

push: ## Push images to registry
	@echo "$(GREEN)Pushing images...$(NC)"
	@./deploy.sh --skip-build

version: ## Show current version
	@echo "Frontend version: $$(cat package.json | grep version | head -1 | awk -F: '{ print $$2 }' | sed 's/[\",]//g' | tr -d '[[:space:]]')"
	@echo "Backend version: $$(cat meaningful-conversations-backend/package.json | grep version | head -1 | awk -F: '{ print $$2 }' | sed 's/[\",]//g' | tr -d '[[:space:]]')"

update-version: ## Update version everywhere in the application
	@read -p "Enter new version (e.g., 1.4.9): " VERSION; \
	if [ -n "$$VERSION" ]; then \
		echo "$(YELLOW)Updating version to $$VERSION in all files...$(NC)"; \
		sed -i.bak "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$$VERSION\"/" package.json && rm package.json.bak; \
		sed -i.bak "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$$VERSION\"/" meaningful-conversations-backend/package.json && rm meaningful-conversations-backend/package.json.bak; \
		sed -i.bak "s/cache-v[0-9]*\.[0-9]*\.[0-9]*-pwa-fix/cache-v$$VERSION-pwa-fix/" public/sw.js && rm public/sw.js.bak; \
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

# ============ ALTERNATIVE SERVER DEPLOYMENT ============

deploy-alternative-staging: ## Deploy to alternative server staging
	@./deploy-alternative.sh -e staging

deploy-alternative-production: ## Deploy to alternative server production
	@./deploy-alternative.sh -e production

deploy-alternative-staging-frontend: ## Deploy frontend to alternative staging
	@./deploy-alternative.sh -e staging -c frontend

deploy-alternative-production-frontend: ## Deploy frontend to alternative production
	@./deploy-alternative.sh -e production -c frontend

deploy-alternative-staging-backend: ## Deploy backend to alternative staging
	@./deploy-alternative.sh -e staging -c backend

deploy-alternative-production-backend: ## Deploy backend to alternative production
	@./deploy-alternative.sh -e production -c backend

deploy-alternative-dry-run: ## Test deployment to alternative server (no changes)
	@./deploy-alternative.sh --dry-run

# Legacy command (defaults to staging)
deploy-alternative: ## Deploy to alternative server (defaults to staging)
	@./deploy-alternative.sh

logs-alternative-staging: ## View logs from alternative server staging
	@ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && podman-compose -f podman-compose-staging.yml logs -f'

logs-alternative-production: ## View logs from alternative server production
	@ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && podman-compose -f podman-compose-production.yml logs -f'

status-alternative-staging: ## Check status on alternative server staging
	@ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && podman-compose -f podman-compose-staging.yml ps'

status-alternative-production: ## Check status on alternative server production
	@ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && podman-compose -f podman-compose-production.yml ps'

restart-alternative-staging: ## Restart staging services on alternative server
	@ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && podman-compose -f podman-compose-staging.yml restart'

restart-alternative-production: ## Restart production services on alternative server
	@ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && podman-compose -f podman-compose-production.yml restart'

stop-alternative-staging: ## Stop staging services on alternative server
	@ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && podman-compose -f podman-compose-staging.yml down'

stop-alternative-production: ## Stop production services on alternative server
	@ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && podman-compose -f podman-compose-production.yml down'

pod-status-alternative: ## Check pod status on alternative server (both envs)
	@ssh root@46.224.37.130 'podman pod ps && echo "" && podman ps --pod'

db-shell-alternative-staging: ## Open MariaDB shell on alternative staging
	@ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && podman-compose -f podman-compose-staging.yml exec mariadb mysql -u mcuser -p meaningful_conversations_staging'

db-shell-alternative-production: ## Open MariaDB shell on alternative production
	@ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && podman-compose -f podman-compose-production.yml exec mariadb mysql -u mcuser -p meaningful_conversations_production'

db-backup-alternative-staging: ## Backup MariaDB on alternative staging
	@echo "Backing up staging database..."
	@ssh root@46.224.37.130 'cd /opt/meaningful-conversations-staging && podman-compose -f podman-compose-staging.yml exec -T mariadb mysqldump -u root -p$${DB_ROOT_PASSWORD} meaningful_conversations_staging' > backup-alternative-staging-$$(date +%Y%m%d-%H%M%S).sql
	@echo "Backup saved to: backup-alternative-staging-$$(date +%Y%m%d-%H%M%S).sql"

db-backup-alternative-production: ## Backup MariaDB on alternative production
	@echo "Backing up production database..."
	@ssh root@46.224.37.130 'cd /opt/meaningful-conversations-production && podman-compose -f podman-compose-production.yml exec -T mariadb mysqldump -u root -p$${DB_ROOT_PASSWORD} meaningful_conversations_production' > backup-alternative-production-$$(date +%Y%m%d-%H%M%S).sql
	@echo "Backup saved to: backup-alternative-production-$$(date +%Y%m%d-%H%M%S).sql"

.DEFAULT_GOAL := help

