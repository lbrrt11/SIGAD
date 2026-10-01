document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('sgad_token');
    const usuarioString = localStorage.getItem('sgad_usuario');

    // Segurança básica: Se não estiver logado, chuta de volta pro login
    if (!token || !usuarioString) {
        window.location.href = 'index.html';
        return;
    }

    const usuarioLogado = JSON.parse(usuarioString);
    document.getElementById('mensagemBoasVindas').textContent = `Olá, ${usuarioLogado.login} (${usuarioLogado.perfil})`;

    // --- MAPA DE TIPOS E NATUREZAS ---
    const mapaNaturezas = {
        "Escritura": [
            "Escritura", "Separação", "Reconciliação", "Conversão de Separação em Divórcio", 
            "Divórcio Direto", "Inventário", "Sobrepartilha", "Retificação de Esc. Inventário, Separação ou Divórcio", 
            "Nomeação de Inventariante", "Partilha"
        ],
        "Procuração": [
            "Procuração", "Procuração para Fins Previdenciários", "Renúncia de Procuração", 
            "Revogação de Procuração", "Procuração Privada"
        ],
        "Substabelecimento": [
            "Substabelecimento"
        ],
        "Ata Notarial": [
            "Ata Notarial", "Ata Notarial Usucapião"
        ],
        "Testamento": [
            "Aditamento", "Cerrado", "Revogação", "Testamento", 
            "Testamento com Revogação", "Testamento sem Conteúdo Patrimonial"
        ],
        "Certidão": [
            "Apostilamento de Haia", "Certidão"
        ]
    };

    const selectTipo = document.getElementById('tipoDocumento');
    const selectNatureza = document.getElementById('naturezaDocumento');

    // Lógica para popular a Natureza baseado no Tipo escolhido
    selectTipo.addEventListener('change', (e) => {
        const tipoSelecionado = e.target.value;
        
        // Limpa o select de natureza
        selectNatureza.innerHTML = '<option value="">Selecione a natureza...</option>';
        
        if (tipoSelecionado && mapaNaturezas[tipoSelecionado]) {
            // Habilita e preenche com as opções corretas
            selectNatureza.disabled = false;
            mapaNaturezas[tipoSelecionado].forEach(natureza => {
                const option = document.createElement('option');
                option.value = natureza;
                option.textContent = natureza;
                selectNatureza.appendChild(option);
            });
        } else {
            // Desabilita se voltar para a opção vazia
            selectNatureza.innerHTML = '<option value="">Primeiro selecione o Tipo do Documento</option>';
            selectNatureza.disabled = true;
        }
    });

    // Navegação e cancelamento (Ajustado para voltar para modelos.html)
    document.getElementById('btnVoltar').addEventListener('click', voltar);
    document.getElementById('btnCancelar').addEventListener('click', voltar);

    function voltar() {
        window.location.href = 'modelos.html';
    }

    // --- SUBMISSÃO DO FORMULÁRIO ---
    const form = document.getElementById('formNovoModelo');
    const msgSucesso = document.getElementById('msgSucesso');
    const msgErro = document.getElementById('msgErro');

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Impede a página de recarregar

        msgSucesso.style.display = 'none';
        msgErro.style.display = 'none';

        const nomeModelo = document.getElementById('nomeModelo').value.trim();
        const tipoDoc = document.getElementById('tipoDocumento').value;
        const naturezaDoc = document.getElementById('naturezaDocumento').value;
        const textoBase = document.getElementById('textoBase').value.trim();

        // --- NOVA VALIDAÇÃO INTELIGENTE AQUI ---
        const temTags = textoBase.includes('{{') && textoBase.includes('}}');

        if (!nomeModelo) {
            alert("⚠️ Por favor, informe o Nome do Modelo.");
            return;
        }

        if (!tipoDoc || tipoDoc === "Selecione..." || tipoDoc === "") {
            alert("⚠️ Por favor, selecione o Serviço / Tipo do documento.");
            return;
        }

        if (!textoBase || !temTags) {
            alert("⚠️ O texto base precisa conter ao menos uma tag no formato {{minha_tag}}.");
            return;
        }
        // ----------------------------------------

        try {
            const btnSalvar = document.getElementById('btnSalvar');
            btnSalvar.textContent = "Salvando...";
            btnSalvar.disabled = true;

            // Envia para a API
            const response = await fetch('https://sgad-backend.onrender.com/api/documentos/modelos/cadastrar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nome_modelo: nomeModelo,
                    tipo_documento: tipoDoc,
                    natureza_documento: naturezaDoc,
                    texto_base: textoBase
                })
            });

            if (response.ok) {
                msgSucesso.style.display = 'block';
                form.reset(); // Limpa os campos
                
                // Redireciona de volta para a lista de modelos depois de 2 segundos
                setTimeout(() => {
                    window.location.href = 'modelos.html';
                }, 2000);
            } else {
                const erroData = await response.json();
                msgErro.textContent = erroData.message || "Erro ao salvar o modelo de documento.";
                msgErro.style.display = 'block';
            }

        } catch (error) {
            msgErro.textContent = "Erro de conexão com o servidor da API.";
            msgErro.style.display = 'block';
        } finally {
            const btnSalvar = document.getElementById('btnSalvar');
            btnSalvar.textContent = "Salvar Modelo";
            btnSalvar.disabled = false;
        }
    });
});