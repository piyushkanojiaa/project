# Orbital Guard AI - CI/CD Pipeline

## 🎯 Automated Workflow

Every commit triggers:
- ✅ Automated testing
- ✅ Code linting
- ✅ Docker builds
- ✅ Security scans
- ✅ Deployment (on main branch)

---

## 🔄 Pipeline Stages

### **1. Test Backend** (Python)
- Runs `pytest` with coverage
- Lints with `flake8`
- Uploads coverage to Codecov
- **Pass**: Green ✅
- **Fail**: Red ❌ blocks merge

### **2. Test Frontend** (TypeScript)
- Runs ESLint
- Builds production bundle
- Validates Vite output
- **Pass**: Green ✅

### **3. Build Docker**
- Builds backend image
- Builds frontend image
- Tests `docker-compose up`
- Health check validation
- **Pass**: Ready to deploy ✅

### **4. Security Scan**
- Trivy vulnerability scanner
- Checks dependencies
- Reports to GitHub Security
- **Pass**: No critical vulnerabilities ✅

### **5. Deploy** (Conditional)
- **develop** → Staging environment
- **main** → Production environment
- **tags** → GitHub Release

---

## 📊 Status Badges

Add to README.md:

```markdown
![CI/CD](https://github.com/yourusername/orbital-guard-ai/workflows/CI%2FCD%20Pipeline/badge.svg)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Coverage](https://img.shields.io/codecov/c/github/yourusername/orbital-guard-ai)
```

---

## 🧪 Running Tests Locally

### Backend Tests
```bash
cd backend
pip install pytest pytest-cov
pytest tests/ -v
```

### Frontend Lint
```bash
cd frontend
npm run lint
```

---

## 🚀 Deployment

**Automatic**:
- Push to `main` → Production
- Push to `develop` → Staging

**Manual**:
- Go to Actions tab
- Run workflow manually
- Select environment

---

## ✅ Benefits

- **Quality Assurance** - Catch bugs early
- **Automated Testing** - No manual QA needed
- **Fast Feedback** - Know instantly if broken
- **Professional** - Industry-standard workflow
- **DevOps Skills** - Resume boost
