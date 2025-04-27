document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.getElementById('login-button');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    
    loginButton.addEventListener('click', function() {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!email || !password) {
            errorMessage.textContent = 'Por favor, preencha todos os campos.';
            return;
        }
        
        errorMessage.textContent = '';
        loginButton.textContent = 'Entrando...';
        loginButton.disabled = true;
        
        fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                // Salvar token no localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Redirecionar para dashboard (simulado)
                window.location.href = '/dashboard.html';
            } else {
                errorMessage.textContent = data.msg || 'Erro ao fazer login. Tente novamente.';
                loginButton.textContent = 'Entrar';
                loginButton.disabled = false;
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            errorMessage.textContent = 'Erro ao conectar com o servidor. Tente novamente.';
            loginButton.textContent = 'Entrar';
            loginButton.disabled = false;
        });
    });
    
    // Permitir login com Enter
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginButton.click();
        }
    });
});
