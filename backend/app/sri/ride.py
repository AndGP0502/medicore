"""
Generador del RIDE (Representación Impresa del Documento Electrónico)
según el formato del SRI Ecuador. Python puro con reportlab —
compatible con PyInstaller.
"""

import os
from lxml import etree
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.graphics.barcode import code128
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Flowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


class Barcode128(Flowable):
    """Código de barras Code128 de la clave de acceso (requisito del RIDE)."""

    def __init__(self, value, width=82 * mm, height=12 * mm):
        super().__init__()
        self.value = value
        self.width = width
        self.height = height

    def draw(self):
        bc = code128.Code128(self.value, barHeight=self.height, barWidth=0.30 * mm)
        if bc.width > self.width:  # autoajustar si se desborda
            factor = self.width / bc.width
            bc = code128.Code128(self.value, barHeight=self.height, barWidth=0.30 * mm * factor)
        x = (self.width - bc.width) / 2
        bc.drawOn(self.canv, max(x, 0), 0)


def _txt_xml(root, tag, default=""):
    el = root.find(f".//{tag}")
    return el.text if el is not None and el.text else default


def generar_ride(xml_autorizado: str, numero_autorizacion: str,
                 fecha_autorizacion: str, ruta_salida: str,
                 logo_path: str = None) -> str:
    """
    Genera el PDF del RIDE a partir del XML autorizado por el SRI.
    Devuelve la ruta del PDF generado.
    """
    root = etree.fromstring(xml_autorizado.encode("utf-8"))

    # ── Datos del comprobante ─────────────────────────────────────────────
    razon_social = _txt_xml(root, "razonSocial")
    nombre_comercial = _txt_xml(root, "nombreComercial", razon_social)
    ruc = _txt_xml(root, "ruc")
    clave_acceso = _txt_xml(root, "claveAcceso")
    estab = _txt_xml(root, "estab")
    pto_emi = _txt_xml(root, "ptoEmi")
    secuencial = _txt_xml(root, "secuencial")
    dir_matriz = _txt_xml(root, "dirMatriz")
    dir_estab = _txt_xml(root, "dirEstablecimiento", dir_matriz)
    ambiente = _txt_xml(root, "ambiente")
    fecha_emision = _txt_xml(root, "fechaEmision")
    comprador = _txt_xml(root, "razonSocialComprador")
    identificacion = _txt_xml(root, "identificacionComprador")
    direccion_comp = _txt_xml(root, "direccionComprador")
    obligado = _txt_xml(root, "obligadoContabilidad", "NO")
    total_sin_imp = _txt_xml(root, "totalSinImpuestos", "0.00")
    total_descuento = _txt_xml(root, "totalDescuento", "0.00")
    propina = _txt_xml(root, "propina", "0.00")
    importe_total = _txt_xml(root, "importeTotal", "0.00")

    # Subtotales por tarifa
    base_0, base_15, valor_iva = "0.00", "0.00", "0.00"
    for ti in root.findall(".//totalImpuesto"):
        cod_pct = ti.findtext("codigoPorcentaje")
        if cod_pct == "0":
            base_0 = ti.findtext("baseImponible", "0.00")
        elif cod_pct == "4":
            base_15 = ti.findtext("baseImponible", "0.00")
            valor_iva = ti.findtext("valor", "0.00")

    # ── Documento ─────────────────────────────────────────────────────────
    os.makedirs(os.path.dirname(ruta_salida) or ".", exist_ok=True)
    doc = SimpleDocTemplate(
        ruta_salida, pagesize=A4,
        leftMargin=12 * mm, rightMargin=12 * mm,
        topMargin=10 * mm, bottomMargin=10 * mm,
    )
    styles = getSampleStyleSheet()
    s_small = ParagraphStyle("small", parent=styles["Normal"], fontSize=7.5, leading=9.5)
    s_bold = ParagraphStyle("bold", parent=s_small, fontName="Helvetica-Bold")
    s_title = ParagraphStyle("title", parent=s_bold, fontSize=10)

    ancho_total = doc.width
    col_izq, col_der = ancho_total * 0.5, ancho_total * 0.5

    # ── Cabecera: emisor (izq) + datos del documento (der) ───────────────
    emisor_contenido = []
    if logo_path and os.path.exists(logo_path):
        from reportlab.platypus import Image
        emisor_contenido.append(Image(logo_path, width=40 * mm, height=20 * mm, kind="proportional"))
        emisor_contenido.append(Spacer(1, 2 * mm))
    emisor_contenido += [
        Paragraph(nombre_comercial, s_title),
        Spacer(1, 1.5 * mm),
        Paragraph(razon_social, s_bold),
        Paragraph(f"<b>Dirección matriz:</b> {dir_matriz}", s_small),
        Paragraph(f"<b>Dirección sucursal:</b> {dir_estab}", s_small),
        Paragraph(f"<b>Obligado a llevar contabilidad:</b> {obligado}", s_small),
    ]

    doc_contenido = [
        Paragraph(f"<b>R.U.C.:</b> {ruc}", s_small),
        Paragraph("FACTURA", s_title),
        Paragraph(f"No. {estab}-{pto_emi}-{secuencial}", s_bold),
        Spacer(1, 1.5 * mm),
        Paragraph("<b>NÚMERO DE AUTORIZACIÓN</b>", s_small),
        Paragraph(numero_autorizacion, s_small),
        Paragraph(f"<b>Fecha y hora de autorización:</b> {fecha_autorizacion}", s_small),
        Paragraph(f"<b>Ambiente:</b> {'PRODUCCIÓN' if ambiente == '2' else 'PRUEBAS'}", s_small),
        Paragraph("<b>Emisión:</b> NORMAL", s_small),
        Spacer(1, 1.5 * mm),
        Paragraph("<b>CLAVE DE ACCESO</b>", s_small),
        Barcode128(clave_acceso),
        Paragraph(clave_acceso, ParagraphStyle("ca", parent=s_small, fontSize=6.5)),
    ]

    cabecera = Table(
        [[emisor_contenido, doc_contenido]],
        colWidths=[col_izq, col_der],
    )
    cabecera.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (0, 0), 0.7, colors.black),
        ("BOX", (1, 0), (1, 0), 0.7, colors.black),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))

    # ── Datos del comprador ───────────────────────────────────────────────
    comprador_tbl = Table([
        [Paragraph(f"<b>Razón social / Nombres:</b> {comprador}", s_small),
         Paragraph(f"<b>Identificación:</b> {identificacion}", s_small)],
        [Paragraph(f"<b>Fecha de emisión:</b> {fecha_emision}", s_small),
         Paragraph(f"<b>Dirección:</b> {direccion_comp}", s_small)],
    ], colWidths=[col_izq, col_der])
    comprador_tbl.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.7, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))

    # ── Detalles ──────────────────────────────────────────────────────────
    det_data = [[
        Paragraph("<b>Cod.</b>", s_small), Paragraph("<b>Cant.</b>", s_small),
        Paragraph("<b>Descripción</b>", s_small), Paragraph("<b>P. Unitario</b>", s_small),
        Paragraph("<b>Descuento</b>", s_small), Paragraph("<b>P. Total</b>", s_small),
    ]]
    for d in root.findall(".//detalle"):
        det_data.append([
            Paragraph(d.findtext("codigoPrincipal", ""), s_small),
            Paragraph(d.findtext("cantidad", ""), s_small),
            Paragraph(d.findtext("descripcion", ""), s_small),
            Paragraph(d.findtext("precioUnitario", ""), s_small),
            Paragraph(d.findtext("descuento", "0.00"), s_small),
            Paragraph(d.findtext("precioTotalSinImpuesto", ""), s_small),
        ])
    det_tbl = Table(det_data, colWidths=[
        ancho_total * 0.08, ancho_total * 0.08, ancho_total * 0.44,
        ancho_total * 0.14, ancho_total * 0.12, ancho_total * 0.14,
    ])
    det_tbl.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.7, colors.black),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.grey),
        ("BACKGROUND", (0, 0), (-1, 0), colors.Color(0.92, 0.92, 0.92)),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))

    # ── Info adicional (izq) + totales (der) ─────────────────────────────
    info_adic = [Paragraph("<b>Información adicional</b>", s_small)]
    for campo in root.findall(".//campoAdicional"):
        info_adic.append(Paragraph(f"<b>{campo.get('nombre', '')}:</b> {campo.text or ''}", s_small))

    totales_data = [
        ["SUBTOTAL 15%", base_15],
        ["SUBTOTAL 0%", base_0],
        ["SUBTOTAL SIN IMPUESTOS", total_sin_imp],
        ["DESCUENTO", total_descuento],
        ["IVA 15%", valor_iva],
        ["PROPINA", propina],
        ["VALOR TOTAL", importe_total],
    ]
    tot_tbl = Table(
        [[Paragraph(f"<b>{k}</b>", s_small), Paragraph(f"$ {v}", s_small)] for k, v in totales_data],
        colWidths=[col_der * 0.6, col_der * 0.4],
    )
    tot_tbl.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.7, colors.black),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.grey),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))

    pie = Table([[info_adic, tot_tbl]], colWidths=[col_izq, col_der])
    pie.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (0, 0), 0.7, colors.black),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
    ]))

    doc.build([
        cabecera, Spacer(1, 3 * mm),
        comprador_tbl, Spacer(1, 3 * mm),
        det_tbl, Spacer(1, 3 * mm),
        pie,
    ])
    return ruta_salida
