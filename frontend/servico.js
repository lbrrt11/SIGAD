document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('sgad_token');
    const usuarioString = localStorage.getItem('sgad_usuario');

    if (!token || !usuarioString) {
        window.location.href = 'index.html';
        return;
    }

    const usuarioLogado = JSON.parse(usuarioString);
    document.getElementById('mensagemBoasVindas').textContent = `Olá, ${usuarioLogado.login} (${usuarioLogado.perfil})`;

    const urlParams = new URLSearchParams(window.location.search);
    const servicoId = urlParams.get('id');
    const servicoNome = urlParams.get('nome') || 'Serviço';

    document.getElementById('nomeServicoHeader').textContent = servicoNome;

    document.getElementById('btnVoltar').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    document.getElementById('btnSair').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });

    let textoBaseAtual = '';
    let modeloIdAtual = null; 

    async function carregarModelosDoServico() {
        const corpoTabela = document.getElementById('corpoTabela');
        const cabecalhoTabela = document.getElementById('cabecalhoTabela');
        
        corpoTabela.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">Carregando...</td></tr>';

        try {
            const response = await fetch(`https://sgad-backend.onrender.com/api/documentos/servicos/${servicoId}/modelos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const modelos = response.ok ? await response.json() : [];

            if (modelos.length === 0) {
                cabecalhoTabela.style.display = 'none';
                corpoTabela.innerHTML = `
                    <tr>
                       <td colspan="3" style="text-align: center; padding: 50px 20px; border: none;">
                           <span style="font-size: 35px; display: block; margin-bottom: 10px;">📭</span>
                           <h3 style="color: var(--primary-blue, #003366); margin-bottom: 5px;">Nenhum modelo cadastrado</h3>
                           <p style="color: #666; font-size: 14px;">Ainda não há modelos criados para a categoria ${servicoNome}.</p>
                       </td>
                    </tr>`;
                return;
            }

            cabecalhoTabela.style.display = '';
            corpoTabela.innerHTML = ''; 

            modelos.forEach(mod => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = "1px solid #eee";
                
                const idDoModelo = mod.id || mod.id_modelo || mod.modelo_id;

                tr.innerHTML = `
                    <td style="padding: 15px 10px;"><strong>${mod.nome_modelo}</strong></td>
                    <td style="padding: 15px 10px;">
                        <span style="background: #eef3f7; padding: 4px 8px; border-radius: 4px; font-size: 12px; color: #003366; font-weight: bold;">
                            ${mod.natureza_documento || 'Padrão'}
                        </span>
                    </td>
                    <td style="padding: 15px 10px; text-align: right;">
                        <button class="btn-usar-modelo" 
                                style="padding: 6px 12px; background: #003366; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;"
                                data-id='${idDoModelo}'
                                data-texto='${encodeURIComponent(mod.texto_base)}' 
                                data-nome='${mod.nome_modelo}'>
                            Usar Modelo
                        </button>
                    </td>
                `;
                corpoTabela.appendChild(tr);
            });

            document.querySelectorAll('.btn-usar-modelo').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    const textoEncoded = e.target.getAttribute('data-texto');
                    textoBaseAtual = decodeURIComponent(textoEncoded);
                    const nome = e.target.getAttribute('data-nome');
                    
                    abrirModalPreenchimento(nome, textoBaseAtual, id);
                });
            });

        } catch (error) {
            corpoTabela.innerHTML = '<tr><td colspan="3" style="color: red; text-align: center;">Erro de conexão.</td></tr>';
        }
    }

    carregarModelosDoServico();

    const modal = document.getElementById('modalPreenchimento');
    const formVariaveis = document.getElementById('formVariaveis');

    function abrirModalPreenchimento(nomeModelo, texto, idModelo) {
        modeloIdAtual = idModelo;
        document.getElementById('modalTitulo').textContent = `Gerar: ${nomeModelo}`;
        formVariaveis.innerHTML = ''; 

        const regexTags = /\{\{(.*?)\}\}/g;
        const tagsEncontradas = new Set();
        let match;

        while ((match = regexTags.exec(texto)) !== null) {
            tagsEncontradas.add(match[1]); 
        }

        if (tagsEncontradas.size === 0) {
            formVariaveis.innerHTML = '<p style="grid-column: span 2; text-align: center;">Este modelo não possui variáveis para preencher.</p>';
        } else {
            const tags = Array.from(tagsEncontradas);
            const tagsOrdenadas = [];
            const tagsUsadas = new Set();

            tags.forEach(tag => {
                if (tag.startsWith('outorgante_')) {
                    const sufixo = tag.replace('outorgante_', '');
                    const tagOutorgado = 'outorgado_' + sufixo;

                    tagsOrdenadas.push(tag); 
                    tagsUsadas.add(tag);

                    if (tags.includes(tagOutorgado)) {
                        tagsOrdenadas.push(tagOutorgado); 
                        tagsUsadas.add(tagOutorgado);
                    }
                }
            });

            tags.forEach(tag => {
                if (!tagsUsadas.has(tag)) {
                    tagsOrdenadas.push(tag);
                }
            });

            tagsOrdenadas.forEach(tag => {
                const labelFormatada = tag.replace(/_/g, ' ').toUpperCase();
                const div = document.createElement('div');
                div.className = 'input-group';
                
                const tagLower = tag.toLowerCase();

                // 🧠 INTELIGÊNCIA 0: ESCREVENTE (AUTO-PREENCHIMENTO)
                if (tagLower.includes('escrevente')) {
                    const nomeEscrevente = usuarioLogado.nome_completo || usuarioLogado.login || '';
                    div.innerHTML = `
                        <label for="tag_${tag}">${labelFormatada}</label>
                        <input type="text" id="tag_${tag}" name="${tag}" value="${nomeEscrevente}" readonly style="background-color: #e9ecef; cursor: not-allowed; color: #555;">
                    `;
                    formVariaveis.appendChild(div);

                // 🧠 INTELIGÊNCIA 1: ESTADO CIVIL
                } else if (tagLower.includes('estado_civil')) {
                    div.innerHTML = `
                        <label for="tag_${tag}">${labelFormatada}</label>
                        <select id="tag_${tag}" name="${tag}" required>
                            <option value="">Selecione...</option>
                            <option value="solteiro(a)">Solteiro(a)</option>
                            <option value="casado(a)">Casado(a)</option>
                            <option value="divorciado(a)">Divorciado(a)</option>
                            <option value="viúvo(a)">Viúvo(a)</option>
                        </select>
                    `;
                    formVariaveis.appendChild(div);

                // 🧠 INTELIGÊNCIA 2: DATA DE NASCIMENTO E DATAS EM GERAL
                } else if (tagLower.includes('data_nascimento') || tagLower.includes('data')) {
                    
                    const hojeObj = new Date();
                    const ano = hojeObj.getFullYear();
                    const mes = String(hojeObj.getMonth() + 1).padStart(2, '0');
                    const dia = String(hojeObj.getDate()).padStart(2, '0');
                    const dataAtual = `${ano}-${mes}-${dia}`;

                    div.innerHTML = `
                        <label for="tag_${tag}">${labelFormatada} <span id="badge_${tag}" style="font-size: 11px; margin-left: 10px; font-weight: bold;"></span></label>
                        <input type="date" id="tag_${tag}" name="${tag}" max="${dataAtual}" required>
                    `;
                    formVariaveis.appendChild(div);

                    const inputData = div.querySelector('input');
                    const badge = div.querySelector(`#badge_${tag}`);

                    if (tagLower.includes('data_nascimento')) {
                        inputData.addEventListener('change', (e) => {
                            if (!e.target.value) {
                                badge.textContent = '';
                                return;
                            }
                            const parts = e.target.value.split('-');
                            const nascimento = new Date(parts[0], parts[1] - 1, parts[2]);
                            const hoje = new Date();
                            
                            let idade = hoje.getFullYear() - nascimento.getFullYear();
                            const m = hoje.getMonth() - nascimento.getMonth();
                            if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
                                idade--;
                            }

                            let capacidade = idade >= 18 ? 'maior capaz' : 'menor incapaz';
                            badge.textContent = `- ${capacidade.toUpperCase()}`;
                            badge.style.color = idade >= 18 ? '#28a745' : '#dc3545';

                            const nomeTagCapacidade = tag.replace('data_nascimento', 'capacidade');
                            const campoCapacidade = document.querySelector(`input[name="${nomeTagCapacidade}"]`);
                            if (campoCapacidade) {
                                campoCapacidade.value = capacidade;
                            }
                        });
                    }

                // 🧠 INTELIGÊNCIA 3: E-MAIL
                } else if (tagLower.includes('email') || tagLower.includes('e-mail')) {
                    div.innerHTML = `
                        <label for="tag_${tag}">${labelFormatada}</label>
                        <input type="email" id="tag_${tag}" name="${tag}" placeholder="exemplo@email.com" required>
                    `;
                    formVariaveis.appendChild(div);

                // 🧠 INTELIGÊNCIA 4: MÚLTIPLAS PARTES (DINÂMICAS)
                 } else if (tagLower === 'qualificacao_outorgantes' || tagLower === 'qualificacao_outorgados') {
                    const tipo = tagLower.includes('outorgantes') ? 'Outorgante' : 'Outorgado';
                    div.style.gridColumn = "span 2";
                    div.style.background = "#f4f7f9";
                    div.style.padding = "20px";
                    div.style.borderRadius = "8px";
                    div.style.border = "1px solid #d0d7de";

                    div.innerHTML = `
                        <h4 style="color: var(--primary-blue); margin-top: 0; margin-bottom: 15px; font-size: 16px;">👥 ${tipo}(s) do Documento</h4>
                        <div id="lista_${tagLower}"></div>
                        <button type="button" class="btn-add-pessoa" style="background: #28a745; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-top: 10px; width: 100%;">+ Adicionar mais um ${tipo}</button>
                        <input type="hidden" id="tag_${tag}" name="${tag}">
                    `;
                    formVariaveis.appendChild(div);

                    const btnAdd = div.querySelector('.btn-add-pessoa');
                    const lista = div.querySelector(`#lista_${tagLower}`);
                    let contador = 0;

                    const adicionarPessoa = () => {
                        contador++;
                        const pessoaDiv = document.createElement('div');
                        pessoaDiv.className = "pessoa-item";
                        pessoaDiv.style.background = "white";
                        pessoaDiv.style.padding = "15px";
                        pessoaDiv.style.marginBottom = "15px";
                        pessoaDiv.style.borderRadius = "6px";
                        pessoaDiv.style.borderLeft = "4px solid var(--primary-blue)";
                        pessoaDiv.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                        pessoaDiv.style.display = "grid";
                        pessoaDiv.style.gridTemplateColumns = "1fr 1fr";
                        pessoaDiv.style.gap = "10px";

                        pessoaDiv.innerHTML = `
                            <div style="grid-column: span 2; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 8px; gap: 15px;">
                                <strong style="color: #333; font-size: 15px; white-space: nowrap; margin: 0;">${tipo} ${contador} <span class="badge-capacidade" style="font-size: 11px; margin-left: 10px;"></span></strong>
                                ${contador > 1 ? `<button type="button" class="btn-remover" style="background: #dc3545; color: white; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; width: auto; flex: 0 0 auto; margin: 0; box-shadow: none;">Remover</button>` : ''}
                            </div>
                            <input type="text" class="p-nome" placeholder="Nome Completo" required>
                            <input type="date" class="p-data-nascimento" required title="Data de Nascimento">
                            <input type="text" class="p-nacionalidade" placeholder="Nacionalidade (ex: brasileiro(a))" required>
                            <input type="text" class="p-naturalidade" placeholder="Naturalidade (Cidade - UF)" required>
                            <input type="text" class="p-contato" placeholder="Contato (E-mail ou Telefone)" required>
                            <select class="p-estado-civil" required>
                                <option value="">Estado Civil...</option>
                                <option value="solteiro(a)">Solteiro(a)</option>
                                <option value="casado(a)">Casado(a)</option>
                                <option value="divorciado(a)">Divorciado(a)</option>
                                <option value="viúvo(a)">Viúvo(a)</option>
                            </select>
                            <input type="text" class="p-profissao" placeholder="Profissão" required>
                            <input type="text" class="p-cpf" placeholder="CPF" maxlength="14" required>
                            <input type="text" class="p-rg" placeholder="RG (Órgão Emissor)" maxlength="13" required>
                            <input type="text" class="p-endereco" placeholder="Endereço Completo (Rua, nº, Bairro, CEP, Cidade, UF)" style="grid-column: span 2;" required>
                        `;

                        // Lógica da Idade/Capacidade Dinâmica
                        const inputDataNasc = pessoaDiv.querySelector('.p-data-nascimento');
                        const badgeCapacidade = pessoaDiv.querySelector('.badge-capacidade');
                        
                        inputDataNasc.addEventListener('change', (e) => {
                            if (!e.target.value) {
                                badgeCapacidade.textContent = '';
                                return;
                            }
                            const parts = e.target.value.split('-');
                            const nascimento = new Date(parts[0], parts[1] - 1, parts[2]);
                            const hoje = new Date();
                            
                            let idade = hoje.getFullYear() - nascimento.getFullYear();
                            const m = hoje.getMonth() - nascimento.getMonth();
                            if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
                                idade--;
                            }

                            let capacidade = idade >= 18 ? 'maior capaz' : 'menor incapaz';
                            badgeCapacidade.textContent = `- ${capacidade.toUpperCase()}`;
                            badgeCapacidade.style.color = idade >= 18 ? '#28a745' : '#dc3545';
                            compilarDados();
                        });

                        // Máscara CPF
                        const inputCpf = pessoaDiv.querySelector('.p-cpf');
                        inputCpf.addEventListener('input', (e) => {
                            let v = e.target.value.replace(/\D/g, "");
                            v = v.replace(/(\d{3})(\d)/, "$1.$2");
                            v = v.replace(/(\d{3})(\d)/, "$1.$2");
                            v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                            e.target.value = v;
                        });

                        // Máscara RG
                        const inputRg = pessoaDiv.querySelector('.p-rg');
                        inputRg.addEventListener('input', (e) => {
                            let valor = e.target.value.replace(/\D/g, ""); 
                            valor = valor.replace(/(\d{2})(\d)/, "$1.$2"); 
                            valor = valor.replace(/(\d{3})(\d)/, "$1.$2"); 
                            valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2"); 
                            e.target.value = valor;
                        });

                        const btnRemover = pessoaDiv.querySelector('.btn-remover');
                        if (btnRemover) {
                            btnRemover.addEventListener('click', () => {
                                pessoaDiv.remove();
                                compilarDados();
                            });
                        }

                        pessoaDiv.querySelectorAll('input, select').forEach(input => {
                            input.addEventListener('input', compilarDados);
                        });

                        lista.appendChild(pessoaDiv);
                        compilarDados();
                    };

                    const compilarDados = () => {
                        const pessoas = [];
                        lista.querySelectorAll('.pessoa-item').forEach(item => {
                            const nome = item.querySelector('.p-nome').value.trim();
                            const dataNascBruta = item.querySelector('.p-data-nascimento').value;
                            const nac = item.querySelector('.p-nacionalidade').value.trim();
                            const nat = item.querySelector('.p-naturalidade').value.trim();
                            const contato = item.querySelector('.p-contato').value.trim();
                            const est = item.querySelector('.p-estado-civil').value;
                            const prof = item.querySelector('.p-profissao').value.trim();
                            const cpf = item.querySelector('.p-cpf').value.trim();
                            const rg = item.querySelector('.p-rg').value.trim();
                            const end = item.querySelector('.p-endereco').value.trim();
                            
                            let dataFormatada = "";
                            let capacidade = "não informada";

                            // Transforma a data de YYYY-MM-DD para DD/MM/YYYY e calcula a capacidade jurídica
                            if (dataNascBruta) {
                                const p = dataNascBruta.split('-');
                                dataFormatada = `${p[2]}/${p[1]}/${p[0]}`;
                                
                                const nascimento = new Date(p[0], p[1] - 1, p[2]);
                                const hoje = new Date();
                                let idade = hoje.getFullYear() - nascimento.getFullYear();
                                const m = hoje.getMonth() - nascimento.getMonth();
                                if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
                                    idade--;
                                }
                                capacidade = idade >= 18 ? 'maior capaz' : 'menor incapaz';
                            }
                            
                            if(nome) {
                                pessoas.push(`${nome.toUpperCase()}, nascido(a) em ${dataFormatada}, classificado(a) neste ato como ${capacidade}, ${nac}, natural de ${nat}, ${est}, ${prof}, portador(a) do RG nº ${rg} e inscrito(a) no CPF sob o nº ${cpf}, contato ${contato}, residente e domiciliado(a) no(a) ${end}`);
                            }
                        });
                        
                        let textoFinal = "";
                        if(pessoas.length === 1) {
                            textoFinal = pessoas[0];
                        } else if (pessoas.length > 1) {
                            const ultimo = pessoas.pop();
                            textoFinal = pessoas.join('; ') + '; e, ' + ultimo;
                        }
                        
                        div.querySelector(`#tag_${tag}`).value = textoFinal;
                    };

                    btnAdd.addEventListener('click', adicionarPessoa);
                    adicionarPessoa(); 
                }

                // COMPORTAMENTO PADRÃO: CAMPO DE TEXTO E MÁSCARAS SIMPLES
                else {
                    div.innerHTML = `
                        <label for="tag_${tag}">${labelFormatada}</label>
                        <input type="text" id="tag_${tag}" name="${tag}" required>
                    `;
                    formVariaveis.appendChild(div);

                    const inputElement = div.querySelector('input');
                    const partesTag = tagLower.split('_'); 

                    if (partesTag.includes('cpf')) {
                        inputElement.setAttribute('maxlength', '14'); 
                        inputElement.addEventListener('input', (e) => {
                            let valor = e.target.value.replace(/\D/g, ""); 
                            valor = valor.replace(/(\d{3})(\d)/, "$1.$2"); 
                            valor = valor.replace(/(\d{3})(\d)/, "$1.$2"); 
                            valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2"); 
                            e.target.value = valor;
                        });
                    } else if (partesTag.includes('rg')) {
                        inputElement.setAttribute('maxlength', '13'); 
                        inputElement.addEventListener('input', (e) => {
                            let valor = e.target.value.replace(/\D/g, ""); 
                            valor = valor.replace(/(\d{2})(\d)/, "$1.$2"); 
                            valor = valor.replace(/(\d{3})(\d)/, "$1.$2"); 
                            valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2"); 
                            e.target.value = valor;
                        });
                    } else if (partesTag.includes('contato') || partesTag.includes('telefone') || partesTag.includes('celular')) {
                        inputElement.setAttribute('maxlength', '15');
                        inputElement.setAttribute('placeholder', '(00) 00000-0000');
                        inputElement.addEventListener('input', (e) => {
                            let v = e.target.value.replace(/\D/g, "");
                            v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
                            v = v.replace(/(\d)(\d{4})$/, "$1-$2");
                            e.target.value = v;
                        });
                    }
                }
            });
        }

        modal.style.display = 'flex';
    }

    document.getElementById('btnFecharModal').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    document.getElementById('btnLimparModal').addEventListener('click', () => {
        if(confirm("Deseja apagar todos os dados preenchidos?")) {
            formVariaveis.reset();
            const badges = formVariaveis.querySelectorAll('[id^="badge_"]');
            badges.forEach(b => b.textContent = '');
        }
    });

    // 🛡️ TRAVA BLINDADA: VALIDAÇÃO DE CAMPOS VAZIOS
    function validarFormulario() {
        const inputs = formVariaveis.querySelectorAll('input, select');
        for (let input of inputs) {
            // Ignora o input escondido (a validação pega os campos visíveis do painel dinâmico)
            if (input.type === 'hidden') continue;
            
            if (!input.value || input.value.trim() === '') {
                let labelText = "Campo obrigatório";
                
                // Inteligência para descobrir o nome do campo vazio e avisar o usuário
                if (input.previousElementSibling && input.previousElementSibling.tagName === 'LABEL') {
                    labelText = input.previousElementSibling.textContent.split(' - ')[0]; 
                } else if (input.placeholder) {
                    labelText = input.placeholder;
                } else if (input.name) {
                    labelText = input.name;
                }
                
                alert(`⚠️ O campo "${labelText}" não pode ficar vazio!`);
                input.focus();
                return false;
            }
        }
        return true;
    }

    function obterValorFormatado(input) {
        if (input.type === 'date' && input.value) {
            const p = input.value.split('-'); 
            const nomeTag = input.name ? input.name.toLowerCase() : '';
            
            if (nomeTag.includes('extenso')) {
                const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
                return `${p[2]} de ${meses[parseInt(p[1]) - 1]} de ${p[0]}`;
            }
            
            return `${p[2]}/${p[1]}/${p[0]}`;
        }
        return input.value;
    }

    document.getElementById('btnVisualizar').addEventListener('click', async () => {
        if (!validarFormulario()) return; 

        const inputs = formVariaveis.querySelectorAll('input, select');
        const dadosFormulario = {};

        // 🛡️ CORREÇÃO: Só envia para o PDF os inputs que pertencem ao Texto Base (ignora lixo de memória)
        inputs.forEach(input => {
            if (input.name) {
                dadosFormulario[input.name] = obterValorFormatado(input);
            }
        });

        const btn = document.getElementById('btnVisualizar');
        const textoOriginal = btn.innerHTML;
        btn.innerHTML = '⏳ Carregando Prévia...';
        btn.disabled = true;

        try {
            const response = await fetch('https://sgad-backend.onrender.com/api/pdf/gerar', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    modeloId: modeloIdAtual,
                    dadosFormulario: dadosFormulario
                })
            });

            if (!response.ok) {
                throw new Error("Falha ao gerar o documento para visualização.");
            }

            const blob = await response.blob();
            const fileURL = window.URL.createObjectURL(blob);
            window.open(fileURL, "_blank");

        } catch (error) {
            console.error("Erro na prévia do PDF:", error);
            alert('❌ Erro ao tentar visualizar o documento. Verifique se o servidor está rodando.');
        } finally {
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
        }
    });

    document.getElementById('btnGerarPDF').addEventListener('click', async () => {
        if (!validarFormulario()) return;

        const inputs = formVariaveis.querySelectorAll('input, select');
        const dadosFormulario = {};

        // 🛡️ CORREÇÃO: Mesma limpeza de lixo de memória para o botão de Baixar
        inputs.forEach(input => {
            if (input.name) {
                dadosFormulario[input.name] = obterValorFormatado(input);
            }
        });

        const btn = document.getElementById('btnGerarPDF');
        const textoOriginal = btn.innerHTML;
        btn.innerHTML = '⏳ Gerando PDF...';
        btn.disabled = true;

        try {
            const response = await fetch('https://sgad-backend.onrender.com/api/pdf/gerar', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    modeloId: modeloIdAtual,
                    dadosFormulario: dadosFormulario
                })
            });

            if (!response.ok) {
                throw new Error("Falha ao gerar o documento no servidor.");
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            a.style.display = 'none';
            a.href = downloadUrl;
            
            const disposition = response.headers.get('Content-Disposition');
            let filename = "Documento_Gerado.pdf";
            if (disposition && disposition.indexOf('filename=') !== -1) {
                const regex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = regex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }
            
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);

        } catch (error) {
            console.error("Erro na geração do PDF:", error);
            alert('❌ Erro de comunicação com o gerador de PDF. Verifique se o servidor está rodando.');
        } finally {
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
        }
    });
});
