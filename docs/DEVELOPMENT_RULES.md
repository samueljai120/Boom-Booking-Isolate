# 📋 Boom Karaoke Booking System - Development Rules

## 🎯 **Primary Rule: Documentation-First Development**

### **RULE #1: ALWAYS FOLLOW THE DOCUMENTATION**

**MANDATORY**: All software development MUST follow the consolidated documentation in the `/docs/` folder. This is a **non-negotiable requirement** for all team members, contractors, and contributors.

---

## 📚 **Documentation Hierarchy (Follow in Order)**

### **1. System Overview** 
**File**: `SYSTEM_OVERVIEW.md`
- **When to Use**: Before starting ANY development work
- **Purpose**: Understand the complete system architecture, features, and capabilities
- **Requirement**: Read completely before making any changes

### **2. Deployment Guide**
**File**: `deployment/DEPLOYMENT_GUIDE_2025.md`
- **When to Use**: For all deployment and infrastructure changes
- **Purpose**: Current production architecture (Vercel + Neon)
- **Requirement**: Follow exactly - no deviations allowed

### **3. Development Guide**
**File**: `development/DEVELOPMENT_GUIDE_2025.md`
- **When to Use**: For all code development and feature implementation
- **Purpose**: Complete development standards, architecture, and best practices
- **Requirement**: Adhere to all guidelines and patterns

### **4. Business Roadmap**
**File**: `business/BUSINESS_ROADMAP_2025.md`
- **When to Use**: For feature prioritization and business decisions
- **Purpose**: Current business strategy, priorities, and market positioning
- **Requirement**: Align all development with business objectives

### **5. Troubleshooting Guide**
**File**: `troubleshooting/TROUBLESHOOTING_GUIDE.md`
- **When to Use**: When encountering issues or bugs
- **Purpose**: Standardized debugging and resolution procedures
- **Requirement**: Follow troubleshooting steps before seeking help

---

## 🚨 **Critical Development Rules**

### **RULE #2: ARCHITECTURE COMPLIANCE**
- **MANDATORY**: Use ONLY the documented architecture (Vercel + Neon PostgreSQL)
- **FORBIDDEN**: Any Railway, Render, or other platform references
- **REQUIRED**: Follow the exact technology stack specified in documentation

### **RULE #3: SECURITY STANDARDS**
- **MANDATORY**: Implement all security measures documented in the guides
- **REQUIRED**: JWT authentication, input validation, SQL injection prevention
- **FORBIDDEN**: Any security shortcuts or bypasses

### **RULE #4: CODE STANDARDS**
- **MANDATORY**: Follow all coding patterns and conventions in the development guide
- **REQUIRED**: Use documented API patterns, component structure, and database schema
- **FORBIDDEN**: Creating new patterns without updating documentation first

### **RULE #5: DEPLOYMENT STANDARDS**
- **MANDATORY**: Use only the deployment methods documented in `DEPLOYMENT_GUIDE_2025.md`
- **REQUIRED**: Follow exact environment variable configuration
- **FORBIDDEN**: Custom deployment configurations not in documentation

---

## 🔄 **Development Workflow Rules**

### **Before Starting Any Work:**
1. **Read `SYSTEM_OVERVIEW.md`** - Understand the complete system
2. **Review `DEVELOPMENT_GUIDE_2025.md`** - Follow established patterns
3. **Check `BUSINESS_ROADMAP_2025.md`** - Ensure alignment with business goals
4. **Verify deployment guide** - Understand production environment

### **During Development:**
1. **Follow documented patterns** - Don't create new ones without updating docs
2. **Use documented APIs** - Follow exact endpoint specifications
3. **Implement documented security** - All security measures required
4. **Follow database schema** - Use exact table structures documented

### **Before Deployment:**
1. **Verify deployment guide compliance** - Follow exact steps
2. **Test against documented standards** - All requirements met
3. **Update documentation if needed** - Any changes must be documented
4. **Follow troubleshooting guide** - Resolve any issues per guide

---

## 📋 **Documentation Update Rules**

### **RULE #6: DOCUMENTATION MAINTENANCE**
- **MANDATORY**: Update documentation when making architectural changes
- **REQUIRED**: Keep all guides current and accurate
- **PROCESS**: Update docs BEFORE implementing changes, not after

### **When to Update Documentation:**
- Adding new features or components
- Changing API endpoints or database schema
- Modifying deployment procedures
- Updating security measures
- Changing business strategy or priorities

### **Documentation Update Process:**
1. **Identify which document(s) need updates**
2. **Make documentation changes FIRST**
3. **Get team review of documentation changes**
4. **Implement code changes per updated documentation**
5. **Verify implementation matches documentation**

---

## 🚫 **Prohibited Practices**

### **NEVER DO THESE:**
- ❌ **Ignore documentation** - Always follow the guides
- ❌ **Create custom patterns** - Use documented patterns only
- ❌ **Skip security measures** - All documented security required
- ❌ **Deploy without documentation compliance** - Must follow deployment guide
- ❌ **Make changes without updating docs** - Documentation first, code second
- ❌ **Use outdated information** - Always reference current 2025 documentation
- ❌ **Reference Railway or deprecated platforms** - Vercel + Neon only

---

## ✅ **Required Practices**

### **ALWAYS DO THESE:**
- ✅ **Read relevant documentation before starting**
- ✅ **Follow exact patterns and conventions documented**
- ✅ **Implement all security measures specified**
- ✅ **Use documented database schema and API endpoints**
- ✅ **Follow deployment procedures exactly**
- ✅ **Update documentation when making changes**
- ✅ **Test against documented standards**
- ✅ **Reference current 2025 documentation only**

---

## 🔍 **Compliance Verification**

### **Code Review Checklist:**
- [ ] Developer read relevant documentation before coding
- [ ] Code follows documented patterns and conventions
- [ ] Security measures implemented per documentation
- [ ] API endpoints match documentation specifications
- [ ] Database schema follows documented structure
- [ ] Deployment procedures followed exactly
- [ ] Documentation updated if changes made

### **Deployment Checklist:**
- [ ] Deployment guide followed exactly
- [ ] Environment variables configured per documentation
- [ ] Security configuration matches documented standards
- [ ] All documented requirements implemented
- [ ] Troubleshooting guide consulted for any issues

---

## 🎯 **Success Metrics**

### **Documentation Compliance Indicators:**
- **100% of code reviews** reference documentation
- **0 deviations** from documented architecture
- **0 security shortcuts** taken
- **100% deployment success** following documentation
- **All changes** documented before implementation

### **Quality Gates:**
- Code must pass documentation compliance review
- Deployment must follow exact documented procedures
- All features must align with business roadmap
- Security must meet documented standards
- Performance must meet documented targets

---

## 📞 **Enforcement & Support**

### **Rule Enforcement:**
- **Code Reviews**: All reviews must verify documentation compliance
- **Deployment Gates**: No deployment without documentation compliance
- **Team Accountability**: All team members responsible for compliance
- **Continuous Improvement**: Regular documentation compliance audits

### **Getting Help:**
1. **Check troubleshooting guide first**
2. **Review relevant documentation sections**
3. **Ask team for clarification on documentation**
4. **Update documentation if gaps found**
5. **Escalate only after following all documented procedures**

---

## 🏆 **Benefits of Documentation-First Development**

### **For Developers:**
- ✅ **Clear guidelines** - No guesswork on implementation
- ✅ **Consistent patterns** - Reusable, maintainable code
- ✅ **Security compliance** - Built-in security standards
- ✅ **Reduced errors** - Proven patterns and procedures

### **For the Project:**
- ✅ **Consistent quality** - Standardized implementation
- ✅ **Maintainable codebase** - Well-documented patterns
- ✅ **Secure system** - Comprehensive security measures
- ✅ **Reliable deployments** - Proven deployment procedures

### **For Business:**
- ✅ **Predictable outcomes** - Documentation-driven results
- ✅ **Faster development** - Clear guidelines reduce decision time
- ✅ **Lower risk** - Proven patterns reduce errors
- ✅ **Scalable team** - New members can follow documentation

---

## 📝 **Quick Reference**

### **Before Coding:**
1. Read `SYSTEM_OVERVIEW.md`
2. Review `DEVELOPMENT_GUIDE_2025.md`
3. Check `BUSINESS_ROADMAP_2025.md`
4. Follow documented patterns

### **Before Deploying:**
1. Review `DEPLOYMENT_GUIDE_2025.md`
2. Follow exact procedures
3. Test against documented standards
4. Verify compliance

### **When Stuck:**
1. Check `TROUBLESHOOTING_GUIDE.md`
2. Review relevant documentation
3. Follow documented procedures
4. Update docs if gaps found

---

## 🎉 **Conclusion**

**Following the documentation is not optional - it's mandatory.** The consolidated documentation in `/docs/` represents the **single source of truth** for all development work. 

**Remember**: Documentation-first development ensures consistency, quality, security, and maintainability. When in doubt, **always refer to the documentation**.

---

**Last Updated**: September 2025  
**Status**: ✅ **MANDATORY COMPLIANCE REQUIRED**  
**Next Review**: Monthly  
**Owner**: Development Team Lead
