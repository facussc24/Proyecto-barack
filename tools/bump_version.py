import argparse
import json
import re
from pathlib import Path


def update_json_version(path: Path, version: str) -> None:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    data["version"] = version
    if path.name == "package.json" and "description" in data:
        data["description"] = f"Versión actual: **{version}**"
    if "packages" in data and "" in data["packages"]:
        data["packages"][""]["version"] = version

    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def replace_line(path: Path, prefix: str, new_line: str) -> None:
    lines = path.read_text(encoding="utf-8").splitlines()
    for i, line in enumerate(lines):
        if line.startswith(prefix):
            lines[i] = new_line
            break
    else:
        raise ValueError(f"'{prefix}' not found in {path}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def update_version_js(path: Path, version: str) -> None:
    pattern = re.compile(r"export const version = ['\"](\d+)['\"];")
    text = path.read_text(encoding="utf-8")
    new_text, count = pattern.subn(f"export const version = '{version}';", text)
    if count == 0:
        raise ValueError(f"version declaration not found in {path}")
    path.write_text(new_text, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Bump project version")
    parser.add_argument("version", help="New version number")
    args = parser.parse_args()

    version = args.version
    update_json_version(Path("package.json"), version)
    update_json_version(Path("package-lock.json"), version)
    replace_line(Path("README.md"), "Versión actual:", f"Versión actual: **{version}**")
    update_version_js(Path("docs/js/version.js"), version)


if __name__ == "__main__":
    main()
