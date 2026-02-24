from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Rack(Base):
    __tablename__ = "racks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    x = Column(Float, default=0.0)
    y = Column(Float, default=0.0)
    width = Column(Float, default=100.0)
    height = Column(Float, default=100.0)

    cases = relationship("Case", back_populates="rack", cascade="all, delete-orphan")


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    qr_code = Column(String, unique=True, nullable=False)
    rack_id = Column(Integer, ForeignKey("racks.id"), nullable=False)

    rack = relationship("Rack", back_populates="cases")
    items = relationship("Item", back_populates="case", cascade="all, delete-orphan")


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    image_path = Column(String, nullable=True)
    ai_label = Column(String, nullable=True)

    case = relationship("Case", back_populates="items")
