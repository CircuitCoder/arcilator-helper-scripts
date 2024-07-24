const process = require('process');
const fs = require('fs');

const fn = process.argv[2];
if(fn === undefined) {
  console.error('Usage: node generate-header.js ./state.json');
  process.exit(1);
}
const states = JSON.parse(fs.readFileSync(fn).toString('UTF-8'));
console.error(`Processing ${fn}`);

function type_lookup(len) {
  if(len > 64) throw new Error(`Bit len too large: ${len}`);

  if(len === 1) return 'bool';
  if(len <= 8) return 'uint8_t';
  if(len <= 16) return 'uint16_t';
  if(len <= 32) return 'uint32_t';
  return 'uint64_t';
}

function state_name(state) {
  return `${state.type === 'input' ? 'i' : 'o'}_${state.name}`;
}

let output = `// Auto-generated from ${fn}\n`;
output += `#include <cstddef>\n`;
output += `#include <cstdint>\n`;

for(const mod of states) {
  const struct_name = mod.name + '_state';
  let struct = `struct ${struct_name} {\n`;
  struct += `  struct IO {\n`
  for(const state of mod.states) {
    const ty = type_lookup(state.numBits);
    struct += `    ${ty} ${state_name(state)};\n`;
  }
  struct += `  } io;\n`
  struct += `  uint8_t _state[${mod.numStateBytes} - sizeof(IO)];\n`;
  struct += `};\n`
  struct += `static_assert(sizeof(${struct_name}) == ${mod.numStateBytes});\n`
  for(const state of mod.states)
    struct += `static_assert(offsetof(${struct_name}, io.${state_name(state)}) == ${state.offset});\n`;

  output += struct;
}

console.log(output);
