"""
Database configuration and models for SomromScan v2 MRV Platform
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import enum
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./somromscan.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ===== Enums =====
class ProjectStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    VALIDATING = "validating"
    REGISTERED = "registered"
    MONITORING = "monitoring"
    VERIFYING = "verifying"
    ISSUED = "issued"
    EXPIRED = "expired"

class ForestType(str, enum.Enum):
    SOMROM = "somrom"           # สวนสมรม
    RUBBER = "rubber"           # ยางพารา
    MANGROVE = "mangrove"       # ป่าชายเลน
    COMMUNITY = "community"     # ป่าชุมชน
    RESTORATION = "restoration" # ป่าฟื้นฟู
    MIXED = "mixed"             # ป่าผสม
    PALM = "palm"               # ปาล์มน้ำมัน

class UserRole(str, enum.Enum):
    FARMER = "farmer"
    GROUP_LEADER = "group_leader"
    VVB = "vvb"
    TGO_ADMIN = "tgo_admin"
    BUYER = "buyer"
    PUBLIC = "public"


# ===== Models =====

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.FARMER)
    organization = Column(String)
    phone = Column(String)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    projects = relationship("Project", back_populates="owner")
    sensor_readings = relationship("SensorReading", back_populates="user")


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    name_th = Column(String)
    tgo_registration_number = Column(String, unique=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    forest_type = Column(Enum(ForestType), nullable=False)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.DRAFT)
    methodology = Column(String, default="T-VER-S-METH-13-01")

    # Location
    province = Column(String)
    district = Column(String)
    area_rai = Column(Float)
    area_hectare = Column(Float)
    latitude = Column(Float)
    longitude = Column(Float)
    kml_boundary = Column(Text)

    # Timeline
    project_start_date = Column(DateTime)
    crediting_period_years = Column(Integer, default=10)
    crediting_period_end = Column(DateTime)
    registration_date = Column(DateTime)

    # Carbon estimates
    expected_reduction_tco2_year = Column(Float)
    total_issued_tco2 = Column(Float, default=0)
    buffer_percentage = Column(Float, default=15.0)

    # Monitoring
    last_monitoring_date = Column(DateTime)
    next_verification_due = Column(DateTime)
    verification_cycle_years = Column(Integer, default=2)

    # Co-benefits
    co_benefits = Column(JSON)
    sdg_indicators = Column(JSON)

    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="projects")
    trees = relationship("Tree", back_populates="project")
    sensor_readings = relationship("SensorReading", back_populates="project")
    verification_events = relationship("VerificationEvent", back_populates="project")
    vvb_assignments = relationship("VVBAssignment", back_populates="project")
    monitoring_reports = relationship("MonitoringReport", back_populates="project")


class Tree(Base):
    __tablename__ = "trees"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    tree_code = Column(String, nullable=False)
    species_common = Column(String)
    species_scientific = Column(String)
    species_family = Column(String)
    forest_type = Column(Enum(ForestType))

    # Measurements
    dbh_cm = Column(Float)
    height_m = Column(Float)
    wood_density = Column(Float)
    agb_kg = Column(Float)
    carbon_kg = Column(Float)
    co2_kg = Column(Float)

    # Allometric equation used
    allometric_equation_id = Column(String)
    allometric_equation_name = Column(String)
    allometric_equation_source = Column(String)

    # Location
    latitude = Column(Float)
    longitude = Column(Float)
    plot_number = Column(Integer)
    is_sample_plot = Column(Boolean, default=False)

    # Monitoring
    first_measured = Column(DateTime, default=datetime.utcnow)
    last_measured = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="alive")

    leaf_image_url = Column(String)
    species_confidence = Column(Float)

    project = relationship("Project", back_populates="trees")
    sensor_readings = relationship("SensorReading", back_populates="tree")


class SensorReading(Base):
    __tablename__ = "sensor_readings"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    tree_id = Column(Integer, ForeignKey("trees.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Measurement type: dbh | height | image | environmental
    measurement_type = Column(String, nullable=False)

    # Sensor data
    dbh_cm = Column(Float)
    height_m = Column(Float)
    tier = Column(String)  # uwb | arcore | stereo

    # Calculated
    agb_kg = Column(Float)
    co2_kg = Column(Float)

    # Quality
    confidence_score = Column(Float)
    is_anomaly = Column(Boolean, default=False)
    anomaly_reason = Column(String)

    # Raw data
    raw_data = Column(JSON)

    timestamp = Column(DateTime, default=datetime.utcnow)
    latitude = Column(Float)
    longitude = Column(Float)
    device_id = Column(String)

    project = relationship("Project", back_populates="sensor_readings")
    tree = relationship("Tree", back_populates="sensor_readings")
    user = relationship("User", back_populates="sensor_readings")


class AllometricEquation(Base):
    __tablename__ = "allometric_equations"
    id = Column(String, primary_key=True)  # e.g. "chave2014_pantropical"
    name = Column(String, nullable=False)
    name_th = Column(String)
    author = Column(String)
    year = Column(Integer)
    source = Column(String)
    doi = Column(String)

    # Applicability
    forest_types = Column(JSON)     # list of ForestType
    species_list = Column(JSON)     # specific species if applicable
    eco_region = Column(String)
    country = Column(String, default="Thailand")

    # Equation
    formula = Column(String)        # e.g. "0.0673 * (WD * DBH^2 * H)^0.976"
    formula_latex = Column(String)
    requires_height = Column(Boolean, default=False)
    requires_wood_density = Column(Boolean, default=False)
    requires_dbh = Column(Boolean, default=True)

    # Performance
    r_squared = Column(Float)
    rmse = Column(Float)
    sample_size = Column(Integer)
    dbh_range_min = Column(Float)
    dbh_range_max = Column(Float)

    priority_rank = Column(Integer, default=5)  # 1=best, 5=fallback
    is_tgo_approved = Column(Boolean, default=False)
    notes = Column(Text)


class VerificationEvent(Base):
    __tablename__ = "verification_events"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    vvb_id = Column(Integer, ForeignKey("vvb_organizations.id"), nullable=True)

    event_type = Column(String)  # validation | verification | monitoring
    status = Column(String, default="scheduled")  # scheduled | in_progress | completed | overdue
    due_date = Column(DateTime)
    completed_date = Column(DateTime)

    # Findings
    cars_count = Column(Integer, default=0)   # Corrective Action Requests
    fars_count = Column(Integer, default=0)   # Forward Action Requests
    cls_count = Column(Integer, default=0)    # Clarifications

    verified_tco2 = Column(Float)
    verification_report_url = Column(String)
    notes = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="verification_events")
    vvb = relationship("VVBOrganization", back_populates="verification_events")
    alerts = relationship("Alert", back_populates="verification_event")


class VVBOrganization(Base):
    __tablename__ = "vvb_organizations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    name_th = Column(String)
    organization_type = Column(String)  # university | private | ngo
    contact_email = Column(String)
    contact_phone = Column(String)
    website = Column(String)

    # TGO Registration
    tgo_registration_number = Column(String)
    registration_valid_until = Column(DateTime)
    is_active = Column(Boolean, default=True)

    # Sectoral Scopes (T-VER codes)
    sectoral_scopes = Column(JSON)  # list of scope numbers
    methodology_specialties = Column(JSON)  # list of methodology IDs

    # Capacity
    current_project_count = Column(Integer, default=0)
    max_project_capacity = Column(Integer, default=20)
    avg_cost_per_manday_thb = Column(Float)
    avg_site_visit_days = Column(Integer)

    # Rating
    avg_rating = Column(Float, default=4.0)
    total_projects_completed = Column(Integer, default=0)
    avg_completion_days = Column(Integer)

    # Location
    province = Column(String)
    service_regions = Column(JSON)  # list of provinces served

    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    verification_events = relationship("VerificationEvent", back_populates="vvb")
    vvb_assignments = relationship("VVBAssignment", back_populates="vvb")


class VVBAssignment(Base):
    __tablename__ = "vvb_assignments"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    vvb_id = Column(Integer, ForeignKey("vvb_organizations.id"))
    match_score = Column(Float)
    match_reasons = Column(JSON)
    status = Column(String, default="recommended")  # recommended | accepted | rejected
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="vvb_assignments")
    vvb = relationship("VVBOrganization", back_populates="vvb_assignments")


class MonitoringReport(Base):
    __tablename__ = "monitoring_reports"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    report_number = Column(String)
    monitoring_period_start = Column(DateTime)
    monitoring_period_end = Column(DateTime)
    status = Column(String, default="draft")

    # Carbon data
    sample_plots_count = Column(Integer)
    trees_measured = Column(Integer)
    total_agb_tonnes = Column(Float)
    total_carbon_tonnes = Column(Float)
    total_co2_tonnes = Column(Float)
    baseline_co2_tonnes = Column(Float)
    net_removal_tco2 = Column(Float)
    buffer_credits = Column(Float)
    issuable_credits = Column(Float)

    # Quality
    qa_qc_passed = Column(Boolean, default=False)
    anomalies_detected = Column(Integer, default=0)

    generated_at = Column(DateTime, default=datetime.utcnow)
    pdf_url = Column(String)
    raw_data = Column(JSON)

    project = relationship("Project", back_populates="monitoring_reports")


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    verification_event_id = Column(Integer, ForeignKey("verification_events.id"), nullable=True)
    alert_type = Column(String)  # verification_due | anomaly | methodology_update | vvb_expiry
    severity = Column(String, default="medium")  # low | medium | high | critical
    title = Column(String)
    message = Column(Text)
    days_until_due = Column(Integer)
    is_read = Column(Boolean, default=False)
    sent_line = Column(Boolean, default=False)
    sent_email = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    verification_event = relationship("VerificationEvent", back_populates="alerts")
