module.exports = {
  // NOTE: Scope can be left blank (optional) or multiple (comma separated, e.g. "ui,db,api")
  types: [
    { value: "build", name: "build:     Build system or external dependencies" },
    { value: "chore", name: "chore:     Build process or auxiliary tool changes" },
    { value: "ci", name: "ci:        CI related changes" },
    { value: "docs", name: "docs:      Documentation only changes" },
    { value: "feat", name: "feat:      A new feature" },
    { value: "feature", name: "feature:   A new feature (alias)" },
    { value: "fix", name: "fix:       A bug fix" },
    { value: "bug", name: "bug:       A bug fix (alias for fix)" },
    { value: "perf", name: "perf:      A code change that improves performance" },
    {
      value: "refactor",
      name: "refactor:  A code change that neither fixes a bug nor adds a feature",
    },
    { value: "revert", name: "revert:    Revert to a commit" },
    {
      value: "style",
      name: "style:     Changes that do not affect the meaning of the code (white-space, formatting, etc)",
    },
    { value: "test", name: "test:      Adding missing tests or correcting existing tests" },
  ],
  scopes: [
    { name: "auth" },
    { name: "ui" },
    { name: "db" },
    { name: "api" },
    { name: "infra" },
    { name: "deps" },
    { name: "other" },
  ],
  scopeOverrides: {
    "*": [{ name: "multiple (comma separated)" }],
  },
  allowCustomScopes: true,
  allowBreakingChanges: ["feature", "bug"],
  skipQuestions: ["body", "footer"],
};
