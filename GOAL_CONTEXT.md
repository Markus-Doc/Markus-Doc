# Goal Context: MCP Governance Platform — Public Portfolio Publication

## Primary Outcome

The MCP Governance Platform must be publish-ready as a serious portfolio piece, with the source GitHub repo polished, the website integrated, and the final documentation structure clearly supporting a public portfolio display.

---

## Local Repositories

| Role | Path |
|---|---|
| Source project repo | `C:\Users\marku\OneDrive\Documents\GitHub\MCP_Governance_Platform` |
| Portfolio website repo | `C:\Users\marku\OneDrive\Documents\GitHub\Markus-Doc` |

---

## Important Recent Source Repo State

The MCP_Governance_Platform repo has already received and pushed the publication assets.

**Latest known pushed commit:**
```
96aacad  Inclusion of asset images pack for publication piece. Personal branding style guide-centric
```

**Previously pushed commit:**
```
dcb30c5  assets/ added for MCP Gov publishing
```

---

## Required Source Assets (now present in MCP_Governance_Platform)

```
assets/screenshots/MCP-Gov_N8N-Workflow.png
assets/diagrams/N8N-MCP_Access_Governance_Platform-v2.json
assets/images/mcp_governance_asset_pack/01_mcp_governance_cover.png
assets/images/mcp_governance_asset_pack/02_mcp_governance_hero_banner.png
assets/images/mcp_governance_asset_pack/03_mcp_governance_social_card_square.png
assets/images/mcp_governance_asset_pack/04_mcp_governance_reference_architecture.png
assets/images/mcp_governance_asset_pack/05_mcp_governance_workflow.png
assets/images/mcp_governance_asset_pack/06_mcp_governance_control_pillars.png
```

---

## Non-Negotiable Publication Requirement

The final n8n workflow visual at:

```
assets/screenshots/MCP-Gov_N8N-Workflow.png
```

**must be included** in the final published article or case study experience.

---

## Optional Visual Asset Guidance

The asset pack images under `assets/images/mcp_governance_asset_pack/` are available for design and publication use. They are optional, except the final n8n workflow screenshot remains mandatory.

| File | Preferred Use |
|---|---|
| `01_mcp_governance_cover.png` | PDF cover or document cover image |
| `02_mcp_governance_hero_banner.png` | Website hero or portfolio card hero |
| `03_mcp_governance_social_card_square.png` | Social preview or square card treatment |
| `04_mcp_governance_reference_architecture.png` | Case study architecture section |
| `05_mcp_governance_workflow.png` | Workflow explanation section |
| `06_mcp_governance_control_pillars.png` | Governance controls section |

---

## Naming Decisions

| Label | Value |
|---|---|
| Short website label | MCP Governance |
| Full project title | AI and MCP Access Governance Platform |
| Website section model | Portfolio Evidence |

### Portfolio Evidence Pieces

| Short Label | Full Title | Public Badge |
|---|---|---|
| IR Program | Enterprise Incident Response Program | Sanitised design portfolio |
| Cloud Case | Rossco's Coffee Cloud Security Plan | Fictionalised AWS case study |
| MCP Governance | AI and MCP Access Governance Platform | Working governance PoC |

> Do **not** label the MCP website button as "Governance Automation and AI Security." That phrase may appear in explanatory body copy only.

---

## Core Publishing Model

| Artefact | Role |
|---|---|
| `README.md` | GitHub landing page and technical gateway |
| Formal project charter | Deeper corporate proposal artefact |
| Portfolio website page | Public case study presentation |
| PDF | Polished downloadable artefact |
| n8n workflow JSON + screenshot | Proof the tool works |

---

## Website Architecture Constraints

- The Markus-Doc website is a **static site**.
- Do **not** introduce React, Vite, server rendering, API routes, backend logic, package manager requirements, or a build step.
- Preserve the current separate desktop and mobile implementations.

| Site | Path |
|---|---|
| Desktop root | `C:\Users\marku\OneDrive\Documents\GitHub\Markus-Doc` |
| Mobile site | `C:\Users\marku\OneDrive\Documents\GitHub\Markus-Doc\Mobile\Markus-Doc` |

- Preserve existing fallback behaviour, no-script fallback, WebGL fallback, mobile routing, and static hosting compatibility.
- Keep links relative where practical.
- Do **not** break existing resume, IR, Cloud, GitHub, LinkedIn, TryHackMe or writeup links.

---

## Required Website Outcome

- The site must clearly expose a **Portfolio Evidence** area or equivalent portfolio hub.
- IR and Cloud must no longer feel like vague unexplained buttons.
- MCP Governance must appear as the third portfolio evidence piece.
- The three portfolio pieces must be visually and textually comparable, but MCP Governance should be presented as more complete because it is a working governance PoC with workflow evidence.

### Preferred Website Implementation

Create or adapt a Portfolio Evidence hub rather than overloading the dock with too many direct buttons. If the current design makes a hub impractical, keep the dock stable and make the current IR and Cloud labels more descriptive while adding MCP Governance cleanly. Choose the **lowest risk implementation** that preserves current site stability and design language.

---

## Required Website Copy Themes for MCP Governance

- Working governance proof of concept for AI and MCP access review.
- Governance-first control for AI tools, MCP servers, workflows, approvals and audit evidence.
- Human-reviewed control flow for AI and MCP operations.
- Request, classify, policy check, approval, execute, log and review.
- Identity, least privilege, human approval, audit evidence and continuous review.
- n8n workflow orchestration with Notion evidence and Asana review tasks where applicable.
- This is a portfolio-safe proof of concept, not a production certification or attestation.

---

## Required MCP Repo Documentation Outcomes

Inspect the current repo first. Update `README.md` only where useful, keeping it as a concise GitHub landing page. Create or update a publication-focused documentation area at:

```
docs/publication/
```

### Publication Artefacts to Create or Update

| File | Purpose |
|---|---|
| `docs/publication/01-portfolio-case-study.md` | Full case study with workflow screenshot, architecture, controls, evidence model |
| `docs/publication/02-executive-summary.md` | Suitable for CISO, security leader or hiring manager |
| `docs/publication/03-website-integration-brief.md` | Website integration guidance |
| `docs/publication/04-publishing-checklist.md` | What must be true before public release |
| `docs/publication/ASSET_INDEX.md` | Lists required and optional assets with intended use |

- The case study **must** include the final n8n workflow screenshot.
- The case study should reference the v2 workflow JSON.
- The case study should explain the governance flow, architecture, control pillars, evidence model and portfolio safety boundaries.

---

## Required Website Asset Handling

Copy or mirror only website-needed public assets into the Markus-Doc website repo.

| Destination | Path |
|---|---|
| Website images | `C:\Users\marku\OneDrive\Documents\GitHub\Markus-Doc\assets\images\mcp-governance\` |
| Website documents | `C:\Users\marku\OneDrive\Documents\GitHub\Markus-Doc\assets\docs\` |

**Expected final PDF filename:** `Markus_Walker_MCP_Governance_Platform.pdf`

If PDF generation tooling exists locally, generate the PDF from the polished Markdown source. If not, create the Markdown source and clearly report that only PDF export is blocked, including the exact command or tool needed.

- Do **not** overwrite existing IR or Cloud PDFs.
- Do **not** rename existing PDFs unless references are updated safely.
- Do **not** delete existing portfolio assets.

---

## Quality and Design Expectations

- Use the existing personal branding style.
- The new MCP piece should visually match the professional navy, white and gold portfolio style already used by the asset pack.
- The MCP piece should not look like a generic AI page.
- Use the provided images only where they improve clarity.
- Do not clutter the site.
- Keep the copy plain, executive-readable and credible.

---

## Security and Privacy Constraints

- Do **not** expose secrets, credential IDs, OAuth details, internal IDs or private live service details in public copy.
- If the n8n JSON includes credential references, present it as a sanitised workflow export or demo artefact.
- Make clear that fictional vendors, mock intake data and demo values are used where applicable.
- Do **not** imply production certification, SOC 2 attestation, ISO certification or live enterprise approval.

---

## Verification Surface

Before considering the goal complete, verify all of the following with evidence in the final report.

### For MCP_Governance_Platform

- [ ] `git status` is clean or only intentionally uncommitted files remain.
- [ ] `README.md` exists and contains links to `docs/publication/` and `assets/screenshots/MCP-Gov_N8N-Workflow.png`.
- [ ] Publication docs exist and render as readable GitHub-flavoured Markdown.
- [ ] The mandatory n8n screenshot is referenced by the publication case study.
- [ ] The v2 workflow JSON is referenced where relevant.
- [ ] Any generated PDF or PDF source exists in the expected location.
- [ ] No obvious secrets are introduced.

### For Markus-Doc Website

- [ ] Desktop site still loads from static root.
- [ ] Mobile site still has equivalent portfolio content.
- [ ] Portfolio Evidence framing is present.
- [ ] IR Program, Cloud Case and MCP Governance are distinguishable and descriptive.
- [ ] MCP Governance links to the relevant PDF or Markdown artefact, GitHub repo and visual evidence.
- [ ] Fallback or no-script content still exposes the important documents.
- [ ] All new local asset paths resolve.
- [ ] Existing resume, IR, Cloud and writeup links still resolve.
- [ ] No backend, build step or package dependency has been introduced.

### Verification Commands

```powershell
git -C "C:/Users/marku/OneDrive/Documents/GitHub/MCP_Governance_Platform" status
git -C "C:/Users/marku/OneDrive/Documents/GitHub/Markus-Doc" status
dir "C:/Users/marku/OneDrive/Documents/GitHub/MCP_Governance_Platform/docs/publication"
dir "C:/Users/marku/OneDrive/Documents/GitHub/Markus-Doc/assets/images/mcp-governance"
dir "C:/Users/marku/OneDrive/Documents/GitHub/Markus-Doc/assets/docs"
findstr /i "MCP-Gov_N8N-Workflow" "C:/Users/marku/OneDrive/Documents/GitHub/MCP_Governance_Platform/docs/publication/01-portfolio-case-study.md"
```

---

## Iteration Policy

1. First inspect both repos and current file structure.
2. Then make a short implementation plan.
3. Then implement in small, safe edits.
4. After each meaningful change, re-check links and file paths.
5. Prefer the **smallest stable change** that achieves the publishing outcome.
6. Do not perform broad unrelated refactors.
7. Do not chase cosmetic perfection beyond what is needed to publish confidently.

---

## Blocked Stop Condition

| Condition | Action |
|---|---|
| Either local repo path is missing | Stop and report exactly which path is missing |
| Required assets are missing | Stop and report exactly which assets are missing |
| PDF generation is the only blocker | Complete all Markdown and website work, then report the missing dependency and exact next step |
| Design choice could break static site architecture | Choose safer implementation and document the tradeoff |
| No defensible path remains | Stop with files inspected, changes made, blocker, and exact input needed |

---

## Completion Report Template

At the end, provide a concise final report with:

- **Files changed**
- **Assets copied or referenced**
- **Website pages or sections changed**
- **Docs created or updated**
- **Verification commands run**
- **Any blocked items**
- **Suggested commit message**

> Do not push unless explicitly asked.

---

## /goal Command (for Claude CLI)

Paste the following into the terminal as the `/goal` command to execute this work:

```
/goal All of the following are true, verified by inspecting the transcript output of each check, or stop after 40 turns:

REPO: MCP_Governance_Platform
1. git -C "C:/Users/marku/OneDrive/Documents/GitHub/MCP_Governance_Platform" status shows nothing uncommitted except intentionally excluded files.
2. README.md exists and contains links to docs/publication/ and assets/screenshots/MCP-Gov_N8N-Workflow.png.
3. docs/publication/01-portfolio-case-study.md exists and contains a reference to MCP-Gov_N8N-Workflow.png.
4. docs/publication/02-executive-summary.md exists and is readable GitHub Markdown.
5. docs/publication/03-website-integration-brief.md exists.
6. docs/publication/04-publishing-checklist.md exists.
7. docs/publication/ASSET_INDEX.md exists and lists all six asset pack images plus the mandatory screenshot.
8. No file in docs/publication/ contains the strings "secret", "credential", "oauth_token", "client_id", or any raw UUID-style credential pattern.

REPO: Markus-Doc
9. C:/Users/marku/OneDrive/Documents/GitHub/Markus-Doc/assets/images/mcp-governance/ exists and contains at minimum MCP-Gov_N8N-Workflow.png and 02_mcp_governance_hero_banner.png.
10. A portfolio evidence section exists in the desktop site index.html referencing all three pieces: IR Program, Cloud Case, and MCP Governance, each with a descriptive label and at least one working relative link.
11. The mobile site at Markus-Doc/Mobile/Markus-Doc/ has equivalent portfolio evidence content for all three pieces.
12. No <script> with src pointing to a CDN package manager, no package.json, no node_modules, no build step introduced anywhere in Markus-Doc.
13. Existing links to resume, IR PDF, Cloud PDF, GitHub, LinkedIn, TryHackMe, and writeups resolve to paths that still exist on disk.
14. A Markdown source for the MCP Governance portfolio PDF exists at C:/Users/marku/OneDrive/Documents/GitHub/Markus-Doc/assets/docs/Markus_Walker_MCP_Governance_Platform.md or equivalent .pdf if generation succeeded.

CONSTRAINTS that must hold throughout:
- Do not overwrite or rename existing IR or Cloud PDFs.
- Do not delete any existing portfolio assets.
- Do not introduce React, Vite, server rendering, API routes, or any backend.
- Do not push either repo. Commit locally only if instructed.
- If PDF generation tooling is unavailable, complete all Markdown and website work and report the exact tool and command needed. That is not a blocker for goal completion.
- If any required source asset is missing from MCP_Governance_Platform, stop immediately and report which asset is missing.

VERIFICATION: Before declaring the goal met, run the following and include each output in the transcript:
- git -C "C:/Users/marku/OneDrive/Documents/GitHub/MCP_Governance_Platform" status
- git -C "C:/Users/marku/OneDrive/Documents/GitHub/Markus-Doc" status
- dir "C:/Users/marku/OneDrive/Documents/GitHub/MCP_Governance_Platform/docs/publication"
- dir "C:/Users/marku/OneDrive/Documents/GitHub/Markus-Doc/assets/images/mcp-governance"
- dir "C:/Users/marku/OneDrive/Documents/GitHub/Markus-Doc/assets/docs"
- findstr /i "MCP-Gov_N8N-Workflow" "C:/Users/marku/OneDrive/Documents/GitHub/MCP_Governance_Platform/docs/publication/01-portfolio-case-study.md"

Context file location: C:/Users/marku/OneDrive/Documents/GitHub/MCP_Governance_Platform/GOAL_CONTEXT.md
```
