# FastAPI Starter

Minimal FastAPI starter project with a health endpoint.

## Project Structure

```
.
├── app/
│   ├── __init__.py
│   └── main.py
├── .env.example
├── requirements.txt
└── readme.md
```

## Quick Start

1. Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the app:

```bash
uvicorn app.main:app --reload
```

4. Open:

- API root: http://127.0.0.1:8000/
- Health: http://127.0.0.1:8000/health
- Docs: http://127.0.0.1:8000/docs

## Next Steps

- Add routers under `app/routers/`
- Add settings management with Pydantic
- Add tests with pytest
