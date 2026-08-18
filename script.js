 (function() {
            // === DADOS DO RECEBEDOR ===
            const CHAVE_PIX = '+5592986021680';
            const NOME_RECEBEDOR = 'FABIO RESENDE DA SILVA';
            const CIDADE_RECEBEDOR = 'NOVO REMANSO';

            // === REFERÊNCIAS DOS CAMPOS ===
            const numRecibo = document.getElementById('numRecibo');
            const dataRecibo = document.getElementById('dataRecibo');
            const locador = document.getElementById('locador');
            const locatario = document.getElementById('locatario');
            const imovel = document.getElementById('imovel');
            const valorAluguel = document.getElementById('valorAluguel');
            const diaVencimento = document.getElementById('diaVencimento');
            const medidor = document.getElementById('medidor');
            const leituraAtual = document.getElementById('leituraAtual');
            const leituraAnterior = document.getElementById('leituraAnterior');
            const tarifa = document.getElementById('tarifa');
            const periodoInicio = document.getElementById('periodoInicio');
            const periodoFim = document.getElementById('periodoFim');
            const pagDinheiro = document.getElementById('pagDinheiro');
            const pagPix = document.getElementById('pagPix');
            const pagTransferencia = document.getElementById('pagTransferencia');
            const cidade = document.getElementById('cidade');
            const dataAssinatura = document.getElementById('dataAssinatura');
            const btnGerar = document.getElementById('btnGerar');
            const reciboArea = document.getElementById('reciboArea');
            const reciboContent = document.getElementById('reciboContent');
            const btnImprimir = document.getElementById('btnImprimir');
            const btnBaixarPDF = document.getElementById('btnBaixarPDF');

            // === FUNÇÕES AUXILIARES ===
            function formatarData(dataStr) {
                if (!dataStr) return '____/____/____';
                const partes = dataStr.split('-');
                return `${partes[2]}/${partes[1]}/${partes[0]}`;
            }

            function formatarMoeda(valor) {
                return 'R$ ' + parseFloat(valor).toFixed(2).replace('.', ',');
            }

            function escreverPorExtenso(valor) {
                const inteiro = Math.floor(valor);
                if (inteiro === 0) return 'zero reais';
                const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
                const dezenas = ['', 'dez', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
                const centenas = ['', 'cem', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
                let extenso = '';
                const cent = Math.floor(inteiro / 100);
                const resto = inteiro % 100;
                const dez = Math.floor(resto / 10);
                const uni = resto % 10;
                if (cent > 0) {
                    extenso += centenas[cent];
                    if (resto > 0) extenso += ' e ';
                }
                if (dez > 0) {
                    if (dez === 1 && uni > 0) {
                        const especiais = ['', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
                        extenso += especiais[uni];
                    } else {
                        extenso += dezenas[dez];
                        if (uni > 0) extenso += ' e ' + unidades[uni];
                    }
                } else if (uni > 0 && cent === 0) {
                    extenso += unidades[uni];
                }
                if (extenso === '') extenso = 'zero';
                extenso += (inteiro === 1) ? ' real' : ' reais';
                const centavos = Math.round((valor - inteiro) * 100);
                if (centavos > 0) {
                    extenso += ' e ' + centavos + (centavos === 1 ? ' centavo' : ' centavos');
                }
                return extenso;
            }

            // === CRC16-CCITT (PADRÃO PIX) ===
            function crc16(str) {
                let crc = 0xFFFF;
                for (let i = 0; i < str.length; i++) {
                    crc ^= str.charCodeAt(i) << 8;
                    for (let j = 0; j < 8; j++) {
                        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
                    }
                    crc &= 0xFFFF;
                }
                return crc.toString(16).toUpperCase().padStart(4, '0');
            }

            // === GERA QR CODE PIX ===
            function gerarQRCodePix(valor) {
                const valorNumerico = parseFloat(valor);
                if (isNaN(valorNumerico) || valorNumerico <= 0) return '';
                const valorStr = valorNumerico.toFixed(2);

                let payload = '000201';
                const gui = 'BR.GOV.BCB.PIX';
                const guiCampo = `00${String(gui.length).padStart(2,'0')}${gui}`;
                const chaveCampo = `01${String(CHAVE_PIX.length).padStart(2,'0')}${CHAVE_PIX}`;
                const merchantAccount = guiCampo + chaveCampo;
                payload += `26${String(merchantAccount.length).padStart(2,'0')}${merchantAccount}`;
                payload += '52040000';
                payload += '5303986';
                payload += `54${String(valorStr.length).padStart(2,'0')}${valorStr}`;
                payload += '5802BR';
                const nomeLimpo = NOME_RECEBEDOR.substring(0, 25);
                payload += `59${String(nomeLimpo.length).padStart(2,'0')}${nomeLimpo}`;
                const cidadeLimpa = CIDADE_RECEBEDOR.substring(0, 15);
                payload += `60${String(cidadeLimpa.length).padStart(2,'0')}${cidadeLimpa}`;
                payload += '62070503***';
                payload += '6304';
                payload += crc16(payload);

                return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`;
            }

            // === GERAR RECIBO ===
            function gerarRecibo() {
                // Validação de campos
                const campos = [
                    { el: numRecibo, nome: 'Nº do Recibo' },
                    { el: dataRecibo, nome: 'Data do Recibo' },
                    { el: locador, nome: 'Locador' },
                    { el: locatario, nome: 'Locatário' },
                    { el: imovel, nome: 'Imóvel' },
                    { el: valorAluguel, nome: 'Valor do Aluguel' },
                    { el: diaVencimento, nome: 'Dia de Vencimento' },
                    { el: medidor, nome: 'Nº do Medidor' },
                    { el: leituraAtual, nome: 'Leitura Atual' },
                    { el: leituraAnterior, nome: 'Leitura Anterior' },
                    { el: tarifa, nome: 'Tarifa' },
                    { el: periodoInicio, nome: 'Período Início' },
                    { el: periodoFim, nome: 'Período Fim' },
                    { el: cidade, nome: 'Cidade' },
                    { el: dataAssinatura, nome: 'Data de Assinatura' }
                ];
                for (let campo of campos) {
                    if (!campo.el.value.trim()) {
                        alert(`❌ O campo "${campo.nome}" é obrigatório.`);
                        campo.el.focus();
                        return;
                    }
                }

                // Leitura dos valores
                const nRecibo = numRecibo.value.trim();
                const dataRec = formatarData(dataRecibo.value);
                const locadorVal = locador.value.trim();
                const locatarioVal = locatario.value.trim();
                const imovelVal = imovel.value.trim();
                const valorAluguelVal = parseFloat(valorAluguel.value) || 0;
                const diaVen = diaVencimento.value.trim();
                const medidorVal = medidor.value.trim();
                const leitAtual = parseInt(leituraAtual.value) || 0;
                const leitAnterior = parseInt(leituraAnterior.value) || 0;
                const tarifaVal = parseFloat(tarifa.value) || 0;
                const consumo = leitAtual - leitAnterior;
                const valorEnergia = consumo * tarifaVal;
                const totalRecebido = valorAluguelVal + valorEnergia;

                const periodoInicioStr = formatarData(periodoInicio.value);
                const periodoFimStr = formatarData(periodoFim.value);
                const cidadeVal = cidade.value.trim();

                let pagamentos = [];
                if (pagDinheiro.checked) pagamentos.push('Dinheiro');
                if (pagPix.checked) pagamentos.push('Pix');
                if (pagTransferencia.checked) pagamentos.push('Transferência');
                let pagStr = pagamentos.length ? pagamentos.join(' / ') : '( ) Dinheiro ( ) Pix ( ) Transferência';

                const qrCodeUrl = gerarQRCodePix(totalRecebido);

                // === MONTA O RECIBO ===
                reciboContent.innerHTML = `
                    <div class="titulo-principal">RECIBO DE ALUGUEL</div>
                    <div class="num-data">
                        <span>Nº: ${nRecibo}</span>
                        <span>Data: ${dataRec}</span>
                    </div>
                    <div class="dados-linha"><strong>Locador:</strong> <span class="valor">${locadorVal}</span></div>
                    <div class="dados-linha"><strong>Locatário:</strong> <span class="valor">${locatarioVal}</span></div>
                    <div class="dados-linhas"><strong>Imóvel:</strong><span class="valor">${imovelVal}</span></div>

                    <div class="subtitulo">Condições do Aluguel</div>
                    <div class="dados-linha"><strong>Valor mensal:</strong> <span class="valor">${formatarMoeda(valorAluguelVal)} conforme o acordo que fizemos</span></div>
                    <div class="dados-linha"><strong>Pagamento:</strong> <span class="valor">sempre até o dia ${diaVen} de cada mês</span></div>
                    <div class="dados-linha"><strong>Energia elétrica:</strong> <span class="valor">por conta do locatário </span></div>

                    <div class="subtitulo">CONTROLE DE CONSUMO DE ENERGIA</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Nº do medidor</th>
                                <th>Leit. atual (kWh)</th>
                                <th>Leit. anterior (kWh)</th>
                                <th>Consumo (kWh)</th>
                                <th>Tarifa (R$/kWh)</th>
                                <th>Valor (R$)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${medidorVal}</td>
                                <td>${String(leitAtual).padStart(5, '0')}</td>
                                <td>${String(leitAnterior).padStart(5, '0')}</td>
                                <td>${String(consumo).padStart(5, '0')}</td>
                                <td>${tarifaVal.toFixed(6)}</td>
                                <td>${formatarMoeda(valorEnergia)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- ✅ LADO ESQUERDO = PERÍODO + VALOR + PAGAMENTO | LADO DIREITO = QR CODE + DADOS PIX EMBAIXO -->
                    <div class="bloco-principal">
                        <div class="lado-esquerdo">
                            <div class="info-periodo">
                                <strong>Referente ao período:</strong> ${periodoInicioStr} a ${periodoFimStr}
                            </div>
                            <div class="valor-recebido">
                                <strong>Valor recebido:</strong> ${formatarMoeda(totalRecebido)} (${escreverPorExtenso(totalRecebido)})
                            </div>
                            <div class="forma-pagamento">
                                <strong>Pagamento:</strong> ${pagStr}
                            </div>
                        </div>

                        <div class="lado-direito">
                            <div class="qrcode-container">
                                <img src="${qrCodeUrl}" alt="QR Code Pix" />
                            </div>
                            <div class="pix-texto">
                                Pague com Pix - Chave: (92) 98602-1680<br>
                                Valor: ${formatarMoeda(totalRecebido)}
                            </div>
                        </div>
                    </div>

                    <div class="data-assinatura">
                        <div class="local-data">
                            ${cidadeVal}, ____ de __________ de 2026.
                        </div>
                        <div class="assinatura">
                            <div class="linha"></div>
                            <div class="legenda">Assinatura do Locador</div>
                        </div>
                    </div>
                `;

                reciboArea.classList.add('visivel');
                reciboArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            // === EVENTOS ===
            btnGerar.addEventListener('click', gerarRecibo);

            btnImprimir.addEventListener('click', function() {
                window.print();
            });

         // --- Baixar PDF com delay para garantir renderização ---
            btnBaixarPDF.addEventListener('click', function() {
                const element = document.getElementById('reciboContent');
                if (!element.innerHTML.trim()) {
                    alert('❌ Gere o recibo primeiro antes de baixar o PDF.');
                    return;
                }
                // Pequeno delay para garantir que tudo está carregado
                setTimeout(() => {
                    html2pdf().set({
                        margin: [0.5, 0.5, 0.5, 0.5],
                        filename: 'recibo_aluguel.pdf',
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, letterRendering: true },
                        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
                    }).from(element).save();
                }, 300);
            });

            // === PREENCHE DATAS AUTOMATICAMENTE ===
            window.addEventListener('DOMContentLoaded', function() {
                const hoje = new Date();
                const ano = hoje.getFullYear();
                const mes = String(hoje.getMonth() + 1).padStart(2, '0');
                const dia = String(hoje.getDate()).padStart(2, '0');
                const dataHoje = `${ano}-${mes}-${dia}`;
                dataRecibo.value = dataHoje;
                dataAssinatura.value = dataHoje;

                let mesPassado = hoje.getMonth();
                let anoPassado = ano;
                if (mesPassado === 0) { mesPassado = 12; anoPassado--; }
                const diaPeriodo = '19';
                const mesPassadoStr = String(mesPassado).padStart(2, '0');
                const mesAtualStr = String(hoje.getMonth() + 1).padStart(2, '0');
                periodoInicio.value = `${anoPassado}-${mesPassadoStr}-${diaPeriodo}`;
                periodoFim.value = `${ano}-${mesAtualStr}-${diaPeriodo}`;
            });

        })();