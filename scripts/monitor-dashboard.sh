#!/bin/bash
# Resource Monitoring Dashboard for Meaningful Conversations
# Shows real-time system and container resource usage
# Run: bash monitor-dashboard.sh [--once]

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Check if running once or continuous
ONCE_MODE=false
if [ "$1" = "--once" ]; then
    ONCE_MODE=true
fi

# Function to get color based on percentage
get_color() {
    local percent=$1
    if (( $(echo "$percent >= 90" | bc -l) )); then
        echo -e "${RED}"
    elif (( $(echo "$percent >= 75" | bc -l) )); then
        echo -e "${YELLOW}"
    else
        echo -e "${GREEN}"
    fi
}

# Function to create a simple progress bar
progress_bar() {
    local percent=$1
    local width=30
    local filled=$(printf "%.0f" $(echo "$percent * $width / 100" | bc -l))
    local empty=$((width - filled))
    local color=$(get_color $percent)
    
    echo -ne "${color}"
    printf '%*s' "$filled" '' | tr ' ' '█'
    echo -ne "${NC}"
    printf '%*s' "$empty" '' | tr ' ' '░'
    printf " %5.1f%%" "$percent"
}

# Function to display the dashboard
show_dashboard() {
    clear
    echo -e "${BOLD}${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════════╗"
    echo "║      Meaningful Conversations - Resource Monitor Dashboard       ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${WHITE}Server: 91.99.193.87 (manualmode)${NC}"
    echo -e "${WHITE}Updated: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo ""
    
    # System Resources
    echo -e "${BOLD}${MAGENTA}━━━ SYSTEM RESOURCES ━━━${NC}"
    echo ""
    
    # CPU Information
    local cpu_cores=$(nproc)
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_percent=$(echo "$load_avg * 100 / $cpu_cores" | bc -l)
    
    echo -e "${BOLD}CPU (${cpu_cores} cores):${NC}"
    echo -ne "  Load: "
    progress_bar "$cpu_percent"
    echo " (1-min avg: $load_avg)"
    echo ""
    
    # Memory Information
    local mem_info=$(free -m | grep Mem:)
    local total_mem=$(echo $mem_info | awk '{print $2}')
    local used_mem=$(echo $mem_info | awk '{print $3}')
    local free_mem=$(echo $mem_info | awk '{print $4}')
    local mem_percent=$(echo "scale=2; $used_mem * 100 / $total_mem" | bc)
    
    echo -e "${BOLD}Memory:${NC}"
    echo -ne "  Usage: "
    progress_bar "$mem_percent"
    echo -e " (${used_mem}M / ${total_mem}M)"
    echo ""
    
    # Swap Information
    local swap_info=$(free -m | grep Swap:)
    local total_swap=$(echo $swap_info | awk '{print $2}')
    
    if [ "$total_swap" -gt 0 ]; then
        local used_swap=$(echo $swap_info | awk '{print $3}')
        local swap_percent=$(echo "scale=2; $used_swap * 100 / $total_swap" | bc -l 2>/dev/null || echo "0")
        echo -e "${BOLD}Swap:${NC}"
        echo -ne "  Usage: "
        progress_bar "$swap_percent"
        echo -e " (${used_swap}M / ${total_swap}M)"
    else
        echo -e "${BOLD}Swap:${NC} ${RED}Not configured${NC}"
    fi
    echo ""
    
    # Disk Information
    local disk_info=$(df -h / | tail -1)
    local disk_percent=$(echo $disk_info | awk '{print $5}' | sed 's/%//')
    local disk_used=$(echo $disk_info | awk '{print $3}')
    local disk_total=$(echo $disk_info | awk '{print $2}')
    
    echo -e "${BOLD}Disk (/):${NC}"
    echo -ne "  Usage: "
    progress_bar "$disk_percent"
    echo -e " (${disk_used} / ${disk_total})"
    echo ""
    
    # Container Resources
    echo -e "${BOLD}${MAGENTA}━━━ PRODUCTION CONTAINERS ━━━${NC}"
    echo ""
    
    # Check if podman is available
    if command -v podman &> /dev/null; then
        # Production containers
        local prod_containers=("meaningful-conversations-frontend-production" "meaningful-conversations-backend-production" "meaningful-conversations-tts-production" "meaningful-conversations-mariadb-production")
        
        printf "  %-40s %8s %12s %8s\n" "CONTAINER" "CPU %" "MEM USAGE" "MEM %"
        printf "  ${WHITE}%s${NC}\n" "────────────────────────────────────────────────────────────────────"
        
        for container in "${prod_containers[@]}"; do
            if podman ps --format "{{.Names}}" | grep -q "^${container}$"; then
                local stats=$(podman stats --no-stream --format "{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}}" "$container" 2>/dev/null)
                if [ -n "$stats" ]; then
                    local cpu=$(echo $stats | cut -d',' -f1 | sed 's/%//')
                    local mem=$(echo $stats | cut -d',' -f2)
                    local mem_pct=$(echo $stats | cut -d',' -f3 | sed 's/%//')
                    
                    local status_color=$(get_color ${cpu%.*})
                    local short_name=$(echo $container | sed 's/meaningful-conversations-//' | sed 's/-production//')
                    
                    printf "  ${status_color}%-40s${NC} %7.1f%% %12s %7.1f%%\n" "$short_name" "$cpu" "$mem" "$mem_pct"
                fi
            else
                local short_name=$(echo $container | sed 's/meaningful-conversations-//' | sed 's/-production//')
                printf "  ${RED}%-40s STOPPED${NC}\n" "$short_name"
            fi
        done
        
        echo ""
        echo -e "${BOLD}${MAGENTA}━━━ STAGING CONTAINERS ━━━${NC}"
        echo ""
        
        # Staging containers
        local staging_containers=("meaningful-conversations-frontend-staging" "meaningful-conversations-backend-staging" "meaningful-conversations-tts-staging" "meaningful-conversations-mariadb-staging")
        
        printf "  %-40s %8s %12s %8s\n" "CONTAINER" "CPU %" "MEM USAGE" "MEM %"
        printf "  ${WHITE}%s${NC}\n" "────────────────────────────────────────────────────────────────────"
        
        for container in "${staging_containers[@]}"; do
            if podman ps --format "{{.Names}}" | grep -q "^${container}$"; then
                local stats=$(podman stats --no-stream --format "{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}}" "$container" 2>/dev/null)
                if [ -n "$stats" ]; then
                    local cpu=$(echo $stats | cut -d',' -f1 | sed 's/%//')
                    local mem=$(echo $stats | cut -d',' -f2)
                    local mem_pct=$(echo $stats | cut -d',' -f3 | sed 's/%//')
                    
                    local status_color=$(get_color ${cpu%.*})
                    local short_name=$(echo $container | sed 's/meaningful-conversations-//' | sed 's/-staging//')
                    
                    printf "  ${status_color}%-40s${NC} %7.1f%% %12s %7.1f%%\n" "$short_name" "$cpu" "$mem" "$mem_pct"
                fi
            else
                local short_name=$(echo $container | sed 's/meaningful-conversations-//' | sed 's/-staging//')
                printf "  ${RED}%-40s STOPPED${NC}\n" "$short_name"
            fi
        done
    else
        echo -e "${RED}  Podman not found. Cannot display container stats.${NC}"
    fi
    
    echo ""
    echo -e "${BOLD}${MAGENTA}━━━ RESOURCE ALERTS ━━━${NC}"
    echo ""
    
    # Check for alerts
    local alerts=0
    
    if (( $(echo "$cpu_percent >= 85" | bc -l) )); then
        echo -e "  ${RED}⚠ CPU load is HIGH (${cpu_percent}%)${NC}"
        alerts=$((alerts + 1))
    fi
    
    if (( $(echo "$mem_percent >= 85" | bc -l) )); then
        echo -e "  ${RED}⚠ Memory usage is HIGH (${mem_percent}%)${NC}"
        alerts=$((alerts + 1))
    fi
    
    if [ "$total_swap" -eq 0 ]; then
        echo -e "  ${YELLOW}⚠ No swap configured - risk of OOM kills${NC}"
        alerts=$((alerts + 1))
    elif [ "$total_swap" -gt 0 ] && (( $(echo "$swap_percent >= 50" | bc -l) )); then
        echo -e "  ${YELLOW}⚠ Swap usage is significant (${swap_percent}%)${NC}"
        alerts=$((alerts + 1))
    fi
    
    if (( disk_percent >= 85 )); then
        echo -e "  ${RED}⚠ Disk usage is HIGH (${disk_percent}%)${NC}"
        alerts=$((alerts + 1))
    fi
    
    if [ $alerts -eq 0 ]; then
        echo -e "  ${GREEN}✓ All systems operating normally${NC}"
    fi
    
    echo ""
    
    if [ "$ONCE_MODE" = false ]; then
        echo -e "${WHITE}Press Ctrl+C to exit | Refreshing every 5 seconds...${NC}"
    fi
}

# Main loop
if [ "$ONCE_MODE" = true ]; then
    show_dashboard
else
    while true; do
        show_dashboard
        sleep 5
    done
fi

