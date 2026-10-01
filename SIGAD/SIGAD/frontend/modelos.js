document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('sgad_token');
    const usuarioString = localStorage.getItem('sgad_usuario');

    if (!token || !usuarioString) {
        window.location.href = 'index.html';
        return;
    }

    const usuarioLogado = JSON.parse(usuarioString);
    document.getElementById('mensagemBoasVindas').textContent = `Olá, ${usuarioLogado.login} (${usuarioLogado.perfil})`;

    // Navegação
    document.getElementById('btnSair').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });

    document.getElementById('btnVoltar').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    // Exibe o botão de Novo Modelo e a Coluna de Ações para TODOS os usuários
    document.getElementById('btnNovoModelo').style.display = 'block';
    document.getElementById('colunaAcoes').style.display = 'table-cell';

    document.getElementById('btnNovoModelo').addEventListener('click', () => {
        window.location.href = 'novo-modelo.html';
    });

    // --- CARREGAR E ORDENAR MODELOS ---
    async function carregarModelos() {
        const corpoTabela = document.getElementById('corpoTabela');
        corpoTabela.innerHTML = '<tr><td colspan="5" style="text-align: center;">Carregando...</td></tr>';

        try {
            const response = await fetch('https://sgad-backend.onrender.com/api/documentos/modelos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            let modelos = [];

            if (response.ok) {
                modelos = await response.json();
            } else {
                // REDE DE SEGURANÇA REMOVIDA! Agora, se não vier do banco, a lista fica realmente vazia.
                console.error("Não foi possível carregar os modelos do banco de dados.");
                modelos = []; 
            }

            const cabecalhoTabela = document.getElementById('cabecalhoTabela');

            // Renderização da tabela vazia
            // Renderização da tabela vazia (agora sem o botão duplicado)
            if (modelos.length === 0) {
                cabecalhoTabela.style.display = 'none'; // Garante que o cabeçalho fica escondido
                corpoTabela.innerHTML = `
                    <tr>
                       <td colspan="5" style="text-align: center; padding: 50px 20px; border: none;">
                             <span style="font-size: 35px; display: block; margin-bottom: 10px;">📄</span>
                           <h3 style="color: var(--primary-blue); margin-bottom: 5px;">Nenhum modelo cadastrado</h3>
                             <p style="color: #666; font-size: 14px; margin-bottom: 10px;">Ainda não há modelos criados no sistema.</p>
                       </td>
                 </tr>`;
                 return;
            }

            // SE HOUVER MODELOS: Mostra o cabeçalho e continua o código normal
            cabecalhoTabela.style.display = ''; 

            // 👇 A LINHA MÁGICA FOI INSERIDA AQUI 👇
            corpoTabela.innerHTML = ''; 

            // ORDENAÇÃO ALFABÉTICA (A - Z) PELO NOME DO MODELO
            modelos.sort((a, b) => {
                const nomeA = a.nome_modelo || '';
                const nomeB = b.nome_modelo || '';
                return nomeA.localeCompare(nomeB, 'pt-BR', { sensitivity: 'base' });
            });

            modelos.forEach(mod => {
                const tr = document.createElement('tr');
                
                // Trata e resume o texto base para caber na tabela
                const textoCompleto = mod.texto_base || 'Sem texto base definido.';
                const textoResumido = textoCompleto.length > 45 
                    ? textoCompleto.substring(0, 45) + '...' 
                    : textoCompleto;

                // O botão de Excluir agora é gerado e mostrado para TODOS os perfis
                // Pega o ID independente de como ele se chama no banco MySQL
                const idDoModelo = mod.id || mod.id_modelo || mod.idModelo || mod.modelo_id;

                // O botão agora usa a variável garantida
                const acoesHtml = `<td><button class="btn-excluir" onclick="excluirModelo(${idDoModelo}, '${mod.nome_modelo}')">Excluir</button></td>`;

                tr.innerHTML = `
                    <td><strong>${mod.nome_modelo}</strong></td>
                    <td><span style="background: #eef3f7; padding: 4px 8px; border-radius: 4px; font-size: 12px; color: var(--primary-blue); font-weight: bold;">${mod.tipo_documento || mod.tipo || 'N/A'}</span></td>
                    <td>${mod.natureza_documento || mod.natureza || 'N/A'}</td>
                    <td title="${textoCompleto}" style="color: #555; font-style: italic;">"${textoResumido}"</td>
                    ${acoesHtml}
                `;
                corpoTabela.appendChild(tr);
            });

        } catch (error) {
            console.error("Erro na listagem de modelos:", error);
            corpoTabela.innerHTML = '<tr><td colspan="5" style="color: red; text-align: center;">Erro ao conectar com o banco de dados.</td></tr>';
        }
    }

    carregarModelos();

    // --- DELETAR MODELO CORRIGIDO ---
    window.excluirModelo = async (id, nomeModelo) => {
        // Trava 1: Se o ID não for encontrado, ele barra na hora e te avisa
        if (!id || id === 'undefined') {
            alert("⚠️ Erro: O ID do modelo está vazio! Verifique o nome da coluna no seu banco de dados.");
            return;
        }

        if (confirm(`Atenção: Deseja realmente excluir permanentemente o modelo "${nomeModelo}"?`)) {
            try {
                // Trava 2: Como a rota de criação era /cadastrar, a de exclusão pode ser /excluir no seu back-end
                // Vamos tentar a padrão primeiro
                let response = await fetch(`https://sgad-backend.onrender.com/api/documentos/modelos/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // Se o servidor retornar 404 (Não Encontrado), tentamos a rota alternativa com /excluir/
                if (response.status === 404) {
                    response = await fetch(`https://sgad-backend.onrender.com/api/documentos/modelos/excluir/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                }

                if (response.ok) {
                    alert('Modelo removido com sucesso!');
                    carregarModelos(); // Atualiza a tabela na mesma hora
                } else {
                    alert('❌ O servidor recusou a exclusão. O back-end pode estar bloqueando a ação ou a rota DELETE está diferente.');
                }
            } catch (error) {
                alert('Erro de comunicação com a API. Verifique se o servidor na porta 3000 está rodando.');
            }
        }
    };
});