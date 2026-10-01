document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validação e Nome do Usuário
    const token = localStorage.getItem('sgad_token');
    const usuarioString = localStorage.getItem('sgad_usuario');

    if (!token || !usuarioString) {
        window.location.href = 'index.html';
        return;
    }

    const usuarioLogado = JSON.parse(usuarioString);
    document.getElementById('mensagemBoasVindas').textContent = `Olá, ${usuarioLogado.login} (${usuarioLogado.perfil})`;

    document.getElementById('btnVoltar').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    document.getElementById('btnSair').addEventListener('click', () => {
        localStorage.clear(); // Limpa a sessão
        window.location.href = 'index.html'; // Joga pra tela de login
    });

    // 2. Busca e Renderiza os Logs
    async function carregarLogs() {
        const corpoTabela = document.getElementById('corpoTabela');

        try {
            const response = await fetch('https://sgad-backend.onrender.com/api/logs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Erro ao buscar logs.");
            
            const logs = await response.json();

            corpoTabela.innerHTML = ''; 

            if (logs.length === 0) {
                corpoTabela.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #666;">Nenhuma atividade registrada ainda.</td></tr>';
                return;
            }

            logs.forEach(log => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = "1px solid #eee";
                
                // Formata a data vinda do MySQL (Ex: 2026-08-03T14:30:00.000Z -> 03/08/2026, 14:30)
                const dataFormatada = new Date(log.data_hora).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });

                // Criar cores dinâmicas para as ações
                let corAcao = '#003366'; // Padrão
                if (log.acao.includes('EXCLUIR') || log.acao.includes('ERRO')) corAcao = '#d9534f'; // Vermelho
                if (log.acao.includes('LOGIN')) corAcao = '#5cb85c'; // Verde

                tr.innerHTML = `
                    <td style="padding: 15px 10px; color: #555; font-size: 14px;">${dataFormatada}</td>
                    <td style="padding: 15px 10px; font-weight: bold;">${log.usuario_nome || log.usuario}</td>
                    <td style="padding: 15px 10px;">
                        <span style="background: ${corAcao}20; color: ${corAcao}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                            ${log.acao}
                        </span>
                    </td>
                    <td style="padding: 15px 10px; color: #555; font-style: italic;">${log.detalhes}</td>
                `;
                corpoTabela.appendChild(tr);
            });

        } catch (error) {
            console.error(error);
            corpoTabela.innerHTML = '<tr><td colspan="4" style="color: red; text-align: center; padding: 20px;">Erro de conexão com o servidor.</td></tr>';
        }
    }

    carregarLogs();
});