#!/usr/bin/env node
// Assemble the shippable phone page.
//
// The Claude Design canvas exports one self-contained HTML file: a loader, a
// JSON manifest of gzipped resources (fonts, the DC runtime, React, the canon
// documents, the engine) and the component markup as a JSON string. That export
// is `phone-shell/shell.html` and is treated as an opaque input — it carries
// ~10 MB of fonts and runtime this repo cannot regenerate.
//
// This script replaces the two parts the repo *does* own — the engine and the
// component — and writes the result to `public/index.html` for deployment.
//
//   node scripts/build-phone-bundle.js
//
// The engine must be current first; `npm run build:phone` does that, and this
// script refuses to run against a stale one.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const shellPath = join(root, 'phone-shell/shell.html')
const enginePath = join(root, 'dist-phone/codex-data.js')
const componentPath = join(root, 'dist-phone/canvas-component.patched.html')
const outPath = join(root, 'public/index.html')

// The uuid the shell's ext_resources map assigns to `codexData`. Read from the
// shell rather than hard-coded, so a re-export that renumbers cannot silently
// write the engine into some other resource.
function engineUuid(shell) {
  const list = JSON.parse(section(shell, 'ext_resources'))
  const entry = list.find(item => item.id === 'codexData')
  if (!entry) throw new Error('The shell declares no "codexData" resource — is phone-shell/shell.html the right export?')
  return entry.uuid
}

function sectionMatch(shell, type) {
  const match = new RegExp(`(<script type="__bundler/${type}"[^>]*>)([\\s\\S]*?)(</script>)`).exec(shell)
  if (!match) throw new Error(`The shell has no __bundler/${type} block.`)
  return match
}

function section(shell, type) {
  return sectionMatch(shell, type)[2]
}

// The bundler's own escaping. A JSON string holding "</script>" would otherwise
// terminate the host <script> and truncate the document — the page still opens,
// but silently loses everything after the cut.
function embed(value) {
  return JSON.stringify(value).replace(/<\//g, '<\\u002F')
}

for (const [label, path] of [['shell', shellPath], ['engine', enginePath], ['component', componentPath]]) {
  if (!existsSync(path)) {
    console.error(`missing ${label}: ${path}`)
    process.exit(1)
  }
}

execFileSync('node', [join(root, 'scripts/build-phone-engine.js'), '--check'], { cwd: root, stdio: 'inherit' })

const shell = readFileSync(shellPath, 'utf8')
const engine = readFileSync(enginePath)
const component = readFileSync(componentPath, 'utf8')

const uuid = engineUuid(shell)
const manifest = JSON.parse(section(shell, 'manifest'))
if (!manifest[uuid]) throw new Error(`The manifest has no entry for the engine (${uuid}).`)
manifest[uuid] = { ...manifest[uuid], compressed: true, data: gzipSync(engine, { level: 9 }).toString('base64') }

// Replace the component first, then re-locate the manifest block in the edited
// document — the earlier splice moves every offset after it.
const templateSpan = sectionMatch(shell, 'template')
let out = shell.slice(0, templateSpan.index + templateSpan[1].length)
  + embed(component)
  + shell.slice(templateSpan.index + templateSpan[1].length + templateSpan[2].length)

const manifestSpan = sectionMatch(out, 'manifest')
out = out.slice(0, manifestSpan.index + manifestSpan[1].length)
  + embed(manifest)
  + out.slice(manifestSpan.index + manifestSpan[1].length + manifestSpan[2].length)

// Prove the document survived: both blocks must parse back to what went in.
const check = (type, expected, decode = JSON.parse) => {
  const actual = decode(section(out, type))
  const same = JSON.stringify(actual) === JSON.stringify(expected)
  if (!same) throw new Error(`${type} did not round-trip — the document is corrupt.`)
}
check('template', component)
check('manifest', manifest)

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, out)

console.log(`wrote ${outPath}`)
console.log(`  ${(out.length / 1048576).toFixed(2)} MB · engine ${(engine.length / 1024).toFixed(1)} KB · component ${(component.length / 1024).toFixed(1)} KB`)
console.log(`  engine resource: ${uuid}`)
