// API Integration for MyJob Frontend
const API_URL = 'http://localhost:8000/api/v1';
let authToken = localStorage.getItem('authToken');

// Authentication functions
const auth = {
    login: async (username, password) => {
        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);
            
            const response = await fetch(`${API_URL}/auth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Get user data after successful login
                const userResponse = await fetch(`${API_URL}/users/me`, {
                    headers: {
                        'Authorization': `Bearer ${data.access_token}`
                    }
                });
                
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    localStorage.setItem('authToken', data.access_token);
                    localStorage.setItem('user', JSON.stringify(userData));
                    authToken = data.access_token;
                    return { success: true, data: userData };
                } else {
                    return { success: false, message: 'Erro ao obter dados do usuário' };
                }
            } else {
                return { success: false, message: data.detail || 'Falha no login' };
            }
        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },
    
    register: async (userData) => {
        try {
            console.log('Sending registration data:', userData);
            const response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            console.log('Registration response:', data);
            
            if (!response.ok) {
                // Handle validation errors
                if (data.detail && Array.isArray(data.detail)) {
                    const errorMessages = data.detail.map(error => {
                        if (error.loc && error.msg) {
                            const field = error.loc[error.loc.length - 1];
                            return `${field}: ${error.msg}`;
                        }
                        return error.msg || error;
                    }).join('\n');
                    return { success: false, message: errorMessages };
                }
                return { success: false, message: data.detail || 'Erro ao registrar usuário' };
            }
            
            return {
                success: true,
                message: data.message,
                data: data
            };
        } catch (error) {
            console.error('Erro no registro:', error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },
    
    logout: async () => {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
        } catch (error) {
            console.error('Erro no logout:', error);
        } finally {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            authToken = null;
            window.location.href = 'login.html';
        }
    },
    
    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },
    
    isAuthenticated: () => {
        return !!authToken;
    },
    
    hasRole: (role) => {
        const user = auth.getCurrentUser();
        return user && user.roles && user.roles.includes(role);
    }
};

// Job functions
const jobs = {
    getAll: async () => {
        try {
            const response = await fetch(`${API_URL}/jobs/`);
            const data = await response.json();
            return { success: response.ok, data: response.ok ? data : null };
        } catch (error) {
            console.error('Erro ao buscar vagas:', error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },
    
    getById: async (id) => {
        try {
            const response = await fetch(`${API_URL}/jobs/${id}`);
            const data = await response.json();
            return { success: response.ok, data: response.ok ? data : null };
        } catch (error) {
            console.error(`Erro ao buscar vaga ${id}:`, error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },
    
    search: async (keyword) => {
        try {
            const response = await fetch(`${API_URL}/jobs/search?keyword=${encodeURIComponent(keyword)}`);
            const data = await response.json();
            return { success: response.ok, data: response.ok ? data : null };
        } catch (error) {
            console.error('Erro na busca de vagas:', error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },
    
    filter: async (location, category, jobType) => {
        let url = `${API_URL}/jobs/filter?`;
        if (location) url += `location=${encodeURIComponent(location)}&`;
        if (category) url += `category=${encodeURIComponent(category)}&`;
        if (jobType) url += `jobType=${encodeURIComponent(jobType)}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            return { success: response.ok, data: response.ok ? data : null };
        } catch (error) {
            console.error('Erro ao filtrar vagas:', error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },
    
    create: async (jobData) => {
        if (!authToken) return { success: false, message: 'Usuário não autenticado' };
        
        try {
            const response = await fetch(`${API_URL}/jobs/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(jobData)
            });
            
            const data = await response.json();
            return { success: response.ok, message: data.message, data: response.ok ? data : null };
        } catch (error) {
            console.error('Erro ao criar vaga:', error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },
    
    update: async (id, jobData) => {
        if (!authToken) return { success: false, message: 'Usuário não autenticado' };
        
        try {
            const response = await fetch(`${API_URL}/jobs/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(jobData)
            });
            
            const data = await response.json();
            return { success: response.ok, message: data.message, data: response.ok ? data : null };
        } catch (error) {
            console.error(`Erro ao atualizar vaga ${id}:`, error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },
    
    delete: async (id) => {
        if (!authToken) return { success: false, message: 'Usuário não autenticado' };
        
        try {
            const response = await fetch(`${API_URL}/jobs/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            const data = await response.json();
            return { success: response.ok, message: data.message };
        } catch (error) {
            console.error(`Erro ao excluir vaga ${id}:`, error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    }
};

// Company functions
const companies = {
    getAll: async () => {
        try {
            const response = await fetch(`${API_URL}/companies/`);
            const data = await response.json();
            return { success: response.ok, data: response.ok ? data : null };
        } catch (error) {
            console.error('Erro ao buscar empresas:', error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },
    
    getById: async (id) => {
        try {
            const response = await fetch(`${API_URL}/companies/${id}`);
            const data = await response.json();
            return { success: response.ok, data: response.ok ? data : null };
        } catch (error) {
            console.error(`Erro ao buscar empresa ${id}:`, error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },
    
    getByUserId: async (userId) => {
        if (!authToken) return { success: false, message: 'Usuário não autenticado' };
        
        try {
            const response = await fetch(`${API_URL}/companies/user/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            const data = await response.json();
            return { success: response.ok, data: response.ok ? data : null };
        } catch (error) {
            console.error(`Erro ao buscar empresa do usuário ${userId}:`, error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },
    
    create: async (companyData) => {
        if (!authToken) return { success: false, message: 'Usuário não autenticado' };
        
        try {
            const response = await fetch(`${API_URL}/companies/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(companyData)
            });
            
            const data = await response.json();
            return { success: response.ok, message: data.message, data: response.ok ? data : null };
        } catch (error) {
            console.error('Erro ao criar perfil de empresa:', error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },
    
    update: async (id, companyData) => {
        if (!authToken) return { success: false, message: 'Usuário não autenticado' };
        
        try {
            const response = await fetch(`${API_URL}/companies/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(companyData)
            });
            
            const data = await response.json();
            return { success: response.ok, message: data.message, data: response.ok ? data : null };
        } catch (error) {
            console.error(`Erro ao atualizar empresa ${id}:`, error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    }
};

// Candidate functions
const candidates = {
    getMyProfile: async () => {
        if (!authToken) return { success: false, message: 'Usuário não autenticado' };
        
        try {
            const response = await fetch(`${API_URL}/candidate-profiles/me`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            const data = await response.json();
            return { success: response.ok, data: response.ok ? data : null };
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },
    
    getById: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/candidate-profiles/${userId}`);
            const data = await response.json();
            return { success: response.ok, data: response.ok ? data : null };
        } catch (error) {
            console.error(`Erro ao buscar candidato ${userId}:`, error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },
    
    updateProfile: async (profileData) => {
        if (!authToken) return { success: false, message: 'Usuário não autenticado' };
        
        try {
            const response = await fetch(`${API_URL}/candidate-profiles/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(profileData)
            });
            
            const data = await response.json();
            return { success: response.ok, message: data.message, data: response.ok ? data : null };
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },
    
    addEducation: async (educationData) => {
        if (!authToken) return { success: false, message: 'Usuário não autenticado' };
        
        try {
            const response = await fetch(`${API_URL}/candidate-profiles/me/education`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(educationData)
            });
            
            const data = await response.json();
            return { success: response.ok, message: data.message, data: response.ok ? data : null };
        } catch (error) {
            console.error('Erro ao adicionar educação:', error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },
    
    addExperience: async (experienceData) => {
        if (!authToken) return { success: false, message: 'Usuário não autenticado' };
        
        try {
            const response = await fetch(`${API_URL}/candidate-profiles/me/experience`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(experienceData)
            });
            
            const data = await response.json();
            return { success: response.ok, message: data.message, data: response.ok ? data : null };
        } catch (error) {
            console.error('Erro ao adicionar experiência:', error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },

    async getByUserId(userId) {
        try {
            const response = await fetch(`${API_URL}/candidate-profiles/me`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            return await handleResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    },

    async updateProfile(profileData) {
        try {
            const response = await fetch(`${API_URL}/candidate-profiles/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(profileData)
            });
            return await handleResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    },

    async updateEducation(educationData) {
        try {
            const response = await fetch(`${API_URL}/candidate-profiles/me/education`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(educationData)
            });
            return await handleResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    },

    async updateExperience(experienceData) {
        try {
            const response = await fetch(`${API_URL}/candidate-profiles/me/experience`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(experienceData)
            });
            return await handleResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    },

    async updateSkills(skills) {
        try {
            const response = await fetch(`${API_URL}/candidate-profiles/me/skills`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ skills })
            });
            return await handleResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    },

    async getStats() {
        try {
            const response = await fetch(`${API_URL}/candidate-profiles/me/stats`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            return await handleResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    },

    async getRecentApplications() {
        try {
            const response = await fetch(`${API_URL}/applications/my-applications`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            return await handleResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    }
};

// Job Application functions
const applications = {
    getMyApplications: async () => {
        if (!authToken) return { success: false, message: 'Usuário não autenticado' };
        
        try {
            const response = await fetch(`${API_URL}/applications/my-applications`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            const data = await response.json();
            return { success: response.ok, data: response.ok ? data : null };
        } catch (error) {
            console.error('Erro ao buscar candidaturas:', error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },
    
    getJobApplications: async (jobId) => {
        if (!authToken) return { success: false, message: 'Usuário não autenticado' };
        
        try {
            const response = await fetch(`${API_URL}/applications/job/${jobId}/applications`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            const data = await response.json();
            return { success: response.ok, data: response.ok ? data : null };
        } catch (error) {
            console.error(`Erro ao buscar candidaturas da vaga ${jobId}:`, error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },
    
    apply: async (applicationData) => {
        if (!authToken) return { success: false, message: 'Usuário não autenticado' };
        
        try {
            const response = await fetch(`${API_URL}/applications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(applicationData)
            });
            
            const data = await response.json();
            return { success: response.ok, message: data.message, data: response.ok ? data : null };
        } catch (error) {
            console.error('Erro ao enviar candidatura:', error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },
    
    updateStatus: async (applicationId, status) => {
        if (!authToken) return { success: false, message: 'Usuário não autenticado' };
        
        try {
            const response = await fetch(`${API_URL}/applications/${applicationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ status })
            });
            
            const data = await response.json();
            return { success: response.ok, message: data.message, data: response.ok ? data : null };
        } catch (error) {
            console.error(`Erro ao atualizar status da candidatura ${applicationId}:`, error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },

    async getByJob(jobId) {
        try {
            const response = await fetch(`${API_URL}/applications/job/${jobId}/applications`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            return await handleResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    },

    async updateStatus(applicationId, status) {
        try {
            const response = await fetch(`${API_URL}/applications/${applicationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ status })
            });
            return await handleResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    }
};

// Error handling
const handleApiError = (error) => {
    console.error('API Error:', error);
    
    // Display error message to user
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.innerHTML = `
            <div class="alert alert-danger">
                <strong>Erro:</strong> ${error.message || 'Ocorreu um erro inesperado. Por favor, tente novamente.'}
            </div>
        `;
        errorContainer.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }
};

// Export API functions
const api = {
    auth,
    jobs,
    companies,
    candidates,
    applications,
    handleApiError
};
