#!/bin/bash

# Meaningful Conversations - Screenshot Capture Helper
# This script helps organize and document the screenshot capture process

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directory paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCREENSHOTS_DIR="$PROJECT_ROOT/screenshots"

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Meaningful Conversations - Screenshot Helper      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if servers are running
check_servers() {
    echo -e "${YELLOW}🔍 Checking if servers are running...${NC}"
    
    # Check frontend
    if lsof -i:5173 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is running on port 5173${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend is NOT running${NC}"
        echo -e "${BLUE}   Start with: npm run dev${NC}"
    fi
    
    # Check backend
    if lsof -i:3001 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is running on port 3001${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend is NOT running${NC}"
        echo -e "${BLUE}   Start with: cd meaningful-conversations-backend && npm start${NC}"
    fi
    
    echo ""
}

# Function to show screenshot directories and counts
show_progress() {
    echo -e "${YELLOW}📊 Screenshot Progress:${NC}"
    echo ""
    
    total=0
    for dir in "$SCREENSHOTS_DIR"/*/; do
        if [ -d "$dir" ]; then
            dirname=$(basename "$dir")
            count=$(find "$dir" -maxdepth 1 -type f \( -name "*.png" -o -name "*.jpg" \) 2>/dev/null | wc -l | tr -d ' ')
            total=$((total + count))
            
            if [ "$count" -gt 0 ]; then
                echo -e "  ${GREEN}✓${NC} $dirname: $count screenshot(s)"
            else
                echo -e "  ${YELLOW}○${NC} $dirname: $count screenshot(s)"
            fi
        fi
    done
    
    echo ""
    echo -e "${BLUE}Total: $total screenshots captured${NC}"
    echo ""
}

# Function to open helpful URLs
open_urls() {
    echo -e "${YELLOW}🌐 Opening helpful URLs...${NC}"
    
    # Frontend
    open "http://localhost:5173" 2>/dev/null || echo "Open http://localhost:5173 in your browser"
    
    # User journey documentation
    echo -e "${BLUE}📖 User journey guide: $PROJECT_ROOT/USER-JOURNEY.md${NC}"
    
    echo ""
}

# Function to show keyboard shortcuts
show_shortcuts() {
    echo -e "${YELLOW}⌨️  Screenshot Keyboard Shortcuts:${NC}"
    echo ""
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        echo "  📸 Selected area:   Cmd + Shift + 4"
        echo "  📸 Full screen:     Cmd + Shift + 3"
        echo "  📸 Window:          Cmd + Shift + 4, then Space"
        echo ""
        echo "  Chrome DevTools:"
        echo "  📱 Toggle device:   Cmd + Shift + M"
        echo "  🔍 Inspect:         Cmd + Option + I"
    else
        # Windows/Linux
        echo "  📸 Snipping tool:   Win + Shift + S"
        echo ""
        echo "  Chrome DevTools:"
        echo "  📱 Toggle device:   Ctrl + Shift + M"
        echo "  🔍 Inspect:         Ctrl + Shift + I"
    fi
    
    echo ""
}

# Function to show next steps
show_next_steps() {
    echo -e "${YELLOW}📝 Recommended Screenshot Order:${NC}"
    echo ""
    echo "  1. 01-landing        - Landing page"
    echo "  2. 02-auth           - Login/Register flows"
    echo "  3. 03-context-setup  - Life Context creation"
    echo "  4. 04-bot-selection  - Choose AI coach"
    echo "  5. 05-chat           - Active conversation"
    echo "  6. 06-session-review - AI insights and updates"
    echo "  7. 07-achievements   - Gamification"
    echo "  8. 08-admin          - Admin console & API usage"
    echo "  9. 09-mobile         - Responsive views"
    echo ""
    echo -e "${BLUE}📖 See USER-JOURNEY.md for detailed checklists${NC}"
    echo ""
}

# Main menu
show_menu() {
    echo -e "${YELLOW}What would you like to do?${NC}"
    echo ""
    echo "  1) Check server status"
    echo "  2) Show screenshot progress"
    echo "  3) Open app in browser"
    echo "  4) Show keyboard shortcuts"
    echo "  5) Show recommended order"
    echo "  6) Open screenshots directory"
    echo "  7) View user journey guide"
    echo "  8) Exit"
    echo ""
}

# Main loop
while true; do
    show_menu
    read -p "Enter choice [1-8]: " choice
    echo ""
    
    case $choice in
        1)
            check_servers
            ;;
        2)
            show_progress
            ;;
        3)
            open_urls
            ;;
        4)
            show_shortcuts
            ;;
        5)
            show_next_steps
            ;;
        6)
            open "$SCREENSHOTS_DIR" 2>/dev/null || echo "Screenshots directory: $SCREENSHOTS_DIR"
            echo ""
            ;;
        7)
            if command -v code >/dev/null 2>&1; then
                code "$PROJECT_ROOT/USER-JOURNEY.md"
            elif command -v open >/dev/null 2>&1; then
                open "$PROJECT_ROOT/USER-JOURNEY.md"
            else
                echo "User journey guide: $PROJECT_ROOT/USER-JOURNEY.md"
            fi
            echo ""
            ;;
        8)
            echo -e "${GREEN}✅ Happy screenshotting! 📸${NC}"
            echo ""
            exit 0
            ;;
        *)
            echo -e "${YELLOW}Invalid choice. Please try again.${NC}"
            echo ""
            ;;
    esac
done

