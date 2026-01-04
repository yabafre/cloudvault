// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Types de commits autorisés
    'type-enum': [
      2,
      'always',
      [
        'feat', // Nouvelle fonctionnalité
        'fix', // Correction de bug
        'docs', // Documentation uniquement
        'style', // Formatting, semicolons, etc. (pas de changement de code)
        'refactor', // Refactoring (ni feat ni fix)
        'perf', // Amélioration de performance
        'test', // Ajout/modification de tests
        'build', // Changements build system ou dépendances
        'ci', // Changements CI/CD
        'chore', // Maintenance, tâches diverses
        'revert', // Revert d'un commit précédent
      ],
    ],

    // Scopes adaptés au monorepo
    'scope-enum': [
      2,
      'always',
      [
        // Apps
        'api',
        'web',
        'mobile',
        'admin',

        // Packages partagés
        'ui',
        'database',
        'shared',
        'config',

        // Infrastructure
        'deps',
        'docker',
        'ci',
        'prisma',

        // Transversal
        'auth',
        'i18n',
        'types',

        // Root/Global
        'root',
        'monorepo',
        'release',
      ],
    ],

    // Scope obligatoire
    'scope-empty': [2, 'never'],

    // Format du sujet
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-min-length': [2, 'always', 10],
    'subject-max-length': [2, 'always', 72],

    // Format du header (type + scope + subject)
    'header-max-length': [2, 'always', 100],

    // Format du body
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],

    // Format du footer
    'footer-leading-blank': [2, 'always'],
    'footer-max-line-length': [2, 'always', 100],

    // Type en minuscules
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],

    // Scope en minuscules
    'scope-case': [2, 'always', 'lower-case'],
  },

  // Messages d'aide personnalisés
  helpUrl: 'https://www.conventionalcommits.org/',

  // Prompt interactif (optionnel, pour commitizen)
  prompt: {
    questions: {
      type: {
        description: 'Type de changement',
        enum: {
          feat: {
            description: '✨ Nouvelle fonctionnalité',
            title: 'Features',
          },
          fix: { description: '🐛 Correction de bug', title: 'Bug Fixes' },
          docs: { description: '📚 Documentation', title: 'Documentation' },
          style: { description: '💎 Style/Formatting', title: 'Styles' },
          refactor: {
            description: '📦 Refactoring',
            title: 'Code Refactoring',
          },
          perf: { description: '🚀 Performance', title: 'Performance' },
          test: { description: '🧪 Tests', title: 'Tests' },
          build: { description: '🛠️ Build/Dependencies', title: 'Builds' },
          ci: { description: '⚙️ CI/CD', title: 'CI' },
          chore: { description: '♻️ Maintenance', title: 'Chores' },
          revert: { description: '⏪ Revert', title: 'Reverts' },
        },
      },
      scope: {
        description: 'Scope du changement (api, web, mobile, ui, database...)',
      },
      subject: {
        description: 'Description courte et impérative du changement',
      },
      body: {
        description: 'Description longue (optionnel)',
      },
      isBreaking: {
        description: 'Breaking changes?',
      },
      issues: {
        description: 'Issues liées (ex: "fix #123", "re #456")',
      },
    },
  },
};
