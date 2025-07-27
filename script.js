document.addEventListener('DOMContentLoaded', () => {
    // ... (Seus elementos do DOM e variáveis globais existentes) ...

    // --- Elementos do DOM ---
    const saldoTotalDisplay = document.getElementById('saldoTotalDisplay');
    const saldoLiquidoDisplay = document.getElementById('saldoLiquidoDisplay');
    const btnEditarSaldoTotal = document.getElementById('btnEditarSaldoTotal');
    const inputSaldoTotal = document.getElementById('inputSaldoTotal');
    const btnSalvarSaldoTotal = document.getElementById('btnSalvarSaldoTotal');

    const formDivida = document.getElementById('formDivida');
    const nomeDividaInput = document.getElementById('nomeDivida');
    const valorTotalDividaInput = document.getElementById('valorTotalDivida');
    const valorParcelaInput = document.getElementById('valorParcela');
    const totalParcelasInput = document.getElementById('totalParcelas');
    const listaDividas = document.getElementById('listaDividas');

    const formExtrato = document.getElementById('formExtrato');
    const tipoTransacaoInput = document.getElementById('tipoTransacao');
    const descricaoTransacaoInput = document.getElementById('descricaoTransacao');
    const valorTransacaoInput = document.getElementById('valorTransacao');
    const dataTransacaoInput = document.getElementById('dataTransacao');
    const listaExtrato = document.getElementById('listaExtrato');
    const graficoDistribuicao = document.getElementById('graficoDistribuicao').getContext('2d');

    const btnImprimirExtrato = document.getElementById('btnImprimirExtrato'); // Novo elemento!
    const areaExtrato = document.getElementById('areaExtrato'); // Novo elemento!

    // --- Variáveis Globais (Armazenamento Simples no Local Storage) ---
    let saldoTotal = parseFloat(localStorage.getItem('saldoTotal')) || 0;
    let dividas = JSON.parse(localStorage.getItem('dividas')) || [];
    let extrato = JSON.parse(localStorage.getItem('extrato')) || [];
    let meuGrafico; // Para armazenar a instância do Chart.js

    // --- Funções Auxiliares ---

    // Formata um número para moeda BRL
    const formatarMoeda = (valor) => {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Salva os dados no Local Storage
    const salvarDados = () => {
        localStorage.setItem('saldoTotal', saldoTotal);
        localStorage.setItem('dividas', JSON.stringify(dividas));
        localStorage.setItem('extrato', JSON.stringify(extrato));
    };

    // ... (Suas funções de renderização e atualização existentes) ...

    // --- Funções de Renderização e Atualização ---

    // Atualiza os displays de saldo e chama outras atualizações
    const atualizarSaldos = () => {
        const totalParcelasMes = dividas.reduce((acc, divida) => {
            return acc + (divida.parcelasRestantes > 0 ? divida.valorParcela : 0);
        }, 0);

        const saldoLiquido = saldoTotal - totalParcelasMes;

        saldoTotalDisplay.textContent = formatarMoeda(saldoTotal);
        saldoLiquidoDisplay.textContent = formatarMoeda(saldoLiquido);

        renderizarDividas();
        renderizarExtrato();
        atualizarGrafico(saldoLiquido);
        salvarDados();
    };

    // Renderiza a lista de dívidas
    const renderizarDividas = () => {
        listaDividas.innerHTML = ''; // Limpa a lista antes de renderizar
        if (dividas.length === 0) {
            listaDividas.innerHTML = '<li style="text-align: center; color: #666;">Nenhuma dívida cadastrada ainda.</li>';
            return;
        }

        dividas.forEach((divida, index) => {
            const li = document.createElement('li');
            li.setAttribute('data-index', index);
            if (divida.parcelasRestantes <= 0) {
                li.classList.add('divida-paga');
            }

            li.innerHTML = `
                <div>
                    <strong>${divida.nome}</strong><br>
                    Valor Total: ${formatarMoeda(divida.valorTotal)}<br>
                    Parcela: ${formatarMoeda(divida.valorParcela)}<br>
                    Parcelas Restantes: ${divida.parcelasRestantes} de ${divida.totalParcelas}
                </div>
                <div>
                    ${divida.parcelasRestantes > 0 ? `<button class="btn-marcar-pago">Marcar como Pago</button>` : '<span>Dívida Paga!</span>'}
                    <button class="remover-btn">Remover</button>
                </div>
            `;
            listaDividas.appendChild(li);
        });
    };

    // Renderiza a lista de extrato
    const renderizarExtrato = () => {
        listaExtrato.innerHTML = ''; // Limpa a lista antes de renderizar
        if (extrato.length === 0) {
            listaExtrato.innerHTML = '<li style="text-align: center; color: #666;">Nenhuma transação registrada ainda.</li>';
            return;
        }

        // Ordena o extrato pela data, do mais recente para o mais antigo
        const extratoOrdenado = [...extrato].sort((a, b) => new Date(b.data) - new Date(a.data));

        extratoOrdenado.forEach((transacao, index) => {
            const li = document.createElement('li');
            const corValor = transacao.tipo === 'entrada' ? 'green' : 'red';

            li.innerHTML = `
                <div>
                    <strong>${transacao.data}</strong> - ${transacao.descricao}<br>
                    Tipo: <span style="color: ${corValor};">${transacao.tipo === 'entrada' ? 'ENTRADA' : 'SAÍDA'}</span>
                </div>
                <div style="color: ${corValor}; font-weight: bold;">
                    ${formatarMoeda(transacao.valor)}
                </div>
            `;
            listaExtrato.appendChild(li);
        });
    };

    // Atualiza o gráfico de distribuição
    const atualizarGrafico = (saldoParaDistribuir) => {
        const usoMensal = saldoParaDistribuir * 0.70;
        const guardarInvestir = saldoParaDistribuir * 0.30;

        if (meuGrafico) {
            meuGrafico.destroy(); // Destrói a instância anterior do gráfico
        }

        meuGrafico = new Chart(graficoDistribuicao, {
            type: 'pie', // Tipo de gráfico: pizza
            data: {
                labels: ['Uso Mensal (70%)', 'Guardar/Investir (30%)'],
                datasets: [{
                    data: [usoMensal, guardarInvestir],
                    backgroundColor: ['#28a745', '#007bff'], // Cores para as fatias
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += formatarMoeda(context.parsed);
                                return label;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Como Distribuir seu Saldo Líquido',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#333'
                    },
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    };

    // --- Event Listeners ---

    // ... (Seus event listeners existentes) ...

    // Editar Saldo Total
    btnEditarSaldoTotal.addEventListener('click', () => {
        inputSaldoTotal.value = saldoTotal;
        saldoTotalDisplay.style.display = 'none';
        btnEditarSaldoTotal.style.display = 'none';
        inputSaldoTotal.style.display = 'inline-block';
        btnSalvarSaldoTotal.style.display = 'inline-block';
        inputSaldoTotal.focus();
    });

    // Salvar Novo Saldo Total
    btnSalvarSaldoTotal.addEventListener('click', () => {
        const novoSaldo = parseFloat(inputSaldoTotal.value);
        if (!isNaN(novoSaldo)) {
            saldoTotal = novoSaldo;
            atualizarSaldos();
            // Volta os elementos ao estado original
            saldoTotalDisplay.style.display = 'block';
            btnEditarSaldoTotal.style.display = 'inline-block';
            inputSaldoTotal.style.display = 'none';
            btnSalvarSaldoTotal.style.display = 'none';
        } else {
            alert('Por favor, insira um valor numérico válido para o saldo.');
        }
    });

    // Adicionar Dívida
    formDivida.addEventListener('submit', (e) => {
        e.preventDefault(); // Impede o recarregamento da página

        const nome = nomeDividaInput.value;
        const valorTotal = parseFloat(valorTotalDividaInput.value);
        const valorParc = parseFloat(valorParcelaInput.value);
        const totalParc = parseInt(totalParcelasInput.value);

        if (nome && !isNaN(valorTotal) && !isNaN(valorParc) && !isNaN(totalParc) && valorTotal > 0 && valorParc > 0 && totalParc > 0) {
            const novaDivida = {
                nome: nome,
                valorTotal: valorTotal,
                valorParcela: valorParc,
                totalParcelas: totalParc,
                parcelasRestantes: totalParc
            };
            dividas.push(novaDivida);
            formDivida.reset(); // Limpa o formulário
            atualizarSaldos();
        } else {
            alert('Por favor, preencha todos os campos da dívida corretamente.');
        }
    });

    // Marcar Dívida como Paga ou Remover
    listaDividas.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return; // Se o clique não foi em um LI, sai

        const index = parseInt(li.getAttribute('data-index'));

        if (e.target.classList.contains('btn-marcar-pago')) {
            if (dividas[index].parcelasRestantes > 0) {
                dividas[index].parcelasRestantes--;

                const hoje = new Date();
                const dataFormatada = hoje.toISOString().split('T')[0]; // YYYY-MM-DD

                const transacaoPagamento = {
                    tipo: 'saida',
                    descricao: `Pagamento Parcela ${dividas[index].totalParcelas - dividas[index].parcelasRestantes + 1}/${dividas[index].totalParcelas} - ${dividas[index].nome}`, // Ajusta o contador da parcela
                    valor: dividas[index].valorParcela,
                    data: dataFormatada
                };
                extrato.push(transacaoPagamento);

                if (dividas[index].parcelasRestantes === 0) {
                    li.classList.add('divida-paga');
                    e.target.style.display = 'none'; // Esconde o botão "Marcar como Pago"
                }
                atualizarSaldos();
            }
        } else if (e.target.classList.contains('remover-btn')) {
            if (confirm('Tem certeza que deseja remover esta dívida?')) {
                dividas.splice(index, 1); // Remove a dívida do array
                atualizarSaldos();
            }
        }
    });

    // Adicionar Transação ao Extrato
    formExtrato.addEventListener('submit', (e) => {
        e.preventDefault();

        const tipo = tipoTransacaoInput.value;
        const descricao = descricaoTransacaoInput.value;
        const valor = parseFloat(valorTransacaoInput.value);
        const data = dataTransacaoInput.value; // Formato YYYY-MM-DD

        if (descricao && !isNaN(valor) && valor > 0 && data) {
            const novaTransacao = {
                tipo: tipo,
                descricao: descricao,
                valor: valor,
                data: data
            };
            extrato.push(novaTransacao);
            formExtrato.reset(); // Limpa o formulário
            atualizarSaldos(); // Re-renderiza o extrato e atualiza o saldo (se a transação impactar)
        } else {
            alert('Por favor, preencha todos os campos da transação corretamente.');
        }
    });

    // --- Novo Event Listener para Imprimir Extrato ---
    btnImprimirExtrato.addEventListener('click', () => {
        window.print(); // Abre a caixa de diálogo de impressão do navegador
    });


    // --- Inicialização ---
    // Define a data atual no campo de data do extrato ao carregar a página
    dataTransacaoInput.valueAsDate = new Date();

    // Chama a função de atualização inicial para carregar os dados salvos
    atualizarSaldos();
});