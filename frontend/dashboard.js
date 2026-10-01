document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validação de Acesso
    const token = localStorage.getItem('sgad_token');
    const usuarioString = localStorage.getItem('sgad_usuario');

    if (!token || !usuarioString) {
        alert("Acesso negado. Faça login primeiro.");
        window.location.href = 'index.html';
        return;
    }

    // 2. Preenche a Navbar
    const usuario = JSON.parse(usuarioString);
    document.getElementById('mensagemBoasVindas').textContent = `Olá, ${usuario.login} (${usuario.perfil})`;

    // 3. Botões da Navbar
    document.getElementById('btnSair').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });

    document.getElementById('btnModelos').addEventListener('click', () => {
        window.location.href = 'modelos.html'; 
    });

    document.getElementById('btnLogs').addEventListener('click', () => {
        window.location.href = 'logs.html';
    });

    // Ir para a tela de Funcionários
    document.getElementById('btnFuncionarios').addEventListener('click', () => {
        window.location.href = 'funcionarios.html'; 
    });

    // 4. Dicionário visual: Associa o nome do serviço a um ícone
    const iconesServicos = {
        'Escritura': '📜',
        'Procuração': '🤝',
        'Substabelecimento': '🔄',
        'Ata Notarial': '👁️‍🗨️',
        'Testamento': '🕊️',
        'Certidão': '📄'
    };

    // 5. Busca os serviços e cria os Cards
    try {
        const response = await fetch('https://sgad-backend.onrender.com/api/documentos/servicos');
        const servicos = await response.json();

        const gridServicos = document.getElementById('grid-servicos');
        gridServicos.innerHTML = ''; 

        servicos.forEach(servico => {
            // Se não achar o nome no dicionário, usa a pasta padrão 📁
            const icone = iconesServicos[servico.nome] || '📁'; 

            const card = document.createElement('div');
            card.className = 'card-servico';
            
            // Injeta o ícone e o texto dentro do card
            card.innerHTML = `
                <div class="icone-card">${icone}</div>
                <div class="texto-card">${servico.nome}</div>
            `;
            
            // 👇 AQUI ESTÁ A MÁGICA DENTRO DO SEU PRÓPRIO CÓDIGO 👇
            // Quando o card for clicado, ele leva pra página de serviço levando o ID e o Nome!
            card.addEventListener('click', () => {
                window.location.href = `servico.html?id=${servico.id}&nome=${servico.nome}`;
            });

            gridServicos.appendChild(card);
        });

    } catch (error) {
        console.error("Erro ao buscar serviços:", error);
        document.getElementById('grid-servicos').innerHTML = '<p style="color:#d9534f; font-weight:bold;">Erro ao carregar os serviços. Verifique o servidor.</p>';
    }
});