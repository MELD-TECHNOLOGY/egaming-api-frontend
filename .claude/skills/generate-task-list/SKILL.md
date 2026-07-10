---

name: generate-task-list
description: Analyze an implementation plan document and generate a detailed, enumerated, implementation-ready task list with trackable completion markers. Save the generated task list to a specified output file.

arguments:
source:
description: Path to the implementation plan document.
required: true

output:
description: Path where the generated task list should be written.
required: true

granularity:
description: Level of task decomposition.
enum:
- high
- detailed
- atomic
default: detailed

methodology:
description: Task organization methodology.
enum:
- sequential
- agile
- phased
- feature-based
default: feature-based

examples:

* /generate-task-list use /prompts/v1/app/inventory/plan.md output /prompts/v1/app/inventory/tasks.md
* /generate-task-list use /prompts/v1/app/payment/plan.md output /prompts/v1/app/payment/tasks.md
* /generate-task-list use /prompts/v1/app/orders/plan.md output /prompts/v1/app/orders/tasks.md
* /generate-task-list use /ecom/plan.md output /ecom/tasks.md

---

# Purpose

Convert an implementation or enhancement plan into an actionable, production-ready task checklist that can be executed by architects, developers, QA engineers, DevOps engineers, product owners, and AI agents.

The task list must:

1. Be implementation-ready.
2. Be fully traceable to the source plan.
3. Be organized into logical phases.
4. Decompose large work items into manageable tasks.
5. Include dependencies.
6. Include validation and testing activities.
7. Include operational and production-readiness activities.
8. Allow progress tracking through completion markers.

---

# Workflow

## Step 1 – Analyze the Plan

Inspect the source plan and identify:

* Features
* Improvements
* Dependencies
* Risks
* Technical requirements
* Functional requirements
* Security requirements
* Infrastructure requirements
* Testing requirements
* Deployment requirements
* Operational requirements

---

## Step 2 – Decompose Work

Break every feature into executable tasks.

A task should:

* Have a single objective.
* Be independently verifiable.
* Be implementable by one engineer or AI agent.
* Have clear completion criteria.
* Have minimal dependencies.

Avoid:

* Ambiguous tasks
* Large unbounded tasks
* Multi-purpose tasks
* Tasks without acceptance criteria

---

## Step 3 – Organize Tasks

Generate tasks under phases.

# Phase 1 – Discovery and Analysis

# Phase 2 – Architecture and Design

# Phase 3 – Data and Infrastructure

# Phase 4 – Backend Implementation

# Phase 5 – Frontend Implementation

# Phase 6 – Security and Hardening

# Phase 7 – Testing and Quality Assurance

# Phase 8 – Deployment and Release

# Phase 9 – Monitoring and Operations

# Phase 10 – Documentation and Knowledge Transfer

---

# Task Format

Every task must use:

```markdown
1. [ ] Task description
2. [ ] Task description
3. [ ] Task description
```

Completed tasks can later become:

```markdown
1. [*] Task description
```

---

# Task Requirements

Every task should:

* Be clear and actionable.
* Start with a verb.
* Include expected deliverables.
* Include dependencies when applicable.
* Include validation requirements.
* Include acceptance criteria when necessary.

---

# Task Categories

## Analysis Tasks

Examples:

```markdown
1. [ ] Review business requirements for inventory synchronization.
2. [ ] Identify existing APIs and dependencies.
3. [ ] Document assumptions and constraints.
```

---

## Design Tasks

Examples:

```markdown
1. [ ] Design the domain model.
2. [ ] Define API contracts.
3. [ ] Design database schema changes.
4. [ ] Design sequence diagrams and workflows.
```

---

## Implementation Tasks

Examples:

```markdown
1. [ ] Create inventory aggregate and entities.
2. [ ] Implement inventory repository layer.
3. [ ] Implement inventory service layer.
4. [ ] Implement REST endpoints.
5. [ ] Implement event publishers and consumers.
```

---

## Security Tasks

Examples:

```markdown
1. [ ] Implement authentication and authorization.
2. [ ] Implement input validation.
3. [ ] Implement audit logging.
4. [ ] Implement rate limiting.
5. [ ] Implement OWASP protections.
```

---

## Testing Tasks

Examples:

```markdown
1. [ ] Create unit tests.
2. [ ] Create integration tests.
3. [ ] Create end-to-end tests.
4. [ ] Create performance tests.
5. [ ] Create security tests.
6. [ ] Verify acceptance criteria.
```

---

## DevOps Tasks

Examples:

```markdown
1. [ ] Create Docker configuration.
2. [ ] Configure CI/CD pipelines.
3. [ ] Configure environment variables.
4. [ ] Configure monitoring dashboards.
5. [ ] Configure alerting rules.
```

---

# Output Structure

Generate:

```markdown
# Project Task List

## Overview

- Source Plan:
- Generated On:
- Methodology:
- Granularity:

---

# Phase 1 – Discovery and Analysis

1. [ ]
2. [ ]
3. [ ]

---

# Phase 2 – Architecture and Design

1. [ ]
2. [ ]
3. [ ]

---

# Phase 3 – Data and Infrastructure

...

---

# Phase N

...
```

---

# Quality Rules

The generated task list must:

* Be complete and implementation-ready.
* Be traceable to the source plan.
* Be ordered by dependencies.
* Include functional and non-functional tasks.
* Include security tasks.
* Include testing tasks.
* Include deployment tasks.
* Include observability tasks.
* Include documentation tasks.
* Be suitable for execution by humans and AI agents.
* Be idempotent and reproducible.

Finally:

Write the generated task list to:

{{output}}
