(function(){
  const displayEl = document.getElementById('display');
  const expressionEl = document.getElementById('expression');

  let current = "0";        // digits currently being entered
  let previous = null;      // stored operand
  let operator = null;      // pending operator symbol
  let justEvaluated = false; // true right after "="

  const OPS = { "+": (a,b)=>a+b, "−": (a,b)=>a-b, "×": (a,b)=>a*b, "÷": (a,b)=>a/b };

  function formatNumber(n){
    if (!isFinite(n)) return "Error";
    // avoid float noise, cap significant digits
    let s = parseFloat(n.toPrecision(12)).toString();
    if (s.length > 14) s = Number(n).toExponential(6);
    return s;
  }

  function render(previewValue){
    if (previewValue !== undefined){
      displayEl.textContent = previewValue;
      displayEl.classList.toggle('preview', true);
      displayEl.classList.remove('error');
    } else {
      displayEl.textContent = current;
      displayEl.classList.remove('preview');
      displayEl.classList.toggle('error', current === "Error");
    }

    if (operator && previous !== null){
      expressionEl.textContent = `${formatNumber(previous)} ${operator}`;
    } else {
      expressionEl.textContent = "\u00A0";
    }

    document.querySelectorAll('.key-op').forEach(btn=>{
      btn.classList.toggle('selected', operator && btn.dataset.op === operator && previous !== null && !justEvaluated);
    });
  }

  function inputDigit(d){
    if (current === "Error") current = "0";
    if (justEvaluated){
      current = d;
      previous = null;
      operator = null;
      justEvaluated = false;
    } else if (current === "0"){
      current = d;
    } else {
      if (current.replace('-','').length >= 14) return;
      current += d;
    }
    render();
  }

  function inputDecimal(){
    if (current === "Error") current = "0";
    if (justEvaluated){
      current = "0";
      previous = null;
      operator = null;
      justEvaluated = false;
    }
    if (!current.includes(".")) current += ".";
    render();
  }

  function chooseOperator(op){
    if (current === "Error") return;
    if (operator && previous !== null && !justEvaluated){
      // chain: evaluate pending operation first
      const result = OPS[operator](previous, parseFloat(current));
      previous = result;
      current = formatNumber(result);
    } else {
      previous = parseFloat(current);
    }
    operator = op;
    justEvaluated = false;
    current = "0";
    render();
  }

  function equals(){
    if (operator === null || previous === null || current === "Error") return;
    const b = parseFloat(current);
    const result = OPS[operator](previous, b);
    const resultStr = formatNumber(result);
    expressionEl.textContent = `${formatNumber(previous)} ${operator} ${formatNumber(b)} =`;
    current = resultStr;
    previous = null;
    justEvaluated = true;
    displayEl.textContent = current;
    displayEl.classList.remove('preview');
    displayEl.classList.toggle('error', current === "Error");
    document.querySelectorAll('.key-op').forEach(btn=>btn.classList.remove('selected'));
    operator = null;
  }

  function clearAll(){
    current = "0";
    previous = null;
    operator = null;
    justEvaluated = false;
    render();
  }

  function backspace(){
    if (current === "Error" || justEvaluated){ clearAll(); return; }
    current = current.length > 1 ? current.slice(0, -1) : "0";
    render();
  }

  function percent(){
    if (current === "Error") return;
    const val = parseFloat(current);
    current = formatNumber(previous !== null ? (previous * val) / 100 : val / 100);
    render();
  }

  // live preview: while typing the second operand, show what the result would be
  function maybePreview(){
    if (operator && previous !== null && current !== "0" && !justEvaluated){
      const b = parseFloat(current);
      if (!isNaN(b)){
        const result = OPS[operator](previous, b);
        render(formatNumber(result));
        return;
      }
    }
    render();
  }

  document.querySelectorAll('button[data-num]').forEach(btn=>{
    btn.addEventListener('click', ()=>{ inputDigit(btn.dataset.num); maybePreview(); });
  });
  document.querySelectorAll('button[data-op]').forEach(btn=>{
    btn.addEventListener('click', ()=> chooseOperator(btn.dataset.op));
  });
  document.querySelector('[data-action="equals"]').addEventListener('click', equals);
  document.querySelector('[data-action="clear"]').addEventListener('click', clearAll);
  document.querySelector('[data-action="backspace"]').addEventListener('click', ()=>{ backspace(); maybePreview(); });
  document.querySelector('[data-action="decimal"]').addEventListener('click', ()=>{ inputDecimal(); maybePreview(); });
  document.querySelector('[data-action="percent"]').addEventListener('click', percent);

  function flashKey(selector){
    const el = document.querySelector(selector);
    if (!el) return;
    el.classList.add('pressed');
    setTimeout(()=>el.classList.remove('pressed'), 90);
  }

  window.addEventListener('keydown', (e)=>{
    if (e.key >= "0" && e.key <= "9"){
      inputDigit(e.key); maybePreview();
      flashKey(`[data-num="${e.key}"]`);
    } else if (e.key === "."){
      inputDecimal(); maybePreview();
      flashKey('[data-action="decimal"]');
    } else if (e.key === "+"){
      chooseOperator("+"); flashKey('[data-op="+"]');
    } else if (e.key === "-"){
      chooseOperator("−"); flashKey('[data-op="−"]');
    } else if (e.key === "*"){
      chooseOperator("×"); flashKey('[data-op="×"]');
    } else if (e.key === "/"){
      e.preventDefault();
      chooseOperator("÷"); flashKey('[data-op="÷"]');
    } else if (e.key === "Enter" || e.key === "="){
      equals(); flashKey('[data-action="equals"]');
    } else if (e.key === "Backspace"){
      backspace(); maybePreview();
      flashKey('[data-action="backspace"]');
    } else if (e.key === "Escape"){
      clearAll(); flashKey('[data-action="clear"]');
    } else if (e.key === "%"){
      percent(); flashKey('[data-action="percent"]');
    }
  });

  render();
})();
