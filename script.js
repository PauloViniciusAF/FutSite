// Utilitários globais
let times = [];
let partida = null;
let cronometro = null;
let tempoRestante = 480;
let gols = [];
let artilheiros = {};

// Carregar times do backend
async function carregarTimes() {
  const res = await fetch('/api/times');
  times = await res.json();
  atualizarTimesSelect();
  atualizarListaTimes();
}

function atualizarTimesSelect() {
  const time1 = document.getElementById('time1');
  const time2 = document.getElementById('time2');
  time1.innerHTML = '';
  time2.innerHTML = '';
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
}

function atualizarListaTimes() {
  const div = document.getElementById('times-list');
  div.innerHTML = times.map(t => `<b>${t.nome}</b>: ${t.jogadores.map(j => `${j.nome} (${j.camisa})`).join(', ')}`).join('<br>');
}

// Cadastro de time
const formTime = document.getElementById('form-time');
const addJogadorBtn = document.getElementById('add-jogador');
const jogadoresArea = document.getElementById('jogadores-area');
addJogadorBtn.onclick = () => {
  const nome = document.createElement('input');
  nome.type = 'text';
  nome.className = 'jogador-nome';
  nome.placeholder = 'Nome do Jogador';
  nome.required = true;
  const camisa = document.createElement('input');
  camisa.type = 'number';
  camisa.className = 'jogador-camisa';
  camisa.placeholder = 'Nº da Camisa';
  camisa.required = true;
  jogadoresArea.appendChild(nome);
  jogadoresArea.appendChild(camisa);
};
formTime.onsubmit = async (e) => {
  e.preventDefault();
  const nome = document.getElementById('nome-time').value;
  const jogadores = [];
  const nomes = document.querySelectorAll('.jogador-nome');
  const camisas = document.querySelectorAll('.jogador-camisa');
  for (let i = 0; i < nomes.length; i++) {
    jogadores.push({ nome: nomes[i].value, camisa: camisas[i].value });
  }
  await fetch('/api/time', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, jogadores })
  });
  formTime.reset();
  jogadoresArea.innerHTML = '';
  carregarTimes();
};

// Iniciar partida
const formPartida = document.getElementById('form-partida');
formPartida.onsubmit = (e) => {
  e.preventDefault();
  const t1 = document.getElementById('time1').value;
  const t2 = document.getElementById('time2').value;
  if (t1 === t2) return alert('Selecione times diferentes');
  partida = { time1: t1, time2: t2, gols: [], vencedor: '', artilheiros: {} };
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

function atualizarPlacar() {
  const placar = document.getElementById('placar');
  const gols1 = gols.filter(g => g.time === partida.time1).length;
  const gols2 = gols.filter(g => g.time === partida.time2).length;
  placar.textContent = `${partida.time1} ${gols1} x ${gols2} ${partida.time2}`;
}

function atualizarGolSelect() {
  const golTime = document.getElementById('gol-time');
  const golJogador = document.getElementById('gol-jogador');
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

function atualizarGolsList() {
  const div = document.getElementById('gols-list');
  div.innerHTML = gols.map(g => `${g.time}: ${g.jogador}`).join('<br>');
}

function iniciarCronometro() {
  clearInterval(cronometro);
  cronometro = setInterval(() => {
    tempoRestante--;
    const min = String(Math.floor(tempoRestante / 60)).padStart(2, '0');
    const seg = String(tempoRestante % 60).padStart(2, '0');
    document.getElementById('cronometro').textContent = `${min}:${seg}`;
    if (tempoRestante <= 0) {
      fimPartida();
    }
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
  partida.artilheiros = Object.entries(artilheiros).map(([nome, gols]) => ({ nome, gols }));
  fetch('/api/partida', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partida)
  });
  document.getElementById('resultado-partida').innerHTML = `<b>Fim de partida!</b><br>Vencedor: ${vencedor}`;
  document.getElementById('partida-area').style.display = 'none';
  carregarHistorico();
}

// Histórico de partidas e artilheiros
async function carregarHistorico() {
  const resPartidas = await fetch('/api/partidas');
  const partidas = await resPartidas.json();
  document.getElementById('partidas-list').innerHTML = partidas.map(p => p.replace(/\n/g, '<br>')).join('<hr>');
  const resArtilheiros = await fetch('/api/artilheiros');
  const artilheiros = await resArtilheiros.json();
  document.getElementById('artilheiros-list').innerHTML = artilheiros.join('<br>');
}

window.onload = () => {
  carregarTimes();
  carregarHistorico();
};
