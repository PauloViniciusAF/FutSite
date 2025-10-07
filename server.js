const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;
const BD = path.join(__dirname, 'BD');

app.use(express.json());
app.use(express.static(__dirname));

// Utilitário para salvar dados em txt
function saveToTxt(filename, data) {
  fs.appendFileSync(path.join(BD, filename), data + '\n', 'utf8');
}

// Cadastrar time e jogadores
app.post('/api/time', (req, res) => {
  const { nome, jogadores } = req.body;
  if (!nome || !jogadores || !Array.isArray(jogadores)) return res.status(400).send('Dados inválidos');
  const timeData = `Time: ${nome}\nJogadores:` + jogadores.map(j => `\n${j.nome} - Camisa ${j.camisa}`).join('') + '\n---';
  saveToTxt('times.txt', timeData);
  res.send('Time cadastrado');
});

// Listar times
app.get('/api/times', (req, res) => {
  const file = path.join(BD, 'times.txt');
  if (!fs.existsSync(file)) return res.json([]);
  const content = fs.readFileSync(file, 'utf8');
  const times = content.split('---').filter(Boolean).map(t => {
    const [header, ...jogadores] = t.trim().split('\n');
    return {
      nome: header.replace('Time: ', ''),
      jogadores: jogadores.slice(1).map(j => {
        const [nome, camisa] = j.split(' - Camisa ');
        return nome && camisa ? { nome, camisa } : null;
      }).filter(Boolean)
    };
  });
  res.json(times);
});

// Registrar partida
app.post('/api/partida', (req, res) => {
  const { time1, time2, gols, vencedor, artilheiros } = req.body;
  const partidaData = `Partida: ${time1} x ${time2}\nGols: ${gols.map(g => `${g.time} - ${g.jogador}`).join(', ')}\nVencedor: ${vencedor}\n---`;
  saveToTxt('partidas.txt', partidaData);
  // Atualiza artilheiros
  artilheiros.forEach(a => {
    saveToTxt('artilheiros.txt', `${a.nome} - ${a.gols} gols`);
  });
  res.send('Partida registrada');
});

// Listar partidas
app.get('/api/partidas', (req, res) => {
  const file = path.join(BD, 'partidas.txt');
  if (!fs.existsSync(file)) return res.json([]);
  const content = fs.readFileSync(file, 'utf8');
  const partidas = content.split('---').filter(Boolean).map(p => p.trim());
  res.json(partidas);
});

// Listar artilheiros
app.get('/api/artilheiros', (req, res) => {
  const file = path.join(BD, 'artilheiros.txt');
  if (!fs.existsSync(file)) return res.json([]);
  const content = fs.readFileSync(file, 'utf8');
  const artilheiros = content.split('\n').filter(Boolean);
  res.json(artilheiros);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
