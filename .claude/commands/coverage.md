---
description: Run test coverage and list files below 80% threshold
---

## Coverage report
!`npm run test:coverage -- --coverageReporters=text 2>&1`

Analyse the coverage output above:

1. List every file that is **below 80% line coverage** — show the file path and its current %
2. For each under-covered file, identify the specific functions or branches not covered
3. Suggest the 1-2 test cases that would have the highest coverage impact per file
4. Flag any controller or service file with **0% coverage** as a blocker

Focus on `src/modules/` — ignore `src/core/`, config files, and type definition files.
