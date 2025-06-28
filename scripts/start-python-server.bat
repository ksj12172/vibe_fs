@echo off
echo 🐍 Starting Python Stock API Server...

rem Python 서버 디렉토리로 이동
cd python-server

rem 가상환경이 있는지 확인
if not exist "venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
)

rem 가상환경 활성화
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

rem 의존성 설치
echo 📚 Installing Python dependencies...
pip install -r requirements.txt

rem 환경변수 설정
set PYTHON_API_PORT=5001

rem 서버 시작
echo 🚀 Starting Flask server on http://localhost:%PYTHON_API_PORT%
echo 📊 Available endpoints:
echo    - GET /api/stock-data/035720?period=3mo^&interval=1d
echo    - GET /health
echo.
echo 🔧 Environment:
echo    - PYTHON_API_PORT=%PYTHON_API_PORT%
echo.
echo Press Ctrl+C to stop the server
echo.

python stock_api.py

pause