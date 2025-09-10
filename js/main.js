// Integração de UI com API para o MyJob
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o usuário está logado e atualizar a UI
    updateAuthUI();
    
    // Configurar busca de vagas
    const searchForm = document.getElementById('job-search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', handleJobSearch);
    }
    
    // Carregar vagas na página inicial ou de vagas
    if (document.getElementById('featured-jobs') || document.getElementById('job-listings')) {
        loadJobs();
    }
    
    // Carregar detalhes da vaga se estiver na página de detalhes
    const jobDetailsContainer = document.getElementById('job-details-container');
    if (jobDetailsContainer && jobDetailsContainer.dataset.jobId) {
        loadJobDetails(jobDetailsContainer.dataset.jobId);
    }
    
    // Carregar perfil do candidato se estiver na página de perfil
    const candidateProfileContainer = document.getElementById('candidate-profile-container');
    if (candidateProfileContainer && api.auth.isAuthenticated() && api.auth.hasRole('ROLE_CANDIDATE')) {
        loadCandidateProfile();
    }
    
    // Carregar perfil da empresa se estiver na página de perfil
    const companyProfileContainer = document.getElementById('company-profile-container');
    if (companyProfileContainer && api.auth.isAuthenticated() && api.auth.hasRole('ROLE_COMPANY')) {
        loadCompanyProfile();
    }
    
    // Configurar botão de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            api.auth.logout();
            window.location.href = 'index.html';
        });
    }
});

// Atualizar UI baseado no estado de autenticação
function updateAuthUI() {
    const isAuthenticated = api.auth.isAuthenticated();
    const currentUser = api.auth.getCurrentUser();
    
    // Elementos que devem ser mostrados apenas quando logado
    const authElements = document.querySelectorAll('.auth-only');
    // Elementos que devem ser mostrados apenas quando não logado
    const guestElements = document.querySelectorAll('.guest-only');
    // Elementos específicos para candidatos
    const candidateElements = document.querySelectorAll('.candidate-only');
    // Elementos específicos para empresas
    const companyElements = document.querySelectorAll('.company-only');
    // Elementos específicos para admin
    const adminElements = document.querySelectorAll('.admin-only');
    
    // Atualizar visibilidade baseado no estado de autenticação
    authElements.forEach(el => el.style.display = isAuthenticated ? 'block' : 'none');
    guestElements.forEach(el => el.style.display = isAuthenticated ? 'none' : 'block');
    
    // Atualizar visibilidade baseado no tipo de usuário
    if (isAuthenticated && currentUser && Array.isArray(currentUser.roles)) {
        const isCandidate = currentUser.roles.includes('ROLE_CANDIDATE');
        const isCompany = currentUser.roles.includes('ROLE_COMPANY');
        const isAdmin = currentUser.roles.includes('ROLE_ADMIN');
        
        candidateElements.forEach(el => el.style.display = isCandidate ? 'block' : 'none');
        companyElements.forEach(el => el.style.display = isCompany ? 'block' : 'none');
        adminElements.forEach(el => el.style.display = isAdmin ? 'block' : 'none');
        
        // Atualizar nome do usuário se o elemento existir
        const userNameElement = document.getElementById('user-name');
        if (userNameElement && currentUser) {
            // Tenta mostrar nome completo, senão username
            if (currentUser.first_name && currentUser.last_name) {
                userNameElement.textContent = `${currentUser.first_name} ${currentUser.last_name}`;
            } else if (currentUser.username) {
                userNameElement.textContent = currentUser.username;
            } else if (currentUser.email) {
                userNameElement.textContent = currentUser.email;
            } else {
                userNameElement.textContent = 'Usuário';
            }
        }
    } else {
        candidateElements.forEach(el => el.style.display = 'none');
        companyElements.forEach(el => el.style.display = 'none');
        adminElements.forEach(el => el.style.display = 'none');
    }
}

// Função para verificar permissões de acesso
function checkAccess() {
    const isAuthenticated = api.auth.isAuthenticated();
    const currentUser = api.auth.getCurrentUser();
    const currentPage = window.location.pathname.split('/').pop();

    if (!isAuthenticated) {
        window.location.href = 'login.html';
        return;
    }

    if (currentPage === 'candidate-dashboard.html' || currentPage === 'candidate-profile.html') {
        if (!currentUser.roles.includes('ROLE_CANDIDATE')) {
            window.location.href = 'company-dashboard.html';
        }
    } else if (currentPage === 'company-dashboard.html' || currentPage === 'company-profile.html') {
        if (!currentUser.roles.includes('ROLE_COMPANY')) {
            window.location.href = 'candidate-dashboard.html';
        }
    }
}

// Manipular busca de vagas
async function handleJobSearch(e) {
    e.preventDefault();
    
    const keyword = document.getElementById('search-keyword').value;
    const location = document.getElementById('search-location').value;
    const category = document.getElementById('search-category').value;
    const jobType = document.getElementById('search-job-type').value;
    
    try {
        let result;
        
        if (keyword) {
            result = await api.jobs.search(keyword);
        } else {
            result = await api.jobs.filter(location, category, jobType);
        }
        
        if (result.success) {
            const jobListingsContainer = document.getElementById('job-listings');
            
            if (jobListingsContainer) {
                if (result.data.length === 0) {
                    jobListingsContainer.innerHTML = '<div class="no-jobs">Nenhuma vaga encontrada com os critérios informados.</div>';
                    return;
                }
                
                let html = '';
                
                result.data.forEach(job => {
                    html += `
                        <div class="job-card">
                            <div class="job-card-header">
                                <h3 class="job-title">${job.title}</h3>
                                <span class="job-company">${job.company.name}</span>
                            </div>
                            <div class="job-card-body">
                                <p class="job-location"><i class="fas fa-map-marker-alt"></i> ${job.location}</p>
                                <p class="job-type"><i class="fas fa-briefcase"></i> ${job.jobType}</p>
                                <p class="job-salary"><i class="fas fa-money-bill-wave"></i> ${job.minSalary ? `${job.minSalary} - ${job.maxSalary} ${job.currency}` : 'Salário não informado'}</p>
                            </div>
                            <div class="job-card-footer">
                                <a href="job-details.html?id=${job.id}" class="btn btn-primary">Ver Detalhes</a>
                            </div>
                        </div>
                    `;
                });
                
                jobListingsContainer.innerHTML = html;
            }
        } else {
            showNotification('Erro ao buscar vagas.', 'error');
        }
    } catch (error) {
        api.handleApiError(error);
    }
}

// Carregar vagas
async function loadJobs() {
    try {
        const result = await api.jobs.getAll();
        
        if (result.success) {
            const featuredJobsContainer = document.getElementById('featured-jobs');
            const jobListingsContainer = document.getElementById('job-listings');
            const container = featuredJobsContainer || jobListingsContainer;
            if (container) {
                if (!Array.isArray(result.data) || result.data.length === 0) {
                    container.innerHTML = '<div class="no-jobs">Nenhuma vaga disponível no momento.</div>';
                    return;
                }
                let html = '';
                result.data.forEach(job => {
                    html += `
                        <div class="job-card">
                            <div class="job-card-header">
                                <h3 class="job-title">${job.title}</h3>
                                <span class="job-company">${job.company.name}</span>
                            </div>
                            <div class="job-card-body">
                                <p class="job-location"><i class="fas fa-map-marker-alt"></i> ${job.location}</p>
                                <p class="job-type"><i class="fas fa-briefcase"></i> ${job.jobType}</p>
                                <p class="job-salary"><i class="fas fa-money-bill-wave"></i> ${job.minSalary ? `${job.minSalary} - ${job.maxSalary} ${job.currency}` : 'Salário não informado'}</p>
                            </div>
                            <div class="job-card-footer">
                                <a href="job-details.html?id=${job.id}" class="btn btn-primary">Ver Detalhes</a>
                            </div>
                        </div>
                    `;
                });
                
                container.innerHTML = html;
            }
        } else {
            showNotification('Erro ao carregar vagas.', 'error');
        }
    } catch (error) {
        api.handleApiError(error);
    }
}

// Carregar detalhes da vaga
async function loadJobDetails(jobId) {
    try {
        const result = await api.jobs.getById(jobId);
        
        if (result.success) {
            const job = result.data;
            const container = document.getElementById('job-details-container');
            
            if (container) {
                container.innerHTML = `
                    <div class="job-header">
                        <h1 class="job-title">${job.title}</h1>
                        <div class="company-info">
                            <img src="${job.company.logo || 'images/company-placeholder.png'}" alt="${job.company.name}" class="company-logo">
                            <div>
                                <h3 class="company-name">${job.company.name}</h3>
                                <p class="company-location">${job.location}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="job-meta">
                        <div class="meta-item">
                            <i class="fas fa-briefcase"></i>
                            <span>${job.jobType}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-graduation-cap"></i>
                            <span>${job.experienceLevel}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-money-bill-wave"></i>
                            <span>${job.minSalary ? `${job.minSalary} - ${job.maxSalary} ${job.currency}` : 'Salário não informado'}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>Publicado em: ${new Date(job.postedDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                    
                    <div class="job-description">
                        <h2>Descrição da Vaga</h2>
                        <p>${job.description}</p>
                    </div>
                    
                    <div class="job-requirements">
                        <h2>Requisitos</h2>
                        <ul>
                            ${job.requirements.map(req => `<li>${req}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="job-skills">
                        <h2>Habilidades</h2>
                        <div class="skills-container">
                            ${job.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                    
                    <div class="job-benefits">
                        <h2>Benefícios</h2>
                        <ul>
                            ${job.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="job-apply">
                        <button id="apply-btn" class="btn btn-primary btn-lg candidate-only">Candidatar-se</button>
                        <p class="guest-only">Faça <a href="login.html">login</a> para se candidatar a esta vaga.</p>
                    </div>
                `;
                
                // Atualizar UI baseado no estado de autenticação
                updateAuthUI();
                
                // Configurar botão de candidatura
                const applyBtn = document.getElementById('apply-btn');
                if (applyBtn) {
                    applyBtn.addEventListener('click', () => handleJobApplication(job.id));
                }
            }
        } else {
            showNotification('Erro ao carregar detalhes da vaga.', 'error');
        }
    } catch (error) {
        api.handleApiError(error);
    }
}

// Manipular candidatura a vaga
async function handleJobApplication(jobId) {
    if (!api.auth.isAuthenticated()) {
        showNotification('Você precisa estar logado para se candidatar.', 'error');
        return;
    }
    
    const currentUser = api.auth.getCurrentUser();
    
    try {
        // Buscar perfil do candidato
        const candidateResult = await api.candidates.getByUserId(currentUser.id);
        
        if (!candidateResult.success) {
            showNotification('Você precisa completar seu perfil antes de se candidatar.', 'warning');
            setTimeout(() => {
                window.location.href = 'candidate-profile.html';
            }, 2000);
            return;
        }
        
        const candidateId = candidateResult.data.id;
        
        // Criar modal para confirmação e cover letter
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Candidatar-se à Vaga</h2>
                <form id="application-form">
                    <div class="form-group">
                        <label for="cover-letter">Carta de Apresentação</label>
                        <textarea id="cover-letter" rows="6" placeholder="Descreva por que você é um bom candidato para esta vaga..."></textarea>
                    </div>
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary">Enviar Candidatura</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // Fechar modal ao clicar no X
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Manipular envio do formulário
        const applicationForm = document.getElementById('application-form');
        applicationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const coverLetter = document.getElementById('cover-letter').value;
            
            const applicationData = {
                job: { id: jobId },
                candidate: { id: candidateId },
                coverLetter: coverLetter
            };
            
            try {
                const result = await api.applications.apply(applicationData);
                
                if (result.success) {
                    document.body.removeChild(modal);
                    showNotification('Candidatura enviada com sucesso!', 'success');
                } else {
                    showNotification(result.message || 'Erro ao enviar candidatura.', 'error');
                }
            } catch (error) {
                api.handleApiError(error);
            }
        });
    } catch (error) {
        api.handleApiError(error);
    }
}

// Carregar perfil do candidato
async function loadCandidateProfile() {
    const currentUser = api.auth.getCurrentUser();
    
    try {
        const result = await api.candidates.getByUserId(currentUser.id);
        
        if (result.success) {
            // Perfil já existe, preencher formulário
            const candidate = result.data;
            
            // Atualizar informações básicas
            document.getElementById('candidate-title').value = candidate.title || '';
            document.getElementById('candidate-summary').value = candidate.summary || '';
            document.getElementById('candidate-location').value = candidate.location || '';
            
            // Atualizar informações básicas no topo do perfil
            if (document.getElementById('candidate-name')) {
                document.getElementById('candidate-name').textContent =
                    (candidate.first_name && candidate.last_name)
                        ? `${candidate.first_name} ${candidate.last_name}`
                        : (candidate.username || '');
            }
            if (document.getElementById('candidate-title')) {
                document.getElementById('candidate-title').textContent = candidate.title || '';
            }
            if (document.getElementById('candidate-location')) {
                document.getElementById('candidate-location').textContent = candidate.location || '';
            }
            if (document.getElementById('candidate-email')) {
                document.getElementById('candidate-email').textContent = candidate.email || '';
            }
            if (document.getElementById('candidate-phone')) {
                document.getElementById('candidate-phone').textContent = candidate.phone || '';
            }
            
            // Atualizar estatísticas
            const statsResult = await api.candidates.getStats();
            if (statsResult.success) {
                const stats = statsResult.success;
                document.getElementById('total-applications').textContent = stats.totalApplications || 0;
                document.getElementById('profile-views').textContent = stats.profileViews || 0;
                document.getElementById('saved-jobs').textContent = stats.savedJobs || 0;
            }
            
            // Carregar candidaturas recentes
            const applicationsResult = await api.candidates.getRecentApplications();
            if (applicationsResult.success) {
                const container = document.getElementById('recent-applications');
                if (container) {
                    if (applicationsResult.data.length === 0) {
                        container.innerHTML = '<p class="no-data">Nenhuma candidatura recente.</p>';
                    } else {
                        let html = '';
                        applicationsResult.data.forEach(application => {
                            html += `
                                <div class="application-item">
                                    <div class="application-info">
                                        <h4>${application.job.title}</h4>
                                        <p>${application.job.company.name}</p>
                                        <span class="application-date">Candidatura em: ${new Date(application.appliedDate).toLocaleDateString()}</span>
                                    </div>
                                    <div class="application-status ${application.status.toLowerCase()}">
                                        ${application.status}
                                    </div>
                                </div>
                            `;
                        });
                        container.innerHTML = html;
                    }
                }
            }
            
            // Carregar vagas recomendadas
            const recommendedResult = await api.jobs.getRecommended();
            if (recommendedResult.success) {
                const container = document.getElementById('recommended-jobs');
                if (container) {
                    if (recommendedResult.data.length === 0) {
                        container.innerHTML = '<p class="no-data">Nenhuma vaga recomendada no momento.</p>';
                    } else {
                        let html = '';
                        recommendedResult.data.forEach(job => {
                            html += `
                                <div class="job-card">
                                    <div class="job-card-header">
                                        <h4>${job.title}</h4>
                                        <p>${job.company.name}</p>
                                    </div>
                                    <div class="job-card-body">
                                        <p><i class="fas fa-map-marker-alt"></i> ${job.location}</p>
                                        <p><i class="fas fa-briefcase"></i> ${job.jobType}</p>
                                    </div>
                                    <div class="job-card-footer">
                                        <a href="job-details.html?id=${job.id}" class="btn btn-outline">Ver Detalhes</a>
                                    </div>
                                </div>
                            `;
                        });
                        container.innerHTML = html;
                    }
                }
            }
            
            // Preencher habilidades
            if (candidate.skills && candidate.skills.length > 0) {
                const skillsContainer = document.getElementById('skills-container');
                if (skillsContainer) {
                    candidate.skills.forEach(skill => {
                        addSkillTag(skill);
                    });
                }
            }
            
            // Configurar botão de atualização
            const updateProfileBtn = document.getElementById('update-profile-btn');
            if (updateProfileBtn) {
                updateProfileBtn.textContent = 'Atualizar Perfil';
                updateProfileBtn.dataset.candidateId = candidate.id;
            }
        } else {
            // Perfil não existe, configurar para criação
            const createProfileBtn = document.getElementById('update-profile-btn');
            if (createProfileBtn) {
                createProfileBtn.textContent = 'Criar Perfil';
            }
        }
        
        // Configurar formulário de perfil
        const profileForm = document.getElementById('candidate-profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', handleCandidateProfileSubmit);
        }
        
        // Configurar adição de habilidades
        const addSkillBtn = document.getElementById('add-skill-btn');
        const skillInput = document.getElementById('skill-input');
        
        if (addSkillBtn && skillInput) {
            addSkillBtn.addEventListener('click', () => {
                const skill = skillInput.value.trim();
                if (skill) {
                    addSkillTag(skill);
                    skillInput.value = '';
                }
            });
        }
    } catch (error) {
        api.handleApiError(error);
    }
}

// Adicionar tag de habilidade
function addSkillTag(skill) {
    const skillsContainer = document.getElementById('skills-container');
    
    if (skillsContainer) {
        const skillTag = document.createElement('div');
        skillTag.className = 'skill-tag';
        skillTag.innerHTML = `
            ${skill}
            <span class="remove-skill">&times;</span>
        `;
        
        skillsContainer.appendChild(skillTag);
        
        // Configurar remoção da tag
        const removeBtn = skillTag.querySelector('.remove-skill');
        removeBtn.addEventListener('click', () => {
            skillsContainer.removeChild(skillTag);
        });
    }
}

// Manipular envio do formulário de perfil do candidato
async function handleCandidateProfileSubmit(e) {
    e.preventDefault();
    
    const currentUser = api.auth.getCurrentUser();
    const title = document.getElementById('candidate-title').value;
    const summary = document.getElementById('candidate-summary').value;
    const location = document.getElementById('candidate-location').value;
    
    // Coletar habilidades
    const skillTags = document.querySelectorAll('.skill-tag');
    const skills = Array.from(skillTags).map(tag => tag.textContent.trim().replace('×', '').trim());
    
    const candidateData = {
        user: { id: currentUser.id },
        title,
        summary,
        location,
        skills
    };
    
    try {
        let result;
        const updateBtn = document.getElementById('update-profile-btn');
        
        if (updateBtn.dataset.candidateId) {
            // Atualizar perfil existente
            candidateData.id = updateBtn.dataset.candidateId;
            result = await api.candidates.update(candidateData.id, candidateData);
        } else {
            // Criar novo perfil
            result = await api.candidates.create(candidateData);
        }
        
        if (result.success) {
            showNotification('Perfil salvo com sucesso!', 'success');
            
            // Atualizar botão se for criação
            if (!updateBtn.dataset.candidateId && result.data) {
                updateBtn.dataset.candidateId = result.data.id;
                updateBtn.textContent = 'Atualizar Perfil';
            }
        } else {
            showNotification(result.message || 'Erro ao salvar perfil.', 'error');
        }
    } catch (error) {
        api.handleApiError(error);
    }
}

// Funções para gerenciar perfil do candidato
async function updateCandidateProfile(profileData) {
    try {
        const result = await api.candidates.updateProfile(profileData);
        if (result.success) {
            showNotification('Perfil atualizado com sucesso!', 'success');
            loadCandidateProfile(); // Recarregar dados do perfil
        } else {
            showNotification('Erro ao atualizar perfil', 'error');
        }
    } catch (error) {
        showNotification('Erro ao atualizar perfil', 'error');
        console.error('Erro ao atualizar perfil:', error);
    }
}

async function updateCandidateEducation(educationData) {
    try {
        const result = await api.candidates.updateEducation(educationData);
        if (result.success) {
            showNotification('Formação acadêmica atualizada com sucesso!', 'success');
            loadCandidateProfile();
        } else {
            showNotification('Erro ao atualizar formação acadêmica', 'error');
        }
    } catch (error) {
        showNotification('Erro ao atualizar formação acadêmica', 'error');
        console.error('Erro ao atualizar formação acadêmica:', error);
    }
}

async function updateCandidateExperience(experienceData) {
    try {
        const result = await api.candidates.updateExperience(experienceData);
        if (result.success) {
            showNotification('Experiência profissional atualizada com sucesso!', 'success');
            loadCandidateProfile();
        } else {
            showNotification('Erro ao atualizar experiência profissional', 'error');
        }
    } catch (error) {
        showNotification('Erro ao atualizar experiência profissional', 'error');
        console.error('Erro ao atualizar experiência profissional:', error);
    }
}

async function updateCandidateSkills(skills) {
    try {
        const result = await api.candidates.updateSkills(skills);
        if (result.success) {
            showNotification('Habilidades atualizadas com sucesso!', 'success');
            loadCandidateProfile();
        } else {
            showNotification('Erro ao atualizar habilidades', 'error');
        }
    } catch (error) {
        showNotification('Erro ao atualizar habilidades', 'error');
        console.error('Erro ao atualizar habilidades:', error);
    }
}

// Carregar perfil da empresa
async function loadCompanyProfile() {
    const currentUser = api.auth.getCurrentUser();
    
    try {
        const result = await api.companies.getByUserId(currentUser.id);
        
        if (result.success) {
            const company = result.data;
            
            // Atualizar informações básicas
            document.getElementById('company-name').value = company.name || '';
            document.getElementById('company-industry').value = company.industry || '';
            document.getElementById('company-description').value = company.description || '';
            document.getElementById('company-location').value = company.location || '';
            
            // Atualizar informações básicas no topo do perfil da empresa
            if (document.getElementById('company-name')) {
                document.getElementById('company-name').textContent = company.name || '';
            }
            if (document.getElementById('company-industry')) {
                document.getElementById('company-industry').textContent = company.industry || '';
            }
            if (document.getElementById('company-location')) {
                document.getElementById('company-location').textContent = company.location || '';
            }
            if (document.getElementById('company-size')) {
                document.getElementById('company-size').textContent = company.size || '';
            }
            if (document.getElementById('company-website')) {
                document.getElementById('company-website').textContent = company.website || '';
            }

            // Atualizar estatísticas
            const statsResult = await api.companies.getStats();
            if (statsResult.success) {
                const stats = statsResult.data;
                document.getElementById('active-jobs').textContent = stats.activeJobs || 0;
                document.getElementById('total-applications').textContent = stats.totalApplications || 0;
                document.getElementById('profile-views').textContent = stats.profileViews || 0;
            }
            
            // Carregar vagas ativas
            const jobsResult = await api.companies.getActiveJobs();
            if (jobsResult.success) {
                const jobsList = document.getElementById('active-jobs-list');
                jobsList.innerHTML = jobsResult.data.map(job => `
                    <div class="job-item">
                        <h4>${job.title}</h4>
                        <div class="job-meta">
                            <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                            <span><i class="fas fa-clock"></i> ${job.type}</span>
                            <span><i class="fas fa-users"></i> ${job.applications} candidaturas</span>
                        </div>
                        <div class="job-actions">
                            <button onclick="editJob(${job.id})" class="btn btn-outline">Editar</button>
                            <button onclick="viewApplications(${job.id})" class="btn btn-primary">Ver Candidaturas</button>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        showNotification('Erro ao carregar perfil da empresa', 'error');
        console.error('Erro ao carregar perfil da empresa:', error);
    }
}

// Funções para gerenciar vagas
async function createJob(jobData) {
    try {
        const result = await api.jobs.create(jobData);
        if (result.success) {
            showNotification('Vaga publicada com sucesso!', 'success');
            loadCompanyProfile();
        } else {
            showNotification('Erro ao publicar vaga', 'error');
        }
    } catch (error) {
        showNotification('Erro ao publicar vaga', 'error');
        console.error('Erro ao publicar vaga:', error);
    }
}

async function updateJob(jobId, jobData) {
    try {
        const result = await api.jobs.update(jobId, jobData);
        if (result.success) {
            showNotification('Vaga atualizada com sucesso!', 'success');
            loadCompanyProfile();
        } else {
            showNotification('Erro ao atualizar vaga', 'error');
        }
    } catch (error) {
        showNotification('Erro ao atualizar vaga', 'error');
        console.error('Erro ao atualizar vaga:', error);
    }
}

async function deleteJob(jobId) {
    try {
        const result = await api.jobs.delete(jobId);
        if (result.success) {
            showNotification('Vaga removida com sucesso!', 'success');
            loadCompanyProfile();
        } else {
            showNotification('Erro ao remover vaga', 'error');
        }
    } catch (error) {
        showNotification('Erro ao remover vaga', 'error');
        console.error('Erro ao remover vaga:', error);
    }
}

// Funções para gerenciar candidaturas
async function viewApplications(jobId) {
    try {
        const result = await api.applications.getByJob(jobId);
        if (result.success) {
            const applications = result.data;
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>Candidaturas para a Vaga</h2>
                    <div class="applications-list">
                        ${applications.map(app => `
                            <div class="application-item">
                                <div class="candidate-info">
                                    <h4>${app.candidate.user.firstName} ${app.candidate.user.lastName}</h4>
                                    <p>${app.candidate.title}</p>
                                </div>
                                <div class="application-status ${app.status.toLowerCase()}">
                                    ${app.status}
                                </div>
                                <div class="application-actions">
                                    <button onclick="viewCandidateProfile(${app.candidate.id})" class="btn btn-outline">Ver Perfil</button>
                                    <button onclick="updateApplicationStatus(${app.id}, 'reviewing')" class="btn btn-primary">Em Análise</button>
                                    <button onclick="updateApplicationStatus(${app.id}, 'interview')" class="btn btn-primary">Entrevista</button>
                                    <button onclick="updateApplicationStatus(${app.id}, 'rejected')" class="btn btn-danger">Recusar</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.style.display = 'block';
            
            // Fechar modal
            const closeBtn = modal.querySelector('.close');
            closeBtn.onclick = function() {
                modal.remove();
            };
        }
    } catch (error) {
        showNotification('Erro ao carregar candidaturas', 'error');
        console.error('Erro ao carregar candidaturas:', error);
    }
}

async function updateApplicationStatus(applicationId, status) {
    try {
        const result = await api.applications.updateStatus(applicationId, status);
        if (result.success) {
            showNotification('Status da candidatura atualizado com sucesso!', 'success');
            viewApplications(result.data.jobId);
        } else {
            showNotification('Erro ao atualizar status da candidatura', 'error');
        }
    } catch (error) {
        showNotification('Erro ao atualizar status da candidatura', 'error');
        console.error('Erro ao atualizar status da candidatura:', error);
    }
}

// Exibir perfil do candidato
async function showCandidateProfile(candidateId) {
    try {
        const result = await api.candidates.getById(candidateId);
        
        if (result.success) {
            const candidate = result.data;
            
            // Criar modal para exibir perfil
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content candidate-profile-modal">
                    <span class="close">&times;</span>
                    <div class="candidate-header">
                        <div class="candidate-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="candidate-info">
                            <h2>${candidate.user.firstName} ${candidate.user.lastName}</h2>
                            <p class="candidate-title">${candidate.title}</p>
                            <p class="candidate-location"><i class="fas fa-map-marker-alt"></i> ${candidate.location}</p>
                            <p class="candidate-contact"><i class="fas fa-envelope"></i> ${candidate.user.email}</p>
                            <p class="candidate-contact"><i class="fas fa-phone"></i> ${candidate.user.phone}</p>
                        </div>
                    </div>
                    
                    <div class="candidate-section">
                        <h3>Resumo</h3>
                        <p>${candidate.summary}</p>
                    </div>
                    
                    <div class="candidate-section">
                        <h3>Habilidades</h3>
                        <div class="skills-container">
                            ${candidate.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                    
                    ${candidate.experience && candidate.experience.length > 0 ? `
                        <div class="candidate-section">
                            <h3>Experiência</h3>
                            <div class="experience-list">
                                ${candidate.experience.map(exp => `
                                    <div class="experience-item">
                                        <h4>${exp.title}</h4>
                                        <p class="company-name">${exp.company}</p>
                                        <p class="date-range">${formatDate(exp.startDate)} - ${exp.current ? 'Presente' : formatDate(exp.endDate)}</p>
                                        <p>${exp.description}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${candidate.education && candidate.education.length > 0 ? `
                        <div class="candidate-section">
                            <h3>Educação</h3>
                            <div class="education-list">
                                ${candidate.education.map(edu => `
                                    <div class="education-item">
                                        <h4>${edu.degree}</h4>
                                        <p class="institution">${edu.institution}</p>
                                        <p class="field">${edu.field}</p>
                                        <p class="date-range">${formatDate(edu.startDate)} - ${edu.current ? 'Presente' : formatDate(edu.endDate)}</p>
                                        <p>${edu.description}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${candidate.languages && candidate.languages.length > 0 ? `
                        <div class="candidate-section">
                            <h3>Idiomas</h3>
                            <div class="languages-list">
                                ${candidate.languages.map(lang => `
                                    <div class="language-item">
                                        <span class="language-name">${lang.name}</span>
                                        <span class="language-level">${lang.level}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
            
            document.body.appendChild(modal);
            modal.style.display = 'block';
            
            // Fechar modal ao clicar no X
            const closeBtn = modal.querySelector('.close');
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        } else {
            showNotification('Erro ao carregar perfil do candidato.', 'error');
        }
    } catch (error) {
        api.handleApiError(error);
    }
}

// Formatar data
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Exibir notificação
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = message;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

// Menu responsivo para navegação mobile
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mainNav = document.querySelector('.main-nav');

if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener('click', function() {
        mainNav.classList.toggle('active');
    });
    // Fechar menu ao clicar em um link (opcional)
    mainNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                mainNav.classList.remove('active');
            }
        });
    });
}
