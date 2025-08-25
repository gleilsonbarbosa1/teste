import React, { useState, useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import { PDVCashRegister, PDVCashRegisterSummary, PDVCashRegisterEntry } from '../../types/pdv';

interface CashRegisterPrintViewProps {
  register: PDVCashRegister;
  summary: PDVCashRegisterSummary;
  entries: PDVCashRegisterEntry[];
  onClose: () => void;
}

const CashRegisterPrintView: React.FC<CashRegisterPrintViewProps> = ({
  register,
  summary,
  entries,
  onClose
}) => {
  const [printerSettings, setPrinterSettings] = useState({
    paper_width: '80mm',
    page_size: 300,
    font_size: 14,
    delivery_font_size: 14,
    scale: 1,
    margin_left: 0,
    margin_top: 1,
    margin_bottom: 1
  });

  // Carregar configurações de impressora do localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('pdv_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.printer_layout) {
          setPrinterSettings(settings.printer_layout);
        }
      } catch (e) {
        console.error('Erro ao carregar configurações de impressora:', e);
      }
    }
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'pix': 'PIX',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'voucher': 'Voucher',
      'misto': 'Pagamento Misto'
    };
    return labels[method] || method;
  };

  const handlePrint = () => {
    // Criar uma nova janela com conteúdo específico para impressão térmica
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Caixa #${register.id.slice(-8)}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
            padding: 0;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            font-weight: normal;
            line-height: 1.3;
            color: black;
            background: white;
            padding: 1mm;
            width: 78mm;
            margin: 0 auto;
          }
          
          .center { text-align: center; }
          .bold { font-weight: 900; color: #000000 !important; }
          .title { font-weight: 900; color: #000000 !important; font-size: 16px !important; }
          .subtitle { font-weight: bold; color: #333333 !important; font-size: 14px !important; }
          .small { font-size: 12px; font-weight: normal; color: #000000 !important; }
          .text { font-size: 14px; font-weight: normal; color: #000000 !important; }
          .value { font-size: 14px; font-weight: bold; color: #000000 !important; }
          .separator { 
            border-bottom: 2px solid #000000; 
            margin: 3px 0; 
            padding-bottom: 3px; 
          }
          .separator-light { 
            border-bottom: 1px dashed #666666; 
            margin: 2px 0; 
            padding-bottom: 2px; 
          }
          .flex-between { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            width: 100%;
            font-weight: normal;
            color: #000000;
          }
          .mb-1 { margin-bottom: 2px; }
          .mb-2 { margin-bottom: 3px; }
          .mb-3 { margin-bottom: 5px; }
          .mt-1 { margin-top: 2px; }
          .mt-2 { margin-top: 3px; }
          .ml-2 { margin-left: 5px; }
          
          /* Força cores específicas */
          .header-title {
            font-weight: 900 !important;
            color: #000000 !important;
            font-size: 18px !important;
            text-align: center;
          }
          
          .section-title {
            font-weight: bold !important;
            color: #000000 !important;
            font-size: 15px !important;
            text-transform: uppercase;
          }
          
          .item-label {
            font-weight: normal !important;
            color: #333333 !important;
            font-size: 13px !important;
          }
          
          .item-value {
            font-weight: bold !important;
            color: #000000 !important;
            font-size: 13px !important;
          }
          
          .total-value {
            font-weight: 900 !important;
            color: #000000 !important;
            font-size: 16px !important;
          }
        </style>
      </head>
      <body>
        <!-- Cabeçalho -->
        <div class="center mb-3 separator">
          <div class="header-title">ELITE AÇAÍ</div>
          <div class="subtitle">Relatório de Caixa</div>
          <div class="small">Rua Um, 1614-C</div>
          <div class="small">Residencial 1 - Cágado</div>
          <div class="small">Tel: (85) 98904-1010</div>
          <div class="small">CNPJ: 38.130.139/0001-22</div>
        </div>
        
        <!-- Dados do Caixa -->
        <div class="mb-3 separator">
          <div class="section-title center mb-2">=== MOVIMENTAÇÕES DO CAIXA ===</div>
          <div class="text">Caixa: <span class="value">#${register.id.slice(-8)}</span></div>
          <div class="text">Data: <span class="value">${new Date(register.opened_at).toLocaleDateString('pt-BR')}</span></div>
          <div class="text">Abertura: <span class="value">${formatDate(register.opened_at)}</span></div>
          ${register.closed_at ? `<div class="small">Fechamento: ${formatDate(register.closed_at)}</div>` : ''}
        </div>
        
        <!-- Resumo Financeiro -->
        <div class="mb-3 separator">
          <div class="section-title mb-1">RESUMO FINANCEIRO:</div>
          <div>
            <div class="flex-between">
              <span class="item-label">Valor de Abertura:</span>
              <span class="item-value">${formatPrice(register.opening_amount || 0)}</span>
            </div>
            <div class="flex-between">
              <span class="item-label">Vendas PDV:</span>
              <span class="item-value">${formatPrice(summary?.sales_total || 0)}</span>
            </div>
            <div class="flex-between">
              <span class="item-label">Vendas Delivery:</span>
              <span class="item-value">${formatPrice(summary?.delivery_total || 0)}</span>
            </div>
            <div class="flex-between">
              <span class="item-label">Outras Entradas:</span>
              <span class="item-value">${formatPrice(summary?.other_income_total || 0)}</span>
            </div>
            <div class="flex-between">
              <span class="item-label">Saídas:</span>
              <span class="item-value">${formatPrice(summary?.total_expense || 0)}</span>
            </div>
            <div style="border-top: 3px solid #000000; padding-top: 3px; margin-top: 3px;">
              <div class="flex-between">
                <span class="section-title">SALDO ESPERADO:</span>
                <span class="total-value">${formatPrice(summary?.expected_balance || 0)}</span>
              </div>
            </div>
            ${register.closing_amount !== null ? `
            <div class="flex-between">
              <span class="item-label">Valor de Fechamento:</span>
              <span class="item-value">${formatPrice(register.closing_amount)}</span>
            </div>
            <div class="flex-between">
              <span class="section-title">Diferença:</span>
              <span class="total-value">
                ${(() => {
                  const difference = (register.closing_amount || 0) - (summary?.expected_balance || 0);
                  return formatPrice(difference);
                })()}
                <span class="value">
                  ${(() => {
                    const difference = (register.closing_amount || 0) - (summary?.expected_balance || 0);
                    return difference < 0 ? '(falta)' : difference > 0 ? '(sobra)' : '(exato)';
                  })()}
                  <span class="value" style="margin-left: 6px;">
              </span>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Totais por Forma de Pagamento -->
        <div class="mb-3 separator">
          <div class="section-title mb-1">POR FORMA DE PAGAMENTO:</div>
          <div>
            ${['dinheiro', 'pix', 'cartao_credito', 'cartao_debito'].map(method => {
              const methodEntries = entries.filter(e => e.payment_method === method);
              const income = methodEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
              const expense = methodEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
              const total = income - expense;
              
              if (total !== 0) {
                return `
                  <div class="flex-between">
                    <span class="item-label">${getPaymentMethodLabel(method)}:</span>
                    <span class="item-value">${formatPrice(total)}</span>
                  </div>
                `;
              }
              return '';
            }).join('')}
          </div>
        </div>

        <!-- Rodapé -->
        <div class="center" style="border-top: 3px solid #000000; padding-top: 5px;">
          <div class="mb-2">
            <div class="section-title">RELATÓRIO DE CAIXA</div>
            <div class="subtitle">Elite Açaí - Sistema PDV</div>
          </div>
          
          <div class="mb-2">
            <div class="text">Operador: <span class="value">Sistema</span></div>
            <div class="text">Impresso: <span class="value">${new Date().toLocaleString('pt-BR')}</span></div>
          </div>

          <div style="margin-top: 8px; padding-top: 5px; border-top: 2px solid #000000;">
            <div class="small">Elite Açaí - CNPJ: 38.130.139/0001-22</div>
            <div class="small">Este é um relatório interno</div>
            <div class="small">Não é um documento fiscal</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Aguardar carregar e imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  return (
    <>
      {/* Modal Interface - Hidden on print */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
        <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden">
          {/* Controls */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Imprimir Relatório de Caixa</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Gerar mensagem do relatório para WhatsApp
                    let message = `📊 *RELATÓRIO DE CAIXA - ELITE AÇAÍ*\n\n`;
                    message += `📋 *Caixa #${register.id.slice(-8)}*\n`;
                    message += `🕐 Abertura: ${formatDate(register.opened_at)}\n`;
                    if (register.closed_at) {
                      message += `🕐 Fechamento: ${formatDate(register.closed_at)}\n`;
                    }
                    message += `\n`;

                    message += `💰 *RESUMO FINANCEIRO:*\n`;
                    message += `Valor de Abertura: ${formatPrice(register.opening_amount || 0)}\n`;
                    message += `Vendas PDV: ${formatPrice(summary?.sales_total || 0)}\n`;
                    message += `Vendas Delivery: ${formatPrice(summary?.delivery_total || 0)}\n`;
                    message += `Outras Entradas: ${formatPrice(summary?.other_income_total || 0)}\n`;
                    message += `Saídas: ${formatPrice(summary?.total_expense || 0)}\n`;
                    message += `*SALDO ESPERADO: ${formatPrice(summary?.expected_balance || 0)}*\n`;
                    
                    if (register.closing_amount !== null) {
                      message += `Valor de Fechamento: ${formatPrice(register.closing_amount)}\n`;
                      const difference = (register.closing_amount || 0) - (summary?.expected_balance || 0);
                      message += `Diferença: ${formatPrice(difference)}`;
                      if (difference !== 0) {
                        message += ` (${difference > 0 ? 'sobra' : 'falta'})`;
                      }
                      message += `\n`;
                    }
                    message += `\n`;

                    message += `📋 *MOVIMENTAÇÕES:*\n`;
                    if (entries.length === 0) {
                      message += `Nenhuma movimentação registrada\n`;
                    } else {
                      entries.forEach((entry, index) => {
                        message += `${index + 1}. ${entry.type === 'income' ? 'ENTRADA' : 'SAÍDA'}\n`;
                        message += `   Descrição: ${entry.description}\n`;
                        message += `   Valor: ${entry.type === 'income' ? '+' : '-'}${formatPrice(entry.amount)}\n`;
                        message += `   Forma: ${getPaymentMethodLabel(entry.payment_method)}\n`;
                        message += `   Data: ${formatDate(entry.created_at)}\n\n`;
                      });
                    }

                    message += `📱 Sistema PDV - Elite Açaí\n`;
                    message += `🕐 Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`;

                    // Abrir WhatsApp
                    window.open(`https://wa.me/5585989041010?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                  title="Enviar relatório para WhatsApp"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  WhatsApp
                </button>
                <button
                  onClick={handlePrint}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  <Printer size={16} />
                  Imprimir
                </button>
                <button
                  onClick={onClose}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm">
              <div className="text-center mb-4">
                <p className="font-bold text-lg">ELITE AÇAÍ</p>
                <p className="text-sm">Relatório de Caixa</p>
                <p className="text-xs">Rua Um, 1614-C</p>
                <p className="text-xs">Residencial 1 - Cágado</p>
                <p className="text-xs">Tel: (85) 98904-1010</p>
                <p className="text-xs">CNPJ: 38.130.139/0001-22</p>
                <p className="text-xs">--------------------------</p>
              </div>
              
              <div className="mb-3">
                <p className="text-sm font-bold text-center text-gray-900">=== MOVIMENTAÇÕES DO CAIXA ===</p>
                <p className="text-xs text-gray-800">Caixa: <span className="font-semibold">#{register.id.slice(-8)}</span></p>
                <p className="text-xs text-gray-800">Data: <span className="font-semibold">{new Date(register.opened_at).toLocaleDateString('pt-BR')}</span></p>
                <p className="text-xs text-gray-800">Abertura: <span className="font-semibold">{formatDate(register.opened_at)}</span></p>
                {register.closed_at && <p className="text-xs">Fechamento: {formatDate(register.closed_at)}</p>}
                <p className="text-xs">--------------------------</p>
              </div>
              
              <div className="mb-3">
                <p className="text-sm font-bold text-gray-900">RESUMO FINANCEIRO:</p>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Valor de Abertura:</span>
                    <span className="font-semibold text-gray-900">{formatPrice(register.opening_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Vendas PDV:</span>
                    <span className="font-semibold text-green-700">{formatPrice(summary?.sales_total || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Vendas Delivery:</span>
                    <span className="font-semibold text-blue-700">{formatPrice(summary?.delivery_total || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Outras Entradas:</span>
                    <span className="font-semibold text-purple-700">{formatPrice(summary?.other_income_total || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Saídas:</span>
                    <span className="font-semibold text-red-700">{formatPrice(summary?.total_expense || 0)}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-300">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-900">SALDO ESPERADO:</span>
                      <span className="font-bold text-lg text-green-800">{formatPrice(summary?.expected_balance || 0)}</span>
                    </div>
                  </div>
                  {register.closing_amount !== null && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Valor de Fechamento:</span>
                        <span className="font-semibold text-gray-900">{formatPrice(register.closing_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-900">Diferença:</span>
                        <span className="font-bold text-lg">
                          {(() => {
                            const difference = (register.closing_amount || 0) - (summary?.expected_balance || 0);
                            const color = difference === 0 ? 'text-gray-900' : difference > 0 ? 'text-green-700' : 'text-red-700';
                            return (
                              <span className={color}>
                                {formatPrice(difference)}
                              </span>
                            );
                          })()}
                          <span className="text-xs ml-2">
                            {(() => {
                              const difference = (register.closing_amount || 0) - (summary?.expected_balance || 0);
                              return difference < 0 ? '(falta)' : difference > 0 ? '(sobra)' : '(exato)';
                            })()}
                          </span>
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs">--------------------------</p>
              </div>
              
              <div className="mb-3">
                <p className="text-sm font-bold text-gray-900">POR FORMA DE PAGAMENTO:</p>
                <div className="text-xs space-y-1">
                  {['dinheiro', 'pix', 'cartao_credito', 'cartao_debito'].map(method => {
                    const methodEntries = entries.filter(e => e.payment_method === method);
                    const income = methodEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
                    const expense = methodEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
                    const total = income - expense;
                    
                    if (total !== 0) {
                      return (
                        <div key={method} className="flex justify-between">
                          <span className="text-gray-700">{getPaymentMethodLabel(method)}:</span>
                          <span className="font-semibold text-gray-900">{formatPrice(total)}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
                <p className="text-xs">--------------------------</p>
              </div>
              
              <div className="text-center text-xs">
                <p className="font-bold text-gray-900 text-sm">RELATÓRIO DE CAIXA</p>
                <p className="text-gray-800">Elite Açaí - Sistema PDV</p>
                <p className="mt-2 text-gray-700">Operador: <span className="font-semibold">Sistema</span></p>
                <p className="text-gray-700">Impresso: <span className="font-semibold">{new Date().toLocaleString('pt-BR')}</span></p>
                <div className="mt-2 pt-2 border-t border-gray-300">
                  <p className="text-gray-600">Elite Açaí - CNPJ: 38.130.139/0001-22</p>
                  <p className="text-gray-600">Este é um relatório interno</p>
                  <p className="text-gray-600">Não é um documento fiscal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Content - Only visible when printing */}
      <div className="hidden print:block print:w-full print:h-full print:bg-white print:text-black thermal-print-content">
        <div style={{ fontFamily: 'Courier New, monospace', fontSize: '12px', lineHeight: '1.3', color: 'black', background: 'white', padding: '2mm', margin: '0' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '1px dashed black', paddingBottom: '5px', color: 'black', background: 'white' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 3px 0' }}>ELITE AÇAÍ</h1>
            <p style={{ fontSize: '12px', margin: '1px 0' }}>Relatório de Caixa</p>
            <p style={{ fontSize: '12px', margin: '1px 0' }}>Rua Um, 1614-C</p>
            <p style={{ fontSize: '12px', margin: '1px 0' }}>Residencial 1 - Cágado</p>
            <p style={{ fontSize: '12px', margin: '1px 0' }}>Tel: (85) 98904-1010</p>
            <p style={{ fontSize: '12px', margin: '1px 0' }}>CNPJ: 38.130.139/0001-22</p>
          </div>

          {/* Order Info */}
          <div style={{ marginBottom: '10px', color: 'black', background: 'white' }}>
            <p style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center', marginBottom: '5px' }}>=== MOVIMENTAÇÕES DO CAIXA ===</p>
            <p style={{ fontSize: '12px', margin: '1px 0' }}>Caixa: #{register.id.slice(-8)}</p>
            <p style={{ fontSize: '12px', margin: '1px 0' }}>Data: {new Date(register.opened_at).toLocaleDateString('pt-BR')}</p>
            <p style={{ fontSize: '12px', margin: '1px 0' }}>Abertura: {formatDate(register.opened_at)}</p>
            {register.closed_at && (
              <p style={{ fontSize: '12px', margin: '1px 0' }}>Fechamento: {formatDate(register.closed_at)}</p>
            )}
          </div>

          {/* Financial Summary */}
          <div style={{ borderBottom: '1px dashed black', paddingBottom: '5px', marginBottom: '10px', color: 'black', background: 'white' }}>
            <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '3px' }}>RESUMO FINANCEIRO:</p>
            <div style={{ fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                <span>Valor de Abertura:</span>
                <span>{formatPrice(register.opening_amount || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                <span>Vendas PDV:</span>
                <span>{formatPrice(summary?.sales_total || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                <span>Vendas Delivery:</span>
                <span>{formatPrice(summary?.delivery_total || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                <span>Outras Entradas:</span>
                <span>{formatPrice(summary?.other_income_total || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                <span>Saídas:</span>
                <span>{formatPrice(summary?.total_expense || 0)}</span>
              </div>
              <div style={{ borderTop: '1px solid black', paddingTop: '3px', marginTop: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>SALDO ESPERADO:</span>
                  <span>{formatPrice(summary?.expected_balance || 0)}</span>
                </div>
              </div>
              {register.closing_amount !== null && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                    <span>Valor de Fechamento:</span>
                    <span>{formatPrice(register.closing_amount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                    <span>Diferença:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {(() => {
                        const difference = (register.closing_amount || 0) - (summary?.expected_balance || 0);
                        return formatPrice(difference);
                      })()}
                      <span style={{ fontSize: '10px', marginLeft: '6px' }}>
                        {(() => {
                          const difference = (register.closing_amount || 0) - (summary?.expected_balance || 0);
                          return difference < 0 ? '(falta)' : difference > 0 ? '(sobra)' : '(exato)';
                        })()}
                      </span>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Detailed Movements */}
          {/* Payment Methods Summary */}
          <div style={{ borderBottom: '1px dashed black', paddingBottom: '5px', marginBottom: '10px', color: 'black', background: 'white' }}>
            <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '3px' }}>POR FORMA DE PAGAMENTO:</p>
            <div style={{ fontSize: '12px' }}>
              {['dinheiro', 'pix', 'cartao_credito', 'cartao_debito'].map(method => {
                const methodEntries = entries.filter(e => e.payment_method === method);
                const income = methodEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
                const expense = methodEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
                const total = income - expense;
                
                if (total !== 0) {
                  return (
                    <div key={method} style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                      <span>{getPaymentMethodLabel(method)}:</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', fontSize: '12px', borderTop: '1px dashed black', paddingTop: '5px', color: 'black', background: 'white' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>RELATÓRIO DE CAIXA</p>
            <p style={{ margin: '1px 0' }}>Elite Açaí - Sistema PDV</p>
            <p style={{ margin: '1px 0' }}>Operador: Sistema</p>
            <p style={{ margin: '1px 0' }}>Impresso: {new Date().toLocaleString('pt-BR')}</p>
            <div style={{ marginTop: '8px', paddingTop: '5px', borderTop: '1px solid black' }}>
              <p style={{ margin: '1px 0' }}>Elite Açaí - CNPJ: 38.130.139/0001-22</p>
              <p style={{ margin: '1px 0' }}>Este é um relatório interno</p>
              <p style={{ margin: '1px 0' }}>Não é um documento fiscal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0 !important;
          }
          
          html, body {
            font-family: 'Courier New', monospace !important;
            font-size: 14px !important;
            line-height: 1.3 !important;
            color: black !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 80mm !important;
            height: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          * {
            color: black !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
            visibility: visible !important;
          }
          
          .print\\:w-full {
            width: 80mm !important;
          }
          
          .print\\:h-full {
            height: 100% !important;
          }
          
          .print\\:bg-white {
            background: white !important;
          }
          
          .print\\:text-black {
            color: black !important;
          }
          
          /* Force visibility for thermal printing */
          .thermal-print-content {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 80mm !important;
            height: auto !important;
            overflow: visible !important;
            font-family: 'Courier New', monospace !important;
            font-size: 13px !important;
            line-height: 1.3 !important;
            color: black !important;
            background: white !important;
            padding: 1mm !important;
            margin: 0 !important;
          }
          
          /* Remove all transforms and effects */
          .thermal-print-content * {
            transform: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            opacity: 1 !important;
            visibility: visible !important;
          }
          
          /* Ensure text is visible */
          .thermal-print-content p,
          .thermal-print-content div,
          .thermal-print-content span {
            display: block !important;
            visibility: visible !important;
          }
          
          /* Specific color overrides for thermal printing */
          .thermal-print-content .header-title {
            color: #000000 !important;
            font-weight: 900 !important;
            font-size: 16px !important;
          }
          
          .thermal-print-content .section-title {
            color: #000000 !important;
            font-weight: bold !important;
            font-size: 14px !important;
          }
          
          .thermal-print-content .item-label {
            color: #333333 !important;
            font-weight: normal !important;
          }
          
          .thermal-print-content .item-value {
            color: #000000 !important;
            font-weight: bold !important;
          }
          
          .thermal-print-content .total-value {
            color: #000000 !important;
            font-weight: 900 !important;
            font-size: 15px !important;
          }
        }
      `}</style>
    </>
  );
};

export default CashRegisterPrintView;