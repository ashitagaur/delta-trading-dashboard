# Agent Development Rules

These rules apply to all development work regardless of repository, framework, language, or project type.

The objective is to use AI models and autonomous agents efficiently while maintaining senior-level engineering quality.

---

## 1. Understand Before Changing Code

Before making changes:

1. Read the task completely.
2. Identify the exact requested outcome.
3. Inspect only the files relevant to the task.
4. Understand existing conventions before introducing new ones.
5. Check the current Git state before modifying files.

Do not immediately start coding from assumptions.

For unfamiliar repositories, first establish:

* application structure
* package manager
* framework and runtime
* existing architecture
* styling strategy
* testing setup
* linting and formatting setup
* relevant documentation

Do not perform a full repository audit when the task only requires a small localized change.

---

## 2. Use the Smallest Capable Model

Use the least expensive and fastest model capable of reliably completing the task.

Use stronger reasoning models primarily for:

* architecture decisions
* complex debugging
* concurrency problems
* performance-sensitive systems
* unfamiliar codebases
* large refactors
* ambiguous requirements
* security-sensitive changes

Use faster models for:

* straightforward file edits
* repetitive implementation
* formatting
* basic tests
* documentation cleanup
* simple refactoring
* mechanical migrations

Do not use maximum reasoning effort for routine tasks.

---

## 3. Plan Proportionally to Task Complexity

Do not create a large implementation plan for a small change.

### Small task

For a localized change:

1. inspect relevant code
2. implement
3. verify
4. report

### Medium task

For a feature affecting multiple files:

1. inspect relevant architecture
2. define a short implementation approach
3. implement incrementally
4. verify affected behavior

### Large task

For architectural or multi-phase work:

1. analyze requirements
2. inspect relevant systems
3. identify constraints
4. create an implementation plan
5. divide work into independently verifiable phases
6. implement phase by phase

Planning must reduce risk, not become the work itself.

---

## 4. Avoid Repeated Context Consumption

Do not repeatedly read the same large files.

After inspecting a file:

* remember its relevant structure
* reopen only the required section when needed
* use targeted searches instead of rereading entire directories

For large repositories:

* search first
* inspect relevant references
* follow dependencies only as required

Avoid recursively exploring unrelated code.

---

## 5. Search Before Inventing

Before introducing a new:

* utility
* hook
* component
* type
* constant
* abstraction
* service

search the repository for an existing equivalent.

Prefer extending an appropriate existing implementation over creating duplicates.

Do not force reuse when existing code has fundamentally different responsibilities.

---

## 6. Preserve Existing Architecture

Follow established project conventions unless there is a strong technical reason not to.

Before introducing a new architectural pattern, determine:

* whether the project already solves the problem
* whether the abstraction will actually be reused
* whether it reduces complexity
* whether the additional indirection is justified

Do not redesign unrelated architecture while implementing a feature.

---

## 7. Keep Changes Scoped

Every task should have a clearly defined scope.

Do not:

* refactor unrelated files
* rename unrelated code
* reformat the entire repository
* upgrade unrelated dependencies
* change architecture without necessity

Make the smallest coherent change that completely solves the problem.

Leave unrelated improvements for separate work.

---

## 8. Implement Incrementally

For substantial work, build in independently working stages.

Prefer:

foundation → domain logic → integration → UI → optimization → polish

Each phase should:

* solve one logical problem
* leave the application in a coherent state
* be independently reviewable
* have appropriate verification

Do not create artificial phases solely to generate more commits.

---

## 9. Verify Instead of Assuming

Never claim that something works without appropriate verification.

Depending on the task, verification may include:

* TypeScript compilation
* linting
* unit tests
* integration tests
* production build
* running the application
* browser verification
* API testing
* backend integration testing

Run the smallest relevant verification during development.

Run broader verification before completion.

---

## 10. Debug Systematically

When something fails:

1. read the actual error
2. identify the failing layer
3. reproduce consistently
4. inspect the smallest relevant code path
5. form a concrete hypothesis
6. test the hypothesis
7. fix the root cause
8. verify the original failure

Do not make multiple speculative changes simultaneously.

Do not repeatedly modify code without understanding why the previous attempt failed.

---

## 11. Avoid Unnecessary Dependencies

Before adding a dependency, ask:

* can this be implemented cleanly with existing tools?
* does the project already contain an equivalent dependency?
* does the dependency solve enough complexity to justify itself?
* is it maintained and appropriate for production use?

Do not install packages for trivial functionality.

Every added dependency should have a clear purpose.

---

## 12. Optimize Based on Evidence

Do not introduce premature performance abstractions.

First understand:

* where updates originate
* which components rerender
* how frequently expensive work occurs
* whether memory grows
* whether the user experiences actual degradation

Then optimize the measured bottleneck.

Prefer simple techniques before complex architecture.

---

## 13. Keep React Code Predictable

For React projects:

* keep render functions primarily declarative
* keep business logic outside JSX where practical
* avoid unnecessary effects
* avoid derived state that can be calculated directly
* avoid global state for local UI concerns
* use stable keys
* clean up subscriptions and timers
* avoid unnecessary memoization
* use memoization when it solves demonstrated render cost

Do not create custom hooks merely to move five lines of code into another file.

Hooks should represent meaningful reusable behavior or isolated lifecycle logic.

---

## 14. Maintain Clear State Ownership

Before adding state, determine who owns it.

Prefer:

* local state for local UI behavior
* feature-level state for shared feature behavior
* application-level state only for genuinely global concerns
* server-state tools for remote asynchronous state

Do not duplicate the same source of truth in multiple places.

Derived values should generally remain derived.

---

## 15. Keep Components Focused

Split components when doing so improves:

* readability
* reuse
* render isolation
* independent testing
* domain separation

Do not split components solely to make files artificially small.

A component should have a clear responsibility.

---

## 16. Avoid Overengineering

Do not introduce:

* unnecessary factories
* unnecessary providers
* unnecessary service layers
* premature design systems
* generic abstractions with one consumer
* excessive configuration
* complex state libraries for trivial state
* elaborate error frameworks for simple applications

Choose the simplest architecture that satisfies current requirements and remains reasonably extensible.

---

## 17. Write Original Code and Documentation

Never copy implementation code, documentation, comments, or distinctive naming from reference projects.

Reference projects may be used to understand:

* architectural ideas
* user experience
* visual language
* engineering standards
* interaction patterns

Reimplement solutions independently.

Documentation must describe the current project in original language.

---

## 18. Do Not Generate Documentation Without Value

Create documentation when it improves:

* implementation clarity
* architecture understanding
* onboarding
* decision traceability
* submission quality

Do not create excessive documents containing duplicated information.

Keep one authoritative location for each type of information.

---

## 19. Keep Git History Intentional

Commits should represent logical development milestones.

Before committing:

1. inspect Git status
2. inspect the diff
3. ensure unrelated changes are excluded
4. run appropriate verification

Commit messages should describe intent.

Use prefixes appropriately:

* `init` — repository or application initialization
* `build` — build system, foundational setup, dependency infrastructure
* `feat` — user-facing or domain functionality
* `fix` — defect correction
* `perf` — performance improvements
* `refactor` — structural changes without behavioral changes
* `test` — test additions or improvements
* `docs` — documentation-only changes
* `style` — visual or formatting changes

Do not use `chore` as a default when another type describes the change more accurately.

Do not create meaningless commits solely to increase commit count.

---

## 20. Do Not Mix Independent Concerns

Avoid commits that combine unrelated work such as:

* feature implementation and broad refactoring
* dependency upgrades and UI changes
* performance optimization and visual redesign
* documentation restructuring and unrelated bug fixes

Separate independently reviewable concerns.

---

## 21. Communicate Decisions, Not Internal Noise

When reporting progress, focus on:

* what was discovered
* what decision was made
* why it matters
* what changed
* how it was verified
* genuine risks or blockers

Do not produce long descriptions of routine file operations.

---

## 22. Stop When the Requirement Is Satisfied

Do not continue adding functionality simply because improvements are possible.

At completion:

1. compare implementation against requirements
2. verify relevant behavior
3. identify genuine limitations
4. remove accidental complexity
5. stop

Optional improvements should remain optional unless they materially affect correctness or quality.

---

# Default Agent Workflow

Unless a task requires a different approach, follow:

```text
UNDERSTAND
    ↓
INSPECT
    ↓
SEARCH EXISTING PATTERNS
    ↓
DESIGN THE SMALLEST SOLUTION
    ↓
IMPLEMENT
    ↓
VERIFY
    ↓
REVIEW DIFF
    ↓
COMMIT
```

For large tasks:

```text
REQUIREMENTS
    ↓
REPOSITORY ANALYSIS
    ↓
ARCHITECTURE
    ↓
PHASED PLAN
    ↓
IMPLEMENT ONE PHASE
    ↓
VERIFY
    ↓
COMMIT
    ↓
NEXT PHASE
```

---

# Core Principle

Operate like a senior engineer, not an autonomous code generator.

The objective is not to produce the maximum amount of:

* code
* files
* documentation
* abstractions
* commits
* reasoning

The objective is to produce the smallest high-quality solution that completely satisfies the requirement, is understandable by another engineer, and has been properly verified.
