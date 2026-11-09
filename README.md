<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/img/hero-dark.svg">
    <img src="docs/img/hero-light.svg" width="100%" alt="Markus Walker. AI engineer, end to end. Grounded in cybersecurity. Portfolio, November 2026. Three links orbit the centre: Checkable AI, the portfolio at markuswalker.com, and the public repositories below.">
  </picture>
</p>

<p align="center">
  <a href="https://www.checkableai.com/"><img src="https://img.shields.io/badge/See%20it%20built-checkableai.com-8a3a1e?style=for-the-badge" alt="See it built: checkableai.com"></a>
  <a href="https://github.com/checkable-ai"><img src="https://img.shields.io/badge/Checkable%20AI-on%20GitHub-8a3a1e?style=for-the-badge" alt="Checkable AI on GitHub"></a>
</p>

<p align="center">
  <a href="https://www.markuswalker.com/"><img src="https://img.shields.io/badge/R%C3%A9sum%C3%A9%20and%20CV-markuswalker.com-263d35?style=for-the-badge" alt="Résumé, CV and portfolio: markuswalker.com"></a>
  <a href="https://www.linkedin.com/in/markus-walker-au/"><img src="https://img.shields.io/badge/Connect-LinkedIn-263d35?style=for-the-badge" alt="Connect on LinkedIn"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/as%20of-November%202026-5f5753" alt="This page is as of November 2026">
  <img src="https://img.shields.io/badge/repositories-93%20total%2C%2013%20public-5f5753" alt="93 repositories in total, 13 public">
  <img src="https://img.shields.io/badge/based%20in-Brisbane%2C%20Australia-5f5753" alt="Based in Brisbane, Australia">
  <img src="https://img.shields.io/badge/clearance-eligible%20for%20NV1%20and%20NV2-5f5753" alt="Eligible for NV1 and NV2 clearance">
</p>

I'm an AI engineer in Brisbane. I take agentic AI from the first scoping conversation through architecture, build, security controls and handover, with thirteen years of cybersecurity, IT infrastructure and operational technology behind it. The quickest way to judge my work is to use it, so start with what I have built.

> [!TIP]
> **Start with Checkable AI.** Its tools, knowledge base and demos are live and open to try. My résumé, CV and written projects are on my portfolio site.

## Start here

| 1. See it built | 2. See who built it |
|---|---|
| **[Checkable AI](https://www.checkableai.com/)**<br>Free AI checks, a knowledge base of what AI vendors document and a working CI demo. Real, running and open to try.<br><br>**[Source on GitHub](https://github.com/checkable-ai)** | **[markuswalker.com](https://www.markuswalker.com/)**<br>Résumé and CV, project write-ups, experience and how I work.<br><br>**[Résumé (PDF)](https://www.markuswalker.com/Markus_Walker_Resume.pdf)** |

## Checkable AI on GitHub

- **[knowledge-base-preview](https://github.com/checkable-ai/knowledge-base-preview)**: what 116 AI platforms document, checked against the same 46 security controls, with one plain page per answer.
- **[ci-demo](https://github.com/checkable-ai/ci-demo)**: catches AI vendor changes before your code ships, with nightly vendor change pull requests, a named sign-off gate, a deploy gate and a Kubernetes check.
- **Live checks**: the [AI Stack Check](https://www.checkableai.com/stack-check/) and the [AU Frameworks Check](https://www.checkableai.com/readiness-check/) run on the same knowledge base.

## My public repositories

### Agentic AI and governance

| Repository | What it is |
|---|---|
| [headless-llm-gateway](https://github.com/Markus-Doc/headless-llm-gateway) | One local OpenAI-compatible endpoint that routes agent calls to headless Claude Code and Codex, with a proof record per call. [Write-up](https://www.markuswalker.com/projects/llm-gateway/). |
| [governed-ai-agent](https://github.com/Markus-Doc/governed-ai-agent) | A governed AI agent on an open knowledge base, with policy as code and a security model that treats the agent as untrusted. [Write-up](https://www.markuswalker.com/projects/governed-ai-agent/). |
| [MCP_Governance_Platform](https://github.com/Markus-Doc/MCP_Governance_Platform) | A working proof of concept for governing AI agent and MCP-connected integrations: intake, risk classification, human review and an evidence trail. |
| [resynth](https://github.com/Markus-Doc/resynth) | Consolidates several AI deep research reports into one verified master document, through a gated systematic review pipeline. |
| [SubstrateOS](https://github.com/Markus-Doc/SubstrateOS) | A thin, local-first AI orchestration harness, engine-swappable by design. Archived as a finished piece. |

### Security writing

| Repository | What it is |
|---|---|
| [cybersecurity-portfolio](https://github.com/Markus-Doc/cybersecurity-portfolio) | Capability design kept apart from technical write-ups, with downloadable deliverables. [Read it as a site](https://markus-doc.github.io/cybersecurity-portfolio/). |
| [cybersecurity-writeups](https://github.com/Markus-Doc/cybersecurity-writeups) | Red Team Capstone crawl-through and other security write-ups. [Read it as a site](https://markus-doc.github.io/cybersecurity-writeups/). |

### Study and play

| Repository | What it is |
|---|---|
| [claude-study-game](https://github.com/Markus-Doc/claude-study-game) | Runner, a pixel-art study game for the Claude Certified Architect, Foundations exam, built with Phaser and TypeScript. [Play it](https://www.markuswalker.com/runner/). |
| [isc2-cc-study](https://github.com/Markus-Doc/isc2-cc-study) | Flashcards and a multiple choice quiz for ISC2 Certified in Cybersecurity revision. [Open it](https://markus-doc.github.io/isc2-cc-study/). |

**93 repositories in total, 13 of them public** (as of November 2026). The other 80 are private lab, business and study work, which is what sits behind the contribution graph further down this page.

<details>
<summary><strong>What I work on</strong>: secure AI delivery, agent architecture, MCP governance and knowledge bases</summary>

- **Secure AI delivery.** Sovereign AI environments on Azure, with Azure AI Foundry models hosted in an Australian region, and the access and device controls that hold each machine to an approved configuration.
- **Agentic architecture.** Reference architectures that stay independent of any one cloud or model, so the security posture survives a change of platform underneath.
- **MCP and agent governance.** Governing agent and MCP-connected integrations before they become unmanaged risk.
- **Knowledge bases agents can reason over.** Graph ontologies, vector-searchable knowledge graphs, and the ingestion, redaction, retrieval and provenance tooling around them.

Thirteen years in cybersecurity, IT infrastructure and operational technology sit behind that, including seven running IT and OT for upstream and midstream gas operations across more than twenty remote sites.

</details>

<details>
<summary><strong>How I build</strong>: two convictions that shape most of the work</summary>

**Build what frontier AI will not replace.** Models keep getting better, so anything a future model will do natively is throwaway work. The durable investment is what stays personal and owned, starting with an organisation's own knowledge base. That is why the work leans towards harnesses and governance around a model rather than wrappers over one.

**Keep the engine swappable.** Nobody knows which tools last. Claude, Codex, ChatGPT, Kimi, Grok, Cursor or something not yet released could win, so the engine has to be a replaceable part: open formats, standard protocols such as MCP, and instructions any agent can read.

</details>

<details>
<summary><strong>Credentials</strong>: AWS, Oracle Cloud, Anthropic and Certificate IV in Cyber Security</summary>

AWS Certified Solutions Architect, Associate. Three Oracle Cloud Infrastructure certifications, including Generative AI Professional. Anthropic Claude Certified Associate, Foundations. Certificate IV in Cyber Security. Australian citizen, eligible for NV1 and NV2.

</details>

<p align="center">
  <a href="https://www.checkableai.com/"><strong>Checkable AI</strong></a>
  &nbsp;&middot;&nbsp;
  <a href="https://github.com/checkable-ai"><strong>Checkable AI on GitHub</strong></a>
  &nbsp;&middot;&nbsp;
  <a href="https://www.markuswalker.com/"><strong>markuswalker.com</strong></a>
  &nbsp;&middot;&nbsp;
  <a href="https://www.linkedin.com/in/markus-walker-au/"><strong>LinkedIn</strong></a>
</p>

<p align="center">
  MIT licence, copyright (c) 2026 M. Walker. See <a href="LICENSE">LICENSE</a>.
</p>
