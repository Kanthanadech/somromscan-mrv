"""Seed demo data — projects from TGO Registry (real data 2024-2025)"""
from database import SessionLocal, Base, engine, Project, Tree, SensorReading, VerificationEvent, User, VVBOrganization
from datetime import datetime, timedelta
from routers.vvb import VVB_SEED_DATA
import random, math, hashlib

Base.metadata.create_all(bind=engine)
db = SessionLocal()

def _hash(p): return hashlib.sha256(p.encode()).hexdigest()
def days(n): return datetime.utcnow() + timedelta(days=n)

def seed():
    print("🌱 Seeding SomromScan v2 with real TGO Registry data...")

    # ===== Users =====
    for uid, email, name, role, org in [
        (1,"farmer@somromscan.th","สมชาย ใจดี","farmer","กลุ่มเกษตรกรสวนสมรมเกาะยอ จ.สงขลา"),
        (2,"leader@somromscan.th","สมหญิง สุขใจ","group_leader","กลุ่มเกษตรกรสวนสมรมเกาะยอ"),
        (3,"tgo@tgo.or.th","นายพิสุทธิ์ ชัยเกษม","tgo_admin","อบก."),
        (4,"buyer@ptt.co.th","ดร.วิภา สุทธิรักษ์","buyer","บริษัท ปตท. จำกัด (มหาชน)"),
        (5,"vvb@psu.ac.th","รศ.ดร.ประพันธ์ สมาน","vvb","ม.สงขลานครินทร์"),
    ]:
        if not db.query(User).filter(User.id==uid).first():
            db.add(User(id=uid,email=email,name=name,role=role,organization=org,hashed_password=_hash("password123")))
    db.commit()
    print("✅ Users: 5")

    # ===== Projects (based on real TGO data) =====
    projects_data = [
        dict(id=1,name="BCPG Mangrove Rehabilitation Project for a Sustainable World",
             name_th="โครงการฟื้นฟูป่าชายเลนของ BCPG เพื่อโลกที่ยั่งยืน",
             tgo_registration_number="T-VER-F-0089",forest_type="mangrove",status="monitoring",
             methodology="T-VER-P-METH-13-02",province="ระยอง",district="บ้านฉาง",
             area_rai=1250.0,area_hectare=200.0,latitude=12.7167,longitude=101.0500,
             project_start_date=datetime(2019,1,1),crediting_period_years=15,
             crediting_period_end=datetime(2034,1,1),registration_date=datetime(2019,6,15),
             expected_reduction_tco2_year=791.0,total_issued_tco2=3164.0,buffer_percentage=15.0,
             verification_cycle_years=3,next_verification_due=days(280),
             last_monitoring_date=datetime(2022,12,31),owner_id=1,
             co_benefits={"biodiversity":True,"water":True,"community":True},
             sdg_indicators=[13,14,15]),
        dict(id=2,name="Community Forestry Baan Pa Sang Doi Kaew, Wiang Chiang Rung, Chiang Rai",
             name_th="โครงการป่าชุมชนบ้านป่าซางดอยแก้ว อ.เวียงเชียงรุ้ง จ.เชียงราย",
             tgo_registration_number="T-VER-F-0142",forest_type="community",status="monitoring",
             methodology="T-VER-S-METH-13-01",province="เชียงราย",district="เวียงเชียงรุ้ง",
             area_rai=4250.0,area_hectare=680.0,latitude=19.9167,longitude=99.9333,
             project_start_date=datetime(2018,1,1),crediting_period_years=10,
             crediting_period_end=datetime(2028,1,1),registration_date=datetime(2018,9,20),
             expected_reduction_tco2_year=2135.0,total_issued_tco2=14945.0,buffer_percentage=15.0,
             verification_cycle_years=2,next_verification_due=days(45),
             last_monitoring_date=datetime(2024,1,15),owner_id=2,
             co_benefits={"biodiversity":True,"water":True,"community":True},
             sdg_indicators=[13,15]),
        dict(id=3,name="Community Forestry Baan Ton Peung, Mae Phong, Doi Saket, Chiang Mai",
             name_th="โครงการป่าชุมชนบ้านต้นผึ้ง แม่โป่ง ดอยสะเก็ด จ.เชียงใหม่",
             tgo_registration_number="T-VER-F-0215",forest_type="community",status="monitoring",
             methodology="T-VER-S-METH-13-01",province="เชียงใหม่",district="ดอยสะเก็ด",
             area_rai=862.0,area_hectare=137.9,latitude=18.8333,longitude=99.2500,
             project_start_date=datetime(2020,1,1),crediting_period_years=10,
             crediting_period_end=datetime(2030,1,1),registration_date=datetime(2020,5,10),
             expected_reduction_tco2_year=315.0,total_issued_tco2=1055.0,buffer_percentage=15.0,
             verification_cycle_years=2,next_verification_due=days(-15),
             last_monitoring_date=datetime(2024,4,1),owner_id=2,
             co_benefits={"biodiversity":True,"water":True,"community":True},sdg_indicators=[13,15]),
        dict(id=4,name="Community Forestry Baan Tau Pae, Mae Hong Son",
             name_th="โครงการป่าชุมชนบ้านต่อแพ อ.ขุนยวม จ.แม่ฮ่องสอน",
             tgo_registration_number="T-VER-F-0272",forest_type="community",status="issued",
             methodology="T-VER-S-METH-13-01",province="แม่ฮ่องสอน",district="ขุนยวม",
             area_rai=15400.0,area_hectare=2464.0,latitude=18.8000,longitude=98.0167,
             project_start_date=datetime(2017,1,1),crediting_period_years=10,
             crediting_period_end=datetime(2027,1,1),registration_date=datetime(2017,8,16),
             expected_reduction_tco2_year=8500.0,total_issued_tco2=10182.0,buffer_percentage=15.0,
             verification_cycle_years=2,next_verification_due=days(320),
             last_monitoring_date=datetime(2024,8,16),owner_id=2,
             co_benefits={"biodiversity":True,"water":True,"community":True},sdg_indicators=[13,15]),
        dict(id=5,name="FIO Phrae Reforestation — TVER-40 (Carbonmark Listed)",
             name_th="โครงการปลูกป่าขององค์การอุตสาหกรรมป่าไม้ จ.แพร่ (TVER-40)",
             tgo_registration_number="T-VER-F-0040",forest_type="restoration",status="issued",
             methodology="T-VER-S-METH-13-01",province="แพร่",district="ร้องกวาง",
             area_rai=28600.0,area_hectare=4576.0,latitude=18.1333,longitude=100.1833,
             project_start_date=datetime(2015,1,1),crediting_period_years=10,
             crediting_period_end=datetime(2025,1,1),registration_date=datetime(2016,3,1),
             expected_reduction_tco2_year=43628.0,total_issued_tco2=87256.0,buffer_percentage=15.0,
             verification_cycle_years=2,next_verification_due=days(180),
             last_monitoring_date=datetime(2023,12,31),owner_id=1,
             co_benefits={"biodiversity":True,"water":True,"community":True},sdg_indicators=[8,13,15]),
        dict(id=6,name="PTT Forestation in Natural Gas Pipeline Areas",
             name_th="โครงการปลูกป่าในพื้นที่ระบบท่อส่งก๊าซธรรมชาติ บริษัท ปตท. จำกัด (มหาชน)",
             tgo_registration_number="T-VER-F-0372",forest_type="restoration",status="monitoring",
             methodology="T-VER-S-METH-13-01",province="ระยอง",district="หลายจังหวัด (Bundling)",
             area_rai=3200.0,area_hectare=512.0,latitude=12.9333,longitude=101.2333,
             project_start_date=datetime(2023,11,2),crediting_period_years=10,
             crediting_period_end=datetime(2033,11,2),registration_date=datetime(2024,3,11),
             expected_reduction_tco2_year=108.0,total_issued_tco2=0.0,buffer_percentage=15.0,
             verification_cycle_years=2,next_verification_due=days(90),
             last_monitoring_date=None,owner_id=1,
             co_benefits={"community":True},sdg_indicators=[13,15]),
        dict(id=7,name="Thai Special Gas Mangrove Planting Project 2023",
             name_th="โครงการปลูกป่าชายเลน เพื่อประโยชน์จากคาร์บอนเครดิต โดย บริษัท ไทยสเปเชี่ยลแก๊ส จำกัด",
             tgo_registration_number="T-VER-F-0523",forest_type="mangrove",status="registered",
             methodology="T-VER-S-METH-13-01",province="ชุมพร",district="ทุ่งตะโก",
             area_rai=180.0,area_hectare=28.8,latitude=10.5500,longitude=99.2000,
             project_start_date=datetime(2025,1,23),crediting_period_years=10,
             crediting_period_end=datetime(2035,1,23),registration_date=datetime(2025,7,22),
             expected_reduction_tco2_year=289.0,total_issued_tco2=0.0,buffer_percentage=15.0,
             verification_cycle_years=2,next_verification_due=days(600),
             last_monitoring_date=None,owner_id=2,
             co_benefits={"biodiversity":True,"water":True},sdg_indicators=[13,14]),
        dict(id=8,name="Rubber Authority of Thailand Carbon Credit 2025 — Central & East",
             name_th="โครงการบริหารจัดการคาร์บอนเครดิตของการยางแห่งประเทศไทย ปี 2568 เขตภาคกลางและภาคตะวันออก",
             tgo_registration_number="T-VER-A-0596",forest_type="rubber",status="registered",
             methodology="T-VER-S-METH-13-06",province="ชลบุรี",district="หลายจังหวัด (Bundling)",
             area_rai=125000.0,area_hectare=20000.0,latitude=13.3500,longitude=101.0000,
             project_start_date=datetime(2025,7,5),crediting_period_years=7,
             crediting_period_end=datetime(2032,7,4),registration_date=datetime(2025,11,25),
             expected_reduction_tco2_year=185000.0,total_issued_tco2=0.0,buffer_percentage=15.0,
             verification_cycle_years=2,next_verification_due=days(540),
             last_monitoring_date=None,owner_id=1,
             co_benefits={"community":True},sdg_indicators=[8,13]),
        dict(id=9,name="Somrom Agroforestry — Koh Yor Songkhla (SomromScan Pilot)",
             name_th="โครงการสวนสมรมชุมชนเกาะยอ จ.สงขลา — Pilot SomromScan v2",
             tgo_registration_number="T-VER-F-0412",forest_type="somrom",status="validating",
             methodology="T-VER-S-METH-13-01",province="สงขลา",district="เกาะยอ",
             area_rai=850.0,area_hectare=136.0,latitude=7.1167,longitude=100.4833,
             project_start_date=datetime(2024,1,1),crediting_period_years=10,
             crediting_period_end=datetime(2034,1,1),registration_date=None,
             expected_reduction_tco2_year=620.0,total_issued_tco2=0.0,buffer_percentage=15.0,
             verification_cycle_years=2,next_verification_due=days(200),
             last_monitoring_date=None,owner_id=1,
             co_benefits={"biodiversity":True,"water":True,"community":True},
             sdg_indicators=[2,13,15],
             notes="โครงการ pilot ของ SomromScan v2 MRV Platform ใช้ sensor IoT + ARCore + Allometric AI"),
        dict(id=10,name="Phang Nga Bay Mangrove Restoration",
             name_th="โครงการฟื้นฟูป่าชายเลนอ่าวพังงา",
             tgo_registration_number="T-VER-F-0481",forest_type="mangrove",status="monitoring",
             methodology="T-VER-P-METH-13-02",province="พังงา",district="เกาะยาว",
             area_rai=960.0,area_hectare=153.6,latitude=8.0500,longitude=98.5500,
             project_start_date=datetime(2021,6,1),crediting_period_years=15,
             crediting_period_end=datetime(2036,6,1),registration_date=datetime(2021,12,1),
             expected_reduction_tco2_year=580.0,total_issued_tco2=2100.0,buffer_percentage=15.0,
             verification_cycle_years=3,next_verification_due=days(-8),
             last_monitoring_date=datetime(2024,6,1),owner_id=2,
             co_benefits={"biodiversity":True,"water":True,"community":True},sdg_indicators=[13,14]),
    ]

    for pdata in projects_data:
        if not db.query(Project).filter(Project.id==pdata["id"]).first():
            db.add(Project(**pdata))
    db.commit()
    print(f"✅ Projects: {db.query(Project).count()}")

    # ===== Trees =====
    species_by_type = {
        "somrom": [("ทุเรียน","Durio zibethinus",0.55),("มังคุด","Garcinia mangostana",0.72),
                   ("ลองกอง","Lansium domesticum",0.60),("จำปาดะ","Artocarpus integer",0.55),
                   ("สะตอ","Parkia speciosa",0.52),("ยางพารา","Hevea brasiliensis",0.56)],
        "rubber": [("ยางพารา","Hevea brasiliensis",0.56)],
        "mangrove": [("โกงกางใบเล็ก","Rhizophora apiculata",0.89),("โกงกางใบใหญ่","Rhizophora mucronata",0.88),
                     ("แสม","Avicennia marina",0.75),("ถั่วขาว","Bruguiera gymnorrhiza",0.84)],
        "community": [("ไม้สัก","Tectona grandis",0.63),("ไม้ยาง","Shorea spp.",0.62),
                      ("ทุเรียน","Durio zibethinus",0.55)],
        "restoration": [("ไม้สัก","Tectona grandis",0.63),("ยูคาลิปตัส","Eucalyptus camaldulensis",0.55),
                        ("กระถินณรงค์","Acacia mangium",0.52)],
        "mixed": [("ทุเรียน","Durio zibethinus",0.55),("ยางพารา","Hevea brasiliensis",0.56),
                  ("ปาล์มน้ำมัน","Elaeis guineensis",0.30)],
    }

    from database import Tree as TreeModel, ForestType
    for project in db.query(Project).all():
        if db.query(TreeModel).filter(TreeModel.project_id==project.id).count() > 0:
            continue
        ft = project.forest_type.value if hasattr(project.forest_type,'value') else project.forest_type
        species_options = species_by_type.get(ft, species_by_type["mixed"])
        n_trees = min(int((project.area_rai or 100) * 0.6), 120)
        for i in range(n_trees):
            sp_common, sp_sci, wd = random.choice(species_options)
            dbh = random.uniform(6, 50)
            h = random.uniform(4, 28)
            agb = 0.0673 * (wd * dbh**2 * h)**0.976
            carbon = agb * 0.47
            co2 = carbon * (44/12)
            db.add(TreeModel(
                project_id=project.id,
                tree_code=f"T{project.id:02d}-{i+1:04d}",
                species_common=sp_common, species_scientific=sp_sci,
                forest_type=project.forest_type,
                dbh_cm=round(dbh,1), height_m=round(h,1), wood_density=wd,
                agb_kg=round(agb,2), carbon_kg=round(carbon,2), co2_kg=round(co2,2),
                allometric_equation_id="chave2014_pantropical",
                allometric_equation_name="Chave 2014 Pantropical",
                allometric_equation_source="Global Change Biology 20(10):3177-3190",
                plot_number=(i//20)+1, is_sample_plot=(i%20==0),
                latitude=(project.latitude or 13)+random.uniform(-0.02,0.02) if project.latitude else None,
                longitude=(project.longitude or 100)+random.uniform(-0.02,0.02) if project.longitude else None,
                species_confidence=round(random.uniform(78,99),1),
                status="alive" if random.random()>0.02 else "dead",
            ))
    db.commit()
    print(f"✅ Trees: {db.query(TreeModel).count()}")

    # ===== Sensor Readings =====
    from database import SensorReading as SR
    for project in db.query(Project).filter(Project.status.in_(["monitoring","issued","registered"])).all():
        if db.query(SR).filter(SR.project_id==project.id).count() > 0:
            continue
        trees = db.query(TreeModel).filter(TreeModel.project_id==project.id).limit(15).all()
        start = project.project_start_date or datetime(2023,1,1)
        for tree in trees:
            for month in range(18):
                ts = start + timedelta(days=month*30 + random.randint(-3,3))
                dbh_r = (tree.dbh_cm or 15) + month*random.uniform(0.1,0.35) + random.uniform(-0.15,0.15)
                agb_r = 0.0673 * ((tree.wood_density or 0.57) * dbh_r**2 * (tree.height_m or 12))**0.976
                co2_r = agb_r * 0.47 * (44/12)
                db.add(SR(
                    project_id=project.id, tree_id=tree.id,
                    measurement_type="dbh", dbh_cm=round(dbh_r,1), tier="arcore",
                    agb_kg=round(agb_r,2), co2_kg=round(co2_r,2),
                    confidence_score=round(random.uniform(78,97),1),
                    is_anomaly=False, timestamp=ts,
                ))
        # Add anomaly
        db.add(SR(project_id=project.id,measurement_type="dbh",dbh_cm=1.2,tier="arcore",
                  confidence_score=42.0,is_anomaly=True,
                  anomaly_reason="DBH 1.2cm ต่ำผิดปกติ — ต้องตรวจสอบ",
                  timestamp=datetime.utcnow()-timedelta(days=random.randint(1,5))))
    db.commit()
    print(f"✅ Sensor readings: {db.query(SR).count()}")

    # ===== VVB Organizations =====
    # Must run before Verification Events: events below reference vvb_id by
    # the auto-assigned VVB ids (1, 5, ...), and Postgres enforces that FK
    # (SQLite does not by default, so this ordering bug was silent in dev).
    from database import VVBOrganization as VVBO
    if db.query(VVBO).count() == 0:
        for data in VVB_SEED_DATA:
            db.add(VVBO(**data))
        db.commit()
    print(f"✅ VVB Organizations: {db.query(VVBO).count()}")

    # ===== Verification Events =====
    from database import VerificationEvent as VE
    events = [
        (1,"validation","completed",datetime(2019,6,15),1,791),
        (1,"verification","completed",datetime(2022,12,31),1,791),
        (1,"verification","scheduled",days(280),None,None),
        (2,"validation","completed",datetime(2018,9,20),1,2135),
        (2,"verification","completed",datetime(2020,1,15),None,2135),
        (2,"verification","completed",datetime(2022,1,15),None,2135),
        (2,"verification","scheduled",days(45),None,None),
        (3,"verification","scheduled",days(-15),None,None),
        (4,"verification","completed",datetime(2024,8,16),1,10182),
        (4,"verification","scheduled",days(320),None,None),
        (5,"verification","completed",datetime(2023,12,31),None,43628),
        (5,"verification","scheduled",days(180),None,None),
        (6,"validation","scheduled",days(90),5,None),
        (9,"validation","in_progress",days(200),5,None),
        (10,"verification","overdue",days(-8),None,None),
    ]
    for pid,etype,estatus,due,vvb,tco2 in events:
        if not db.query(VE).filter(VE.project_id==pid,VE.event_type==etype,VE.due_date==due).first():
            db.add(VE(project_id=pid,event_type=etype,status=estatus,due_date=due,
                      vvb_id=vvb,verified_tco2=tco2,
                      completed_date=due if estatus=="completed" else None))
    db.commit()
    print(f"✅ Verification events: {db.query(VE).count()}")

    print("\n🎉 Seed complete!")
    print(f"   Projects: {db.query(Project).count()}")
    print(f"   Trees: {db.query(TreeModel).count()}")
    print(f"   Sensor readings: {db.query(SR).count()}")
    print(f"   Verification events: {db.query(VE).count()}")
    print(f"   VVB organizations: {db.query(VVBO).count()}")

if __name__ == "__main__":
    seed()
    db.close()
