---

name: execute-task-list
description: Inspect the project, implementation plan, and task list. Execute only a specified range of tasks in order, update task completion markers immediately after each successful implementation, and persist all changes to the task list and project artifacts.

arguments:
plan:
description: Path to the implementation plan document.
required: true

tasks:
description: Path to the task list document.
required: true

start:
description: Starting task identifier.
required: true

end:
description: Ending task identifier.
required: true

implementation_mode:
description: Execution strategy.
enum:
- sequential
- strict-sequential
- dependency-aware
default: strict-sequential

persist_progress:
description: Persist task completion immediately after every successful task.
enum:
- true
- false
default: true

examples:

* /execute-task-chunk plan /prompts/v1/app/inventory/plan.md tasks /prompts/v1/app/inventory/tasks.md start 0.1 end 5.5
* /execute-task-chunk plan /prompts/v1/app/inventory/plan.md tasks /prompts/v1/app/inventory/tasks.md start 6.1 end 10.14
* /execute-task-chunk plan /prompts/v1/app/inventory/plan.md tasks /prompts/v1/app/inventory/tasks.md start 11.1 end 15.5
* /execute-task-chunk plan /ecom/plan.md tasks /ecom/tasks.md start 1.1 end 3.10

---

# Purpose

Execute implementation tasks in manageable chunks while maintaining accurate task progress tracking.

The skill must:

1. Inspect the project.
2. Read the implementation plan.
3. Read the task list.
4. Execute only the specified task range.
5. Execute tasks strictly in order.
6. Respect task dependencies.
7. Update progress after each completed task.
8. Persist progress immediately.
9. Stop if a blocking dependency or unrecoverable error occurs.
10. Produce an execution summary.

---

# Workflow

## Step 1 – Inspect Project

Inspect:

* Source code
* Directory structure
* Existing implementation
* Configuration files
* Build files
* Infrastructure definitions
* APIs
* Database schemas
* Existing tests
* Documentation

Determine:

* Current implementation state
* Previously completed work
* Missing dependencies
* Potential conflicts

---

## Step 2 – Load Documents

Load:

{{plan}}

Load:

{{tasks}}

Identify:

* Task hierarchy
* Task dependencies
* Acceptance criteria
* Required deliverables
* Implementation order

---

## Step 3 – Determine Execution Range

Only execute:

```text
{{start}} → {{end}}
```

Examples:

```text
0.1 → 5.5
6.1 → 10.14
11.1 → 15.5
```

Ignore all tasks outside the specified range.

Do not:

* Skip tasks
* Reorder tasks
* Execute future tasks
* Modify unrelated tasks

---

## Step 4 – Execute Tasks Sequentially

For each task:

### Validate Dependencies

Determine:

* Parent tasks completed
* Required files exist
* Required code exists
* Required configurations exist

If dependencies are missing:

Stop execution and report blockers.

---

### Implement Task

Perform:

* Code changes
* Configuration changes
* Database changes
* Infrastructure changes
* Documentation changes
* Tests

Verify:

* Build succeeds
* Tests pass
* Acceptance criteria met

---

### Immediately Update Progress

Before:

```markdown
3.2 [ ] Implement inventory service layer
```

After successful completion:

```markdown
3.2 [*] Implement inventory service layer
```

Persist immediately:

Write changes back to:

{{tasks}}

This update is mandatory after every successfully completed task.

Never batch updates.

Never wait until the end.

---

## Step 5 – Continue Execution

Continue until:

* End task reached
* Blocking dependency encountered
* Build failure occurs
* Validation failure occurs
* Unrecoverable error occurs

---

## Step 6 – Produce Execution Report

Generate:

# Execution Summary

## Executed Range

```text
{{start}} → {{end}}
```

## Completed Tasks

* Task IDs
* Deliverables created
* Files modified

## Failed Tasks

* Task IDs
* Reasons
* Dependencies

## Remaining Tasks

* Task IDs
* Estimated prerequisites

## Risks

* Technical risks
* Dependency risks
* Security risks

## Recommended Next Chunk

Example:

```text
Next:
6.1 → 10.14
```

---

# Rules

## Execution Rules

* Execute only the specified range.
* Execute tasks strictly in order.
* One task at a time.
* Validate before implementation.
* Verify after implementation.
* Persist after every task.

---

## Progress Rules

Task not started:

```markdown
[ ]
```

Task completed:

```markdown
[*]
```

The task list file must always reflect the current state of execution.

---

## Persistence Rules

After every completed task:

1. Update task marker.
2. Save tasks.md.
3. Save modified files.
4. Continue to next task.

Never defer persistence.

---

## Failure Rules

If a task fails:

1. Stop execution.
2. Preserve completed markers.
3. Record blockers.
4. Do not mark failed tasks as complete.

---

# Final Output

Persist:

Updated task list:

{{tasks}}

Modified project files.

Execution summary.

Progress state suitable for resuming the next chunk execution.
