/* ================================================================
   DUSHELL — VALIDAÇÃO FISCAL (CPF / CNPJ)
   ------------------------------------------------------------
   Função: cálculo de dígitos verificadores (módulo 11) e
   bloqueio de avanço com valores inválidos.

   INTEGRAÇÃO COM O PROTÓTIPO (contrato público):
     • Todo campo de documento usa o atributo:  data-doc="cpf" | "cnpj"
     • Este arquivo valida ao vivo (digitação/saída do campo),
       marca o input com a classe .bad e insere a mensagem .doc-msg.
     • O HTML principal consulta window.DushellValida.docValido(el)
       dentro de reqOk() antes de permitir avançar de etapa.
     • Um listener de 'submit' em fase de captura dá a última
       linha de defesa: se houver [data-doc].bad no form, o envio
       é cancelado independentemente de qualquer outro código.
   ================================================================ */
(function () {
  'use strict';

  var VERSAO = '1.0.0';

  /* ---------- utilidades ---------- */
  function limpa(v) { return String(v || '').replace(/\D/g, ''); }

  function todosIguais(d) {
    for (var i = 1; i < d.length; i++) { if (d[i] !== d[0]) return false; }
    return true;
  }

  /* ---------- CPF (11 dígitos, 2 DV mod-11, pesos 10..2 e 11..2) ---------- */
  function calculaDVCPF(base9) {
    var soma = 0, peso = 10, i, r;
    for (i = 0; i < 9; i++) { soma += Number(base9[i]) * peso--; }
    r = soma % 11;
    var d1 = (r < 2) ? 0 : 11 - r;
    soma = 0; peso = 11;
    for (i = 0; i < 9; i++) { soma += Number(base9[i]) * peso--; }
    soma += d1 * 2;
    r = soma % 11;
    var d2 = (r < 2) ? 0 : 11 - r;
    return String(d1) + String(d2);
  }

  function cpfValido(valor) {
    var d = limpa(valor);
    if (d.length !== 11) return false;
    if (todosIguais(d)) return false;              // 111.111.111-11 e afins
    if (isNaN(Number(d))) return false;
    var dv = calculaDVCPF(d.slice(0, 9));
    return dv === d.slice(9);
  }

  /* ---------- CNPJ (14 dígitos, 2 DV mod-11, pesos 5..2/9..2 e 6..2) ---------- */
  var PESOS1 = [5,4,3,2,9,8,7,6,5,4,3,2];
  var PESOS2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];

  function calculaDVCNPJ(base12) {
    var soma = 0, i, r;
    for (i = 0; i < 12; i++) { soma += Number(base12[i]) * PESOS1[i]; }
    r = soma % 11;
    var d1 = (r < 2) ? 0 : 11 - r;
    soma = 0;
    for (i = 0; i < 12; i++) { soma += Number(base12[i]) * PESOS2[i]; }
    soma += d1 * PESOS2[12];
    r = soma % 11;
    var d2 = (r < 2) ? 0 : 11 - r;
    return String(d1) + String(d2);
  }

  function cnpjValido(valor) {
    var d = limpa(valor);
    if (d.length !== 14) return false;
    if (todosIguais(d)) return false;              // 00.000.000/0000-00 e afins
    if (isNaN(Number(d))) return false;
    var dv = calculaDVCNPJ(d.slice(0, 12));
    return dv === d.slice(12);
  }

  /* ---------- validação de um campo [data-doc] ---------- */
  function docValido(el) {
    if (!el) return false;
    var tipo = (el.getAttribute('data-doc') || '').toLowerCase();
    var valor = el.value;
    if (!limpa(valor)) return false;               // vazio = inválido (obrigatório)
    if (tipo === 'cpf')  return cpfValido(valor);
    if (tipo === 'cnpj') return cnpjValido(valor);
    return false;
  }

  /* ---------- feedback visual ao vivo ----------
     Delegação de eventos: sobrevive à re-renderização do SPA
     (o protótipo reescreve o innerHTML a cada tela).            */
  function mensagem(el, texto, ok) {
    var pai = el.parentNode;
    var msg = pai.querySelector('.doc-msg');
    if (!msg) {
      msg = document.createElement('div');
      msg.className = 'doc-msg';
      pai.appendChild(msg);
    }
    msg.textContent = texto;
    msg.className = 'doc-msg ' + (ok ? 'ok' : 'err');
  }

  function limpaMensagem(el) {
    var msg = el.parentNode.querySelector('.doc-msg');
    if (msg) { msg.parentNode.removeChild(msg); }
    el.classList.remove('bad');
  }

  function validaAoVivo(el) {
    var tipo = (el.getAttribute('data-doc') || '').toLowerCase();
    var d = limpa(el.value);

    if (!d) { limpaMensagem(el); return; }         // vazio: trata reqOk do HTML

    if (d.length < (tipo === 'cnpj' ? 14 : 11)) {  // ainda digitando
      el.classList.remove('bad');
      mensagem(el, 'Faltam dígitos — ' + (tipo === 'cnpj' ? 'CNPJ tem 14 números.' : 'CPF tem 11 números.'), false);
      return;
    }
    if (docValido(el)) {
      el.classList.remove('bad');
      mensagem(el, (tipo === 'cnpj' ? 'CNPJ' : 'CPF') + ' válido — dígitos verificadores conferem.', true);
    } else {
      el.classList.add('bad');
      mensagem(el, (tipo === 'cnpj' ? 'CNPJ' : 'CPF') + ' inválido — dígito verificador não confere.', false);
    }
  }

  document.addEventListener('input', function (e) {
    var el = e.target;
    if (el && el.matches && el.matches('[data-doc]')) validaAoVivo(el);
  });
  document.addEventListener('focusout', function (e) {
    var el = e.target;
    if (el && el.matches && el.matches('[data-doc]') && limpa(el.value)) validaAoVivo(el);
  });

  /* ---------- última linha de defesa: bloqueia o submit ----------
     Fase de captura = roda ANTES de qualquer handler do formulário. */
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || !f.querySelector) return;
    var ruim = f.querySelector('[data-doc].bad, [data-doc]:not([data-doc=""]):invalid');
    var vazioIncompleto = null;
    f.querySelectorAll('[data-doc]').forEach(function (el) {
      if (!docValido(el)) { ruim = ruim || el; if (!el.value) vazioIncompleto = vazioIncompleto || el; }
    });
    if (ruim) {
      e.preventDefault();
      e.stopPropagation();
      if (window.toast) {
        window.toast(vazioIncompleto && !vazioIncompleto.value
          ? 'Informe o documento destacado para continuar.'
          : 'Documento inválido — corrija o ' + (ruim.getAttribute('data-doc') || 'documento').toUpperCase() + ' destacado antes de continuar.', 'err');
      }
      if (ruim.focus) ruim.focus();
    }
  }, true);

  /* ---------- API pública ---------- */
  window.DushellValida = {
    versao: VERSAO,
    limpa: limpa,
    cpfValido: cpfValido,
    cnpjValido: cnpjValido,
    docValido: docValido
  };
})();