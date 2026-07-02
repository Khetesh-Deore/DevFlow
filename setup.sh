#!/bin/bash

# =============================================================================
#  DevFlow - Complete Ubuntu Setup Script
#  Installs: Node.js 20, Python 3.11, MongoDB 7, Git
#  Sets up:  Backend (Express), Frontend (React/Vite), Judge (FastAPI)
# =============================================================================

set -e  # Exit immediately if any command fails

# ---- Colors ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

print_header()  { echo ""; echo -e "${BOLD}${BLUE}========================================${NC}"; echo -e "${BOLD}${BLUE}  $1${NC}"; echo -e "${BOLD}${BLUE}========================================${NC}"; echo ""; }
print_step()    { echo -e "${CYAN}[STEP] $1${NC}"; }
print_success() { echo -e "${GREEN}[OK]   $1${NC}"; }
print_warning() { echo -e "${YELLOW}[WARN] $1${NC}"; }

# =============================================================================
#  CONFIG — EDIT THESE BEFORE RUNNING
# =============================================================================

GITHUB_REPO="https://github.com/Khetesh-Deore/DevFlow.git"
PROJECT_DIR="$HOME/DevFlow"

# ---- Database Mode ----
# "local"  = use local MongoDB on this machine (recommended for college)
# "atlas"  = use MongoDB Atlas cloud
DB_MODE="local"

# Local MongoDB settings (used when DB_MODE=local)
LOCAL_DB_NAME="devflow"
MONGO_URI_LOCAL="mongodb://localhost:27017/devflow"

# Atlas fallback (only used if DB_MODE=atlas)
MONGO_URI_ATLAS=""

# Set active URI based on mode
if [ "$DB_MODE" = "local" ]; then
  MONGO_URI="$MONGO_URI_LOCAL"
else
  MONGO_URI="$MONGO_URI_ATLAS"
fi

# Backend settings
JWT_SECRET="devflow_create_a_random_string_at_least_32_characters_long"
JWT_EXPIRE="7d"
JUDGE_API_KEY="judge_internal_secret_key_change_this"
CLIENT_URL="http://localhost:5173"
EMAIL_USER=""
EMAIL_PASS=""

# Judge settings
JUDGE_MAX_CONCURRENT=5
JUDGE_TIMEOUT=5

# Ports
BACKEND_PORT=5000
JUDGE_PORT=8000
FRONTEND_PORT=5173

# Export file to import (filename inside backend/exports/)
# Set this to your latest export file name, or leave empty to skip import
EXPORT_FILE="database-export-2026-04-21T13-48-19.json"

# =============================================================================
#  STEP 1 - System Update
# =============================================================================
print_header "STEP 1: Update System Packages"
sudo apt update -y
sudo apt upgrade -y
sudo apt install -y curl wget git build-essential software-properties-common gnupg lsb-release ca-certificates unzip
print_success "System updated"

# =============================================================================
#  STEP 2 - Node.js 20 via NVM
# =============================================================================
print_header "STEP 2: Install Node.js 20 via NVM"

if [ ! -d "$HOME/.nvm" ]; then
  print_step "Installing NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
else
  print_warning "NVM already exists, skipping install"
fi

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

if ! grep -q 'NVM_DIR' "$HOME/.bashrc"; then
  {
    echo ''
    echo '# NVM'
    echo 'export NVM_DIR="$HOME/.nvm"'
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"'
    echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"'
  } >> "$HOME/.bashrc"
fi

nvm install 20
nvm use 20
nvm alias default 20
print_success "Node.js $(node -v) ready"
print_success "npm $(npm -v) ready"

# =============================================================================
#  STEP 3 - Python 3.11
# =============================================================================
print_header "STEP 3: Install Python 3.11"

if ! python3.11 --version &>/dev/null; then
  print_step "Adding deadsnakes PPA..."
  sudo add-apt-repository ppa:deadsnakes/ppa -y
  sudo apt update -y
  sudo apt install -y python3.11 python3.11-venv python3.11-dev
  print_success "Python 3.11 installed"
else
  print_warning "Python 3.11 already installed: $(python3.11 --version)"
fi

print_step "Installing pip for Python 3.11..."
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11
print_success "pip ready"

# =============================================================================
#  STEP 4 - Install MongoDB 7 (local)
# =============================================================================
print_header "STEP 4: Install MongoDB 7 (Local)"

if [ "$DB_MODE" = "local" ]; then

  if mongod --version &>/dev/null; then
    print_warning "MongoDB already installed: $(mongod --version | head -1)"
  else
    print_step "Adding MongoDB 7.0 GPG key..."
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc \
      | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

    # Detect Ubuntu version and use correct repo
    UBUNTU_CODENAME=$(lsb_release -cs)
    # MongoDB 7 supports focal (20.04) and jammy (22.04)
    # If on newer Ubuntu, fall back to jammy
    if [[ "$UBUNTU_CODENAME" != "focal" && "$UBUNTU_CODENAME" != "jammy" ]]; then
      print_warning "Ubuntu $UBUNTU_CODENAME detected - using jammy repo for MongoDB"
      UBUNTU_CODENAME="jammy"
    fi

    print_step "Adding MongoDB 7.0 repo for Ubuntu $UBUNTU_CODENAME..."
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
https://repo.mongodb.org/apt/ubuntu ${UBUNTU_CODENAME}/mongodb-org/7.0 multiverse" \
      | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

    sudo apt update -y
    sudo apt install -y mongodb-org
    print_success "MongoDB 7.0 installed"
  fi

  print_step "Starting MongoDB service..."
  sudo systemctl start mongod
  sudo systemctl enable mongod
  sleep 3

  if sudo systemctl is-active --quiet mongod; then
    print_success "MongoDB is RUNNING on localhost:27017"
  else
    print_warning "MongoDB failed to start. Trying manual start..."
    sudo mongod --dbpath /var/lib/mongodb --logpath /var/log/mongodb/mongod.log --fork
    sleep 2
    print_warning "Check: sudo systemctl status mongod"
  fi

else
  print_warning "DB_MODE=atlas — skipping local MongoDB install"
  print_warning "Make sure this machine has internet access to reach MongoDB Atlas"
fi

# =============================================================================
#  STEP 5 - Clone Repository
# =============================================================================
print_header "STEP 5: Clone GitHub Repository"

if [ -d "$PROJECT_DIR" ]; then
  print_warning "Project directory exists: $PROJECT_DIR"
  read -p "Delete and re-clone? (y/N): " confirm
  if [[ "$confirm" =~ ^[Yy]$ ]]; then
    rm -rf "$PROJECT_DIR"
    git clone "$GITHUB_REPO" "$PROJECT_DIR"
    print_success "Repository cloned fresh"
  else
    cd "$PROJECT_DIR" && git pull
    print_success "Repository pulled latest changes"
  fi
else
  print_step "Cloning: $GITHUB_REPO"
  git clone "$GITHUB_REPO" "$PROJECT_DIR"
  print_success "Repository cloned to $PROJECT_DIR"
fi

# =============================================================================
#  STEP 6 - Backend .env
# =============================================================================
print_header "STEP 6: Configure Backend .env"

BACKEND_ENV="$PROJECT_DIR/backend/.env"

if [ ! -f "$BACKEND_ENV" ]; then
  cat > "$BACKEND_ENV" <<ENVEOF
NODE_ENV=development
PORT=$BACKEND_PORT
MONGO_URI=$MONGO_URI
JWT_SECRET=$JWT_SECRET
JWT_EXPIRE=$JWT_EXPIRE
JUDGE_SERVICE_URL=http://localhost:$JUDGE_PORT
JUDGE_API_KEY=$JUDGE_API_KEY
CLIENT_URL=$CLIENT_URL
EMAIL_SERVICE=gmail
EMAIL_USER=$EMAIL_USER
EMAIL_PASS=$EMAIL_PASS
ENVEOF
  print_success "backend/.env created"
else
  print_warning "backend/.env already exists — skipping"
fi

# =============================================================================
#  STEP 7 - Frontend .env
# =============================================================================
print_header "STEP 7: Configure Frontend .env"

FRONTEND_ENV="$PROJECT_DIR/frontend/.env"

if [ ! -f "$FRONTEND_ENV" ]; then
  cat > "$FRONTEND_ENV" <<ENVEOF
VITE_API_URL=http://localhost:$BACKEND_PORT/api/v1
VITE_SOCKET_URL=http://localhost:$BACKEND_PORT
ENVEOF
  print_success "frontend/.env created"
else
  print_warning "frontend/.env already exists — skipping"
fi

# =============================================================================
#  STEP 8 - Judge .env
# =============================================================================
print_header "STEP 8: Configure Judge .env"

JUDGE_ENV="$PROJECT_DIR/judge/.env"

if [ ! -f "$JUDGE_ENV" ]; then
  cat > "$JUDGE_ENV" <<ENVEOF
API_KEY=$JUDGE_API_KEY
MAX_CONCURRENT_JOBS=$JUDGE_MAX_CONCURRENT
DEFAULT_TIMEOUT_SEC=$JUDGE_TIMEOUT
ENVEOF
  print_success "judge/.env created"
else
  print_warning "judge/.env already exists — skipping"
fi

# =============================================================================
#  STEP 9 - Backend npm install
# =============================================================================
print_header "STEP 9: Install Backend Dependencies"
cd "$PROJECT_DIR/backend"
npm install
print_success "Backend node_modules installed"

# =============================================================================
#  STEP 10 - Frontend npm install
# =============================================================================
print_header "STEP 10: Install Frontend Dependencies"
cd "$PROJECT_DIR/frontend"
npm install
print_success "Frontend node_modules installed"

# =============================================================================
#  STEP 11 - Setup Judge Python Environment
# =============================================================================
print_header "STEP 11: Setup Judge Python Environment"
cd "$PROJECT_DIR/judge"

if [ ! -d "venv" ]; then
  python3.11 -m venv venv
  print_success "Python venv created"
else
  print_warning "venv already exists"
fi

./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt
print_success "Judge Python dependencies installed"

# =============================================================================
#  STEP 11b - Import existing data into local MongoDB
# =============================================================================
print_header "STEP 11b: Import Database into Local MongoDB"

if [ "$DB_MODE" = "local" ] && [ -n "$EXPORT_FILE" ]; then

  EXPORT_PATH="$PROJECT_DIR/backend/exports/$EXPORT_FILE"

  if [ -f "$EXPORT_PATH" ]; then
    print_step "Found export file: $EXPORT_FILE"
    print_step "Importing data into local MongoDB (mongodb://localhost:27017/devflow)..."
    echo ""
    print_warning "This will replace any existing data in the local DB."
    print_warning "Waiting 5 seconds — press Ctrl+C to cancel..."
    sleep 5

    # Temporarily set MONGO_URI to local in .env for import
    cd "$PROJECT_DIR/backend"

    # Run import script — it reads MONGO_URI from .env which already points to local
    node scripts/importDatabase.js "$EXPORT_FILE"
    print_success "Database imported successfully!"
    echo ""
    print_success "Your Atlas data is now available locally."
  else
    print_warning "Export file not found: $EXPORT_PATH"
    print_warning "Skipping import. You can import manually later:"
    print_warning "  cd $PROJECT_DIR/backend"
    print_warning "  node scripts/importDatabase.js <filename>"
  fi

elif [ "$DB_MODE" = "local" ] && [ -z "$EXPORT_FILE" ]; then
  print_warning "EXPORT_FILE is empty in config — skipping data import"
  print_warning "Local MongoDB is running but empty"
  print_warning "To import data later:"
  print_warning "  cd $PROJECT_DIR/backend"
  print_warning "  node scripts/importDatabase.js database-export-2026-04-21T13-48-19.json"

else
  print_warning "Using Atlas mode — skipping local import"
fi

# =============================================================================
#  STEP 12 - Install nodemon globally
# =============================================================================
print_header "STEP 12: Install Global npm Tools"
npm install -g nodemon
print_success "nodemon installed: $(nodemon --version)"

# =============================================================================
#  STEP 13 - Create start/stop scripts
# =============================================================================
print_header "STEP 13: Create Start/Stop Scripts"

# start-backend.sh
cat > "$PROJECT_DIR/start-backend.sh" <<'SCRIPTEOF'
#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd "$(dirname "$0")/backend"
echo "Starting Backend on port 5000..."
npm run dev
SCRIPTEOF
chmod +x "$PROJECT_DIR/start-backend.sh"

# start-frontend.sh
cat > "$PROJECT_DIR/start-frontend.sh" <<'SCRIPTEOF'
#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd "$(dirname "$0")/frontend"
echo "Starting Frontend on port 5173..."
npm run dev
SCRIPTEOF
chmod +x "$PROJECT_DIR/start-frontend.sh"

# start-judge.sh
cat > "$PROJECT_DIR/start-judge.sh" <<'SCRIPTEOF'
#!/bin/bash
cd "$(dirname "$0")/judge"
echo "Starting Judge Service on port 8000..."
./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
SCRIPTEOF
chmod +x "$PROJECT_DIR/start-judge.sh"

# start-all.sh
cat > "$PROJECT_DIR/start-all.sh" <<'SCRIPTEOF'
#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

DIR="$(dirname "$0")"

echo ""
echo "Starting all DevFlow services..."
echo ""

# Judge
echo "[1/3] Judge Service (port 8000)..."
cd "$DIR/judge"
./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 &
JUDGE_PID=$!
sleep 2

# Backend
echo "[2/3] Backend (port 5000)..."
cd "$DIR/backend"
npm run dev &
BACKEND_PID=$!
sleep 2

# Frontend
echo "[3/3] Frontend (port 5173)..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo "$JUDGE_PID $BACKEND_PID $FRONTEND_PID" > "$DIR/.pids"

echo ""
echo "All services running!"
echo ""
echo "  Frontend  -> http://localhost:5173"
echo "  Backend   -> http://localhost:5000"
echo "  Judge     -> http://localhost:8000"
echo "  API       -> http://localhost:5000/api/v1"
echo ""
echo "  Stop all  -> ./stop-all.sh"
echo ""

wait
SCRIPTEOF
chmod +x "$PROJECT_DIR/start-all.sh"

# stop-all.sh
cat > "$PROJECT_DIR/stop-all.sh" <<'SCRIPTEOF'
#!/bin/bash
DIR="$(dirname "$0")"
if [ -f "$DIR/.pids" ]; then
  PIDS=$(cat "$DIR/.pids")
  echo "Stopping services (PIDs: $PIDS)..."
  kill $PIDS 2>/dev/null
  rm "$DIR/.pids"
  echo "Done"
else
  echo "Killing by port..."
  fuser -k 5173/tcp 2>/dev/null && echo "Stopped port 5173 (Frontend)" || true
  fuser -k 5000/tcp 2>/dev/null && echo "Stopped port 5000 (Backend)" || true
  fuser -k 8000/tcp 2>/dev/null && echo "Stopped port 8000 (Judge)" || true
  echo "Done"
fi
SCRIPTEOF
chmod +x "$PROJECT_DIR/stop-all.sh"

# switch-db.sh
cat > "$PROJECT_DIR/switch-db.sh" <<SCRIPTEOF
#!/bin/bash
# Usage:
#   ./switch-db.sh local   -- switch to local MongoDB
#   ./switch-db.sh atlas   -- switch to MongoDB Atlas

DIR="\$(dirname "\$0")"
ENV_FILE="\$DIR/backend/.env"

LOCAL_URI="mongodb://localhost:27017/devflow"
ATLAS_URI="$MONGO_URI_ATLAS"

if [ -z "\$1" ]; then
  CURRENT=\$(grep "^MONGO_URI=" "\$ENV_FILE" | cut -d= -f2-)
  echo "Current MONGO_URI: \$CURRENT"
  echo ""
  echo "Usage: ./switch-db.sh local | atlas"
  exit 0
fi

if [ "\$1" = "local" ]; then
  sed -i "s|^MONGO_URI=.*|MONGO_URI=\$LOCAL_URI|" "\$ENV_FILE"
  echo "Switched to LOCAL MongoDB (localhost:27017)"
  echo "Make sure MongoDB is running:  sudo systemctl start mongod"

elif [ "\$1" = "atlas" ]; then
  sed -i "s|^MONGO_URI=.*|MONGO_URI=\$ATLAS_URI|" "\$ENV_FILE"
  echo "Switched to MongoDB ATLAS (cloud)"
  echo "Make sure this machine has internet access"

else
  echo "Unknown: \$1 — use: local | atlas"
  exit 1
fi

echo ""
echo "Restart the backend for changes to take effect."
SCRIPTEOF
chmod +x "$PROJECT_DIR/switch-db.sh"

print_success "All startup scripts created"
# =============================================================================
print_header "STEP 14: Verification Summary"

echo -e "  Node.js  : ${GREEN}$(node -v)${NC}"
echo -e "  npm      : ${GREEN}$(npm -v)${NC}"
echo -e "  Python   : ${GREEN}$(python3.11 --version)${NC}"
echo -e "  Git      : ${GREEN}$(git --version)${NC}"
echo -e "  nodemon  : ${GREEN}$(nodemon --version)${NC}"

if [ "$DB_MODE" = "local" ]; then
  if sudo systemctl is-active --quiet mongod; then
    echo -e "  MongoDB  : ${GREEN}LOCAL — RUNNING on localhost:27017${NC}"
  else
    echo -e "  MongoDB  : ${RED}LOCAL — NOT RUNNING  ->  sudo systemctl start mongod${NC}"
  fi
else
  echo -e "  MongoDB  : ${YELLOW}ATLAS (cloud)${NC}"
fi

echo ""
echo -e "${BOLD}${GREEN}============================================${NC}"
echo -e "${BOLD}${GREEN}  SETUP COMPLETE!${NC}"
echo -e "${BOLD}${GREEN}============================================${NC}"
echo ""
echo -e "  Project at: ${CYAN}$PROJECT_DIR${NC}"
echo ""
echo -e "${BOLD}  TO RUN THE APP:${NC}"
echo ""
echo -e "  Option A — All at once:"
echo -e "    ${CYAN}cd $PROJECT_DIR && ./start-all.sh${NC}"
echo ""
echo -e "  Option B — Separate terminals (recommended):"
echo -e "    Terminal 1:  ${CYAN}cd $PROJECT_DIR && ./start-judge.sh${NC}"
echo -e "    Terminal 2:  ${CYAN}cd $PROJECT_DIR && ./start-backend.sh${NC}"
echo -e "    Terminal 3:  ${CYAN}cd $PROJECT_DIR && ./start-frontend.sh${NC}"
echo ""
echo -e "  Open in browser: ${CYAN}http://localhost:5173${NC}"
echo ""

if [ "$DB_MODE" = "local" ]; then
  echo -e "${BOLD}  DATABASE:${NC}"
  echo -e "    Mode     : ${GREEN}Local MongoDB (localhost:27017/devflow)${NC}"
  echo -e "    Data     : Imported from $EXPORT_FILE"
  echo -e "    Switch   : ${CYAN}./switch-db.sh atlas${NC}  (to use cloud Atlas)"
else
  echo -e "${BOLD}  DATABASE:${NC}"
  echo -e "    Mode     : ${YELLOW}MongoDB Atlas (cloud)${NC}"
  echo -e "    Switch   : ${CYAN}./switch-db.sh local${NC}  (to use local MongoDB)"
fi
echo ""
echo -e "${YELLOW}  NOTE: Close and reopen terminal so NVM works properly!${NC}"
echo ""
