(() => {
  // Remove instância anterior caso você rode o código duas vezes
  const oldGui = document.getElementById('auto-typer-gui-root');
  if (oldGui) oldGui.remove();

  let selectedElement = null;
  let isSelecting = false;
  let isTyping = false;
  let stopRequested = false;
  let currentIndex = 0; // Guarda onde a digitação parou

  // 1. Criar o container principal
  const host = document.createElement('div');
  host.id = 'auto-typer-gui-root';
  host.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; font-family: system-ui, -apple-system, sans-serif;';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // 2. Estilos e HTML do GUI (Tema Roxo)
  shadow.innerHTML = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      .wrapper { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
      
      .toggle-btn {
        background: linear-gradient(135deg, #7c3aed, #5b21b6); color: #ffffff; border: 1px solid #a78bfa; border-radius: 50px;
        padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer;
        box-shadow: 0 4px 15px rgba(124, 58, 237, 0.45); transition: all 0.2s;
      }
      .toggle-btn:hover { background: linear-gradient(135deg, #8b5cf6, #6d28d9); box-shadow: 0 6px 20px rgba(139, 92, 246, 0.6); }
      .toggle-btn:active { transform: scale(0.96); }

      .panel {
        width: 300px; background: #161026; color: #ede9fe; border-radius: 12px;
        padding: 16px; box-shadow: 0 12px 30px rgba(15, 7, 32, 0.75); border: 1px solid #4c1d95;
        display: flex; flex-direction: column; gap: 12px; transition: opacity 0.2s, transform 0.2s;
      }
      .panel.hidden { display: none; }

      .header { 
        font-size: 15px; font-weight: 700; color: #ddd6fe; 
        border-bottom: 1px solid #3b1c71; padding-bottom: 8px; 
        display: flex; align-items: center; justify-content: space-between;
      }
      .progress-badge {
        font-size: 11px; background: #2e1d52; color: #d8b4fe;
        padding: 2px 8px; border-radius: 10px; border: 1px solid #5b21b6;
      }

      textarea {
        width: 100%; height: 90px; background: #0d0918; color: #f5f3ff;
        border: 1px solid #4c1d95; border-radius: 8px; padding: 10px;
        font-size: 13px; resize: vertical; outline: none; font-family: inherit;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      textarea::placeholder { color: #7c6f9c; }
      textarea:focus { border-color: #a855f7; box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.25); }

      .speed-row {
        display: flex; align-items: center; justify-content: space-between;
        background: #1e1535; padding: 8px 10px; border-radius: 8px; border: 1px solid #3b1c71;
      }
      .speed-row label { font-size: 12px; color: #c4b5fd; font-weight: 600; }
      .speed-input {
        width: 75px; background: #0d0918; color: #f5f3ff;
        border: 1px solid #5b21b6; border-radius: 6px; padding: 5px 8px;
        font-size: 13px; font-weight: 600; text-align: center; outline: none;
      }
      .speed-input:focus { border-color: #a855f7; box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.25); }

      .status {
        font-size: 12px; background: #1e1535; padding: 8px; border-radius: 6px;
        color: #c4b5fd; word-break: break-all; border: 1px solid #3b1c71;
      }
      .status span { color: #e879f9; font-weight: 600; }

      .btn {
        width: 100%; padding: 10px; border: none; border-radius: 8px;
        font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s;
      }
      .btn-select { background: #2e1d52; color: #ede9fe; border: 1px solid #5b21b6; }
      .btn-select:hover { background: #3b256b; border-color: #7c3aed; }
      .btn-select.active { background: #c026d3; color: #ffffff; border-color: #f0abfc; }

      .action-row { display: flex; gap: 8px; }

      .btn-type { background: linear-gradient(135deg, #9333ea, #6b21a8); color: #ffffff; box-shadow: 0 4px 12px rgba(147, 51, 234, 0.35); }
      .btn-type:hover { background: linear-gradient(135deg, #a855f7, #7e22ce); }
      .btn-type:disabled { opacity: 0.5; cursor: not-allowed; }

      .btn-stop { background: linear-gradient(135deg, #e11d48, #9f1239); color: #ffffff; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.35); display: none; }
      .btn-stop:hover { background: linear-gradient(135deg, #f43f5e, #be123c); }
    </style>

    <div class="wrapper">
      <div class="panel" id="guiPanel">
        <div class="header">
          <span>⌨️ Auto Typer GUI</span>
          <span class="progress-badge" id="progressBadge">0 / 0</span>
        </div>
        
        <textarea id="textInput" placeholder="Digite ou cole aqui o texto que deseja auto-digitar..."></textarea>
        
        <div class="speed-row">
          <label for="speedInput">⚡ Velocidade (0 a 100):</label>
          <input type="number" id="speedInput" class="speed-input" min="0" max="100" value="80" />
        </div>

        <div class="status" id="targetStatus">Alvo: <span>Nenhum selecionado</span></div>
        
        <button class="btn btn-select" id="selectBtn">🎯 Selecionar Área / Div</button>
        
        <div class="action-row">
          <button class="btn btn-type" id="typeBtn">▶️ Auto Digitar</button>
          <button class="btn btn-stop" id="stopBtn">⏹️ Parar</button>
        </div>
      </div>

      <button class="toggle-btn" id="toggleBtn">Fechar GUI</button>
    </div>
  `;

  // Referências dos elementos internos
  const panel = shadow.getElementById('guiPanel');
  const toggleBtn = shadow.getElementById('toggleBtn');
  const textInput = shadow.getElementById('textInput');
  const speedInput = shadow.getElementById('speedInput');
  const targetStatus = shadow.getElementById('targetStatus');
  const selectBtn = shadow.getElementById('selectBtn');
  const typeBtn = shadow.getElementById('typeBtn');
  const stopBtn = shadow.getElementById('stopBtn');
  const progressBadge = shadow.getElementById('progressBadge');

  function updateProgressUI() {
    const total = textInput.value.length;
    progressBadge.textContent = `${currentIndex} / ${total}`;
  }

  // Se o usuário editar o texto manualmente, reseta o progresso para o início
  textInput.addEventListener('input', () => {
    if (!isTyping) {
      currentIndex = 0;
      typeBtn.textContent = '▶️ Auto Digitar';
      updateProgressUI();
    }
  });

  // Garante que o valor fique sempre entre 0 e 100
  speedInput.addEventListener('change', () => {
    let val = parseInt(speedInput.value, 10);
    if (isNaN(val) || val < 0) val = 0;
    if (val > 100) val = 100;
    speedInput.value = val;
  });

  // 3. Botão Alternável (Abrir / Fechar GUI)
  toggleBtn.addEventListener('click', () => {
    const isHidden = panel.classList.toggle('hidden');
    toggleBtn.textContent = isHidden ? 'Abrir GUI' : 'Fechar GUI';
  });

  // 4. Lógica de Seleção de Área / Div
  let lastHovered = null;
  let originalOutline = '';

  function handleMouseOver(e) {
    if (!isSelecting || host.contains(e.target)) return;
    if (lastHovered) lastHovered.style.outline = originalOutline;
    lastHovered = e.target;
    originalOutline = lastHovered.style.outline;
    lastHovered.style.outline = '3px dashed #d946ef';
  }

  function handleMouseOut(e) {
    if (!isSelecting || !lastHovered) return;
    lastHovered.style.outline = originalOutline;
  }

  function handleClick(e) {
    if (!isSelecting || host.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();

    selectedElement = e.target;
    selectedElement.style.outline = originalOutline;
    
    const prevOutline = selectedElement.style.outline;
    selectedElement.style.outline = '3px solid #a855f7';
    setTimeout(() => { selectedElement.style.outline = prevOutline; }, 800);

    const tag = selectedElement.tagName.toLowerCase();
    const id = selectedElement.id ? `#${selectedElement.id}` : '';
    const cls = selectedElement.className && typeof selectedElement.className === 'string' 
      ? '.' + selectedElement.className.trim().split(/\s+/)[0] : '';
    targetStatus.innerHTML = `Alvo: <span>&lt;${tag}${id}${cls}&gt;</span>`;

    // Reseta o ponto de partida ao trocar de alvo
    currentIndex = 0;
    typeBtn.textContent = '▶️ Auto Digitar';
    updateProgressUI();

    stopSelectionMode();
  }

  function stopSelectionMode() {
    isSelecting = false;
    selectBtn.classList.remove('active');
    selectBtn.textContent = '🎯 Selecionar Área / Div';
    document.body.style.cursor = 'default';
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
    document.removeEventListener('click', handleClick, true);
  }

  selectBtn.addEventListener('click', () => {
    if (isSelecting) {
      stopSelectionMode();
      return;
    }
    isSelecting = true;
    selectBtn.classList.add('active');
    selectBtn.textContent = '❌ Cancelar (Clique no alvo)';
    document.body.style.cursor = 'crosshair';
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('click', handleClick, true);
  });

  // 5. Botão de Parar
  stopBtn.addEventListener('click', () => {
    if (isTyping) {
      stopRequested = true;
      stopBtn.textContent = '⏳ Parando...';
      stopBtn.disabled = true;
    }
  });

  // 6. Lógica de Auto Digitação (com pausa e retomada)
  const sleep = (ms) => new Promise(res => setTimeout(res, ms));

  typeBtn.addEventListener('click', async () => {
    if (isTyping) return;
    const text = textInput.value;

    if (!selectedElement) {
      alert('Por favor, selecione uma área ou div primeiro!');
      return;
    }
    if (!text) {
      alert('Digite algum texto na caixa antes de iniciar!');
      return;
    }

    // Se já havia terminado o texto inteiro antes, reinicia do 0
    if (currentIndex >= text.length) {
      currentIndex = 0;
    }

    isTyping = true;
    stopRequested = false;

    typeBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    stopBtn.disabled = false;
    stopBtn.textContent = '⏹️ Parar';
    textInput.disabled = true;

    let target = selectedElement;
    if (!['INPUT', 'TEXTAREA'].includes(target.tagName) && !target.isContentEditable) {
      const innerEditable = target.querySelector('input, textarea, [contenteditable="true"]');
      if (innerEditable) target = innerEditable;
    }

    target.focus();

    const isInputOrTextarea = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
    const isContentEditable = target.isContentEditable;

    const nativeSetter = isInputOrTextarea 
      ? Object.getOwnPropertyDescriptor(window[target.tagName === 'INPUT' ? 'HTMLInputElement' : 'HTMLTextAreaElement'].prototype, 'value')?.set
      : null;

    // Continua exatamente de onde parou (currentIndex)
    for (; currentIndex < text.length; currentIndex++) {
      if (stopRequested) break;

      const char = text[currentIndex];

      target.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
      target.dispatchEvent(new KeyboardEvent('keypress', { key: char, bubbles: true }));

      if (isInputOrTextarea) {
        const nextVal = target.value + char;
        if (nativeSetter) nativeSetter.call(target, nextVal);
        else target.value = nextVal;
      } else if (isContentEditable) {
        document.execCommand('insertText', false, char);
      } else {
        target.textContent += char;
      }

      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));

      updateProgressUI();

      // Lê a velocidade em tempo real (permite alterar a velocidade mesmo enquanto digita!)
      let speed = parseInt(speedInput.value, 10);
      if (isNaN(speed)) speed = 80;
      speed = Math.max(0, Math.min(100, speed));
      const baseDelay = Math.round(((100 - speed) / 100) * 250);

      if (baseDelay > 0) {
        const jitter = Math.floor((Math.random() - 0.5) * (baseDelay * 0.3));
        await sleep(Math.max(1, baseDelay + jitter));
      }
    }

    // Atualiza o contador caso tenha chegado ao final
    updateProgressUI();
    target.dispatchEvent(new Event('change', { bubbles: true }));

    isTyping = false;
    textInput.disabled = false;
    stopBtn.style.display = 'none';
    typeBtn.style.display = 'block';

    // Define o texto do botão conforme parou no meio ou concluiu tudo
    if (stopRequested && currentIndex < text.length) {
      typeBtn.textContent = '▶️ Continuar';
    } else {
      currentIndex = 0; // Reseta para uma próxima vez
      typeBtn.textContent = '▶️ Auto Digitar';
    }
  });

  console.log('%c✅ Auto Typer GUI (com Parar/Continuar) carregado!', 'color: #c084fc; font-weight: bold; font-size: 14px;');
})();
