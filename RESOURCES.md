# 📚 Orbital Guard AI - Resources & References

## 🛰️ Datasets & Orbital Data

### **Primary Data Sources**
- **[CelesTrak](https://celestrak.org/)** ✅ *Currently integrated*
  - Free access to Two-Line Element (TLE) sets
  - Used for our live satellite data (23,755+ objects)
  
- **[Space-Track.org](https://www.space-track.org/)** (US Space Command)
  - Official catalog of orbital data
  - Requires registration (free)
  - More comprehensive than Celestrak
  
- **[ESA DISCOS](https://discosweb.esoc.esa.int/)** (European Space Agency)
  - Database and Information System Characterizing Objects in Space
  - European perspective on space objects

### **NASA Resources**
- **[NASA Orbital Debris Program Office](https://orbitaldebris.jsc.nasa.gov/)**
  - Debris environment models
  - Research reports and guidelines
  
- **CDMs (Conjunction Data Messages)**
  - Standardized format for collision warnings
  - Useful for training and validation

---

## 📖 Research Papers & Technical References

### **Paper Repositories**
- **[NASA Technical Reports Server (NTRS)](https://ntrs.nasa.gov/)**
  - Search: "conjunction assessment" and "collision avoidance"
  
- **[ESA Space Debris Conference Proceedings](https://conference.sdo.esoc.esa.int/)**
  - Cutting-edge methods in debris tracking
  
- **Journal of Guidance, Control, and Dynamics (AIAA)**
  - Articles on orbital mechanics
  - Maneuver optimization techniques
  
- **[Acta Astronautica](https://www.sciencedirect.com/journal/acta-astronautica)**
  - Peer-reviewed space debris papers
  - AI applications in space

### **AI-Focused Papers** (arXiv/IEEE)
- "Machine Learning for Space Debris Collision Prediction"
- "Reinforcement Learning for Autonomous Collision Avoidance Maneuvers"
- "Deep Learning for Orbital Conjunction Screening"

---

## 🛠️ Open-Source Tools & Libraries

### **Orbital Mechanics**
- **[Orekit](https://www.orekit.org/)** (Java)
  - High-precision orbital mechanics library
  - Industry-grade calculations
  
- **[GMAT](https://software.nasa.gov/software/GSC-17177-1)** (NASA)
  - General Mission Analysis Tool
  - Open-source trajectory simulation
  
- **[SGP4](https://pypi.org/project/sgp4/)** (Python) ✅ *Currently integrated*
  - Simplified General Perturbations
  - Used for our satellite propagation

### **Visualization & Rendering**
- **[osgEarth](https://github.com/gwaldron/osgearth)** (C++)
  - 3D geospatial terrain rendering toolkit
  - Built on OpenSceneGraph
  - **Note**: Desktop application framework
  - Could be used for a future C++ desktop variant
  - Current project uses Three.js (web-based)

### **Python Libraries**
- **[PyKEP](https://esa.github.io/pykep/)**
  - Trajectory optimization
  - Maneuver planning
  
- **[Astropy](https://www.astropy.org/)**
  - Astronomy calculations
  
- **[Poliastro](https://docs.poliastro.space/)**
  - Orbital mechanics in Python
  - Lambert problems, Hohmann transfers

### **AI/ML Tools**
- **[TensorFlow](https://www.tensorflow.org/)** / **[PyTorch](https://pytorch.org/)** ✅ *PyTorch integrated*
  - Deep learning frameworks
  - LSTM, Transformers, RL agents

### **Commercial Tools** (Student Licenses Available)
- **STK (Systems Tool Kit)** - Analytical Graphics Inc.
  - Industry standard for conjunction analysis
  - Free student licenses
  
- **POLARIS** - Orbital analysis suite

---

## 🌍 Organizations & Initiatives

### **Space Agencies**
- **[NASA Orbital Debris Program Office](https://orbitaldebris.jsc.nasa.gov/)**
- **[ESA Space Debris Office](https://www.esa.int/Safety_Security/Space_Debris)**
- **[UNOOSA](https://www.unoosa.org/)** (United Nations Office for Outer Space Affairs)

### **Research & Policy**
- **[Secure World Foundation](https://swfound.org/)**
  - Policy and technical resources
  - Space sustainability
  
- **DARPA & AFRL Projects**
  - Cutting-edge AI + space situational awareness

---

## 🧪 Validation & Simulation

### **Debris Environment Models**
- **ESA MASTER Model**
  - Space debris environment simulation
  - Statistical analysis
  
- **NASA LEGEND Model**
  - Long-term debris evolution
  - Projection scenarios

### **Simulation Frameworks**
- **Monte Carlo Simulation** ✅ *Partially implemented*
  - Uncertainty modeling in orbital predictions
  
- **[OpenSimSat](https://github.com/Ibrassow/opensimsatplus)**
  - Satellite simulation environment
  - Testing AI algorithms

---

## 🎯 Integration Roadmap for Orbital Guard AI

### **Phase 1: Enhanced Data Sources** (Future)
- [ ] Space-Track.org API integration
- [ ] CDM format parser
- [ ] ESA DISCOS data access

### **Phase 2: Advanced Algorithms**
- [ ] Orekit integration for high-precision propagation
- [ ] PyKEP for optimal maneuver planning
- [ ] Monte Carlo uncertainty quantification

### **Phase 3: ML Enhancements**
- [ ] LSTM for time-series PoC prediction
- [ ] Transformer models for pattern recognition
- [ ] Reinforcement learning for autonomous decisions

### **Phase 4: Validation**
- [ ] Test against NASA LEGEND scenarios
- [ ] Validate with ESA MASTER data
- [ ] Compare with STK results

---

## 📊 Current Implementation Status

**Integrated**:
- ✅ CelesTrak API (23,755 satellites)
- ✅ SGP4 propagation
- ✅ Foster 3D PoC (1984 algorithm)
- ✅ PyTorch neural network
- ✅ Basic Monte Carlo (covariance)

**Planned** (Priority 2+):
- Space-Track.org integration
- PyKEP maneuver optimization
- Orekit precision propagation
- Advanced ML models (LSTM/RL)

---

## 🔗 Quick Links

**Data**:
- [CelesTrak](https://celestrak.org/)
- [Space-Track](https://www.space-track.org/)

**Papers**:
- [arXiv: Space Science](https://arxiv.org/list/astro-ph.IM/recent)
- [NASA NTRS](https://ntrs.nasa.gov/)

**Tools**:
- [SGP4 Python](https://pypi.org/project/sgp4/)
- [Poliastro Docs](https://docs.poliastro.space/)

---

**Last Updated**: January 2026  
**Project**: Orbital Guard AI  
**Status**: Production-Ready with Priority 1 features in development
