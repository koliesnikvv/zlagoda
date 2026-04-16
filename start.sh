#!/bin/bash
echo "Starting ZLAGODA..."

# Запуск бекенду в новому вікні терміналу
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  osascript -e 'tell app "Terminal" to do script "cd \"'"$(pwd)"'/backend\" && python -m main"'
else
  # Linux
  gnome-terminal -- bash -c "cd backend && python -m main; exec bash" 2>/dev/null \
  || xterm -e "cd backend && python -m main" 2>/dev/null \
  || bash -c "cd backend && python -m main" &
fi

sleep 2

cd frontend
npm run start
