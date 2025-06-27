#!/bin/sh
# Simple formatting check for all Python modules tracked by git

# Gather all tracked Python files
PY_FILES=$(git ls-files '*.py')

# Run black in check mode on the files. If formatting issues are found, black
# exits with a non-zero status which will cause this script to fail as well.
exec black --check $PY_FILES
