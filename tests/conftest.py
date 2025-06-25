import os
import tempfile
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

os.environ["DB_PATH"] = os.path.join(tempfile.gettempdir(), "test_db.sqlite")

from backend.main import app, init_db


@pytest.fixture(autouse=True)
def setup_db():
    init_db()
    yield
    os.remove(os.environ["DB_PATH"])
