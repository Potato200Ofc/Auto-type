(() => {
  // Remove instância anterior caso você rode o código duas vezes
  const oldGui = document.getElementById('auto-typer-gui-root');
  if (oldGui) oldGui.remove();

  let selectedElement = null;
  let isSelecting = false;
  let isTyping = false;

  // 1. Criar o container principal (usando Shadow DOM para o CSS do site não quebrar o GUI)
  const host = document.createElement('div');
  host.id = 'auto-typer-gui-root';
  host.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; font-family: system-ui, -apple-system, sans-serif;';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // 2. Estilos e HTML do GUI
  shadow.innerHTML = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      .wrapper { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
      
      .toggle-btn {
        background: #2563eb; color: white; border: none; border-radius: 50px;
        padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: background 0.2s, transform 0.1s;
      }
      .toggle-btn:hover { background: #1d4ed8; }
      .toggle-btn:active { transform: scale(0.96); }

      .panel {
        width: 300px; background: #1e1e2e; color: #cdd6f4; border-radius: 12px;
        padding: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.4); border: 1px solid #313244;
        display: flex; flex-direction: column; gap: 12px; transition: opacity 0.2s, transform 0.2s;
      }
      .panel.hidden { display: none; }

      .header { font-size: 15px; font-weight: 700; color: #fff; border-bottom: 1px solid #313244; padding-bottom: 8px; }

      textarea {
        width: 100%; height: 90px; background: #11111b; color: #fff;
        border: 1px solid #45475a; border-radius: 8px; padding: 10px;
        font-size: 13px; resize: vertical; outline: none; font-family: inherit;
      }
      textarea:focus { border-color: #89b4fa; }

      .status {
        font-size: 12px; background: #181825; padding: 8px; border-radius: 6px;
        color: #a6adc8; word-break: break-all; border: 1px solid #313244;
      }
      .status span { color: #a6e3a1; font-weight: 600; }

      .btn {
        width: 100%; padding: 10px; border: none; border-radius: 8px;
        font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s;
      }
      .btn-select { background: #313244; color: #fff; }
      .btn-select:hover { background: #45475a; }
      .btn-select.active { background: #f38ba8; color: #11111b; }

      .btn-type { background: #a6e3a1; color: #11111b; }
      .btn-type:hover { background: #94e2d5; }
      .btn-type:disabled { opacity: 0.5; cursor: not-allowed; }
    </style>

    <div class="wrapper">
      <div class="panel" id="guiPanel">
        <div class="header">⌨️ Auto Typer GUI</div>
        
        <textarea id="textInput" placeholder="Digite ou cole aqui o texto que deseja auto-digitar..."></textarea>
        
        <div class="status" id="targetStatus">Alvo: <span>Nenhum selecionado</span></div>
        
        <button class="btn btn-select" id="selectBtn">🎯 Selecionar Área / Div</button>
        <button class="btn btn-type" id="typeBtn">▶️ Auto Digitar</button>
      </div>

      <button class="toggle-btn" id="toggleBtn">Fechar GUI</button>
    </div>
  `;

  // Referências dos elementos internos
  const panel = shadow.getElementById('guiPanel');
  const toggleBtn = shadow.getElementById('toggleBtn');
  const textInput = shadow.getElementById('textInput');
  const targetStatus = shadow.getElementById('targetStatus');
  const selectBtn = shadow.getElementById('selectBtn');
  const typeBtn = shadow.getElementById('typeBtn');

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
    lastHovered.style.outline = '3px dashed #f38ba8';
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
    
    // Pisca em verde para confirmar seleção
    const prevOutline = selectedElement.style.outline;
    selectedElement.style.outline = '3px solid #a6e3a1';
    setTimeout(() => { selectedElement.style.outline = prevOutline; }, 800);

    // Mostra qual tag foi selecionada
    const tag = selectedElement.tagName.toLowerCase();
    const id = selectedElement.id ? `#${selectedElement.id}` : '';
    const cls = selectedElement.className && typeof selectedElement.className === 'string' 
      ? '.' + selectedElement.className.trim().split(/\s+/)[0] : '';
    targetStatus.innerHTML = `Alvo: <span>&lt;${tag}${id}${cls}&gt;</span>`;

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

  // 5. Lógica de Auto Digitação
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

    isTyping = true;
    typeBtn.disabled = true;
    typeBtn.textContent = '⏳ Digitando...';

    // Foca no elemento selecionado (ou busca um input/textarea dentro da div selecionada)
    let target = selectedElement;
    if (!['INPUT', 'TEXTAREA'].includes(target.tagName) && !target.isContentEditable) {
      const innerEditable = target.querySelector('input, textarea, [contenteditable="true"]');
      if (innerEditable) target = innerEditable;
    }

    target.focus();

    const isInputOrTextarea = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
    const isContentEditable = target.isContentEditable;

    // Setter nativo para funcionar em sites feitos com React/Vue/Angular
    const nativeSetter = isInputOrTextarea 
      ? Object.getOwnPropertyDescriptor(window[target.tagName === 'INPUT' ? 'HTMLInputElement' : 'HTMLTextAreaElement'].prototype, 'value')?.set
      : null;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // Dispara eventos de teclado reais
      target.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
      target.dispatchEvent(new KeyboardEvent('keypress', { key: char, bubbles: true }));

      if (isInputOrTextarea) {
        const nextVal = target.value + char;
        if (nativeSetter) nativeSetter.call(target, nextVal);
        else target.value = nextVal;
      } else if (isContentEditable) {
        document.execCommand('insertText', false, char);
      } else {
        // Caso seja uma <div> comum não editável, apenas insere o texto nela
        target.textContent += char;
      }

      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));

      // Velocidade humana aleatória entre 30ms e 75ms por letra
      await sleep(Math.floor(Math.random() * 45) + 30);
    }

    target.dispatchEvent(new Event('change', { bubbles: true }));

    isTyping = false;
    typeBtn.disabled = false;
    typeBtn.textContent = '▶️ Auto Digitar';
  });

  console.log('%c✅ Auto Typer GUI carregado com sucesso!', 'color: #a6e3a1; font-weight: bold; font-size: 14px;');
})();
