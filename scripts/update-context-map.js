#!/usr/bin/env node

/**
 * Update Context Map
 * 
 * Met à jour docs/claude/context/architecture.md après une feature validée.
 * Appelé par le hook post-review.sh
 * 
 * Usage: node scripts/update-context-map.js <feature-slug>
 */

const fs = require('fs');
const path = require('path');

const ARCHITECTURE_FILE = 'docs/claude/context/architecture.md';
const WORKING_NOTES_DIR = 'docs/claude/working-notes';
const ADR_DIR = 'docs/claude/decisions';

function main() {
  const featureSlug = process.argv[2];
  
  if (!featureSlug) {
    console.log('Usage: node update-context-map.js <feature-slug>');
    process.exit(0);
  }
  
  console.log(`📊 Updating context map for: ${featureSlug}`);
  
  // Lire la working note si elle existe
  const workingNotePath = path.join(WORKING_NOTES_DIR, `${featureSlug}.md`);
  if (!fs.existsSync(workingNotePath)) {
    console.log(`⚠️  Working note not found: ${workingNotePath}`);
    process.exit(0);
  }
  
  const workingNote = fs.readFileSync(workingNotePath, 'utf-8');
  
  // Extraire les infos de la working note
  const moduleMatch = workingNote.match(/apps\/api\/src\/(\w+)/);
  const routeMatch = workingNote.match(/apps\/web\/app\/.*?\/(\w+)/);
  
  // Lire le fichier architecture actuel
  if (!fs.existsSync(ARCHITECTURE_FILE)) {
    console.log(`⚠️  Architecture file not found: ${ARCHITECTURE_FILE}`);
    process.exit(0);
  }
  
  let architecture = fs.readFileSync(ARCHITECTURE_FILE, 'utf-8');
  
  // Mettre à jour la date
  const now = new Date().toISOString().split('T')[0];
  architecture = architecture.replace(
    /\*Dernière mise à jour.*\*/,
    `*Dernière mise à jour: ${now} - Feature: ${featureSlug}*`
  );
  
  // Sauvegarder
  fs.writeFileSync(ARCHITECTURE_FILE, architecture);
  
  console.log(`✅ Context map updated`);
  console.log(`   Feature: ${featureSlug}`);
  console.log(`   Module: ${moduleMatch ? moduleMatch[1] : 'N/A'}`);
  console.log(`   Route: ${routeMatch ? routeMatch[1] : 'N/A'}`);
}

main();
