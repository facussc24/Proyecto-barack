import re
from pathlib import Path


def test_named_export_after_default():
    js_file = Path(__file__).resolve().parent.parent / "docs/js/dataService.js"
    text = js_file.read_text(encoding="utf-8")
    lines = text.splitlines()
    idx = next((i for i, line in enumerate(lines) if "export default api;" in line), None)
    assert idx is not None, "export default api not found"
    remainder = "\n".join(lines[idx + 1 :])
    m = re.search(r"export\s*\{([^}]*)\}", remainder)
    assert m, "named export block not found"
    exported = {name.strip() for name in m.group(1).split(",") if name.strip()}
    assert {"getAll", "ready", "initialized"} <= exported

