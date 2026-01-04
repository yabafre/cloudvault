#!/usr/bin/env node

/**
 * Track Feature Completion
 * 
 * Enregistre les métriques d'une feature terminée.
 * Appelé à la fin du pipeline par docs-writer.
 * 
 * Usage: node scripts/track-feature.js <feature-slug> [--tokens=X] [--files-created=Y] [--files-modified=Z]
 */

const fs = require('fs');
const path = require('path');

const FEATURES_FILE = 'docs/claude/metrics/features.json';
const COSTS_FILE = 'docs/claude/metrics/costs.json';
const QUEUE_FILE = 'enhancements/_queue.json';

function parseArgs(args) {
  const result = { slug: args[0] };
  
  args.slice(1).forEach(arg => {
    const match = arg.match(/--(\w+[-\w]*)=(.+)/);
    if (match) {
      const key = match[1].replace(/-/g, '_');
      result[key] = isNaN(match[2]) ? match[2] : Number(match[2]);
    }
  });
  
  return result;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  
  if (!args.slug) {
    console.log('Usage: node track-feature.js <feature-slug> [--tokens=X] [--files-created=Y]');
    process.exit(1);
  }
  
  console.log(`📊 Tracking feature: ${args.slug}`);
  
  // Lire les données existantes
  let features = [];
  if (fs.existsSync(FEATURES_FILE)) {
    features = JSON.parse(fs.readFileSync(FEATURES_FILE, 'utf-8'));
    // Filtrer les exemples
    features = features.filter(f => !f._comment && !f._example);
  }
  
  let costs = { total: 0, features: {} };
  if (fs.existsSync(COSTS_FILE)) {
    costs = JSON.parse(fs.readFileSync(COSTS_FILE, 'utf-8'));
  }
  
  // Lire la queue pour les infos de timing
  let queue = { started_at: null };
  if (fs.existsSync(QUEUE_FILE)) {
    queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
  }
  
  const now = new Date().toISOString();
  const startedAt = queue.started_at ? new Date(queue.started_at) : new Date();
  const durationMinutes = Math.round((new Date() - startedAt) / 60000);
  
  // Créer l'entrée feature
  const featureEntry = {
    slug: args.slug,
    started_at: queue.started_at || now,
    completed_at: now,
    duration_minutes: durationMinutes,
    phases_completed: Object.entries(queue.phases || {})
      .filter(([_, status]) => status === 'DONE')
      .map(([phase]) => phase),
    files_created: args.files_created || 0,
    files_modified: args.files_modified || 0,
    tests_added: args.tests_added || 0,
    tokens_estimated: args.tokens || 0
  };
  
  features.push(featureEntry);
  
  // Calculer le coût estimé
  const inputTokens = (args.tokens || 0) * 0.7; // ~70% input
  const outputTokens = (args.tokens || 0) * 0.3; // ~30% output
  const estimatedCost = (inputTokens * 0.003 + outputTokens * 0.015) / 1000;
  
  costs.features[args.slug] = {
    input_tokens: Math.round(inputTokens),
    output_tokens: Math.round(outputTokens),
    total: Math.round(estimatedCost * 100) / 100,
    completed_at: now.split('T')[0]
  };
  costs.total = Object.values(costs.features).reduce((sum, f) => sum + (f.total || 0), 0);
  costs.total = Math.round(costs.total * 100) / 100;
  
  // Sauvegarder
  fs.writeFileSync(FEATURES_FILE, JSON.stringify(features, null, 2));
  fs.writeFileSync(COSTS_FILE, JSON.stringify(costs, null, 2));
  
  // Reset la queue
  const resetQueue = {
    current_feature: null,
    status: 'IDLE',
    phases: Object.keys(queue.phases || {}).reduce((acc, phase) => {
      acc[phase] = 'PENDING';
      return acc;
    }, {}),
    started_at: null,
    completed_at: null,
    history: [...(queue.history || []), {
      slug: args.slug,
      completed_at: now,
      duration_minutes: durationMinutes
    }],
    metrics: {
      features_completed: (queue.metrics?.features_completed || 0) + 1,
      total_tokens_estimated: (queue.metrics?.total_tokens_estimated || 0) + (args.tokens || 0),
      total_files_created: (queue.metrics?.total_files_created || 0) + (args.files_created || 0),
      total_files_modified: (queue.metrics?.total_files_modified || 0) + (args.files_modified || 0)
    }
  };
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(resetQueue, null, 2));
  
  console.log(`✅ Feature tracked successfully`);
  console.log(`   Duration: ${durationMinutes} minutes`);
  console.log(`   Estimated cost: $${estimatedCost.toFixed(2)}`);
  console.log(`   Total project cost: $${costs.total}`);
}

main();
