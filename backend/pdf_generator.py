"""
PDF Generator Module for FixGSM Service Tickets
Generates professional PDF documents for receipts, delivery forms, and warranties
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime
from io import BytesIO
import os

class FixGSMPDFGenerator:
    """Generator for FixGSM service documents"""
    
    def __init__(self, company_info: dict):
        self.company_info = company_info
        self.page_width, self.page_height = A4
        
        # Colors
        self.primary_color = HexColor('#06b6d4')  # cyan-500
        self.secondary_color = HexColor('#3b82f6')  # blue-500
        self.text_dark = HexColor('#1e293b')  # slate-800
        self.text_light = HexColor('#64748b')  # slate-500
        
    def generate_reception_document(self, ticket_data: dict) -> BytesIO:
        """Generate Reception Document (Fisa Receptie) - Model FIXGSM"""
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        
        # Header
        self._draw_header(c, "FISA DE RECEPTIE")
        
        # Company Info (top right)
        self._draw_company_header(c)
        
        # Main Title
        y_position = self.page_height - 70*mm
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(self.text_dark)
        c.drawCentredString(self.page_width / 2, y_position, "PROCES VERBAL DE INTRARE IN SERVICE")
        
        # Ticket ID and Date
        y_position -= 15
        c.setFont("Helvetica-Bold", 11)
        ticket_id = self._clean_text(ticket_data.get('ticket_id', 'N/A'))
        created_at = self._clean_text(ticket_data.get('created_at', 'N/A'))
        c.drawCentredString(self.page_width / 2, y_position, f"{ticket_id} / {created_at}")
        
        # Table with ticket details
        y_position -= 25
        table_end_y = self._draw_reception_table(c, ticket_data, y_position)
        
        # Terms and Conditions on same page (below table)
        terms_y = table_end_y - 15
        # Terms and conditions on first page (with signatures at the end)
        self._draw_terms_compact(c, terms_y)
        
        # GDPR on page 2
        c.showPage()
        self._draw_gdpr_page(c)
        
        c.save()
        buffer.seek(0)
        return buffer
    
    def generate_delivery_document(self, ticket_data: dict) -> BytesIO:
        """Generate Delivery Document (Fișă Ieșire)"""
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        
        # Header
        self._draw_header(c, "FIȘĂ DE IEȘIRE")
        
        # Company Info
        y_position = self.page_height - 80*mm
        self._draw_company_info(c, y_position)
        
        # Ticket Info
        y_position -= 40*mm
        self._draw_ticket_info(c, ticket_data, y_position)
        
        # Client Info
        y_position -= 50*mm
        self._draw_client_info(c, ticket_data, y_position)
        
        # Device Info
        y_position -= 50*mm
        self._draw_device_info(c, ticket_data, y_position)
        
        # Service Operations
        y_position -= 60*mm
        self._draw_service_operations(c, ticket_data, y_position)
        
        # Cost Summary
        y_position -= 50*mm
        self._draw_cost_summary(c, ticket_data, y_position)
        
        # Footer
        self._draw_footer(c, "delivery")
        
        c.showPage()
        c.save()
        buffer.seek(0)
        return buffer
    
    def generate_warranty_document(self, ticket_data: dict) -> BytesIO:
        """Generate Warranty Document (Fișă Ieșire + Garanție)"""
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        
        # Header
        self._draw_header(c, "PROCES VERBAL DE IEȘIRE PRODUS DIN SERVICE")
        
        # Company header
        self._draw_company_header(c)
        
        # Success message
        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(self.text_dark)
        c.drawCentredString(self.page_width / 2, self.page_height - 80*mm, "Reparatie finalizata cu success")
        
        # Ticket info
        ticket_id = ticket_data.get('ticket_id', 'N/A')
        created_at = ticket_data.get('created_at', 'N/A')
        if isinstance(created_at, str):
            try:
                from datetime import datetime
                date_obj = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                formatted_date = date_obj.strftime('%d %b %Y')
            except:
                formatted_date = created_at
        else:
            formatted_date = str(created_at)
        
        c.setFont("Helvetica", 10)
        c.drawCentredString(self.page_width / 2, self.page_height - 95*mm, f"{ticket_id} / {formatted_date} proces verbal de iesire din service")
        
        # Table with ticket details
        y_position = self.page_height - 110*mm
        table_end_y = self._draw_reception_table(c, ticket_data, y_position)
        
        # Success confirmation text
        success_y = table_end_y - 15
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(self.text_dark)
        c.drawString(20*mm, success_y, "Produsul iese din service REPARAT CU SUCCES si a fost verificat din toate punctele de vedere,")
        success_y -= 15
        c.drawString(20*mm, success_y, "estetic si functional de catre client!")
        success_y -= 20
        c.setFont("Helvetica-Bold", 9)
        c.drawString(20*mm, success_y, "Orice RECLAMATIE ulterioara cu privire la dispozitivul mentionat nu va fi luata in considerare!")
        
        # Warranty Certificate on page 2
        c.showPage()
        self._draw_warranty_certificate(c, ticket_data)
        
        c.save()
        buffer.seek(0)
        return buffer
    
    # Helper Methods
    
    def _clean_text(self, text: str) -> str:
        """Remove diacritics from Romanian text"""
        if not text:
            return "N/A"
        text = str(text)
        replacements = {
            'Ă': 'A', 'ă': 'a', 'Â': 'A', 'â': 'a',
            'Î': 'I', 'î': 'i', 'Ș': 'S', 'ș': 's',
            'Ț': 'T', 'ț': 't'
        }
        for old, new in replacements.items():
            text = text.replace(old, new)
        return text
    
    def _draw_header(self, c: canvas.Canvas, title: str):
        """Draw document header with logo and title"""
        # Background gradient effect
        c.setFillColor(self.primary_color)
        c.rect(0, self.page_height - 50*mm, self.page_width, 50*mm, fill=1, stroke=0)
        
        # Title (without diacritics for encoding)
        c.setFillColorRGB(1, 1, 1)  # White
        c.setFont("Helvetica-Bold", 20)
        # Remove diacritics from title
        title_clean = title.replace('Ă', 'A').replace('ă', 'a').replace('Ț', 'T').replace('ț', 't').replace('Ș', 'S').replace('ș', 's').replace('Î', 'I').replace('î', 'i').replace('Â', 'A').replace('â', 'a')
        c.drawCentredString(self.page_width / 2, self.page_height - 30*mm, title_clean)
        
        # Subtitle
        c.setFont("Helvetica", 10)
        c.drawCentredString(self.page_width / 2, self.page_height - 38*mm, "FixGSM Service Platform")
    
    def _draw_company_header(self, c: canvas.Canvas):
        """Draw company info in top right corner"""
        x_start = self.page_width - 80*mm
        y_start = self.page_height - 60*mm
        
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(self.text_dark)
        company_name = self._clean_text(self.company_info.get("service_name", "Brand Mobile"))
        c.drawRightString(self.page_width - 20*mm, y_start, company_name)
        
        c.setFont("Helvetica", 8)
        c.setFillColor(self.text_light)
        y = y_start - 12
        
        if self.company_info.get("company_name"):
            c.drawRightString(self.page_width - 20*mm, y, self._clean_text(self.company_info["company_name"]))
            y -= 10
        
        if self.company_info.get("cui"):
            c.drawRightString(self.page_width - 20*mm, y, f"CUI: {self.company_info['cui']}")
            y -= 10
        
        if self.company_info.get("phone"):
            c.drawRightString(self.page_width - 20*mm, y, f"Tel: {self.company_info['phone']}")
    
    def _draw_reception_table(self, c: canvas.Canvas, ticket_data: dict, y_start: float) -> float:
        """Draw reception table with ticket details. Returns final Y position."""
        # Table dimensions
        x_start = 20*mm
        table_width = self.page_width - 40*mm
        col1_width = table_width * 0.55
        col2_width = table_width * 0.45
        row_height = 12
        
        # Table data
        rows = [
            ("Tip produs / Marca/ Model / Culoare / SN", self._clean_text(ticket_data.get('device_model', 'N/A'))),
            ("Defectiuni raportate", self._clean_text(ticket_data.get('reported_issue', 'N/A'))),
            ("Cauze ale defectelor", "Soc mecanic"),
            ("Solutii propuse / Cost estimativ reparatie", f"Constatare / {ticket_data.get('estimated_cost', 0)} RON"),
            ("Client", self._clean_text(ticket_data.get('client_name', 'N/A'))),
            ("Date de contact", self._clean_text(ticket_data.get('client_phone', 'N/A'))),
            ("Obs. Suplimentare", self._clean_text(ticket_data.get('observations', 'N/A')) if ticket_data.get('observations') else 'N/A'),
        ]
        
        y = y_start
        for label, value in rows:
            # Draw cell borders
            c.setStrokeColor(self.text_light)
            c.setLineWidth(0.5)
            c.rect(x_start, y - row_height, col1_width, row_height)
            c.rect(x_start + col1_width, y - row_height, col2_width, row_height)
            
            # Draw text
            c.setFont("Helvetica", 8)
            c.setFillColor(self.text_dark)
            c.drawString(x_start + 3, y - row_height + 4, label)
            c.drawString(x_start + col1_width + 3, y - row_height + 4, value)
            
            y -= row_height
        
        return y  # Return final Y position
    
    def _draw_company_info(self, c: canvas.Canvas, y_position: float):
        """Draw company information"""
        c.setFillColor(self.text_dark)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(30*mm, y_position, self._clean_text(self.company_info.get("service_name", "FixGSM Service")))
        
        c.setFont("Helvetica", 10)
        c.setFillColor(self.text_light)
        
        y = y_position - 15
        if self.company_info.get("company_name"):
            c.drawString(30*mm, y, f"Companie: {self.company_info['company_name']}")
            y -= 12
        
        if self.company_info.get("cui"):
            c.drawString(30*mm, y, f"CUI: {self.company_info['cui']}")
            y -= 12
        
        if self.company_info.get("phone"):
            c.drawString(30*mm, y, f"Telefon: {self.company_info['phone']}")
            y -= 12
        
        if self.company_info.get("email"):
            c.drawString(30*mm, y, f"Email: {self.company_info['email']}")
    
    def _draw_ticket_info(self, c: canvas.Canvas, ticket_data: dict, y_position: float):
        """Draw ticket information box"""
        # Box background
        c.setFillColor(HexColor('#f1f5f9'))  # slate-100
        c.rect(30*mm, y_position - 25, 150*mm, 30, fill=1, stroke=0)
        
        c.setFillColor(self.text_dark)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(35*mm, y_position - 10, f"Fișă Service: {ticket_data.get('ticket_id', 'N/A')}")
        
        c.setFont("Helvetica", 10)
        c.drawString(35*mm, y_position - 20, f"Data: {ticket_data.get('created_at', 'N/A')}")
        
        c.drawString(120*mm, y_position - 10, f"Status: {ticket_data.get('status', 'N/A')}")
        c.drawString(120*mm, y_position - 20, f"Locație: {ticket_data.get('location', 'N/A')}")
    
    def _draw_client_info(self, c: canvas.Canvas, ticket_data: dict, y_position: float):
        """Draw client information section"""
        c.setFillColor(self.primary_color)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(30*mm, y_position, "INFORMAȚII CLIENT")
        
        # Underline
        c.setStrokeColor(self.primary_color)
        c.setLineWidth(2)
        c.line(30*mm, y_position - 3, 80*mm, y_position - 3)
        
        c.setFillColor(self.text_dark)
        c.setFont("Helvetica", 11)
        
        y = y_position - 15
        c.drawString(30*mm, y, f"Nume: {ticket_data.get('client_name', 'N/A')}")
        y -= 12
        c.drawString(30*mm, y, f"Telefon: {ticket_data.get('client_phone', 'N/A')}")
        y -= 12
        if ticket_data.get('client_email'):
            c.drawString(30*mm, y, f"Email: {ticket_data['client_email']}")
    
    def _draw_device_info(self, c: canvas.Canvas, ticket_data: dict, y_position: float):
        """Draw device information section"""
        c.setFillColor(self.secondary_color)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(30*mm, y_position, "INFORMAȚII DISPOZITIV")
        
        # Underline
        c.setStrokeColor(self.secondary_color)
        c.setLineWidth(2)
        c.line(30*mm, y_position - 3, 95*mm, y_position - 3)
        
        c.setFillColor(self.text_dark)
        c.setFont("Helvetica", 11)
        
        y = y_position - 15
        c.drawString(30*mm, y, f"Model: {ticket_data.get('device_model', 'N/A')}")
        y -= 12
        c.drawString(30*mm, y, f"IMEI: {ticket_data.get('imei', 'N/A')}")
        y -= 12
        if ticket_data.get('serial_number'):
            c.drawString(30*mm, y, f"Serial: {ticket_data['serial_number']}")
    
    def _draw_reported_issues(self, c: canvas.Canvas, ticket_data: dict, y_position: float):
        """Draw reported issues section"""
        c.setFillColor(self.primary_color)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(30*mm, y_position, "DEFECTE RECLAMATE")
        
        c.setStrokeColor(self.primary_color)
        c.setLineWidth(2)
        c.line(30*mm, y_position - 3, 85*mm, y_position - 3)
        
        c.setFillColor(self.text_dark)
        c.setFont("Helvetica", 10)
        
        y = y_position - 15
        issues = ticket_data.get('reported_issue', 'N/A')
        
        # Handle multiline text
        max_width = 150*mm
        lines = self._wrap_text(issues, max_width, c)
        for line in lines[:5]:  # Max 5 lines
            c.drawString(30*mm, y, line)
            y -= 12
    
    def _draw_service_operations(self, c: canvas.Canvas, ticket_data: dict, y_position: float):
        """Draw service operations section"""
        c.setFillColor(self.secondary_color)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(30*mm, y_position, "OPERAȚIUNI EFECTUATE")
        
        c.setStrokeColor(self.secondary_color)
        c.setLineWidth(2)
        c.line(30*mm, y_position - 3, 100*mm, y_position - 3)
        
        c.setFillColor(self.text_dark)
        c.setFont("Helvetica", 10)
        
        y = y_position - 15
        operations = ticket_data.get('service_operations', 'N/A')
        
        lines = self._wrap_text(operations, 150*mm, c)
        for line in lines[:5]:
            c.drawString(30*mm, y, line)
            y -= 12
    
    def _draw_cost_summary(self, c: canvas.Canvas, ticket_data: dict, y_position: float):
        """Draw cost summary section"""
        # Box with gradient
        c.setFillColor(HexColor('#dbeafe'))  # blue-100
        c.rect(30*mm, y_position - 30, 150*mm, 35, fill=1, stroke=0)
        
        c.setFillColor(self.text_dark)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(35*mm, y_position - 12, "COST TOTAL:")
        
        cost = ticket_data.get('estimated_cost', 0)
        c.setFont("Helvetica-Bold", 16)
        c.setFillColor(self.secondary_color)
        c.drawRightString(175*mm, y_position - 12, f"{cost:.2f} LEI")
    
    def _draw_warranty_info(self, c: canvas.Canvas, ticket_data: dict, y_position: float):
        """Draw warranty information section"""
        c.setFillColor(HexColor('#10b981'))  # green-500
        c.setFont("Helvetica-Bold", 12)
        c.drawString(30*mm, y_position, "INFORMAȚII GARANȚIE")
        
        c.setStrokeColor(HexColor('#10b981'))
        c.setLineWidth(2)
        c.line(30*mm, y_position - 3, 95*mm, y_position - 3)
        
        c.setFillColor(self.text_dark)
        c.setFont("Helvetica", 10)
        
        y = y_position - 15
        c.drawString(30*mm, y, "Perioada de garanție: 30 de zile de la data ridicării")
        y -= 12
        c.drawString(30*mm, y, "Garanția acoperă doar defectele apărute la reparația efectuată")
        y -= 12
        c.drawString(30*mm, y, "Garanția nu acoperă: deteriorări fizice, oxidare, contact cu lichide")
    
    def _draw_footer(self, c: canvas.Canvas, doc_type: str):
        """Draw document footer with signatures"""
        y_position = 40*mm
        
        # Signature section
        c.setFillColor(self.text_light)
        c.setFont("Helvetica", 9)
        
        # Client signature
        c.drawString(30*mm, y_position, "Semnătura Client:")
        c.setStrokeColor(self.text_light)
        c.setLineWidth(0.5)
        c.line(30*mm, y_position - 15, 80*mm, y_position - 15)
        
        # Technician signature
        c.drawString(120*mm, y_position, "Semnătura Tehnician:")
        c.line(120*mm, y_position - 15, 170*mm, y_position - 15)
        
        # Document info
        c.setFont("Helvetica", 8)
        c.drawCentredString(self.page_width / 2, 20*mm, 
                           f"Document generat de FixGSM Platform - {datetime.now().strftime('%d.%m.%Y %H:%M')}")
        
        c.drawCentredString(self.page_width / 2, 15*mm,
                           "www.fixgsm.ro | contact@fixgsm.ro")
    
    def _draw_terms_compact(self, c: canvas.Canvas, y_start: float):
        """Draw ALL 21 Terms and Conditions on first page - COMPACT but READABLE"""
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(self.text_dark)
        c.drawString(20*mm, y_start, "TERMENI SI CONDITII")
        
        c.setFont("Helvetica", 7)  # Balanced font for readability
        c.setFillColor(self.text_dark)
        
        x_margin = 20*mm
        line_height = 9  # Balanced spacing
        y = y_start - 12
        
        # ALL 21 terms - ultra compact
        terms = [
            ("Lipsa raspunderii pentru alte defecte", "Brand Mobile SRL nu isi asuma responsabilitatea pentru problemele suplimentare descoperite pe parcursul reparatiei care nu au fost raportate initial. Orice defecte suplimentare identificate vor fi comunicate clientului impreuna cu costurile si timpul necesar pentru remediere."),
            ("Pierderea datelor personale", "In cazul interventiilor software (decodare, jailbreak, root, etc.) sau hardware (inlocuire de componente), exista riscul pierderii datelor personale (contacte, poze, aplicatii). Clientii sunt responsabili sa isi efectueze o copie de siguranta inainte de predarea produsului. La cerere, Brand Mobile SRL poate oferi acest serviciu contra cost."),
            ("Modificarea timpilor de lucru", "Timpul estimat pentru reparatie poate fi afectat de descoperirea unor defecte suplimentare sau indisponibilitatea pieselor necesare. In cazul intarzierilor semnificative, clientul va fi notificat in timp util."),
            ("Pierderea garantiei initiale", "In cazul interventiilor efectuate asupra produsului, garantia oferita de producator sau operator va fi pierduta. Recomandam clientilor sa utilizeze service-uri autorizate daca doresc sa pastreze garantia initiala."),
            ("Interventia autoritatilor", "Daca produsul predat face obiectul unei cercetari oficiale, acesta poate fi ridicat de autoritatile competente fara obligatii ulterioare din partea Brand Mobile SRL."),
            ("Obligatia ridicarii produsului", "Produsul trebuie ridicat in termen de 10 zile lucratoare de la finalizarea reparatiei. In caz contrar, se va aplica o sanctiune de depozitare de 10 lei/zi, care se adauga la costul total al reparatiei. Produsele neridicate in termen de 90 de zile vor fi considerate abandonate si valorificate sau casate fara notificare prealabila."),
            ("Ridicarea produsului cu documentul original", "Produsul lasat in service poate fi ridicat doar pe baza documentului emis la predare. Recomandam pastrarea acestuia in siguranta."),
            ("Accesoriile predate", "Brand Mobile SRL nu este responsabil pentru pierderea sau deteriorarea accesoriilor lasate impreuna cu produsul. Clientii sunt incurajati sa pastreze accesoriile pana la ridicarea produsului."),
            ("Constatarea defectelor", "Procesul de constatare si diagnosticare nu este gratuit. Costul acesteia este stabilit in prealabil si trebuie achitat indiferent daca clientul decide sa continue reparatia."),
            ("Politica privind dispozitivele nereparabile", "Daca dispozitivul este considerat nereparabil dupa diagnosticare, clientul va fi notificat. Taxa de diagnosticare ramane aplicabila, iar dispozitivul va fi returnat in starea constatata."),
            ("Garantia lucrarii si pieselor inlocuite", "Garantia este aplicata exclusiv pentru problemele constatate si reparate. Durata garantiei: Orice piesa sau componenta inlocuita beneficiaza de o garantie de 90 de zile de la data reparatiei. Excluderi: Garantia se anuleaza daca: - apar alte defecte nespecificate in fisa de service. - produsul a fost manipulat de alte persoane sau a fost deteriorat ulterior. - sigiliile aplicate de service au fost indepartate sau deteriorate."),
            ("Serviciile software fara garantie", "Interventiile software (decodare, jailbreak, actualizare software) nu beneficiaza de garantie, deoarece acestea pot fi afectate de modificari ulterioare."),
            ("Returnarea pieselor inlocuite", "Piesele inlocuite nu pot fi returnate in cazul in care au fost deja montate pe dispozitiv. Acestea vor fi gestionate conform politicilor interne."),
            ("Avansul pentru servicii de reparatie", "In unele cazuri, initierea reparatiei necesita achitarea unui avans stabilit de comun acord cu clientul. Daca clientul renunta ulterior la reparatie sau refuza continuarea acesteia, avansul achitat nu va fi returnat, acoperind costurile administrative si de diagnosticare."),
            ("Piese si componente inlocuitoare", "Brand Mobile SRL utilizeaza exclusiv componente proprii pentru reparatii. Nu se accepta piese sau componente aduse de clienti. Costurile montajului sunt aplicabile doar pieselor furnizate de service. Preturile pieselor sunt confidentiale, iar clientul va cunoaste doar costul final al reparatiei."),
            ("Probleme ulterioare cu piesele inlocuite", "Daca dupa reparatie apar probleme legate de componentele montate, produsul va intra in proces de constatare, iar solutionarea acestora poate dura pana la 24 de ore."),
            ("Politica privind testarea dispozitivelor", "Dupa finalizarea reparatiei, dispozitivul este testat pentru a verifica functionalitatea componentelor reparate. Clientul este incurajat sa efectueze propria verificare la ridicarea dispozitivului."),
            ("Politica pentru situatiile de urgenta", "In cazul in care clientul solicita o reparatie de urgenta, aceasta poate fi efectuata contra unei taxe suplimentare. Disponibilitatea depinde de complexitatea reparatiei si de stocul existent."),
            ("Politica de raspundere limitata", "Brand Mobile SRL nu este responsabil pentru pierderile indirecte, pierderile financiare sau alte daune suferite de client ca urmare a unui dispozitiv nereparat, deteriorat sau intarziat."),
            ("Politica de selectie a clientelei", "Brand Mobile SRL isi rezerva dreptul de a selecta clientele si de a refuza serviciile in cazurile in care exista suspiciuni de frauda, comportament abuziv sau alte motive intemeiate."),
            ("Transportul dispozitivelor", "Brand Mobile SRL nu este responsabil pentru deteriorarile aparute in timpul transportului efectuat de curieri externi."),
        ]
        
        for title, content in terms:
            # Check if we need a new page
            if y < 60*mm:  # If less than 60mm from bottom, start new page
                c.showPage()
                self._draw_header(c, "FIȘĂ DE RECEPȚIE")
                y = self.page_height - 60*mm
                c.setFont("Helvetica", 7)
                c.setFillColor(self.text_dark)
            
            # Title
            c.setFont("Helvetica-Bold", 7)
            c.drawString(x_margin, y, title)
            y -= line_height + 1
            
            # Content (wrapped - readable)
            c.setFont("Helvetica", 7)
            words = content.split()
            line = ""
            max_width = self.page_width - 2 * x_margin
            
            for word in words:
                test_line = line + word + " "
                if c.stringWidth(test_line, "Helvetica", 7) < max_width:
                    line = test_line
                else:
                    if line:
                        # Check if we need a new page for this line
                        if y < 60*mm:
                            c.showPage()
                            self._draw_header(c, "FIȘĂ DE RECEPȚIE")
                            y = self.page_height - 60*mm
                            c.setFont("Helvetica", 7)
                            c.setFillColor(self.text_dark)
                        
                        c.drawString(x_margin, y, line.strip())
                        y -= line_height
                        line = word + " "
            
            if line:
                # Check if we need a new page for last line
                if y < 60*mm:
                    c.showPage()
                    self._draw_header(c, "FIȘĂ DE RECEPȚIE")
                    y = self.page_height - 60*mm
                    c.setFont("Helvetica", 7)
                    c.setFillColor(self.text_dark)
                
                c.drawString(x_margin, y, line.strip())
                y -= line_height + 2  # Better space between terms
        
        # Add signatures at the END of all terms
        y -= 15  # Extra space before signatures
        
        # Check if signatures fit on current page
        if y < 80*mm:
            c.showPage()
            self._draw_header(c, "FIȘĂ DE RECEPȚIE")
            y = self.page_height - 80*mm
        
        c.setFont("Helvetica-Bold", 8)
        c.drawString(x_margin, y, "Semnatura Client:")
        y -= 15
        c.drawString(x_margin, y, "_________________________")
        y -= 20
        c.drawString(x_margin, y, "Semnatura Reprezentant Service:")
        y -= 15
        c.drawString(x_margin, y, "_________________________")
    
    def _draw_warranty_certificate(self, c: canvas.Canvas, ticket_data: dict):
        """Draw Warranty Certificate on page 2"""
        c.setFont("Helvetica-Bold", 16)
        c.setFillColor(self.text_dark)
        c.drawCentredString(self.page_width / 2, self.page_height - 40*mm, "CERTIFICAT DE GARANTIE")
        
        # Company info
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(self.text_dark)
        y = self.page_height - 60*mm
        
        c.drawString(20*mm, y, "Emitent: Brand Mobile SRL")
        y -= 15
        c.drawString(20*mm, y, "Adresa: Bucuresti, Bld. Constructorilor 16A")
        y -= 15
        c.drawString(20*mm, y, "Telefon: 0728 795 249")
        y -= 15
        c.drawString(20*mm, y, "E-mail: support@brandmobile.ro")
        
        # Product info
        y -= 25
        c.setFont("Helvetica-Bold", 12)
        c.drawString(20*mm, y, "Informatii despre produs/reparatie")
        y -= 20
        
        c.setFont("Helvetica", 10)
        device_model = self._clean_text(ticket_data.get('device_model', 'N/A'))
        ticket_id = ticket_data.get('ticket_id', 'N/A')
        c.drawString(20*mm, y, f"Denumire produs: {device_model}")
        y -= 15
        c.drawString(20*mm, y, f"Numar fisa service: {ticket_id}")
        y -= 15
        c.drawString(20*mm, y, "Data finalizarii reparatiei: N/A")
        
        # Components section
        y -= 25
        c.setFont("Helvetica-Bold", 12)
        c.drawString(20*mm, y, "# Componente reparate/inlocuite")
        y -= 20
        
        # Legal text
        c.setFont("Helvetica", 9)
        legal_text = ("Garantia produselor se asigura in conformitate cu Legea Nr. 140/2021 privind vanzarea produselor si garantiile asociate acestora, republicata (r1), OG 21 / 1992 privind protectia Consumatorilor, republicata (r2), cu modificarile si completarile ulterioare de la data vanzarii.")
        
        words = legal_text.split()
        line = ""
        max_width = self.page_width - 40*mm
        
        for word in words:
            test_line = line + word + " "
            if c.stringWidth(test_line, "Helvetica", 9) < max_width:
                line = test_line
            else:
                if line:
                    c.drawString(20*mm, y, line.strip())
                    y -= 12
                    line = word + " "
        
        if line:
            c.drawString(20*mm, y, line.strip())
            y -= 12
        
        # Warranty duration
        y -= 15
        c.setFont("Helvetica-Bold", 11)
        c.drawString(20*mm, y, "Durata Garantiei")
        y -= 15
        c.setFont("Helvetica", 9)
        c.drawString(20*mm, y, "Garantia este valabila pentru o perioada de 90 de zile de la data finalizarii reparatiei.")
        
        # Conditions
        y -= 20
        c.setFont("Helvetica-Bold", 11)
        c.drawString(20*mm, y, "Conditiile de aplicare a garantiei")
        y -= 15
        c.setFont("Helvetica", 9)
        conditions = [
            "Garantia este aplicabila exclusiv pentru piesele sau componentele inlocuite in cadrul reparatiei efectuate de Brand Mobile SRL.",
            "Orice defectiuni aparute din vina producatorului piesei sau din cauza reparatiei vor fi remediate gratuit, in termenul de garantie.",
            "Clientul trebuie sa prezinte acest certificat de garantie impreuna cu fisa de reparatie emisa de service."
        ]
        
        for condition in conditions:
            c.drawString(20*mm, y, condition)
            y -= 12
        
        # Exclusions
        y -= 15
        c.setFont("Helvetica-Bold", 11)
        c.drawString(20*mm, y, "Excluderi din garantie")
        y -= 15
        c.setFont("Helvetica", 9)
        c.drawString(20*mm, y, "Garantia NU acopera:")
        y -= 12
        exclusions = [
            "- Defectele aparute ca urmare a utilizarii necorespunzatoare, socurilor mecanice, expunerii la lichide sau conditiilor de mediu improprii.",
            "- Interventiile neautorizate asupra produsului sau deteriorarea sigiliilor de garantie aplicate de service.",
            "- Probleme legate de software, cum ar fi decodari, actualizari sau modificari ale sistemului."
        ]
        
        for exclusion in exclusions:
            c.drawString(20*mm, y, exclusion)
            y -= 12
        
        # Procedure
        y -= 15
        c.setFont("Helvetica-Bold", 11)
        c.drawString(20*mm, y, "Procedura pentru solicitarea garantiei")
        y -= 15
        c.setFont("Helvetica", 9)
        procedures = [
            "Produsul trebuie predat in cadrul Brand Mobile SRL insotit de acest certificat si fisa de reparatie.",
            "Service-ul va efectua o constatare preliminara pentru a stabili daca defectul se incadreaza in conditiile de garantie.",
            "In cazul in care defectul este acoperit de garantie, reparatia sau inlocuirea piesei va fi efectuata gratuit."
        ]
        
        for procedure in procedures:
            c.drawString(20*mm, y, procedure)
            y -= 12
        
        # Additional info
        y -= 15
        c.setFont("Helvetica-Bold", 11)
        c.drawString(20*mm, y, "Informatii suplimentare")
        y -= 15
        c.setFont("Helvetica", 9)
        additional_info = [
            "Acest certificat este valabil doar pentru reparatiile efectuate de Brand Mobile SRL.",
            "Garantia este valabila exclusiv pentru produsul specificat mai sus si nu poate fi transferata altor produse.",
            "Garantia nu este valabila in cazul in care se constata ca dispozitivul a avut contact cu lichide."
        ]
        
        for info in additional_info:
            c.drawString(20*mm, y, info)
            y -= 12
        
        # Signatures
        y -= 30
        c.setFont("Helvetica-Bold", 10)
        c.drawString(20*mm, y, "Semnatura Client:")
        y -= 15
        c.drawString(20*mm, y, "_________________________")
        y -= 20
        c.drawString(20*mm, y, "Semnatura Reprezentant Service:")
        y -= 15
        c.drawString(20*mm, y, "_________________________")
    
    def _draw_terms_and_conditions(self, c: canvas.Canvas):
        """Draw Terms and Conditions on page 2"""
        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(self.text_dark)
        c.drawCentredString(self.page_width / 2, self.page_height - 30*mm, "TERMENI SI CONDITII")
        
        c.setFont("Helvetica", 7)
        c.setFillColor(self.text_dark)
        
        x_margin = 20*mm
        line_height = 10
        y = self.page_height - 45*mm
        
        terms = [
            ("Lipsa raspunderii pentru alte defecte", "Brand Mobile SRL nu isi asuma responsabilitatea pentru problemele suplimentare descoperite pe parcursul reparatiei care nu au fost raportate initial. Orice defecte suplimentare identificate vor fi comunicate clientului impreuna cu costurile si timpul necesar pentru remediere."),
            ("Pierderea datelor personale", "In cazul interventiilor software (decodare, jailbreak, root, etc.) sau hardware (inlocuire de componente), exista riscul pierderii datelor personale (contacte, poze, aplicatii). Clientii sunt responsabili sa isi efectueze o copie de siguranta inainte de predarea produsului. La cerere, Brand Mobile SRL poate oferi acest serviciu contra cost."),
            ("Modificarea timpilor de lucru", "Timpul estimat pentru reparatie poate fi afectat de descoperirea unor defecte suplimentare sau indisponibilitatea pieselor necesare. In cazul intarzierilor semnificative, clientul va fi notificat in timp util."),
            ("Pierderea garantiei initiale", "In cazul interventiilor efectuate asupra produsului, garantia oferita de producator sau operator va fi pierduta. Recomandam clientilor sa utilizeze service-uri autorizate daca doresc sa pastreze garantia initiala."),
            ("Interventia autoritatilor", "Daca produsul predat face obiectul unei cercetari oficiale, acesta poate fi ridicat de autoritatile competente fara obligatii ulterioare din partea Brand Mobile SRL."),
            ("Obligatia ridicarii produsului", "Produsul trebuie ridicat in termen de 10 zile lucratoare de la finalizarea reparatiei. In caz contrar, se va aplica o sanctiune de depozitare de 10 lei/zi, care se adauga la costul total al reparatiei. Produsele neridicate in termen de 90 de zile vor fi considerate abandonate si valorificate sau casate fara notificare prealabila."),
            ("Ridicarea produsului cu documentul original", "Produsul lasat in service poate fi ridicat doar pe baza documentului emis la predare. Recomandam pastrarea acestuia in siguranta."),
            ("Accesoriile predate", "Brand Mobile SRL nu este responsabil pentru pierderea sau deteriorarea accesoriilor lasate impreuna cu produsul. Clientii sunt incurajati sa pastreze accesoriile pana la ridicarea produsului."),
            ("Constatarea defectelor", "Procesul de constatare si diagnosticare nu este gratuit. Costul acesteia este stabilit in prealabil si trebuie achitat indiferent daca clientul decide sa continue reparatia."),
            ("Politica privind dispozitivele nereparabile", "Daca dispozitivul este considerat nereparabil dupa diagnosticare, clientul va fi notificat. Taxa de diagnosticare ramane aplicabila, iar dispozitivul va fi returnat in starea constatata."),
            ("Garantia lucrarii si pieselor inlocuite", "Garantia este aplicata exclusiv pentru problemele constatate si reparate. Durata garantiei: Orice piesa sau componenta inlocuita beneficiaza de o garantie de 90 de zile de la data reparatiei. Excluderi: Garantia se anuleaza daca: - apar alte defecte nespecificate in fisa de service. - produsul a fost manipulat de alte persoane sau a fost deteriorat ulterior. - sigiliile aplicate de service au fost indepartate sau deteriorate."),
            ("Serviciile software fara garantie", "Interventiile software (decodare, jailbreak, actualizare software) nu beneficiaza de garantie, deoarece acestea pot fi afectate de modificari ulterioare."),
            ("Returnarea pieselor inlocuite", "Piesele inlocuite nu pot fi returnate in cazul in care au fost deja montate pe dispozitiv. Acestea vor fi gestionate conform politicilor interne."),
            ("Avansul pentru servicii de reparatie", "In unele cazuri, initierea reparatiei necesita achitarea unui avans stabilit de comun acord cu clientul. Daca clientul renunta ulterior la reparatie sau refuza continuarea acesteia, avansul achitat nu va fi returnat, acoperind costurile administrative si de diagnosticare."),
            ("Piese si componente inlocuitoare", "Brand Mobile SRL utilizeaza exclusiv componente proprii pentru reparatii. Nu se accepta piese sau componente aduse de clienti. Costurile montajului sunt aplicabile doar pieselor furnizate de service. Preturile pieselor sunt confidentiale, iar clientul va cunoaste doar costul final al reparatiei."),
            ("Probleme ulterioare cu piesele inlocuite", "Daca dupa reparatie apar probleme legate de componentele montate, produsul va intra in proces de constatare, iar solutionarea acestora poate dura pana la 24 de ore."),
            ("Politica privind testarea dispozitivelor", "Dupa finalizarea reparatiei, dispozitivul este testat pentru a verifica functionalitatea componentelor reparate. Clientul este incurajat sa efectueze propria verificare la ridicarea dispozitivului."),
            ("Politica pentru situatiile de urgenta", "In cazul in care clientul solicita o reparatie de urgenta, aceasta poate fi efectuata contra unei taxe suplimentare. Disponibilitatea depinde de complexitatea reparatiei si de stocul existent."),
            ("Politica de raspundere limitata", "Brand Mobile SRL nu este responsabil pentru pierderile indirecte, pierderile financiare sau alte daune suferite de client ca urmare a unui dispozitiv nereparat, deteriorat sau intarziat."),
            ("Politica de selectie a clientelei", "Brand Mobile SRL isi rezerva dreptul de a selecta clientele si de a refuza serviciile in cazurile in care exista suspiciuni de frauda, comportament abuziv sau alte motive intemeiate."),
            ("Transportul dispozitivelor", "Brand Mobile SRL nu este responsabil pentru deteriorarile aparute in timpul transportului efectuat de curieri externi."),
        ]
        
        for title, content in terms:
            # Title
            c.setFont("Helvetica-Bold", 7)
            c.drawString(x_margin, y, title)
            y -= line_height
            
            # Content (wrapped)
            c.setFont("Helvetica", 7)
            words = content.split()
            line = ""
            max_width = self.page_width - 2 * x_margin
            
            for word in words:
                test_line = line + word + " "
                if c.stringWidth(test_line, "Helvetica", 7) < max_width:
                    line = test_line
                else:
                    if line:
                        c.drawString(x_margin, y, line.strip())
                        y -= line_height
                        line = word + " "
                        
                        # Check if we need a new page
                        if y < 40*mm:
                            c.showPage()
                            y = self.page_height - 30*mm
            
            if line:
                c.drawString(x_margin, y, line.strip())
                y -= line_height * 1.5
                
            # Check if we need a new page
            if y < 60*mm:
                c.showPage()
                y = self.page_height - 30*mm
    
    def _draw_signatures(self, c: canvas.Canvas, y_position: float):
        """Draw signature zones for client and service representative"""
        x_margin = 30*mm
        
        c.setFont("Helvetica", 9)
        c.setFillColor(self.text_dark)
        
        # Client signature
        c.drawString(x_margin, y_position, "Semnatura Client:")
        c.setStrokeColor(self.text_light)
        c.setLineWidth(0.5)
        c.line(x_margin, y_position - 10, x_margin + 60*mm, y_position - 10)
        
        # Service representative signature
        c.drawString(self.page_width - x_margin - 60*mm, y_position, "Semnatura Reprezentant Service:")
        c.line(self.page_width - x_margin - 60*mm, y_position - 10, self.page_width - x_margin, y_position - 10)
    
    def _draw_gdpr_page(self, c: canvas.Canvas):
        """Draw GDPR compliance page"""
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(self.text_dark)
        c.drawCentredString(self.page_width / 2, self.page_height - 30*mm, "ACORD GDPR")
        
        c.setFont("Helvetica", 7)
        c.setFillColor(self.text_dark)
        
        x_margin = 20*mm
        line_height = 10
        y = self.page_height - 45*mm
        
        gdpr_text = [
            ("", "Conform cerintelor Legii nr. 677/2001 cu privire la prelucrarea datelor cu caracter personal si libera circulatie a acestor date, modificata si completata, Brand Mobile SRL are obligatia de a administra in conditii de siguranta si numai pentru scopurile specificate, datele personale care sunt furnizate;"),
            ("2. Scopul colectarii datelor este:", "2.1. informarea clientilor privind situatia echipamentului lor inclusiv validarea, expedierea si facturarea comenzilor, rezolvarea anularilor sau a problemelor de orice natura referitoare la o Comanda, la Bunurile si sau serviciile achizitionate; 2.2. trimiterea de Newslettere si/sau alerte periodice, prin folosirea postei electronice (e-mail, SMS); 2.3. de cercetare de piata, de urmarire si monitorizare a vanzarilor si comportamentul angajatilor;"),
            ("3.", "Prin furnizarea datelor clientul declara si accepta neconditional ca datele sale personale sa fie incluse in baza de date a Brand Mobile SRL si isi da acordul expres si neechivoc ca toate aceste date personale sa fie stocate, utilizate si prelucrate in scopul prevazut mai sus la punctul 2;"),
            ("4.", "Prin citirea documentului ati luat la cunostinta faptul ca va sunt garantate drepturile prevazute de lege, respectiv dreptul la informare, dreptul de acces la date, dreptul de interventie, dreptul de opozitie, dreptul de a nu fi supus unei decizii individuale, dreptul de va adresa justitiei in caz de incalcare a drepturilor garantate de Legea 677/2001 pentru protectia persoanelor cu privire la prelucrarea datelor cu caracter personal si libera circulatie a acestor date;"),
            ("5.", "Pe baza unei cereri scrise, datate, semnate si expediate la adresa: Str. Rezerverilor, Nr. 58C, Ilfov, Sat Dudu, Com. Chiajna 5.1. Va puteti exercita, in mod gratuit, pentru o solicitare pe an, sa vi se confirme faptul ca datele personale sunt sau nu procesate; 5.2. Va puteti exercita dreptul de interventie asupra datelor, dupa caz: 5.2.1. Rectificarea, actualizarea, blocarea sau stergerea datelor a caror prelucrare nu este conforma legii 677/2001 pentru protectia persoanelor cu privire la prelucrarea datelor cu caracter personal si libera circulatie a acestor date, in special a datelor incomplete sau inexacte; 5.2.2. Transformarea in date anonime a datelor a caror prelucrare nu este conforma legii 677/2001 pentru protectia persoanelor cu privire la prelucrarea datelor cu caracter personal si libera circulatie a acestora 5.2.3. notificarea catre tertii carora le-au fost dezvaluite datele, daca aceasta notificare nu se dovedeste imposibila sau nu presupune un efort disproport ionat fata de interesul legitim care ar putea fi lezat;"),
            ("6.", "De asemenea, Brand Mobile SRL poate furniza datele cu caracter personal ale clientului altor companii cu care se afla in relatii de parteneriat, dar numai in temeiul unui angajament de confidentialitate din partea acestora si numai in scopurile mentionate la punctul 2, prin care garanteaza ca aceste date sunt pastrate in siguranta si ca furnizarea acestor informatii personale se face conform legislatiei in vigoare, dupa cum urmeaza: furnizorilor de servicii de curierat, furnizorilor de servicii de marketing, furnizorilor de servicii de plata/bancare sau alte servicii, furnizate de companii cu care putem dezvolta programe comune de ofertare pe piata a Bunurilor si Serviciilor noastre;"),
            ("7.", "Prin completarea in formularul de comanda a datelor personale, inclusiv CNP, in scopul activitatii de creditare, Cumparatorul isi exprima expres consimtamantul ca persoanele juridice cu care Brand Mobile SRL a incheiat parteneriate in vederea oferirii produselor prin credit sa prelucreze datele personale ale acestuia in evidentele proprii in scopul efectuarii analizei de credit si sa le transmita in vederea consultarii informatiilor inregistrate pe numele Cumparatorului in baza de date a Biroului de Credit."),
            ("8.", "Informatiile clientului cu caracter personal pot fi furnizate si catre Parchetul General, Politie, instantele judecatoresti si altor organe abilitate ale statului, in baza si in limitele prevederilor legale si ca urmare a unor cereri expres formulate;"),
        ]
        
        for title, content in gdpr_text:
            # Title (if exists)
            if title:
                c.setFont("Helvetica-Bold", 7)
                c.drawString(x_margin, y, title)
                y -= line_height
            
            # Content (wrapped)
            c.setFont("Helvetica", 7)
            words = content.split()
            line = ""
            max_width = self.page_width - 2 * x_margin
            
            for word in words:
                test_line = line + word + " "
                if c.stringWidth(test_line, "Helvetica", 7) < max_width:
                    line = test_line
                else:
                    if line:
                        c.drawString(x_margin, y, line.strip())
                        y -= line_height
                        line = word + " "
                        
                        # Check if we need a new page
                        if y < 40*mm:
                            c.showPage()
                            y = self.page_height - 30*mm
            
            if line:
                c.drawString(x_margin, y, line.strip())
                y -= line_height * 1.5
                
            # Check if we need a new page
            if y < 60*mm:
                c.showPage()
                y = self.page_height - 30*mm
        
        # Signature zones at bottom
        y = 50*mm
        self._draw_signatures(c, y)
    
    def _wrap_text(self, text: str, max_width: float, canvas_obj: canvas.Canvas) -> list:
        """Wrap text to fit within max width"""
        if not text or text == 'N/A':
            return [text]
        
        words = str(text).split()
        lines = []
        current_line = []
        
        for word in words:
            test_line = ' '.join(current_line + [word])
            if canvas_obj.stringWidth(test_line, "Helvetica", 10) <= max_width:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
        
        if current_line:
            lines.append(' '.join(current_line))
        
        return lines if lines else [text]

