import io
import csv
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class ExportService:
    @staticmethod
    def export_meeting_pdf(meeting_data: Dict[str, Any]) -> bytes:
        """Generate a PDF report for a meeting."""
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.lib import colors
            from reportlab.platypus import (
                SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
            )

            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=letter,
                leftMargin=0.75 * inch,
                rightMargin=0.75 * inch,
                topMargin=0.75 * inch,
                bottomMargin=0.75 * inch,
            )
            styles = getSampleStyleSheet()
            indigo = colors.HexColor("#6366F1")
            story = []

            # Title
            title_style = ParagraphStyle(
                "Title",
                parent=styles["Title"],
                textColor=colors.HexColor("#111827"),
                fontSize=22,
                spaceAfter=4,
            )
            story.append(Paragraph(f"Meeting Report", title_style))
            story.append(
                Paragraph(
                    meeting_data.get("title", "Untitled Meeting"),
                    ParagraphStyle("Sub", parent=styles["Heading2"], textColor=indigo, fontSize=16),
                )
            )
            story.append(HRFlowable(width="100%", thickness=1, color=indigo))
            story.append(Spacer(1, 0.15 * inch))

            # Meta info
            meta = []
            if meeting_data.get("date"):
                meta.append(f"<b>Date:</b> {meeting_data['date']}")
            if meeting_data.get("project_name"):
                meta.append(f"<b>Project:</b> {meeting_data['project_name']}")
            if meta:
                story.append(Paragraph("  |  ".join(meta), styles["Normal"]))
                story.append(Spacer(1, 0.1 * inch))

            # Executive Summary
            if meeting_data.get("summary"):
                story.append(Paragraph("Executive Summary", styles["Heading2"]))
                story.append(Paragraph(meeting_data["summary"], styles["Normal"]))
                story.append(Spacer(1, 0.15 * inch))

            # Action Items
            action_items = meeting_data.get("action_items", [])
            if action_items:
                story.append(Paragraph("Action Items", styles["Heading2"]))
                data = [["Title", "Assigned To", "Priority", "Deadline", "Status"]]
                for item in action_items:
                    data.append([
                        Paragraph(item.get("title", ""), styles["Normal"]),
                        item.get("assigned_to", "Unassigned"),
                        item.get("priority", "Medium"),
                        item.get("deadline") or "Not specified",
                        item.get("status", "Pending"),
                    ])
                col_widths = [2.5 * inch, 1.3 * inch, 0.9 * inch, 1.3 * inch, 1.0 * inch]
                t = Table(data, colWidths=col_widths)
                t.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), indigo),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("PADDING", (0, 0), (-1, -1), 6),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ]))
                story.append(t)
                story.append(Spacer(1, 0.15 * inch))

            # Decisions
            decisions = meeting_data.get("decisions", [])
            if decisions:
                story.append(Paragraph("Key Decisions", styles["Heading2"]))
                for d in decisions:
                    story.append(
                        Paragraph(f"• {d.get('content', '')}", styles["Normal"])
                    )
                story.append(Spacer(1, 0.15 * inch))

            doc.build(story)
            return buffer.getvalue()
        except Exception as e:
            logger.error(f"PDF export error: {e}")
            # Return minimal PDF bytes placeholder
            return b"%PDF-1.0\n1 0 obj<</Type/Catalog>>endobj\nxref\n0 0\ntrailer<</Root 1 0 R>>\nstartxref\n9\n%%EOF"

    @staticmethod
    def export_tasks_csv(tasks: List[Dict[str, Any]]) -> bytes:
        """Export tasks as CSV."""
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Title", "Description", "Assigned To", "Priority", "Deadline", "Status", "Meeting ID"])
        for task in tasks:
            writer.writerow([
                task.get("title", ""),
                task.get("description", ""),
                task.get("assigned_to", "Unassigned"),
                task.get("priority", "Medium"),
                task.get("deadline", "") or "",
                task.get("status", "Pending"),
                task.get("meeting_id", ""),
            ])
        return output.getvalue().encode("utf-8-sig")  # UTF-8 BOM for Excel compatibility
