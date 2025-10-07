// Utilitários globais
let times = [];
let partida = null;
let cronometro = null;
let tempoRestante = 480;
let gols = [];
let artilheiros = {};

// Funções de armazenamento
function salvarTimes(arr) {
    localStorage.setItem('times', JSON.stringify(arr));
}

function carregarTimes() {
    const timesData = localStorage.getItem('times');
    times = timesData ? JSON.parse(timesData) : [];
    atualizarTimesSelect();
    atualizarListaTimes();
}

function salvarPartida(partida) {
    const partidas = carregarPartidas();
    partidas.push(partida);
    localStorage.setItem('partidas', JSON.stringify(partidas));
}

function carregarPartidas() {
    const partidasData = localStorage.getItem('partidas');
    return partidasData ? JSON.parse(partidasData) : [];
}

function atualizarArtilheiro(jogador, numGols) {
    const artilheirosData = localStorage.getItem('artilheiros');
    let art = artilheirosData ? JSON.parse(artilheirosData) : {};
    art[jogador] = (art[jogador] || 0) + numGols;
    localStorage.setItem('artilheiros', JSON.stringify(art));
}

function carregarArtilheiros() {
    const artilheirosData = localStorage.getItem('artilheiros');
    return artilheirosData ? JSON.parse(artilheirosData) : {};
}

function registrarNovoTime(time) {
    times.push(time);
    salvarTimes(times);
    const art = carregarArtilheiros();
    time.jogadores.forEach(j => { if (!(j.nome in art)) art[j.nome] = 0; });
    localStorage.setItem('artilheiros', JSON.stringify(art));
}

function atualizarTimesSelect() {
    const time1 = document.getElementById('time1');
    const time2 = document.getElementById('time2');
    if(!time1 || !time2) return;
    time1.innerHTML = '<option value="">Selecione o Time 1</option>';
    time2.innerHTML = '<option value="">Selecione o Time 2</option>';
    
    if (!times.length) {
        time1.innerHTML = '<option value="">Cadastre times primeiro</option>';
        time2.innerHTML = '<option value="">Cadastre times primeiro</option>';
        time1.disabled = true;
        time2.disabled = true;
        return;
    }
    
    times.forEach(t => {
        const opt1 = document.createElement('option');
        opt1.value = t.nome;
        opt1.textContent = t.nome;
        time1.appendChild(opt1);
        const opt2 = document.createElement('option');
        opt2.value = t.nome;
        opt2.textContent = t.nome;
        time2.appendChild(opt2);
    });
    
    time1.disabled = false;
    time2.disabled = false;
}

function atualizarListaTimes() {
    const div = document.getElementById('times-list');
    if (!div) return;
    if (!times.length) {
        div.innerHTML = '<p style="text-align: center; color: #ccc;">Nenhum time cadastrado ainda. Clique em "Criar Novo Time" para começar!</p>';
        return;
    }
    div.innerHTML = times.map(time => `
        <div class="time-card">
            <h3>${time.nome}</h3>
            <ul>
                ${time.jogadores.map(j => `
                    <li>${j.nome} <small style="color: #999;">(${j.camisa})</small></li>
                `).join('')}
            </ul>
        </div>
    `).join('');
}

// Cadastro de time (tipo formulário no index — caso deseje criar times aqui também)
const formTime = document.getElementById('form-time');
if (formTime) {
  formTime.onsubmit = (e) => {
      e.preventDefault();
      const nome = document.getElementById('nome-time').value;
      const jogadores = [];
      const nomes = document.querySelectorAll('.jogador-nome');
      const camisas = document.querySelectorAll('.jogador-camisa');
      for (let i = 0; i < nomes.length; i++) {
          jogadores.push({ nome: nomes[i].value, camisa: camisas[i].value });
      }
      registrarNovoTime({ nome, jogadores });
      formTime.reset();
      carregarTimes();
  };
}

// Iniciar partida
const formPartida = document.getElementById('form-partida');
if (formPartida) {
  formPartida.onsubmit = (e) => {
      e.preventDefault();
      const t1 = document.getElementById('time1').value;
      const t2 = document.getElementById('time2').value;
      if (!t1 || !t2) return alert('Selecione os dois times');
      if (t1 === t2) return alert('Selecione times diferentes');
      partida = { time1: t1, time2: t2, gols: [], vencedor: '' };
      tempoRestante = 480;
      gols = [];
      artilheiros = {};
      document.getElementById('partida-area').style.display = '';
      atualizarPlacar();
      atualizarGolSelect();
      atualizarGolsList();
      document.getElementById('resultado-partida').innerHTML = '';
      iniciarCronometro();
  };
}

function atualizarPlacar() {
    const placar = document.getElementById('placar');
    if(!partida) return;
    const gols1 = gols.filter(g => g.time === partida.time1).length;
    const gols2 = gols.filter(g => g.time === partida.time2).length;
    placar.textContent = `${partida.time1} ${gols1} x ${gols2} ${partida.time2}`;
}

function atualizarGolSelect() {
    const golTime = document.getElementById('gol-time');
    const golJogador = document.getElementById('gol-jogador');
    if(!golTime || !golJogador || !partida) return;
    golTime.innerHTML = '';
    golJogador.innerHTML = '';
    [partida.time1, partida.time2].forEach(tn => {
        const opt = document.createElement('option');
        opt.value = tn;
        opt.textContent = tn;
        golTime.appendChild(opt);
    });
    golTime.onchange = () => {
        golJogador.innerHTML = '';
        const time = times.find(t => t.nome === golTime.value);
        if (!time) return;
        time.jogadores.forEach(j => {
            const opt = document.createElement('option');
            opt.value = j.nome;
            opt.textContent = `${j.nome} (${j.camisa})`;
            golJogador.appendChild(opt);
        });
    };
    golTime.onchange();
}

const formGol = document.getElementById('form-gol');
if (formGol) {
  formGol.onsubmit = (e) => {
      e.preventDefault();
      const time = document.getElementById('gol-time').value;
      const jogador = document.getElementById('gol-jogador').value;
      gols.push({ time, jogador });
      artilheiros[jogador] = (artilheiros[jogador] || 0) + 1;
      atualizarPlacar();
      atualizarGolsList();
      checarFimPartida();
  };
}

function atualizarGolsList() {
    const div = document.getElementById('gols-list');
    if(!div) return;
    div.innerHTML = gols.map(g => `${g.time}: ${g.jogador}`).join('<br>');
}

function iniciarCronometro() {
    clearInterval(cronometro);
    document.getElementById('cronometro').textContent = '08:00';
    cronometro = setInterval(() => {
        tempoRestante--;
        const min = String(Math.floor(tempoRestante / 60)).padStart(2, '0');
        const seg = String(tempoRestante % 60).padStart(2, '0');
        document.getElementById('cronometro').textContent = `${min}:${seg}`;
        if (tempoRestante <= 0) fimPartida();
    }, 1000);
}

function checarFimPartida() {
    const gols1 = gols.filter(g => g.time === partida.time1).length;
    const gols2 = gols.filter(g => g.time === partida.time2).length;
    if (gols1 >= 3 || gols2 >= 3) fimPartida();
}

function fimPartida() {
    clearInterval(cronometro);
    const gols1 = gols.filter(g => g.time === partida.time1).length;
    const gols2 = gols.filter(g => g.time === partida.time2).length;
    let vencedor = '';
    if (gols1 > gols2) vencedor = partida.time1;
    else if (gols2 > gols1) vencedor = partida.time2;
    else vencedor = 'Empate';
    partida.gols = gols;
    partida.vencedor = vencedor;
    
    // Atualiza artilheiros (persiste)
    Object.entries(artilheiros).forEach(([jogador, num]) => {
        atualizarArtilheiro(jogador, num);
    });
    
    salvarPartida(partida);
    
    const el = document.getElementById('resultado-partida');
    if (el) el.innerHTML = `<b>Fim de partida!</b><br>Vencedor: ${vencedor}`;
    const pa = document.getElementById('partida-area'); if (pa) pa.style.display = 'none';
    carregarHistorico();
}

// Histórico de partidas e artilheiros
function carregarHistorico() {
    const partidas = carregarPartidas();
    const pl = document.getElementById('partidas-list');
    if (pl) {
      pl.innerHTML = partidas.map(p => 
        `<div style="margin-bottom:10px;">Partida: ${p.time1} x ${p.time2}<br>` +
        `Gols: ${p.gols.map(g => `${g.time} - ${g.jogador}`).join(', ')}<br>` +
        `Vencedor: ${p.vencedor}</div>`
      ).join('');
    }
    const ar = carregarArtilheiros();
    const al = document.getElementById('artilheiros-list');
    if (al) {
      al.innerHTML = Object.entries(ar)
        .sort((a, b) => b[1] - a[1])
        .map(([nome, gols]) => `${nome} - ${gols} gols`)
        .join('<br>');
    }
}

// Atualiza se localStorage mudar em outra aba/janela
window.addEventListener('storage', (e) => {
    if (!e.key) return;
    if (e.key === 'times') {
        times = JSON.parse(e.newValue || '[]');
        atualizarTimesSelect();
        atualizarListaTimes();
    }
    if (e.key === 'partidas' || e.key === 'artilheiros') {
        carregarHistorico();
    }
});

window.onload = () => {
    carregarTimes();
    carregarHistorico();
};
