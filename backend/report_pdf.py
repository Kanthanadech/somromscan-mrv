"""
PDF generator for T-VER reports (PDD / Validation / Monitoring), using fpdf2.

fpdf2 chosen over WeasyPrint/xhtml2pdf after testing: those two render Thai
script as solid black boxes (a reportlab font-embedding bug, reproduced with
3 different Thai fonts including the real Sarabun). fpdf2 is a different
codebase and renders Thai correctly. Trade-off: no shared HTML/CSS template
with the Word generator — layout is written directly against report_data(),
same as report_docx.py, just with fpdf2's own table/cell API instead.
"""
import os
from fpdf import FPDF

FONT_DIR = os.path.join(os.path.dirname(__file__), "fonts")
FONT_NAME = "Sarabun"


class ReportPDF(FPDF):
    def __init__(self, form_code: str):
        super().__init__(format="A4")
        self.form_code = form_code
        self.add_font(FONT_NAME, "", os.path.join(FONT_DIR, "Sarabun-Regular.ttf"))
        self.add_font(FONT_NAME, "B", os.path.join(FONT_DIR, "Sarabun-Bold.ttf"))
        self.set_font(FONT_NAME, size=11)
        self.set_margins(20, 18, 20)
        self.set_auto_page_break(auto=True, margin=20)

    def footer(self):
        self.set_y(-15)
        self.set_font(FONT_NAME, size=9)
        self.cell(0, 8, f"{self.form_code} | SomromScan MRV Platform | หน้า {self.page_no()}", align="C")

    def heading(self, text, size=13):
        self.ln(2)
        self.set_font(FONT_NAME, "B", size)
        self.multi_cell(0, 8, text)
        self.set_font(FONT_NAME, size=11)
        self.ln(1)

    def para(self, text, size=11, italic=False):
        self.set_font(FONT_NAME, size=size)
        self.multi_cell(0, 7, text)
        self.ln(1)

    def kv_table(self, rows):
        col1_w = 55
        col2_w = self.epw - col1_w
        for label, value in rows:
            y_before = self.get_y()
            x_before = self.get_x()
            self.set_font(FONT_NAME, "B", 10)
            self.multi_cell(col1_w, 7, str(label), border=1)
            y_after_col1 = self.get_y()
            self.set_xy(x_before + col1_w, y_before)
            self.set_font(FONT_NAME, size=10)
            self.multi_cell(col2_w, 7, str(value), border=1)
            y_after_col2 = self.get_y()
            self.set_y(max(y_after_col1, y_after_col2))
        self.ln(3)

    def data_table(self, headers, rows):
        n = len(headers)
        col_w = self.epw / n
        self.set_font(FONT_NAME, "B", 10)
        for h in headers:
            self.cell(col_w, 8, str(h), border=1, align="C")
        self.ln()
        self.set_font(FONT_NAME, size=10)
        for row in rows:
            for val in row:
                self.cell(col_w, 8, str(val), border=1, align="C")
            self.ln()
        self.ln(3)

    def signature_block(self, labels):
        n = len(labels)
        col_w = self.epw / n
        self.set_font(FONT_NAME, size=10)
        y_start = self.get_y()
        for label in labels:
            self.multi_cell(col_w, 6, f"ลงชื่อ ..................... {label}", border=0, align="C", new_x="RIGHT", new_y="TOP")
        self.set_y(y_start)
        self.set_x(self.l_margin)
        self.ln(12)
        for _ in labels:
            self.multi_cell(col_w, 6, "( ..................... ) วันที่ ........./........./.........", border=0, align="C", new_x="RIGHT", new_y="TOP")
        self.ln(14)

    def title_block(self, subtitle, title):
        self.set_font(FONT_NAME, "B", 13)
        self.cell(0, 8, "SomromScan — แพลตฟอร์ม MRV", new_x="LMARGIN", new_y="NEXT")
        self.set_font(FONT_NAME, size=9)
        self.multi_cell(0, 6, f"({subtitle})")
        self.ln(2)
        self.set_font(FONT_NAME, "B", 15)
        self.cell(0, 9, title, align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font(FONT_NAME, size=11)
        self.cell(0, 7, "โครงการลดก๊าซเรือนกระจกภาคสมัครใจตามมาตรฐานของประเทศไทย (T-VER)", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(4)

    def net_note(self, ghg):
        if ghg.get("net_was_floored"):
            self.set_font(FONT_NAME, size=9)
            self.multi_cell(0, 6, ghg["net_floor_note"])
            self.set_font(FONT_NAME, size=11)
            self.ln(1)


def generate_pdd_pdf(data: dict) -> ReportPDF:
    project = data["project"]
    pdf = ReportPDF("T-VER-PDD")
    pdf.add_page()
    pdf.title_block(
        "จัดทำตามรูปแบบเอกสารข้อเสนอโครงการ T-VER ขององค์การบริหารจัดการก๊าซเรือนกระจก",
        "เอกสารข้อเสนอโครงการ (Project Design Document: PDD)",
    )
    pdf.kv_table([
        ("ชื่อโครงการ", project["name_th"] or project["name"]),
        ("ผู้พัฒนาโครงการ", project["developer_org"]),
        ("ประเภทโครงการ", project["forest_type_label"]),
        ("ฉบับที่ / วันที่", f"ฉบับที่ 1 / {data['generated_at_th']}"),
    ])

    pdf.heading("๑. รายละเอียดทั่วไปของโครงการ")
    pdf.kv_table([
        ("ที่ตั้งโครงการ", f"{project['district'] or ''} {project['province'] or ''}".strip()),
        ("พิกัดอ้างอิง", f"ละติจูด {project['latitude']}° เหนือ ลองจิจูด {project['longitude']}° ตะวันออก" if project["latitude"] else "ไม่มีข้อมูล"),
        ("ขนาดพื้นที่", f"{project['area_rai']:,.1f} ไร่ ({project['area_hectare']:,.2f} เฮกตาร์)" if project["area_rai"] else "-"),
        ("วันเริ่มดำเนินโครงการ", project["project_start_date_th"]),
        ("ระยะเวลาคิดเครดิต", f"{project['crediting_period_years']} ปี"),
    ])

    pdf.heading("๒. คำอธิบายโครงการและกิจกรรมลดก๊าซเรือนกระจก")
    pdf.para(
        f"โครงการมีวัตถุประสงค์เพื่ออนุรักษ์และฟื้นฟูพื้นที่{project['forest_type_label']} "
        "ด้วยการปลูกเสริมไม้ยืนต้น การดูแลรักษาต้นไม้ให้เจริญเติบโต และการป้องกันการตัดฟัน "
        "เพื่อเพิ่มการกักเก็บคาร์บอนในมวลชีวภาพเหนือและใต้พื้นดิน ควบคู่กับการสร้างรายได้จากคาร์บอนเครดิตให้แก่ชุมชน"
    )

    pdf.heading("๓. การประยุกต์ใช้ระเบียบวิธีและความเข้าเกณฑ์ (Eligibility & Additionality)")
    pdf.para(
        f"โครงการประยุกต์ใช้ระเบียบวิธี {project['methodology']} ร่วมกับสมการแอลโลเมตริกของ Winrock "
        "ในการประเมินการกักเก็บคาร์บอน มีความเพิ่มเติม (additionality) เนื่องจากกิจกรรมการฟื้นฟูจะไม่เกิดขึ้น "
        "หากปราศจากแรงจูงใจจากคาร์บอนเครดิต"
    )

    pdf.heading("๔. ขอบเขตโครงการและแหล่งก๊าซเรือนกระจกที่เกี่ยวข้อง")
    pdf.para(
        f"ขอบเขตโครงการครอบคลุมพื้นที่ {project['area_rai']:,.1f} ไร่ตามพิกัดที่ระบุ "
        "แหล่งกักเก็บที่พิจารณา ได้แก่ มวลชีวภาพเหนือพื้นดินและใต้พื้นดินของไม้ยืนต้น "
        "ก๊าซเรือนกระจกที่เกี่ยวข้องหลักคือคาร์บอนไดออกไซด์ (CO2)"
    )

    pdf.heading("๕. การกำหนดกรณีฐาน (Baseline Scenario)")
    pdf.para(
        "กรณีฐานกำหนดจากสภาพการใช้ที่ดินเดิมก่อนมีโครงการ ซึ่งมีการกักเก็บคาร์บอนในระดับต่ำ "
        f"ปริมาณการกักเก็บกรณีฐานประเมินไว้เท่ากับ {data['ghg']['ghg_bsl']:,.1f} tCO2eq ต่อปี"
    )

    pdf.heading("๖. การประเมินปริมาณก๊าซเรือนกระจกที่คาดว่าจะลด/กักเก็บได้")
    pdf.para(f"ประมาณการปริมาณสุทธิตลอดระยะเวลาคิดเครดิต {project['crediting_period_years']} ปี")
    pdf.data_table(
        ["ปี", "ปริมาณสุทธิ (tCO2eq/ปี)", "สะสม (tCO2eq)"],
        [[r["year_be"], f"{r['net_tco2eq_year']:,.1f}", f"{r['cumulative_tco2eq']:,.1f}"] for r in data["yearly_projection"]],
    )

    pdf.heading("๗. แผนการติดตามผล (Monitoring Plan)")
    pdf.para(
        "โครงการจะติดตามพารามิเตอร์ ได้แก่ DBH จำนวนต้น ชนิดพันธุ์ และอัตราการรอด ปีละครั้ง "
        "ผ่านระบบ SomromScan โดยจัดทำรายงานการติดตามผล (Monitoring Report) ตามแบบ T-VER-S-F005-MR"
    )

    pdf.heading("๘. ผลกระทบด้านสิ่งแวดล้อมและการมีส่วนร่วมของผู้มีส่วนได้เสีย")
    pdf.para(
        "โครงการก่อให้เกิดผลกระทบเชิงบวกต่อความหลากหลายทางชีวภาพและวิถีชีวิตชุมชน "
        "มีการรับฟังความคิดเห็นของผู้มีส่วนได้เสียในพื้นที่ก่อนดำเนินโครงการ และไม่พบผลกระทบเชิงลบที่มีนัยสำคัญ"
    )

    pdf.heading("๙. การรับรองโดยผู้พัฒนาโครงการ")
    pdf.signature_block(["ผู้พัฒนาโครงการ", "ผู้มีอำนาจลงนาม"])
    return pdf


def generate_validation_pdf(data: dict) -> ReportPDF:
    project = data["project"]
    pdf = ReportPDF("T-VER-VR")
    pdf.add_page()
    pdf.title_block(
        "จัดทำโดยหน่วยตรวจสอบความใช้ได้และทวนสอบ VVB ตามรูปแบบ T-VER",
        "รายงานการตรวจสอบความใช้ได้ (Validation Report)",
    )
    pdf.kv_table([
        ("ชื่อโครงการ", project["name_th"] or project["name"]),
        ("หน่วยตรวจสอบ (VVB)", data["vvb"]["name_th"]),
        ("เลขที่รายงาน / วันที่", f"VAL-{project['id']:04d} / {data['generated_at_th']}"),
        ("ระดับความเชื่อมั่น", "ระดับความเชื่อมั่นที่สมเหตุสมผล (Reasonable Assurance)"),
    ])

    pdf.heading("๑. บทสรุปผลการตรวจสอบ (Validation Opinion)")
    pdf.para(
        f"จากการตรวจสอบเอกสารข้อเสนอโครงการ (PDD) และการตรวจประเมิน หน่วยตรวจสอบมีความเห็นว่าโครงการ "
        f"{project['name_th'] or project['name']} จัดทำขึ้นสอดคล้องกับข้อกำหนดและระเบียบวิธีของกลไก T-VER "
        "มีการประเมินกรณีฐาน ความเพิ่มเติม ขอบเขต และแผนการติดตามที่เหมาะสม "
        "จึงเห็นควรให้ผ่านการตรวจสอบความใช้ได้เพื่อเสนอขอขึ้นทะเบียนต่อ อบก. ต่อไป"
    )

    pdf.heading("๒. ขอบเขต วัตถุประสงค์ และเกณฑ์การตรวจสอบ")
    pdf.para(
        "การตรวจสอบมีวัตถุประสงค์เพื่อประเมินว่าเอกสารข้อเสนอโครงการเป็นไปตามระเบียบวิธีและข้อกำหนดของ T-VER หรือไม่ "
        "ครอบคลุมประเด็นด้านระเบียบวิธี กรณีฐาน ความเพิ่มเติม ขอบเขตโครงการ การประเมินปริมาณก๊าซเรือนกระจก "
        "และแผนการติดตาม โดยใช้เกณฑ์ตามเอกสารมาตรฐานของ อบก."
    )

    pdf.heading("๓. วิธีการตรวจสอบ")
    pdf.para(
        "หน่วยตรวจสอบดำเนินการทบทวนเอกสาร (document review) ตรวจประเมินพื้นที่ (site visit) "
        "สัมภาษณ์ผู้พัฒนาโครงการและผู้มีส่วนได้เสีย และตรวจสอบความถูกต้องของข้อมูลและการคำนวณในระบบ SomromScan"
    )

    pdf.heading("๔. ผลการตรวจสอบตามประเด็นและข้อค้นพบ")
    pdf.para("ประเภทข้อค้นพบ : CAR = ข้อบกพร่องที่ต้องแก้ไข, CL = ข้อขอความชัดเจน, FAR = ข้อพึงดำเนินการในอนาคต", size=9)
    if data["validation_findings"]:
        pdf.data_table(
            ["ประเภท", "ประเด็น/ข้อค้นพบ", "สถานะ"],
            [[f["type"], f["description"], f["status"]] for f in data["validation_findings"]],
        )
    else:
        pdf.set_font(FONT_NAME, size=10)
        pdf.multi_cell(0, 7, data["validation_findings_note"])
        pdf.set_font(FONT_NAME, size=11)
        pdf.ln(3)

    pdf.heading("๕. ข้อสรุปการตรวจสอบความใช้ได้")
    pdf.para(
        "ภายหลังการแก้ไขข้อบกพร่อง (CAR) และข้อขอความชัดเจน (CL) ครบถ้วนแล้ว หน่วยตรวจสอบสรุปว่าโครงการเป็นไปตาม "
        "ข้อกำหนดของกลไก T-VER และให้ความเห็นผ่านการตรวจสอบความใช้ได้ (Positive Validation Opinion)"
    )

    pdf.heading("๖. การรับรองโดยหน่วยตรวจสอบ (VVB)")
    pdf.signature_block(["ผู้ตรวจสอบนำ (Lead Validator)", "ผู้อนุมัติทางเทคนิค"])
    return pdf


def generate_monitoring_pdf(data: dict) -> ReportPDF:
    project = data["project"]
    ghg = data["ghg"]
    pdf = ReportPDF("T-VER-S-F005-MR")
    pdf.add_page()
    pdf.title_block(
        "จัดทำตามรูปแบบรายงานการติดตามผล T-VER Monitoring Report ขององค์การบริหารจัดการก๊าซเรือนกระจก",
        "รายงานการติดตามผลการดำเนินโครงการ",
    )
    pdf.set_font(FONT_NAME, "B", 12)
    pdf.cell(0, 8, "Monitoring Report", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font(FONT_NAME, size=11)
    pdf.ln(2)

    pdf.kv_table([
        ("ชื่อโครงการ", project["name_th"] or project["name"]),
        ("เลขที่ทะเบียนโครงการ", project["tgo_registration_number"]),
        ("รอบการติดตามที่", data["verification"]["cycle_number"]),
        ("วันที่จัดทำรายงาน", data["generated_at_th"]),
    ])

    pdf.heading("ส่วนที่ ๑ ข้อมูลทั่วไปของโครงการ")
    pdf.kv_table([
        ("ผู้พัฒนาโครงการ", project["developer_org"]),
        ("ประเภทโครงการ", project["forest_type_label"]),
        ("ที่ตั้งโครงการ", f"{project['district'] or ''} {project['province'] or ''}".strip()),
        ("พิกัดอ้างอิง", f"ละติจูด {project['latitude']}° เหนือ ลองจิจูด {project['longitude']}° ตะวันออก" if project["latitude"] else "ไม่มีข้อมูล"),
        ("ขนาดพื้นที่โครงการ", f"{project['area_rai']:,.1f} ไร่ ({project['area_hectare']:,.2f} เฮกตาร์)" if project["area_rai"] else "-"),
        ("ระเบียบวิธีที่ใช้", f"{project['methodology']} ร่วมกับสมการแอลโลเมตริกของ Winrock"),
        ("ระยะเวลาคิดเครดิต", f"{project['crediting_period_years']} ปี"),
    ])

    pdf.heading("ส่วนที่ ๒ ขอบเขตการดำเนินงานและระเบียบวิธีการติดตาม")
    pdf.para(
        f"การติดตามผลในรอบนี้ครอบคลุมพื้นที่โครงการทั้งหมด {project['area_rai']:,.1f} ไร่ "
        "โดยดำเนินการสำรวจและวัดขนาดต้นไม้ในแปลงตัวอย่างที่เป็นตัวแทนของพื้นที่ ตามหลักการวัดคาร์บอนภาคพื้นดินของ "
        "Winrock International คณะทำงานได้บันทึกค่าเส้นผ่านศูนย์กลางเพียงอก (DBH) ของต้นไม้แต่ละต้น "
        "ระบุชนิดพันธุ์ พิกัด และสถานะการรอดของต้นไม้ ผ่านระบบ SomromScan"
    )

    pdf.heading("ส่วนที่ ๓ พารามิเตอร์ที่ติดตามและวิธีการตรวจวัด")
    pdf.data_table(
        ["พารามิเตอร์", "หน่วย", "วิธีตรวจวัด", "ความถี่"],
        [
            ["DBH", "ซม.", "เทปวัดเส้นรอบวงที่ 1.30 ม.", "ปีละครั้ง"],
            ["จำนวนต้นไม้", "ต้น", "สำรวจและบันทึกในระบบ", "ปีละครั้ง"],
            ["ชนิดพันธุ์ไม้", "-", "จำแนกโดยผู้เชี่ยวชาญ", "ปีละครั้ง"],
            ["อัตราการรอด", "%", "สถานะมีชีวิต/ตาย", "ปีละครั้ง"],
        ],
    )

    pdf.heading("ส่วนที่ ๔ การคำนวณปริมาณก๊าซเรือนกระจก")
    pdf.para("AGB = a × (DBH)^b [สมการแอลโลเมตริกของ Winrock]", size=10)
    pdf.para("คาร์บอนรวม (tC) = (AGB + BGB) × 0.47", size=10)
    pdf.para("ปริมาณคาร์บอนไดออกไซด์เทียบเท่า (tCO2eq) = คาร์บอนรวม × (44/12)", size=10)
    pdf.data_table(
        ["รายการ", "สัญลักษณ์", "ค่า (tCO2eq)"],
        [
            ["การกักเก็บของโครงการ", "GHG_PROJ", f"{ghg['ghg_proj']:,.3f}"],
            ["การกักเก็บกรณีฐาน", "GHG_BSL", f"{ghg['ghg_bsl']:,.3f}"],
            ["การรั่วไหล", "GHG_LK", f"{ghg['ghg_lk']:,.3f}"],
            ["ปริมาณสุทธิ (NET)", "GHG_NET", f"{ghg['ghg_net']:,.3f}"],
        ],
    )
    pdf.net_note(ghg)
    pdf.para(f"สรุป : ในรอบการติดตามนี้ โครงการมีปริมาณการกักเก็บก๊าซเรือนกระจกสุทธิเท่ากับ {ghg['ghg_net']:,.3f} ตันคาร์บอนไดออกไซด์เทียบเท่า (tCO2eq)")

    pdf.heading("ส่วนที่ ๕ ผลการติดตามในรอบการติดตามนี้")
    pdf.para(f"จำนวนต้นไม้ที่ทำการวัดในรอบนี้รวม {data['survival']['total_trees']:,} ต้น")
    pdf.data_table(
        ["ช่วงชั้น DBH", "จำนวนต้น", "กักเก็บ (tCO2eq)", "สัดส่วน (%)"],
        [[r["label_th"], r["tree_count"], f"{r['co2_tco2eq']:,.3f}", f"{r['pct']:.1f}"] for r in data["dbh_breakdown"]]
        + [["รวม", data["survival"]["total_trees"], f"{data['carbon']['total_co2_tonnes']:,.3f}", "100.0"]],
    )
    s = data["survival"]
    pdf.para(f"อัตราการรอดของต้นไม้ในรอบติดตาม : {s['survival_pct']}% (ต้นมีชีวิต {s['alive_count']} ต้น จากทั้งหมด {s['total_trees']} ต้น)")

    pdf.heading("ส่วนที่ ๖ สรุปและการรับรอง")
    pdf.para(
        "คณะผู้จัดทำขอรับรองว่าข้อมูลและผลการติดตามในรายงานฉบับนี้ถูกต้องตามความเป็นจริง จัดทำขึ้นตามระเบียบวิธีที่กำหนด "
        "และพร้อมรับการทวนสอบจากหน่วยตรวจสอบความใช้ได้และทวนสอบ (VVB) เพื่อเสนอต่อองค์การบริหารจัดการก๊าซเรือนกระจก (อบก.) ต่อไป"
    )
    pdf.signature_block(["ผู้พัฒนาโครงการ", "หน่วยตรวจสอบ VVB", "เจ้าหน้าที่ อบก."])
    return pdf


GENERATORS = {
    "pdd": generate_pdd_pdf,
    "validation": generate_validation_pdf,
    "monitoring": generate_monitoring_pdf,
}


def generate_pdf(data: dict) -> ReportPDF:
    report_type = data["report_type"]
    if report_type not in GENERATORS:
        raise ValueError(f"report_type ไม่ถูกต้อง: {report_type}")
    return GENERATORS[report_type](data)
