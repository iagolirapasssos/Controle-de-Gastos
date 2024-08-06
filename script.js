let gastos = [];
let limiteGasto = 0;
let receitaMensal = 0;
let grafico = null;
let abaAtiva = 'controle';

function mostrarErro(mensagem) {
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = mensagem;
    errorContainer.style.display = 'block';
    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
}

// Função para carregar dados do TinyDB
function carregarDados() {
    try {
        window.AppInventor.setWebViewString("get_data");
    } catch (error) {
        mostrarErro('Erro ao carregar dados: ' + error.message);
    }
}

// Função para salvar dados no TinyDB
function salvarDados() {
    try {
        const dados = {
            limiteGasto,
            receitaMensal,
            gastos,
            abaAtiva
        };
        window.AppInventor.setWebViewString(JSON.stringify(dados));
    } catch (error) {
        mostrarErro('Erro ao salvar dados: ' + error.message);
    }
}

// Função chamada quando a WebView é carregada
window.addEventListener('load', () => {
    try {
        carregarDados();
    } catch (error) {
        mostrarErro('Erro ao carregar a página: ' + error.message);
    }
});

// Função para receber dados do TinyDB
window.AppInventorReceiveData = function(dados) {
    try {
        if (dados) {
            const dadosParse = typeof dados === 'string' ? JSON.parse(dados) : dados;
            limiteGasto = dadosParse.limiteGasto || 0;
            receitaMensal = dadosParse.receitaMensal || 0;
            gastos = Array.isArray(dadosParse.gastos) ? dadosParse.gastos : [];
            abaAtiva = dadosParse.abaAtiva || 'controle';

            // Atualizar os valores dos campos no HTML
            document.getElementById('receitaMensal').value = receitaMensal;
            document.getElementById('limite').value = limiteGasto;

            atualizarLista();
            atualizarStatus();
            ativarAba(abaAtiva);
        }
    } catch (error) {
        mostrarErro('Erro ao receber dados: ' + error.message);
    }
};


// Definir limite e receita
function definirLimiteEReceita() {
    try {
        receitaMensal = parseFloat(document.getElementById('receitaMensal').value);
        limiteGasto = parseFloat(document.getElementById('limite').value);
        atualizarStatus();
        salvarDados();
    } catch (error) {
        mostrarErro('Erro ao definir limite e receita: ' + error.message);
    }
}

// Atualizar limite baseado na receita mensal
function atualizarLimite() {
    try {
        const receita = parseFloat(document.getElementById('receitaMensal').value);
        if (!isNaN(receita)) {
            document.getElementById('limite').value = (receita / 3).toFixed(2);
        } else {
            document.getElementById('limite').value = '';
        }
    } catch (error) {
        mostrarErro('Erro ao atualizar limite: ' + error.message);
    }
}

// Adicionar um novo gasto
function adicionarGasto() {
    try {
        const produto = document.getElementById('produto').value.trim();
        const valor = parseFloat(document.getElementById('valor').value);

        if (!produto || isNaN(valor) || valor <= 0) {
            alert('Por favor, insira um nome de produto válido e um valor positivo.');
            return;
        }

        const data = new Date();

        const gasto = {
            id: Date.now(),
            produto: produto,
            valor: valor,
            data: data.toLocaleDateString(),
            hora: data.toLocaleTimeString(),
            mes: data.getMonth(),
            ano: data.getFullYear()
        };

        gastos.push(gasto);
        atualizarLista();
        atualizarStatus();
        atualizarGrafico();
        salvarDados();

        document.getElementById('produto').value = '';
        document.getElementById('valor').value = '';
    } catch (error) {
        mostrarErro('Erro ao adicionar gasto: ' + error.message);
    }
}

// Excluir um gasto
function excluirGasto(id) {
    try {
        gastos = gastos.filter(gasto => gasto.id !== id);
        atualizarLista();
        atualizarStatus();
        atualizarGrafico();
        salvarDados();
    } catch (error) {
        mostrarErro('Erro ao excluir gasto: ' + error.message);
    }
}

// Deletar todos os dados e limpar o cache
function deletarDados() {
    try {
        gastos = [];
        limiteGasto = 0;
        receitaMensal = 0;
        abaAtiva = 'controle';
        salvarDados();
        atualizarLista();
        atualizarStatus();
        atualizarGrafico();
        document.getElementById('limite').value = '';
        document.getElementById('receitaMensal').value = '';
        alert('Todos os dados foram deletados.');
    } catch (error) {
        mostrarErro('Erro ao deletar dados: ' + error.message);
    }
}

// Atualizar lista de gastos
function atualizarLista() {
    try {
        const lista = document.getElementById('listaGastos');
        lista.innerHTML = '';

        const gastosPorMes = agruparGastosPorMes();

        gastosPorMes.forEach((mes, index) => {
            const liMes = document.createElement('li');
            liMes.textContent = mes.nome;
            liMes.classList.add('mes-header');
            lista.appendChild(liMes);

            mes.gastos.forEach(gasto => {
                const li = document.createElement('li');
                li.innerHTML = `${gasto.produto}: R$ ${gasto.valor.toFixed(2)} - ${gasto.data} ${gasto.hora} 
                                <button class="excluir-btn" onclick="excluirGasto(${gasto.id})">Excluir</button>`;
                lista.appendChild(li);
            });
        });
    } catch (error) {
        mostrarErro('Erro ao atualizar lista: ' + error.message);
    }
}

// Agrupar gastos por mês
function agruparGastosPorMes() {
    try {
        const meses = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];

        const agora = new Date();
        const mesAtual = agora.getMonth();
        const anoAtual = agora.getFullYear();

        const gastosPorMes = [];

        for (let i = 0; i < 12; i++) {
            const mesIndex = (mesAtual + i) % 12;
            const ano = (mesAtual + i) >= 12 ? anoAtual + 1 : anoAtual;

            const gastosMes = gastos.filter(gasto => gasto.mes === mesIndex && gasto.ano === ano);

            if (gastosMes.length > 0) {
                gastosPorMes.push({
                    nome: `${meses[mesIndex]} ${ano}`,
                    gastos: gastosMes
                });
            }
        }

        return gastosPorMes;
    } catch (error) {
        mostrarErro('Erro ao agrupar gastos por mês: ' + error.message);
    }
}

// Atualizar gráfico de gastos
function atualizarGrafico() {
    try {
        const ctx = document.getElementById('graficoGastos').getContext('2d');
        
        // Limpar o canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        const gastosPorMes = agruparGastosPorMes();

        const labels = gastosPorMes.map(mes => mes.nome);
        const valores = gastosPorMes.map(mes => mes.gastos.reduce((total, gasto) => total + gasto.valor, 0));

        if (grafico) {
            grafico.destroy();
            grafico = null;
        }

        if (valores.length === 0) {
            // Se não houver gastos, exibir uma mensagem
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('Nenhum gasto registrado', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        grafico = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Valor do Gasto',
                    data: valores,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)'
                }]
            },
            options: {
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        suggestedMax: Math.max(...valores) * 1.1, // 10% acima do valor máximo
                        title: {
                            display: true,
                            text: 'Gastos (R$)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Meses'
                        }
                    }
                },
                responsive: false,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    annotation: {
                        annotations: {
                            limite: {
                                type: 'line',
                                xMin: limiteGasto,
                                xMax: limiteGasto,
                                borderColor: 'red',
                                borderWidth: 2,
                                borderDash: [6, 6],
                                label: {
                                    content: 'Limite Mensal',
                                    enabled: true,
                                    position: 'end',
                                    backgroundColor: 'red'
                                }
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        mostrarErro('Erro ao atualizar gráfico: ' + error.message);
    }
}

// Atualizar status dos gastos
function atualizarStatus() {
    try {
        const totalGasto = gastos.reduce((total, gasto) => total + gasto.valor, 0);
        const percentual = (totalGasto / limiteGasto) * 100;
        const statusBar = document.getElementById('statusBarFill');
        const statusInfo = document.getElementById('statusInfo');

        statusBar.style.width = `${Math.min(percentual, 100)}%`;

        if (percentual < 80) {
            statusBar.style.backgroundColor = '#4CAF50'; // Verde
        } else if (percentual < 100) {
            statusBar.style.backgroundColor = '#FFA500'; // Laranja
        } else {
            statusBar.style.backgroundColor = '#FF0000'; // Vermelho
        }

        const dataAtual = new Date();
        const diasPassados = dataAtual.getDate();
        const mediaDiariaGastos = totalGasto / diasPassados;
        const diasNoMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0).getDate();
        const projecaoGastosMensal = mediaDiariaGastos * diasNoMes;
        const saldoDisponivel = receitaMensal - totalGasto;
        const percentualEconomizado = ((receitaMensal - totalGasto) / receitaMensal) * 100;

        document.getElementById('gastoAtual').textContent = totalGasto.toFixed(2);
        document.getElementById('limiteAtual').textContent = limiteGasto.toFixed(2);
        document.getElementById('economiaSugerida').textContent = (receitaMensal * 0.2).toFixed(2);
        document.getElementById('outrasAtividades').textContent = (receitaMensal * 0.1).toFixed(2);
        document.getElementById('diferenca').textContent = saldoDisponivel.toFixed(2);
        document.getElementById('percentualGasto').textContent = ((totalGasto / receitaMensal) * 100).toFixed(2);
        document.getElementById('mediaDiariaGastos').textContent = mediaDiariaGastos.toFixed(2);
        document.getElementById('projecaoGastosMensal').textContent = projecaoGastosMensal.toFixed(2);
        document.getElementById('saldoDisponivel').textContent = saldoDisponivel.toFixed(2);
        document.getElementById('percentualEconomizado').textContent = percentualEconomizado.toFixed(2);
    } catch (error) {
        mostrarErro('Erro ao atualizar status dos gastos: ' + error.message);
    }
}

// Gerenciamento de abas
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        try {
            abaAtiva = button.dataset.tab;
            ativarAba(abaAtiva);
        } catch (error) {
            mostrarErro('Erro ao gerenciar abas: ' + error.message);
        }
    });
});

function ativarAba(tab) {
    try {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        document.querySelector(`.tab-button[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(tab).classList.add('active');

        if (tab === 'grafico') {
            atualizarGrafico();
        }
    } catch (error) {
        mostrarErro('Erro ao ativar aba: ' + error.message);
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    try {
        atualizarLista();
        atualizarStatus();
        ativarAba(abaAtiva);
    } catch (error) {
        mostrarErro('Erro na inicialização: ' + error.message);
    }
});

// Tooltip logic
document.querySelectorAll('.tooltip-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
        try {
            const tooltipText = e.target.getAttribute('data-tooltip');
            let tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.innerHTML = tooltipText;
            document.body.appendChild(tooltip);

            const rect = e.target.getBoundingClientRect();
            tooltip.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
            tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 10}px`;

            tooltip.style.display = 'block';

            setTimeout(() => {
                tooltip.remove();
            }, 3000);
        } catch (error) {
            mostrarErro('Erro na lógica do tooltip: ' + error.message);
        }
    });
});

