'use strict';

const fs = require('node:fs');
const path = require('node:path');

const INCLUDE = /^\s*--\s*@include\s+(\S+)\s*$/;

// Reads a SQL entry point and inlines any `-- @include <relative path>` directives.
// Paths resolve relative to the file containing the directive.
function loadSql(file, seen = new Set()) {
  const absolute = path.resolve(file);
  if (seen.has(absolute)) {
    throw new Error(`Circular SQL include: ${absolute}`);
  }
  seen.add(absolute);

  const lines = fs.readFileSync(absolute, 'utf8').split(/\r?\n/);
  const parts = [];
  for (const line of lines) {
    const match = line.match(INCLUDE);
    if (match) {
      parts.push(loadSql(path.join(path.dirname(absolute), match[1]), seen));
    } else {
      parts.push(line);
    }
  }
  return parts.join('\n');
}

module.exports = { loadSql };
