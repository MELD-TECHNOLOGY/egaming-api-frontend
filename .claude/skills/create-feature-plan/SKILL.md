---

name: create-feature-plan
description: Analyze a requirements file, inspect the surrounding project structure, identify features, gaps, risks, and improvements, then generate an enterprise-grade implementation and improvement plan and save it to a specified output file.

arguments:
source:
description: Path to the requirements file to analyze.
required: true

output:
description: Path where the generated plan should be written.
required: true

architecture:
description: Optional architecture document to guide implementation planning.
required: false

depth:
description: Planning depth.
enum:
- standard
- detailed
- enterprise
default: enterprise

examples:

* /create-feature-plan use /ecom/requirements.md output /ecom/plan.md
* /create-feature-plan use /prompts/v1/app/inventory/requirements.md output /prompts/v1/app/inventory/plan.md
* /create-feature-plan use /payments/requirements.md output /payments/implementation-plan.md architecture /payments/ARCHITECTURE.md

---

# Purpose

Convert a requirements document into an actionable, production-ready implementation and improvement plan.

The skill must:

1. Inspect the entire project structure surrounding the requirements file.
2. Analyze all requirements.
3. Identify existing and missing features.
4. Identify gaps, risks, dependencies, and assumptions.
5. Produce a detailed implementation roadmap.
6. Store the generated plan in the specified output file.

# Workflow

## Step 1 – Project Inspection

Inspect:

* Directory structure
* Existing source code
* Documentation
* Configuration files
* APIs
* Database schemas
* Build files
* Infrastructure definitions
* Tests
* CI/CD configuration

Identify:

* Existing capabilities
* Missing functionality
* Technical debt
* Security concerns
* Scalability issues
* Performance bottlenecks

---

## Step 2 – Requirement Analysis

Parse the source requirements file.

For each requirement:

Identify:

* Business objective
* User stories
* Functional requirements
* Non-functional requirements
* Dependencies
* Constraints
* Acceptance criteria
* Edge cases
* Assumptions
* Risks

---

## Step 3 – Feature Discovery

For every feature, generate:

### Feature Name

### Objective

### Business Value

### Functional Requirements

### Technical Requirements

### Dependencies

### API Requirements

### Database Requirements

### Security Requirements

### Validation Rules

### Error Handling

### Performance Requirements

### Monitoring Requirements

### Test Requirements

### Risks

### Mitigations

---

## Step 4 – Improvement Analysis

Identify opportunities for:

### Architecture

* Modularization
* Domain boundaries
* Separation of concerns
* Service decomposition

### Security

* Authentication
* Authorization
* OWASP risks
* Input validation
* Secrets management
* Audit logging
* Encryption
* Data privacy

### Scalability

* Caching
* Horizontal scaling
* Rate limiting
* Asynchronous processing
* Event-driven architecture

### Reliability

* Idempotency
* Retry strategies
* Circuit breakers
* Graceful degradation
* Transaction management

### Performance

* Query optimization
* Indexing
* Pagination
* Connection pooling
* Batch processing

### Observability

* Structured logging
* Metrics
* Tracing
* Health checks
* Alerting

---

## Step 5 – Generate Enterprise Plan

Generate the output document using the following structure:

# Project Overview

# Current State Assessment

# Identified Gaps

# Risks and Assumptions

# Recommended Improvements

# Feature Implementation Plan

For each feature:

## Feature: <Name>

### Objective

### Business Value

### Requirements

### Technical Design

### Data Model

### APIs

### Security Controls

### Validation Rules

### Error Handling

### Edge Cases

### Performance Considerations

### Monitoring and Observability

### Test Scenarios

### Acceptance Criteria

### Dependencies

### Risks and Mitigations

### Implementation Tasks

#### Phase 1 – Analysis

#### Phase 2 – Design

#### Phase 3 – Development

#### Phase 4 – Testing

#### Phase 5 – Deployment

#### Phase 6 – Monitoring

---

# Recommended Architecture Improvements

# Security Recommendations

# Performance Recommendations

# Scalability Recommendations

# Operational Recommendations

# Implementation Roadmap

Phase 1 – Foundation

Phase 2 – Core Features

Phase 3 – Integration

Phase 4 – Hardening

Phase 5 – Production Readiness

Phase 6 – Optimization

---

# Output Requirements

The generated plan must:

* Be implementation-ready.
* Be actionable.
* Be technology agnostic unless requirements specify otherwise.
* Follow enterprise architecture principles.
* Follow secure-by-design principles.
* Follow scalable-by-design principles.
* Follow production-grade operational practices.
* Be understandable by architects, developers, QA engineers, DevOps engineers, and product owners.

Finally:

Write the generated document to:

{{output}}
