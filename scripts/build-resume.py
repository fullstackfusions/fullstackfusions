#!/usr/bin/env python3
"""
build-resume.py
Generates data/MIHIR_PATEL_Lead_Staff_Software_Engineer.pdf by parsing
index.html and experience/index.html — no manual data to maintain.
Run: python3 scripts/build-resume.py
Requires: pip install reportlab beautifulsoup4
"""

import os
import re
from bs4 import BeautifulSoup
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
    Table, TableStyle, ListFlowable, ListItem,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT     = os.path.join(os.path.dirname(__file__), "..")
OUT_DIR  = os.path.join(ROOT, "data")
OUT_FILE = os.path.join(OUT_DIR, "MIHIR_PATEL_Lead_Staff_Software_Engineer.pdf")
INDEX_HTML      = os.path.join(ROOT, "index.html")
EXPERIENCE_HTML = os.path.join(ROOT, "experience", "index.html")

# ── Colours (matching website palette) ───────────────────────────────────────
BLUE = colors.HexColor("#2563eb")
DARK = colors.HexColor("#0f172a")
GRAY = colors.HexColor("#475569")
LIGHT_GRAY = colors.HexColor("#94a3b8")
RULE_COLOR = colors.HexColor("#e2e8f0")

# ── Contact (only things not on the page) ─────────────────────────────────────
CONTACT = {
    "name":     "Mihir Patel",
    "title":    "Lead / Staff Software Engineer",
    "email":    "fullstackfusions@gmail.com",
    "linkedin": "linkedin.com/in/fullstackfusions",
    "github":   "github.com/fullstackfusions",
    "website":  "fullstackfusions.com",
}


def _soup(path):
    with open(path, encoding="utf-8") as f:
        return BeautifulSoup(f, "html.parser")


def _clean(text):
    """Collapse whitespace and strip."""
    return re.sub(r"\s+", " ", text).strip()


# ── Parsers ───────────────────────────────────────────────────────────────────

def parse_summary():
    soup = _soup(INDEX_HTML)
    about = soup.find("section", id="about")
    para = about.find("p", class_=lambda c: c and "text-gray-700" in c)
    return _clean(para.get_text())


def parse_experience():
    soup = _soup(EXPERIENCE_HTML)
    jobs = []
    for card in soup.select("main > div.bg-white"):
        left  = card.find("div", class_=lambda c: c and "md:w-1/3" in c)
        right = card.find("div", class_=lambda c: c and "md:w-2/3" in c)
        if not left or not right:
            continue

        title = _clean(left.find("h2").get_text())
        # meta line: "RBC | May 2025 – Present"
        meta_el = left.find("p", class_=lambda c: c and "text-gray-600" in c)
        meta_text = _clean(meta_el.get_text(" ", strip=True))
        # split on the pipe character (rendered from &nbsp;|&nbsp; or plain |)
        parts = [p.strip() for p in re.split(r"\|", meta_text)]
        company = parts[0] if len(parts) > 0 else ""
        period  = parts[1] if len(parts) > 1 else ""

        summary_el = right.find("p", class_=lambda c: c and "italic" in c)
        summary = _clean(summary_el.get_text()) if summary_el else ""

        bullets = [_clean(li.get_text()) for li in right.select("ul li")]

        jobs.append({
            "title":   title,
            "company": company,
            "period":  period,
            "summary": summary,
            "bullets": bullets,
        })
    return jobs


def parse_skills():
    soup = _soup(INDEX_HTML)
    skills_section = soup.find("section", id="skills")
    result = []
    for card in skills_section.select("div.bg-white"):
        h4 = card.find("h4")
        if not h4:
            continue
        label = _clean(h4.get_text())
        # "Tools" subsection is the first <p class="text-gray-600"> under the card
        tools_p = card.find("p", class_=lambda c: c and "text-gray-600" in c)
        if not tools_p:
            continue
        value = _clean(tools_p.get_text(", "))
        result.append((label, value))
    return result


def parse_education():
    soup = _soup(INDEX_HTML)
    edu_section = soup.find("section", id="education")
    result = []
    for card in edu_section.select("div.bg-white"):
        school = _clean(card.find("h3").get_text())
        paras  = card.find_all("p")
        degree = _clean(paras[0].get_text()) if len(paras) > 0 else ""
        period = _clean(paras[1].get_text()) if len(paras) > 1 else ""
        result.append((school, degree, period))
    return result


def parse_certifications():
    soup = _soup(INDEX_HTML)
    certs_section = soup.find("section", id="certs")
    return [_clean(card.find("h3").get_text()) for card in certs_section.select("div.bg-white")]


# ── Style helpers ─────────────────────────────────────────────────────────────
def build_styles():
    base = getSampleStyleSheet()
    s = {}

    s["name"] = ParagraphStyle(
        "name", fontSize=22, fontName="Helvetica-Bold",
        textColor=DARK, leading=26, alignment=TA_CENTER,
    )
    s["title_line"] = ParagraphStyle(
        "title_line", fontSize=11, fontName="Helvetica",
        textColor=GRAY, leading=14, alignment=TA_CENTER, spaceAfter=4,
    )
    s["contact_line"] = ParagraphStyle(
        "contact_line", fontSize=9, fontName="Helvetica",
        textColor=GRAY, leading=12, alignment=TA_CENTER, spaceAfter=2,
    )
    s["section_head"] = ParagraphStyle(
        "section_head", fontSize=11, fontName="Helvetica-Bold",
        textColor=BLUE, leading=14, spaceBefore=10, spaceAfter=2,
    )
    s["job_title"] = ParagraphStyle(
        "job_title", fontSize=10, fontName="Helvetica-Bold",
        textColor=DARK, leading=13,
    )
    s["job_meta"] = ParagraphStyle(
        "job_meta", fontSize=9, fontName="Helvetica",
        textColor=GRAY, leading=12, spaceAfter=2,
    )
    s["summary_italic"] = ParagraphStyle(
        "summary_italic", fontSize=9, fontName="Helvetica-Oblique",
        textColor=GRAY, leading=13, spaceAfter=3,
    )
    s["bullet"] = ParagraphStyle(
        "bullet", fontSize=9, fontName="Helvetica",
        textColor=colors.HexColor("#1e293b"), leading=13,
        leftIndent=12, firstLineIndent=0, spaceAfter=2,
    )
    s["skill_label"] = ParagraphStyle(
        "skill_label", fontSize=9, fontName="Helvetica-Bold",
        textColor=DARK, leading=12,
    )
    s["skill_value"] = ParagraphStyle(
        "skill_value", fontSize=9, fontName="Helvetica",
        textColor=GRAY, leading=12, spaceAfter=3,
    )
    s["body_small"] = ParagraphStyle(
        "body_small", fontSize=9, fontName="Helvetica",
        textColor=DARK, leading=12, spaceAfter=2,
    )
    s["summary_para"] = ParagraphStyle(
        "summary_para", fontSize=9.5, fontName="Helvetica",
        textColor=colors.HexColor("#1e293b"), leading=14, spaceAfter=4,
    )
    return s


def section_rule(story):
    story.append(Spacer(1, 2))
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_COLOR))
    story.append(Spacer(1, 4))


def section_heading(story, text, styles):
    story.append(Paragraph(text.upper(), styles["section_head"]))
    story.append(HRFlowable(width="100%", thickness=1.5, color=BLUE))
    story.append(Spacer(1, 5))


# ── Main build ────────────────────────────────────────────────────────────────
def build_pdf():
    os.makedirs(OUT_DIR, exist_ok=True)

    # ── Parse data from HTML sources ──────────────────────────────────────────
    SUMMARY        = parse_summary()
    EXPERIENCE     = parse_experience()
    SKILLS         = parse_skills()
    EDUCATION      = parse_education()
    CERTIFICATIONS = parse_certifications()

    print(f"  Parsed {len(EXPERIENCE)} jobs, {len(SKILLS)} skill groups, "
          f"{len(EDUCATION)} education entries, {len(CERTIFICATIONS)} certs")

    doc = SimpleDocTemplate(
        OUT_FILE,
        pagesize=letter,
        leftMargin=0.55 * inch,
        rightMargin=0.55 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )

    styles = build_styles()
    story = []

    # ── Header ────────────────────────────────────────────────────────────────
    story.append(Paragraph(CONTACT["name"], styles["name"]))
    story.append(Paragraph(CONTACT["title"], styles["title_line"]))
    story.append(Paragraph(
        f'{CONTACT["email"]}  |  {CONTACT["linkedin"]}  |  {CONTACT["github"]}  |  {CONTACT["website"]}',
        styles["contact_line"],
    ))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1, color=BLUE))
    story.append(Spacer(1, 6))

    # ── Summary ───────────────────────────────────────────────────────────────
    section_heading(story, "Professional Summary", styles)
    story.append(Paragraph(SUMMARY, styles["summary_para"]))
    story.append(Spacer(1, 4))

    # ── Experience ────────────────────────────────────────────────────────────
    section_heading(story, "Professional Experience", styles)

    for i, job in enumerate(EXPERIENCE):
        # Title row: job title + date right-aligned
        title_data = [[
            Paragraph(f'{job["title"]} — {job["company"]}', styles["job_title"]),
            Paragraph(job["period"], ParagraphStyle(
                "period", fontSize=9, fontName="Helvetica",
                textColor=GRAY, alignment=TA_RIGHT, leading=12,
            )),
        ]]
        title_table = Table(title_data, colWidths=["70%", "30%"])
        title_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]))
        story.append(title_table)

        story.append(Paragraph(job["summary"], styles["summary_italic"]))

        for bullet in job["bullets"]:
            # Split "Bold prefix: rest" for bold lead
            if ": " in bullet:
                lead, rest = bullet.split(": ", 1)
                text = f'<b>{lead}:</b> {rest}'
            else:
                text = bullet
            story.append(Paragraph(f"• {text}", styles["bullet"]))

        if i < len(EXPERIENCE) - 1:
            story.append(Spacer(1, 6))

    story.append(Spacer(1, 4))

    # ── Skills ────────────────────────────────────────────────────────────────
    section_heading(story, "Technical Skills", styles)

    for label, value in SKILLS:
        row_data = [[
            Paragraph(label, styles["skill_label"]),
            Paragraph(value, styles["skill_value"]),
        ]]
        row_table = Table(row_data, colWidths=["28%", "72%"])
        row_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 1),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ]))
        story.append(row_table)

    story.append(Spacer(1, 4))

    # ── Education ─────────────────────────────────────────────────────────────
    section_heading(story, "Education", styles)

    for school, degree, period in EDUCATION:
        edu_data = [[
            Paragraph(f'<b>{school}</b> — {degree}', styles["body_small"]),
            Paragraph(period, ParagraphStyle(
                "edu_period", fontSize=9, fontName="Helvetica",
                textColor=GRAY, alignment=TA_RIGHT, leading=12,
            )),
        ]]
        edu_table = Table(edu_data, colWidths=["70%", "30%"])
        edu_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 1),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]))
        story.append(edu_table)

    story.append(Spacer(1, 4))

    # ── Certifications ────────────────────────────────────────────────────────
    section_heading(story, "Certifications", styles)

    # Two-column cert layout
    cert_pairs = [CERTIFICATIONS[i:i+2] for i in range(0, len(CERTIFICATIONS), 2)]
    for pair in cert_pairs:
        cells = [Paragraph(f"• {c}", styles["body_small"]) for c in pair]
        if len(cells) == 1:
            cells.append(Paragraph("", styles["body_small"]))
        cert_table = Table([cells], colWidths=["50%", "50%"])
        cert_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 1),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]))
        story.append(cert_table)

    # ── Build ─────────────────────────────────────────────────────────────────
    doc.build(story)
    print(f"✓ Resume written to: {os.path.abspath(OUT_FILE)}")


if __name__ == "__main__":
    build_pdf()
