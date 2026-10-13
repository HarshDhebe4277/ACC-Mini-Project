import io
from datetime import datetime
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


class PDFService:
    @staticmethod
    def generate_certificate_pdf(
        student_name: str,
        event_title: str,
        completion_date: str,
        certificate_id: str,
        department: str = "Campus Event Committee"
    ) -> bytes:
        """
        Dynamically generates a collegiate Certificate of Participation PDF in memory.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(letter),
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )

        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            name="CertTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=30,
            leading=36,
            textColor=colors.HexColor("#1e3a8a"),
            alignment=1, # Center
        )

        subtitle_style = ParagraphStyle(
            name="CertSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#4b5563"),
            alignment=1,
        )

        name_style = ParagraphStyle(
            name="CertName",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=26,
            leading=32,
            textColor=colors.HexColor("#111827"),
            alignment=1,
        )

        body_style = ParagraphStyle(
            name="CertBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=13,
            leading=20,
            textColor=colors.HexColor("#374151"),
            alignment=1,
        )

        footer_style = ParagraphStyle(
            name="CertFooter",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#9ca3af"),
            alignment=1,
        )

        story = []
        story.append(Spacer(1, 20))
        story.append(Paragraph("COLLEGE EVENT MANAGEMENT SYSTEM", subtitle_style))
        story.append(Spacer(1, 10))
        story.append(Paragraph("CERTIFICATE OF PARTICIPATION", title_style))
        story.append(Spacer(1, 20))
        story.append(Paragraph("This is proudly presented to", subtitle_style))
        story.append(Spacer(1, 15))
        story.append(Paragraph(student_name.upper(), name_style))
        story.append(Spacer(1, 15))
        story.append(Paragraph(
            f"for actively attending and completing the event <b>'{event_title}'</b> organized by the <b>{department}</b> on {completion_date}.",
            body_style
        ))
        story.append(Spacer(1, 40))
        story.append(Paragraph(f"Verification ID: {certificate_id} &bull; Generated via Cloud-Native CI/CD Portal", footer_style))

        def draw_border(canvas, document):
            canvas.saveState()
            canvas.setStrokeColor(colors.HexColor("#2563eb"))
            canvas.setLineWidth(4)
            canvas.rect(20, 20, document.pagesize[0] - 40, document.pagesize[1] - 40)
            canvas.setStrokeColor(colors.HexColor("#93c5fd"))
            canvas.setLineWidth(1)
            canvas.rect(26, 26, document.pagesize[0] - 52, document.pagesize[1] - 52)
            canvas.restoreState()

        doc.build(story, onFirstPage=draw_border)
        buffer.seek(0)
        return buffer.getvalue()


pdf_service = PDFService()

