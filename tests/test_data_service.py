import re
from pathlib import Path


def test_no_named_export_after_default():
    js_file = Path(__file__).resolve().parent.parent / "docs/js/dataService.js"
    text = js_file.read_text(encoding="utf-8")
    lines = text.splitlines()
    idx = None
    for i, line in enumerate(lines):
        if "export default api;" in line:
            idx = i
            break
    assert idx is not None, "export default api not found"
    remainder = "\n".join(lines[idx + 1 :])
    assert not re.search(
        r"^\s*export\s*\{", remainder, re.MULTILINE
    ), "Unexpected named export after default export"
