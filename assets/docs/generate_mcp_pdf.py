"""
Generates Markus_Walker_MCP_Governance_Platform.pdf
Navy / white / gold portfolio style.
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, Image as RLImage, PageBreak
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from PIL import Image as PILImage

# ── Paths ──────────────────────────────────────────────────────────────────
SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
ASSET_PACK  = r"C:\Users\marku\OneDrive\Documents\GitHub\MCP_Governance_Platform\assets\images\mcp_governance_asset_pack"
SCREENSHOTS = r"C:\Users\marku\OneDrive\Documents\GitHub\MCP_Governance_Platform\assets\screenshots"
OUT_PATH    = os.path.join(SCRIPT_DIR, "Markus_Walker_MCP_Governance_Platform.pdf")

IMG_COVER    = os.path.join(ASSET_PACK, "01_mcp_governance_cover.png")
IMG_HERO     = os.path.join(ASSET_PACK, "02_mcp_governance_hero_banner.png")
IMG_ARCH     = os.path.join(ASSET_PACK, "04_mcp_governance_reference_architecture.png")
IMG_WORKFLOW = os.path.join(ASSET_PACK, "05_mcp_governance_workflow.png")
IMG_PILLARS  = os.path.join(ASSET_PACK, "06_mcp_governance_control_pillars.png")
IMG_N8N      = os.path.join(SCREENSHOTS, "MCP-Gov_N8N-Workflow.png")

# ── Colours ────────────────────────────────────────────────────────────────
NAVY_DEEP = colors.HexColor("#02060f")
NAVY_MID  = colors.HexColor("#0d1b2a")
NAVY_CARD = colors.HexColor("#101f33")
NAVY_RULE = colors.HexColor("#1a3a5c")
CYAN      = colors.HexColor("#6ee7ff")
GOLD      = colors.HexColor("#d4a843")
WHITE     = colors.HexColor("#edfaff")
MUTED     = colors.HexColor("#7a9bbf")
RED_ALERT = colors.HexColor("#fb7185")
GREEN_OK  = colors.HexColor("#34d399")

W, H   = A4
MARGIN = 18 * mm
CW     = W - 2 * MARGIN   # content width

# ── Image helper ───────────────────────────────────────────────────────────
def img_flow(path, max_w, max_h=None):
    try:
        pil = PILImage.open(path)
        iw, ih = pil.size
        ratio = iw / ih
        w = max_w
        h = w / ratio
        if max_h and h > max_h:
            h = max_h
            w = h * ratio
        return RLImage(path, width=w, height=h)
    except Exception as e:
        print(f"Warning: {path}: {e}")
        return Spacer(1, 6)

# ── Cover page — drawn on canvas directly in onFirstPage ──────────────────
def draw_cover(canv, doc):
    """Draw the full cover page on page 1."""
    canv.saveState()

    canv.setFillColor(NAVY_DEEP)
    canv.rect(0, 0, W, H, fill=1, stroke=0)

    try:
        canv.drawImage(IMG_COVER, 0, H * 0.38, W, H * 0.62,
                       preserveAspectRatio=False, anchor='c')
    except Exception as e:
        print(f"Cover image: {e}")

    # Gradient overlay
    steps = 50
    for i in range(steps):
        y_start = H * 0.38 + i * (H * 0.2 / steps)
        alpha   = i / steps * 0.9
        canv.setFillColor(colors.Color(0.008, 0.023, 0.059, alpha))
        canv.rect(0, y_start, W, H * 0.2 / steps + 2, fill=1, stroke=0)

    canv.setFillColor(NAVY_MID)
    canv.rect(0, 0, W, H * 0.41, fill=1, stroke=0)
    canv.setFillColor(CYAN)
    canv.rect(MARGIN, H * 0.41 - 1.5, W - 2 * MARGIN, 1.5, fill=1, stroke=0)

    # Badge
    bx, by = MARGIN, H * 0.384
    canv.setFillColor(colors.Color(0.43, 0.91, 1.0, 0.10))
    canv.roundRect(bx, by, 128, 17, 8, fill=1, stroke=0)
    canv.setFillColor(CYAN)
    canv.setFont("Helvetica-Bold", 7)
    canv.drawString(bx + 9, by + 5, "WORKING GOVERNANCE PoC")

    # Title
    ty = H * 0.315
    canv.setFillColor(WHITE)
    canv.setFont("Helvetica-Bold", 27)
    canv.drawString(MARGIN, ty, "AI and MCP Access")
    canv.drawString(MARGIN, ty - 33, "Governance Platform")
    canv.setFillColor(GOLD)
    canv.rect(MARGIN, ty - 40, 195, 2.5, fill=1, stroke=0)
    canv.setFillColor(MUTED)
    canv.setFont("Helvetica", 10.5)
    canv.drawString(MARGIN, ty - 56,
                    "Structured intake · Risk classification · Human review · Audit evidence")

    # Author
    ay = H * 0.115
    canv.setFillColor(GOLD)
    canv.setFont("Helvetica-Bold", 13)
    canv.drawString(MARGIN, ay + 18, "Markus Walker")
    canv.setFillColor(MUTED)
    canv.setFont("Helvetica", 9.5)
    canv.drawString(MARGIN, ay, "Security, AI and Cloud Engineer  ·  Brisbane, Australia")
    canv.drawString(MARGIN, ay - 14,
                    "markus@markuswalker.com  ·  linkedin.com/in/markus-walker-au")

    canv.setFillColor(NAVY_RULE)
    canv.rect(0, 20, W, 1, fill=1, stroke=0)
    canv.setFillColor(MUTED)
    canv.setFont("Helvetica-Oblique", 7)
    canv.drawString(MARGIN, 8,
                    "Portfolio-safe proof of concept. Fictional vendors and mock data throughout. "
                    "Not a production deployment or compliance certification.")
    canv.restoreState()

# ── Page chrome (background + header + footer) ─────────────────────────────
def _make_bg_canvas(canv, doc):
    canv.saveState()

    canv.setFillColor(NAVY_DEEP)
    canv.rect(0, 0, W, H, fill=1, stroke=0)

    canv.setFillColor(NAVY_MID)
    canv.rect(0, H - 22 * mm, W, 22 * mm, fill=1, stroke=0)
    canv.setFillColor(CYAN)
    canv.rect(0, H - 22 * mm - 1.5, W, 1.5, fill=1, stroke=0)

    canv.setFillColor(MUTED)
    canv.setFont("Helvetica", 7.5)
    canv.drawString(MARGIN, H - 13 * mm,
                    "AI AND MCP ACCESS GOVERNANCE PLATFORM  ·  MARKUS WALKER")
    canv.setFillColor(CYAN)
    canv.setFont("Helvetica-Bold", 7.5)
    canv.drawRightString(W - MARGIN, H - 13 * mm, "WORKING GOVERNANCE PoC")

    canv.setFillColor(NAVY_RULE)
    canv.rect(0, 14 * mm, W, 1, fill=1, stroke=0)
    canv.setFillColor(MUTED)
    canv.setFont("Helvetica", 7)
    canv.drawString(MARGIN, 10 * mm,
                    "Portfolio-safe proof of concept · Fictional vendors and mock data throughout")
    canv.drawRightString(W - MARGIN, 10 * mm, f"Page {doc.page}")

    canv.restoreState()

# ── Styles ─────────────────────────────────────────────────────────────────
S = {
    'h1': ParagraphStyle('h1',
        fontName="Helvetica-Bold", textColor=CYAN,
        fontSize=20, spaceBefore=8, spaceAfter=6, leading=26),
    'h2': ParagraphStyle('h2',
        fontName="Helvetica-Bold", textColor=GOLD,
        fontSize=14, spaceBefore=14, spaceAfter=4, leading=20),
    'h3': ParagraphStyle('h3',
        fontName="Helvetica-Bold", textColor=MUTED,
        fontSize=10, spaceBefore=10, spaceAfter=3, leading=14),
    'body': ParagraphStyle('body',
        fontName="Helvetica", textColor=WHITE,
        fontSize=9.5, leading=15, spaceAfter=6),
    'body_muted': ParagraphStyle('body_muted',
        fontName="Helvetica-Oblique", textColor=MUTED,
        fontSize=8.5, leading=13, spaceAfter=5),
    'bullet': ParagraphStyle('bullet',
        fontName="Helvetica", textColor=WHITE,
        fontSize=9.5, leading=15, leftIndent=14, spaceAfter=3),
    'eyebrow': ParagraphStyle('eyebrow',
        fontName="Helvetica-Bold", textColor=MUTED,
        fontSize=7.5, spaceAfter=2, leading=10),
    'lede': ParagraphStyle('lede',
        fontName="Helvetica", textColor=WHITE,
        fontSize=11, leading=18, spaceAfter=10),
    'caption': ParagraphStyle('caption',
        fontName="Helvetica-Oblique", textColor=MUTED,
        fontSize=7.5, leading=11, spaceAfter=8, alignment=TA_CENTER),
}

# ── Rule helpers ───────────────────────────────────────────────────────────
def rule():
    return HRFlowable(width="100%", thickness=0.8,
                      color=NAVY_RULE, spaceAfter=6, spaceBefore=2)

def gold_rule():
    return HRFlowable(width="38%", thickness=2.2,
                      color=GOLD, spaceAfter=10, spaceBefore=2, hAlign='LEFT')

def cyan_rule():
    return HRFlowable(width="100%", thickness=1.2,
                      color=CYAN, spaceAfter=8, spaceBefore=4)

# ── Base table style factory ───────────────────────────────────────────────
BASE_TBL = [
    ('BACKGROUND',    (0, 0), (-1, 0),  NAVY_CARD),
    ('TEXTCOLOR',     (0, 0), (-1, 0),  CYAN),
    ('FONTNAME',      (0, 0), (-1, 0),  'Helvetica-Bold'),
    ('FONTSIZE',      (0, 0), (-1, 0),  8),
    ('TOPPADDING',    (0, 0), (-1, 0),  6),
    ('BOTTOMPADDING', (0, 0), (-1, 0),  6),
    ('LEFTPADDING',   (0, 0), (-1,-1),  8),
    ('RIGHTPADDING',  (0, 0), (-1,-1),  8),
    ('GRID',          (0, 0), (-1,-1),  0.4, NAVY_RULE),
    ('TEXTCOLOR',     (0, 1), (-1,-1),  WHITE),
    ('FONTNAME',      (0, 1), (-1,-1),  'Helvetica'),
    ('FONTSIZE',      (0, 1), (-1,-1),  8.5),
    ('TOPPADDING',    (0, 1), (-1,-1),  5),
    ('BOTTOMPADDING', (0, 1), (-1,-1),  5),
    ('ROWBACKGROUNDS',(0, 1), (-1,-1),  [NAVY_MID, NAVY_CARD]),
    ('VALIGN',        (0, 0), (-1,-1),  'MIDDLE'),
]

def tbl_style(*extra):
    return TableStyle(list(BASE_TBL) + list(extra))

# ── Build ──────────────────────────────────────────────────────────────────
def build():
    doc = SimpleDocTemplate(
        OUT_PATH, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=26 * mm, bottomMargin=22 * mm,
        title="AI and MCP Access Governance Platform",
        author="Markus Walker",
        subject="Security Portfolio — Working Governance PoC",
    )

    story = []

    # ── Cover: onFirstPage draws it; CondPageBreak forces content to p2 ──
    story.append(PageBreak())

    # ── Page 2: Overview ─────────────────────────────────────────────────
    story.append(Paragraph("01 / OVERVIEW", S['eyebrow']))
    story.append(Paragraph("AI and MCP Access Governance Platform", S['h1']))
    story.append(gold_rule())
    story.append(img_flow(IMG_HERO, CW, max_h=72))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "A working security engineering proof of concept that addresses a real and "
        "emerging governance gap: organisations lack a repeatable intake, classification, "
        "review and audit process for AI agent integrations and MCP-connected tools.",
        S['lede']))
    story.append(Paragraph(
        "This project demonstrates a complete governance control loop — from structured intake "
        "through automated risk classification, human-reviewed approval, and durable audit "
        "evidence — implemented as a runnable n8n workflow.", S['body']))

    story.append(Spacer(1, 8))
    story.append(Paragraph("THE PROBLEM", S['h3']))
    story.append(rule())
    for b in [
        "Sensitive data flows through channels that have never been security-reviewed",
        "No accountable owner is documented for AI workflows",
        "No evidence of review exists if an incident occurs",
        "Security teams cannot demonstrate that controls operated over time",
    ]:
        story.append(Paragraph(f"•  {b}", S['bullet']))

    story.append(Spacer(1, 8))
    story.append(Paragraph("PLATFORM STACK", S['h3']))
    story.append(rule())
    stack_data = [
        ["Platform", "Role"],
        ["n8n Cloud",  "Workflow orchestration, validation, risk classification, decision routing, evidence"],
        ["Asana",      "Human review task queue, remediation tracking, operational audit evidence"],
        ["Notion",     "Governance knowledge base, MCP server inventory, control notes, decision records"],
        ["GitHub",     "Source control, documentation, workflow exports, JSON schemas"],
    ]
    story.append(Table(stack_data, colWidths=[72, CW - 72],
                       style=tbl_style()))
    story.append(PageBreak())

    # ── Page 3: Governance Flow ────────────────────────────────────────────
    story.append(Paragraph("02 / GOVERNANCE FLOW", S['eyebrow']))
    story.append(Paragraph("How the control loop works", S['h1']))
    story.append(gold_rule())
    story.append(img_flow(IMG_WORKFLOW, CW, max_h=125))
    story.append(Paragraph(
        "Governance control flow — intake through evidence record", S['caption']))
    story.append(Spacer(1, 4))

    flow_data = [
        ["Step", "Action",    "Detail"],
        ["1",   "Submit",    "Developer submits via structured Asana intake form"],
        ["2",   "Validate",  "n8n validates required fields, data classification and MCP tool details"],
        ["3",   "Classify",  "Risk signals checked: data class, environment, privilege scope, vendor maturity"],
        ["4",   "Route",     "Low risk: auto-allowed with evidence. Medium/High: named security reviewer"],
        ["5",   "Review",    "Reviewer decides: Approve, Approve with Conditions, or Deny"],
        ["6",   "Evidence",  "Every terminal decision produces a structured JSON audit record"],
    ]
    story.append(Table(flow_data, colWidths=[22, 62, CW - 84],
                       style=tbl_style(
                           ('FONTNAME',  (0, 1), (0, -1), 'Helvetica-Bold'),
                           ('TEXTCOLOR', (0, 1), (0, -1), GOLD),
                       )))

    story.append(Spacer(1, 12))
    story.append(Paragraph("RISK CLASSIFICATION LEVELS", S['h3']))
    story.append(rule())
    risk_data = [
        ["Level",       "Routing",      "Outcome"],
        ["Low",         "Automated",    "Auto-allowed with structured evidence record"],
        ["Medium",      "Human review", "Named reviewer in Asana, structured decision record"],
        ["High",        "Human review", "Named reviewer, escalation path, conditional approval or deny"],
        ["Prohibited",  "Auto-denied",  "Immediate denial with evidence record, no exception path"],
    ]
    story.append(Table(risk_data, colWidths=[62, 85, CW - 147],
                       style=tbl_style(
                           ('TEXTCOLOR', (0, 1), (0, 1), GREEN_OK),
                           ('TEXTCOLOR', (0, 2), (0, 2), GOLD),
                           ('TEXTCOLOR', (0, 3), (0, 3), colors.HexColor("#fb7185")),
                           ('TEXTCOLOR', (0, 4), (0, 4), RED_ALERT),
                       )))
    story.append(PageBreak())

    # ── Page 4: n8n Workflow Evidence (MANDATORY) ──────────────────────────
    story.append(Paragraph("03 / WORKFLOW EVIDENCE", S['eyebrow']))
    story.append(Paragraph("n8n workflow — live and runnable", S['h1']))
    story.append(gold_rule())
    story.append(Paragraph(
        "The following screenshot shows the complete n8n workflow as deployed. "
        "Every node corresponds directly to a governance control objective. "
        "The workflow JSON export is available for direct import into any n8n Cloud "
        "or self-hosted n8n instance.", S['body']))
    story.append(Spacer(1, 6))
    story.append(img_flow(IMG_N8N, CW, max_h=295))
    story.append(Paragraph(
        "Live n8n workflow export  ·  "
        "intake → validate → classify → route "
        "→ human review → evidence record", S['caption']))
    story.append(Spacer(1, 8))

    wf_data = [
        ["Property",       "Value"],
        ["Workflow name",  "MCP Access Governance Platform v2"],
        ["Trigger",        "Asana new task event (structured intake form)"],
        ["Key nodes",      "Webhook receiver, Validate intake, Risk classifier, Route by level, "
                           "Asana reviewer task, Evidence writer"],
        ["Evidence output","Structured JSON record per terminal decision"],
        ["Export format",  "n8n workflow JSON — importable directly into n8n Cloud or self-hosted"],
    ]
    story.append(Table(wf_data, colWidths=[110, CW - 110],
                       style=tbl_style()))
    story.append(PageBreak())

    # ── Page 5: Governance Controls ─────────────────────────────────────────
    story.append(Paragraph("04 / GOVERNANCE CONTROLS", S['eyebrow']))
    story.append(Paragraph("Eight control objectives", S['h1']))
    story.append(gold_rule())
    story.append(img_flow(IMG_PILLARS, CW, max_h=125))
    story.append(Paragraph(
        "Governance control pillars — identity, least privilege, human approval, audit evidence",
        S['caption']))

    ctrl_data = [
        ["Ref",     "Control Objective"],
        ["GOV-01", "Structured intake — every request captured with required fields"],
        ["GOV-02", "Risk-based decisioning — classification uses documented, consistent criteria"],
        ["GOV-03", "Human accountability — material risk routed to named security reviewer"],
        ["GOV-04", "Audit evidence — every terminal decision produces a structured record"],
        ["GOV-05", "Least privilege — approved access is time-bound and purpose-bound"],
        ["GOV-06", "Safe automation boundary — no provisioning without explicit approval"],
        ["GOV-07", "Scope guardrails — workflow changes follow documented architecture"],
        ["GOV-08", "Periodic review — approved access re-reviewed on material scope change"],
    ]
    story.append(Table(ctrl_data, colWidths=[55, CW - 55],
                       style=tbl_style(
                           ('TEXTCOLOR', (0, 1), (0, -1), GOLD),
                           ('FONTNAME',  (0, 1), (0, -1), 'Helvetica-Bold'),
                       )))
    story.append(PageBreak())

    # ── Page 6: Architecture + Security Linter ──────────────────────────────
    story.append(Paragraph("05 / REFERENCE ARCHITECTURE", S['eyebrow']))
    story.append(Paragraph("Platform architecture", S['h1']))
    story.append(gold_rule())
    story.append(img_flow(IMG_ARCH, CW, max_h=175))
    story.append(Paragraph(
        "Reference architecture — n8n orchestration with Asana, Notion and GitHub integrations",
        S['caption']))

    story.append(Spacer(1, 8))
    story.append(Paragraph("SECURITY LINTER", S['h3']))
    story.append(rule())
    story.append(Paragraph(
        "A deterministic Python security linter inspects n8n workflow JSON exports for "
        "governance risk signals. 42 pytest tests pass across positive, negative, serialisation "
        "and integration scenarios. Framework mapping tags embedded in every finding at "
        "generation time. Pure functions — deterministic, stateless, side-effect-free.", S['body']))

    lint_data = [
        ["Rule",     "Severity", "Signal"],
        ["LINT-001", "High",     "MCP client tool node detected"],
        ["LINT-002", "High",     "MCP node with credential references"],
        ["LINT-003", "Medium",   "HTTP node calling MCP-like endpoint directly"],
        ["LINT-004", "High",     "AI agent node with no human approval gate upstream"],
        ["LINT-005", "Medium",   "Workflow missing owner metadata"],
        ["LINT-006", "Low",      "Workflow missing risk classification metadata"],
    ]
    story.append(Table(lint_data, colWidths=[58, 58, CW - 116],
                       style=tbl_style(
                           ('TEXTCOLOR', (1, 1), (1, 1), RED_ALERT),
                           ('TEXTCOLOR', (1, 2), (1, 2), RED_ALERT),
                           ('TEXTCOLOR', (1, 3), (1, 3), GOLD),
                           ('TEXTCOLOR', (1, 4), (1, 4), RED_ALERT),
                           ('TEXTCOLOR', (1, 5), (1, 5), GOLD),
                           ('TEXTCOLOR', (1, 6), (1, 6), GREEN_OK),
                       )))
    story.append(PageBreak())

    # ── Page 7: Framework Alignment + What It Demonstrates ──────────────────
    story.append(Paragraph("06 / FRAMEWORK ALIGNMENT", S['eyebrow']))
    story.append(Paragraph("Standards and frameworks", S['h1']))
    story.append(gold_rule())

    fw_data = [
        ["Framework",              "Alignment Area"],
        ["ISO/IEC 27001",          "Access control, supplier risk, change management, auditability"],
        ["ISO/IEC 42001",          "AI management, human oversight, accountability, lifecycle governance"],
        ["NIST SP 800-37",         "Risk management framework structure"],
        ["NIST SP 800-30",         "Risk assessment language and treatment"],
        ["CSA AI Controls Matrix", "Cloud AI governance, access control, data governance"],
        ["MAESTRO",                "Agentic AI threat modelling, orchestration and tool execution"],
        ["OWASP LLM Top 10",       "Prompt injection, data leakage, tool misuse, excessive agency"],
        ["MCP Security Guidance",  "Consent, authorisation, confused deputy protections"],
    ]
    story.append(Table(fw_data, colWidths=[130, CW - 130],
                       style=tbl_style()))
    story.append(Paragraph(
        "The project does not claim formal certification or attestation against any of these frameworks.",
        S['body_muted']))

    story.append(Spacer(1, 12))
    story.append(Paragraph("WHAT THIS DEMONSTRATES", S['h3']))
    story.append(rule())
    dem_data = [
        ["Capability",                                                "Evidence"],
        ["Security engineering applied to an emerging AI governance problem",
         "Working PoC with runnable n8n workflow"],
        ["Governance translated to testable, auditable code",
         "42 passing tests, schema-validated output"],
        ["Framework alignment at engineering level",
         "Tags embedded in every finding, not just in documents"],
        ["Evidence-oriented design",
         "Audit chain across every decision path"],
        ["Full governance documentation",
         "Charter, architecture, design, implementation guide, case study"],
        ["Honest scoping",
         "PoC limitations documented; no overclaiming"],
    ]
    story.append(Table(dem_data, colWidths=[195, CW - 195],
                       style=tbl_style()))
    story.append(PageBreak())

    # ── Page 8: Portfolio Safety + Contact ──────────────────────────────────
    story.append(Paragraph("07 / PORTFOLIO SAFETY", S['eyebrow']))
    story.append(Paragraph("Scope and safety boundaries", S['h1']))
    story.append(gold_rule())
    for b in [
        "All sample data is fictional",
        "All workflow exports use fictional placeholder values",
        "No production infrastructure, live credentials or real customer data are present",
        "The project does not claim to be a production deployment, formal compliance "
        "certification or complete enterprise control environment",
        "Fictional vendors, mock intake data and demo values are used throughout",
    ]:
        story.append(Paragraph(f"•  {b}", S['bullet']))

    story.append(Spacer(1, 22))
    story.append(cyan_rule())
    story.append(Spacer(1, 8))
    story.append(Paragraph("CONTACT", S['h3']))
    story.append(rule())
    contact_data = [
        ["Field",     "Detail"],
        ["Name",      "Markus Walker"],
        ["Role",      "Security, AI and Cloud Engineer"],
        ["Location",  "Brisbane, Queensland, Australia"],
        ["Email",     "markus@markuswalker.com"],
        ["LinkedIn",  "linkedin.com/in/markus-walker-au"],
        ["GitHub",    "github.com/markus-doc"],
        ["Portfolio", "markuswalker.com"],
    ]
    story.append(Table(contact_data, colWidths=[70, CW - 70],
                       style=tbl_style(
                           ('TEXTCOLOR', (1, 2), (1, 2), CYAN),   # name value
                           ('TEXTCOLOR', (1, 5), (1, 5), GOLD),   # email
                       )))
    story.append(Spacer(1, 16))
    story.append(Paragraph(
        "Source repository, workflow exports, schemas, documentation and evidence samples: "
        "github.com/markus-doc/MCP_Governance_Platform",
        S['body_muted']))

    # ── Build ────────────────────────────────────────────────────────────────
    doc.build(story,
              onFirstPage=draw_cover,
              onLaterPages=_make_bg_canvas)
    print(f"PDF written: {OUT_PATH}")


if __name__ == "__main__":
    build()
