// GitHub Profile Search Application
class GitHubProfileSearch {
    constructor() {
        this.apiBase = 'https://api.github.com';
        this.rateLimit = {
            remaining: 60,
            reset: 0
        };
        
        this.initializeElements();
        this.bindEvents();
        this.checkRateLimit();
    }

    initializeElements() {
        // Search elements
        this.usernameInput = document.getElementById('usernameInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        
        // Profile elements
        this.profileSection = document.getElementById('profileSection');
        this.profileImage = document.getElementById('profileImage');
        this.profileName = document.getElementById('profileName');
        this.profileUsername = document.getElementById('profileUsername');
        this.profileBio = document.getElementById('profileBio');
        this.followersCount = document.getElementById('followersCount');
        this.followingCount = document.getElementById('followingCount');
        this.reposCount = document.getElementById('reposCount');
        this.profileLocation = document.getElementById('profileLocation');
        this.profileWebsite = document.getElementById('profileWebsite');
        this.profileJoinDate = document.getElementById('profileJoinDate');
        this.profileCompany = document.getElementById('profileCompany');
        this.githubLink = document.getElementById('githubLink');
        this.viewReposBtn = document.getElementById('viewReposBtn');
        
        // Repositories elements
        this.reposSection = document.getElementById('reposSection');
        this.reposList = document.getElementById('reposList');
        
        // Suggestion buttons
        this.suggestionBtns = document.querySelectorAll('.suggestion-btn');
    }

    bindEvents() {
        // Search button click
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        
        // Enter key press in input
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
        
        // Input focus effects
        this.usernameInput.addEventListener('focus', () => {
            this.usernameInput.parentElement.classList.add('focused');
        });
        
        this.usernameInput.addEventListener('blur', () => {
            this.usernameInput.parentElement.classList.remove('focused');
        });
        
        // Suggestion buttons
        this.suggestionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const username = btn.getAttribute('data-username');
                this.usernameInput.value = username;
                this.handleSearch();
            });
        });
        
        // View repositories button
        this.viewReposBtn.addEventListener('click', () => this.toggleRepositories());
        
        // Animate elements on scroll
        this.observeElements();
    }

    async handleSearch() {
        const username = this.usernameInput.value.trim();
        
        if (!username) {
            this.showError('Please enter a GitHub username');
            return;
        }
        
        if (!this.checkRateLimit()) {
            this.showError('Rate limit exceeded. Please try again later.');
            return;
        }
        
        this.showLoading();
        this.hideError();
        this.hideProfile();
        
        try {
            const [profile, repos] = await Promise.all([
                this.fetchUserProfile(username),
                this.fetchUserRepositories(username)
            ]);
            
            this.displayProfile(profile, repos);
            this.hideLoading();
            
        } catch (error) {
            this.hideLoading();
            this.handleError(error);
        }
    }

    async fetchUserProfile(username) {
        const response = await fetch(`${this.apiBase}/users/${username}`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('User not found. Please check the username and try again.');
            } else if (response.status === 403) {
                throw new Error('API rate limit exceeded. Please try again later.');
            } else {
                throw new Error('Failed to fetch user profile. Please try again.');
            }
        }
        
        // Update rate limit info
        this.updateRateLimit(response.headers);
        
        return await response.json();
    }

    async fetchUserRepositories(username) {
        const response = await fetch(`${this.apiBase}/users/${username}/repos?sort=updated&per_page=6`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            console.warn('Failed to fetch repositories');
            return [];
        }
        
        return await response.json();
    }

    displayProfile(profile, repos) {
        // Profile image
        this.profileImage.src = profile.avatar_url;
        this.profileImage.alt = `${profile.name || profile.login}'s profile picture`;
        
        // Basic info
        this.profileName.textContent = profile.name || profile.login;
        this.profileUsername.textContent = `@${profile.login}`;
        this.profileBio.textContent = profile.bio || 'No bio available';
        
        // Stats
        this.followersCount.textContent = this.formatNumber(profile.followers);
        this.followingCount.textContent = this.formatNumber(profile.following);
        this.reposCount.textContent = this.formatNumber(profile.public_repos);
        
        // Details
        this.profileLocation.textContent = profile.location || 'Not specified';
        this.profileWebsite.textContent = profile.blog || 'Not specified';
        this.profileWebsite.href = profile.blog || '#';
        this.profileJoinDate.textContent = this.formatJoinDate(profile.created_at);
        this.profileCompany.textContent = profile.company || 'Not specified';
        
        // GitHub link
        this.githubLink.href = profile.html_url;
        
        // Store repos for later display
        this.currentRepos = repos;
        
        // Show profile with animation
        this.showProfile();
        
        // Add entrance animations
        this.animateProfileElements();
    }

    displayRepositories(repos) {
        if (!repos || repos.length === 0) {
            this.reposList.innerHTML = '<p class="no-repos">No repositories found</p>';
            return;
        }
        
        this.reposList.innerHTML = repos.map(repo => `
            <div class="repo-card">
                <div class="repo-header">
                    <a href="${repo.html_url}" target="_blank" class="repo-name">
                        ${repo.name}
                    </a>
                    <span class="repo-visibility ${repo.private ? 'private' : 'public'}">
                        ${repo.private ? 'Private' : 'Public'}
                    </span>
                </div>
                <p class="repo-description">${repo.description || 'No description available'}</p>
                <div class="repo-stats">
                    <div class="repo-stat">
                        <i class="fas fa-star"></i>
                        <span>${this.formatNumber(repo.stargazers_count)}</span>
                    </div>
                    <div class="repo-stat">
                        <i class="fas fa-code-branch"></i>
                        <span>${this.formatNumber(repo.forks_count)}</span>
                    </div>
                    <div class="repo-stat">
                        <i class="fas fa-circle"></i>
                        <span>${repo.language || 'No language'}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Animate repository cards
        this.animateRepositoryCards();
    }

    toggleRepositories() {
        if (this.reposSection.style.display === 'none' || !this.reposSection.style.display) {
            this.displayRepositories(this.currentRepos);
            this.reposSection.style.display = 'block';
            this.viewReposBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Repositories';
        } else {
            this.reposSection.style.display = 'none';
            this.viewReposBtn.innerHTML = '<i class="fas fa-folder-open"></i> View Repositories';
        }
    }

    showLoading() {
        this.loadingSpinner.classList.add('show');
        this.searchBtn.disabled = true;
        this.searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
    }

    hideLoading() {
        this.loadingSpinner.classList.remove('show');
        this.searchBtn.disabled = false;
        this.searchBtn.innerHTML = '<span class="btn-text">Search</span><i class="fas fa-arrow-right btn-icon"></i>';
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.classList.add('show');
        this.errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    hideError() {
        this.errorMessage.classList.remove('show');
    }

    showProfile() {
        this.profileSection.classList.add('show');
        this.profileSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    hideProfile() {
        this.profileSection.classList.remove('show');
    }

    handleError(error) {
        console.error('Error:', error);
        this.showError(error.message);
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatJoinDate(dateString) {
        const date = new Date(dateString);
        return `Joined ${date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
        })}`;
    }

    updateRateLimit(headers) {
        this.rateLimit.remaining = parseInt(headers.get('X-RateLimit-Remaining') || '0');
        this.rateLimit.reset = parseInt(headers.get('X-RateLimit-Reset') || '0');
    }

    checkRateLimit() {
        if (this.rateLimit.remaining <= 0) {
            const resetTime = new Date(this.rateLimit.reset * 1000);
            const now = new Date();
            if (now < resetTime) {
                return false;
            }
        }
        return true;
    }

    animateProfileElements() {
        const elements = [
            '.profile-header',
            '.profile-details',
            '.profile-actions'
        ];
        
        elements.forEach((selector, index) => {
            const element = document.querySelector(selector);
            if (element) {
                setTimeout(() => {
                    element.style.opacity = '0';
                    element.style.transform = 'translateY(20px)';
                    element.style.transition = 'all 0.6s ease-out';
                    
                    requestAnimationFrame(() => {
                        element.style.opacity = '1';
                        element.style.transform = 'translateY(0)';
                    });
                }, index * 200);
            }
        });
    }

    animateRepositoryCards() {
        const cards = document.querySelectorAll('.repo-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'all 0.4s ease-out';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    observeElements() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe elements for scroll animations
        const elementsToObserve = document.querySelectorAll('.profile-card, .repo-card');
        elementsToObserve.forEach(el => observer.observe(el));
    }

    // Utility method to add typing effect
    addTypingEffect(element, text, speed = 50) {
        element.textContent = '';
        let i = 0;
        
        const typeWriter = () => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, speed);
            }
        };
        
        typeWriter();
    }

    // Method to add search suggestions dynamically
    addSearchSuggestions() {
        const popularUsers = [
            'torvalds', 'gaearon', 'sindresorhus', 'addyosmani', 
            'jashkenas', 'substack', 'paulirish', 'mdo'
        ];
        
        const suggestionsContainer = document.querySelector('.search-suggestions');
        const existingSuggestions = suggestionsContainer.querySelectorAll('.suggestion-btn');
        
        // Remove existing suggestions except the first 3
        existingSuggestions.forEach((btn, index) => {
            if (index >= 3) {
                btn.remove();
            }
        });
        
        // Add more suggestions
        popularUsers.slice(3, 6).forEach(username => {
            const btn = document.createElement('button');
            btn.className = 'suggestion-btn';
            btn.setAttribute('data-username', username);
            btn.textContent = username;
            btn.addEventListener('click', () => {
                this.usernameInput.value = username;
                this.handleSearch();
            });
            suggestionsContainer.appendChild(btn);
        });
    }

    // Method to add keyboard shortcuts
    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.usernameInput.focus();
            }
            
            // Escape to clear search
            if (e.key === 'Escape') {
                this.usernameInput.value = '';
                this.hideProfile();
                this.hideError();
            }
        });
    }

    // Method to add search history
    addSearchHistory() {
        const history = JSON.parse(localStorage.getItem('github-search-history') || '[]');
        
        // Add current search to history
        const addToHistory = (username) => {
            if (!history.includes(username)) {
                history.unshift(username);
                if (history.length > 5) {
                    history.pop();
                }
                localStorage.setItem('github-search-history', JSON.stringify(history));
            }
        };
        
        // Show history in suggestions
        const showHistory = () => {
            if (history.length > 0) {
                const historyContainer = document.createElement('div');
                historyContainer.className = 'search-history';
                historyContainer.innerHTML = `
                    <span class="suggestion-label">Recent:</span>
                    ${history.map(username => 
                        `<button class="suggestion-btn history-btn" data-username="${username}">${username}</button>`
                    ).join('')}
                `;
                
                const suggestionsContainer = document.querySelector('.search-suggestions');
                suggestionsContainer.appendChild(historyContainer);
                
                // Add event listeners to history buttons
                historyContainer.querySelectorAll('.history-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const username = btn.getAttribute('data-username');
                        this.usernameInput.value = username;
                        this.handleSearch();
                    });
                });
            }
        };
        
        return { addToHistory, showHistory };
    }

    // Method to add theme toggle
    addThemeToggle() {
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        themeToggle.title = 'Toggle theme';
        
        const header = document.querySelector('.header .container');
        header.appendChild(themeToggle);
        
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            themeToggle.innerHTML = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    // Method to add copy to clipboard functionality
    addCopyToClipboard() {
        const copyButtons = document.querySelectorAll('.copy-btn');
        copyButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const text = btn.getAttribute('data-copy');
                try {
                    await navigator.clipboard.writeText(text);
                    btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => {
                        btn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy: ', err);
                }
            });
        });
    }

    // Method to add smooth scrolling
    addSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Method to add loading states for images
    addImageLoadingStates() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.addEventListener('load', () => {
                img.classList.add('loaded');
            });
            
            img.addEventListener('error', () => {
                img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                img.alt = 'Image not available';
            });
        });
    }

    // Method to add performance monitoring
    addPerformanceMonitoring() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
            });
        }
    }

    // Method to add error reporting
    addErrorReporting() {
        window.addEventListener('error', (e) => {
            console.error('JavaScript Error:', e.error);
            // In a real application, you might want to send this to an error reporting service
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled Promise Rejection:', e.reason);
            // In a real application, you might want to send this to an error reporting service
        });
    }

    // Method to add accessibility features
    addAccessibilityFeatures() {
        // Add ARIA labels
        this.usernameInput.setAttribute('aria-label', 'GitHub username input');
        this.searchBtn.setAttribute('aria-label', 'Search GitHub user');
        
        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    // Method to add offline support
    addOfflineSupport() {
        window.addEventListener('online', () => {
            this.showNotification('Connection restored!', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showNotification('You are offline. Some features may not work.', 'warning');
        });
    }

    // Method to show notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    // Method to add search analytics
    addSearchAnalytics() {
        const trackSearch = (username, success) => {
            const searchData = {
                username,
                success,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            };
            
            // In a real application, you might want to send this to an analytics service
            console.log('Search tracked:', searchData);
        };
        
        // Override handleSearch to include analytics
        const originalHandleSearch = this.handleSearch.bind(this);
        this.handleSearch = async () => {
            const username = this.usernameInput.value.trim();
            try {
                await originalHandleSearch();
                trackSearch(username, true);
            } catch (error) {
                trackSearch(username, false);
                throw error;
            }
        };
    }

    // Initialize all additional features
    initializeAdditionalFeatures() {
        this.addKeyboardShortcuts();
        this.addSearchHistory();
        this.addThemeToggle();
        this.addSmoothScrolling();
        this.addImageLoadingStates();
        this.addPerformanceMonitoring();
        this.addErrorReporting();
        this.addAccessibilityFeatures();
        this.addOfflineSupport();
        this.addSearchAnalytics();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new GitHubProfileSearch();
    app.initializeAdditionalFeatures();
    
    // Add some initial animations
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});

// Add CSS for additional features
const additionalStyles = `
    .theme-toggle {
        position: absolute;
        top: 20px;
        right: 20px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--space-2);
        color: var(--text-primary);
        cursor: pointer;
        transition: all var(--transition-normal);
    }
    
    .theme-toggle:hover {
        background: var(--primary-color);
        color: white;
    }
    
    .search-history {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-top: var(--space-3);
        flex-wrap: wrap;
    }
    
    .history-btn {
        background: var(--bg-primary);
        border: 1px solid var(--primary-color);
        color: var(--primary-color);
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--space-3) var(--space-4);
        display: flex;
        align-items: center;
        gap: var(--space-2);
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
    }
    
    .notification-success {
        border-color: var(--success-color);
        background: rgba(16, 185, 129, 0.1);
    }
    
    .notification-warning {
        border-color: var(--warning-color);
        background: rgba(245, 158, 11, 0.1);
    }
    
    .notification-close {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: var(--font-size-lg);
        margin-left: var(--space-2);
    }
    
    .keyboard-navigation *:focus {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
    }
    
    .loaded {
        animation: fadeIn 0.5s ease-out;
    }
    
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .light-theme {
        --bg-primary: #ffffff;
        --bg-secondary: #f8fafc;
        --bg-tertiary: #f1f5f9;
        --text-primary: #1e293b;
        --text-secondary: #475569;
        --text-muted: #64748b;
        --border-color: #e2e8f0;
        --border-light: #cbd5e1;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
            