/**
 * Authentication and Session Management
 */

async function checkAuth() {
    if (!supabaseClient) return;

    const path = window.location.pathname;
    const isLogin = path.includes('index.html') || path.endsWith('/pages/');
    const isView = path.includes('view.html');
    const isCreate = path.includes('create.html');
    const isDashboard = path.includes('dashboard.html');

    if (isView) return; // Viewers don't require session

    const { data: { session } } = await supabaseClient.auth.getSession();

    if (isDashboard || isCreate) {
        if (!session) {
            window.location.replace('index.html'); // Back to login
            return;
        }
        
        // Populate user info if elements exist
        const userEmailSpan = document.getElementById('user-email');
        if (userEmailSpan && session.user.email) {
            userEmailSpan.innerText = session.user.email;
            userEmailSpan.classList.remove('hidden');
        }
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.onclick = async () => {
                await supabaseClient.auth.signOut();
                window.location.replace('index.html');
            };
        }
    } else if (isLogin) {
        if (session) {
            window.location.replace('dashboard.html');
            return;
        }
    }
}

// Initialize Auth
document.addEventListener('DOMContentLoaded', checkAuth);

// Force session re-check on focus/visibility change
window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkAuth();
});
window.addEventListener('focus', checkAuth);

// Form Handlers
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('login-btn');
        const spinner = document.getElementById('login-spinner');
        const errorDiv = document.getElementById('login-error');
        
        btn.disabled = true;
        spinner.classList.remove('hidden');
        errorDiv.classList.add('hidden');
        
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        
        if (error) {
            errorDiv.innerText = error.message;
            errorDiv.classList.remove('hidden');
            btn.disabled = false;
            spinner.classList.add('hidden');
        } else {
            window.location.replace('dashboard.html');
        }
    });
}

const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const btn = document.getElementById('register-btn');
        const spinner = document.getElementById('register-spinner');
        const errorDiv = document.getElementById('register-error');
        
        btn.disabled = true;
        spinner.classList.remove('hidden');
        errorDiv.classList.add('hidden');
        
        const { error } = await supabaseClient.auth.signUp({ 
            email, password, options: { data: { full_name: name } }
        });
        
        if (error) {
            errorDiv.innerText = error.message;
            errorDiv.classList.remove('hidden');
            btn.disabled = false;
            spinner.classList.add('hidden');
        } else {
            window.location.replace('dashboard.html');
        }
    });
}
