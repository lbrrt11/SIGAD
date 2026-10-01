// 1. Pegamos as referências dos elementos que vamos usar no arquivo todo
const senhaInput = document.getElementById('senha');
const toggleSenha = document.getElementById('toggleSenha');
const olhoAberto = document.getElementById('olhoAberto');
const olhoFechado = document.getElementById('olhoFechado');

// 2. Lógica do "Olhinho" (Fica DE FORA do submit, para funcionar a qualquer momento)
if (toggleSenha && senhaInput) {
    toggleSenha.addEventListener('click', () => {
        const tipoAtual = senhaInput.getAttribute('type');
        
        if (tipoAtual === 'password') {
            // Mostra a senha e muda para o olho riscado
            senhaInput.setAttribute('type', 'text');
            olhoAberto.style.display = 'none';
            olhoFechado.style.display = 'block';
            toggleSenha.style.color = '#0056b3'; // Fica azulzinho
        } else {
            // Esconde a senha e volta para o olho normal
            senhaInput.setAttribute('type', 'password');
            olhoAberto.style.display = 'block';
            olhoFechado.style.display = 'none';
            toggleSenha.style.color = '#666'; // Volta pra cor cinza
        }
    });
}

// 3. Lógica de enviar o formulário para fazer Login
document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Impede a página de recarregar

    const loginInput = document.getElementById('login').value;
    const mensagemErro = document.getElementById('mensagemErro');
    const btnEntrar = document.getElementById('btnEntrar');

    // Limpa erros anteriores e muda o botão
    mensagemErro.textContent = "";
    btnEntrar.textContent = "Carregando...";
    btnEntrar.disabled = true;

    try {
        const response = await fetch('https://sgad-backend.onrender.com/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                login: loginInput,
                senha: senhaInput.value
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Sucesso! Salva o token e os dados do usuário no navegador
            localStorage.setItem('sgad_token', data.token);
            localStorage.setItem('sgad_usuario', JSON.stringify(data.usuario));
            
            // Redireciona para a Tela 2 (Dashboard)
            window.location.href = 'dashboard.html';
        } else {
            // Erro de usuário/senha
            mensagemErro.textContent = data.message || "Erro ao realizar login.";
            btnEntrar.textContent = "Entrar";
            btnEntrar.disabled = false;
        }

    } catch (error) {
        console.error("Erro na requisição:", error);
        mensagemErro.textContent = "Falha na conexão com o servidor.";
        btnEntrar.textContent = "Entrar";
        btnEntrar.disabled = false;
    }
});