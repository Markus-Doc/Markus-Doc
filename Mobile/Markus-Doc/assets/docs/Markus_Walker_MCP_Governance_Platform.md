# AI and MCP Access Governance Platform

**Markus Walker — Security, AI and Cloud Engineer**  
Brisbane, Australia · markus@markuswalker.com · linkedin.com/in/markus-walker-au

---

## Overview

The **AI and MCP Access Governance Platform** is a working security engineering proof of concept that addresses a real and emerging governance gap: organisations lack a repeatable intake, classification, review and audit process for AI agent integrations and MCP-connected tools.

This project demonstrates a complete governance control loop — from structured intake through automated risk classification, human-reviewed approval, and durable audit evidence — implemented as a runnable n8n workflow.

---

## The Problem

AI agents and MCP-connected workflow tools are entering enterprise infrastructure faster than governance frameworks can keep up. Without a structured process:

- Sensitive data flows through channels that have never been security-reviewed
- No accountable owner is documented for AI workflows
- No evidence of review exists if an incident occurs
- Security teams cannot demonstrate that controls operated over time

This is the default outcome when AI-native development tooling meets legacy access governance processes.

---

## The Solution

A lightweight, repeatable governance control loop that sits between a developer wanting a new integration and that integration touching real infrastructure.

```
Request → Validate → Classify → Route → Review → Evidence
```

Every path — approved, conditionally approved, or denied — produces a structured audit evidence record.

---

## Platform Stack

| Platform | Role |
|---|---|
| n8n Cloud | Workflow orchestration, validation, risk classification, decision routing, evidence summary |
| Asana | Human review task queue, remediation tracking, operational audit evidence |
| Notion | Governance knowledge base, MCP server inventory, control notes, decision records |
| GitHub | Source control, documentation, workflow exports, JSON schemas |

---

## Governance Flow

1. Developer submits an integration request via structured Asana form
2. n8n receives and validates the intake (required fields, data classification, MCP tool details)
3. Automated risk signals are checked: data class, environment, privilege scope, vendor maturity
4. Risk is classified at one of four levels: Low, Medium, High, or Prohibited
5. Low-risk requests are auto-allowed with an evidence record
6. Medium and High-risk requests route to a named security reviewer in Asana
7. Reviewer decides: Approve, Approve with Conditions, or Deny
8. Every terminal decision produces a structured JSON evidence record

---

## Governance Controls

| Control | Objective |
|---|---|
| GOV-01 | Structured intake — every request captured with required fields |
| GOV-02 | Risk-based decisioning — classification uses documented, consistent criteria |
| GOV-03 | Human accountability — material risk routed to named security reviewer |
| GOV-04 | Audit evidence — every terminal decision produces a structured record |
| GOV-05 | Least privilege — approved access is time-bound and purpose-bound |
| GOV-06 | Safe automation boundary — no real provisioning without explicit approval |
| GOV-07 | Scope guardrails — workflow changes follow documented architecture |
| GOV-08 | Periodic review — approved access re-reviewed on material scope change |

---

## Security Linter

A deterministic Python security linter inspects n8n workflow JSON exports for governance risk signals:

| Rule | Severity | Signal |
|---|---|---|
| LINT-001 | High | MCP client tool node detected |
| LINT-002 | High | MCP node with credential references |
| LINT-003 | Medium | HTTP node calling MCP-like endpoint directly |
| LINT-004 | High | AI agent node with no human approval gate upstream |
| LINT-005 | Medium | Workflow missing owner metadata |
| LINT-006 | Low | Workflow missing risk classification metadata |

- 42 pytest tests passing across positive, negative, serialisation and integration scenarios
- Framework mapping tags embedded in every finding at generation time
- Pure functions — deterministic, stateless, side-effect-free

---

## Framework Alignment

| Framework | Alignment Area |
|---|---|
| ISO/IEC 27001 | Access control, supplier risk, change management, auditability |
| ISO/IEC 42001 | AI management, human oversight, accountability, lifecycle governance |
| NIST SP 800-37 | Risk management framework structure |
| NIST SP 800-30 | Risk assessment language and treatment |
| CSA AI Controls Matrix | Cloud AI governance, access control, data governance |
| MAESTRO | Agentic AI threat modelling, orchestration and tool execution |
| OWASP LLM Top 10 | Prompt injection, data leakage, tool misuse, excessive agency |
| MCP Security Guidance | Consent, authorisation, confused deputy protections |

The project does not claim formal certification or attestation against any of these frameworks.

---

## What This Demonstrates

| Capability | Evidence |
|---|---|
| Security engineering applied to an emerging AI governance problem | Working PoC with runnable n8n workflow |
| Governance translated to testable, auditable code | 42 passing tests, schema-validated output |
| Framework alignment at the engineering level | Tags embedded in every finding, not just in documents |
| Evidence-oriented design | Audit chain across every decision path |
| Full governance documentation | Charter, architecture, design, implementation guide, case study |
| Honest scoping | PoC limitations documented; no overclaiming |

---

## Portfolio Safety

This is a portfolio-safe proof of concept.

- All sample data is fictional
- All workflow exports use fictional placeholder values
- No production infrastructure, live credentials or real customer data are present
- The project does not claim to be a production deployment, a formal compliance certification or a complete enterprise control environment
- Fictional vendors, mock intake data and demo values are used throughout

---

## Source Repository

Full documentation, workflow exports, schemas and evidence samples are available at the GitHub repository for this project.

---

## Contact

**Markus Walker**  
Security, AI and Cloud Engineer  
Brisbane, Australia  
markus@markuswalker.com  
linkedin.com/in/markus-walker-au
