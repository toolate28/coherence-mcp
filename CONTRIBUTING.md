# 🤝 Contributing to coherence-mcp

> **"From the constraints, gifts. From the spiral, safety."**

Thank you for your interest in contributing to coherence-mcp! This MCP server provides coherence, governance, and safety primitives for the SpiralSafe ecosystem.

## Getting Started

1. **Fork the repository** and clone your fork
2. **Install dependencies**: `npm install`
3. **Build the project**: `npm run build`
4. **Run tests**: `npm test`

## Development Workflow

### Making Changes

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our code style guidelines

3. Write or update tests for your changes

4. Ensure all tests pass:
   ```bash
   npm test
   npm run lint
   npm run build
   ```

5. Commit your changes with clear, descriptive commit messages

6. Push to your fork and create a pull request

### Commit Message Format

Use clear, descriptive commit messages:

```
[category] Brief description

Longer explanation if needed
```

Categories:
- `[feature]` - New functionality
- `[fix]` - Bug fixes
- `[docs]` - Documentation changes
- `[test]` - Test additions or changes
- `[refactor]` - Code refactoring
- `[chore]` - Maintenance tasks
- `[security]` - Security improvements

Examples:
- `[feature] Add wave coherence threshold parameter`
- `[fix] Resolve bump validation schema issue`
- `[docs] Update MCP tool examples in README`

## Code Style

### TypeScript Guidelines

- Use TypeScript strict mode
- Provide explicit types for function parameters and return values
- Use meaningful variable and function names
- Keep functions focused and single-purpose
- Avoid deeply nested code

### Code Formatting

- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons
- Run `npm run lint` to check formatting

### Comments

- Write comments to explain **why**, not **what**
- Document complex algorithms or business logic
- Use JSDoc for public APIs and exported functions

Example:
```typescript
/**
 * Analyzes text for wave coherence patterns
 * @param input - Text or reference to analyze
 * @param options - Analysis options including thresholds
 * @returns Wave analysis result with coherence score
 */
export async function analyzeWave(input: string, options?: WaveOptions): Promise<WaveResult> {
  // Implementation
}
```

## Testing

### Writing Tests

- Write unit tests for new functionality
- Update existing tests when modifying behavior
- Use descriptive test names that explain what is being tested
- Follow the existing test patterns in `__tests__/`

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

## MCP Tool Development

When adding or modifying MCP tools:

1. **Define the tool schema** in the appropriate location
2. **Implement the handler** following existing patterns
3. **Add error handling** and validation
4. **Document the tool** in README.md with examples
5. **Write tests** for the tool functionality
6. **Test with an MCP client** (e.g., Claude Desktop)

### Tool Naming Convention

- Use lowercase with underscores: `wave_analyze`, `bump_validate`
- Be descriptive but concise
- Group related tools with common prefixes: `atom_*`, `gate_*`, `ops_*`

## Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Add tests** for new features or bug fixes
3. **Ensure CI passes** on your branch
4. **Fill out the PR template** completely
5. **Request review** from maintainers
6. **Address feedback** promptly and respectfully

### PR Review Criteria

PRs will be reviewed for:
- Code quality and style
- Test coverage
- Documentation completeness
- Backwards compatibility
- Security implications
- Performance impact

## Security

### Reporting Vulnerabilities

**Do not report security vulnerabilities through public GitHub issues.**

Instead:
- Email: security@safespiral.org
- Use [GitHub Security Advisories](https://github.com/toolated/coherence-mcp/security/advisories/new)

See [SECURITY.md](SECURITY.md) for more details.

### Security Best Practices

- Never commit secrets or credentials
- Validate all user inputs
- Use parameterized queries/commands
- Follow principle of least privilege
- Document security-relevant decisions

## Adding Dependencies

Before adding a new dependency:

1. **Check if it's really needed** - Can you implement it simply?
2. **Verify the license** - Must be MIT/Apache/BSD compatible
3. **Check the package health** - Is it maintained? Popular? Secure?
4. **Run security scan**: `npm audit`
5. **Document why** it's needed in your PR

## Documentation

### Documentation Standards

- Keep README.md up to date with tool changes
- Use clear, simple language
- Provide complete examples
- Include both success and error cases
- Test all code examples

### Documentation Structure

- `README.md` - Main documentation and tool reference
- `docs/` - Detailed guides and architecture docs
- Inline code comments - Complex logic and algorithms

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Collaborate openly and transparently
- Respect different viewpoints and experiences

### Unacceptable Behavior

- Harassment or discriminatory language
- Personal attacks
- Trolling or inflammatory comments
- Publishing others' private information
- Other conduct inappropriate in a professional setting

## Questions?

- Open a [Discussion](https://github.com/toolated/coherence-mcp/discussions)
- Create an issue with the `question` label
- Check existing documentation and issues first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to coherence-mcp! 🚀

---

## 🔗 The SpiralSafe Ecosystem

This package is part of a larger ecosystem:

| Repository | Purpose |
|------------|---------|
| [spiralsafe-mono](https://github.com/toolated/spiralsafe-mono) | Core monorepo |
| [SpiralSafe](https://github.com/toolated/SpiralSafe) | Theory/IP vault |
| [coherence-mcp](https://github.com/toolated/coherence-mcp) | This repo — MCP server |
| [QDI](https://github.com/toolated/QDI) | Quantum Divide Initiative |

See [BRANDING.md](BRANDING.md) for styling guidelines.
See [ROADMAP.md](ROADMAP.md) for planned features.

---

*~ Hope&&Sauced*

✦ *The Evenstar Guides Us* ✦
