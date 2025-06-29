// public/js/user.js
const socket = io();

if (typeof username !== 'undefined' && username !== 'admin') {
  socket.emit('register user', username);
}

// Recibir historial enviado por el servidor
socket.on('chat history user', ({ history }) => {
  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML = '';
  history.forEach(({ from, msg, timestamp }) => {
    const p = document.createElement('p');
    const time = new Date(timestamp).toLocaleTimeString();
    if (from === 'admin') {
      p.innerHTML = `<strong>Admin [${time}]:</strong> ${msg}`;
    } else {
      p.innerHTML = `<strong>Tú [${time}]:</strong> ${msg}`;
    }
    messagesDiv.appendChild(p);
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

socket.on('admin message', ({ msg, timestamp }) => {
  const messagesDiv = document.getElementById('messages');
  const p = document.createElement('p');
  const time = new Date(timestamp).toLocaleTimeString();
  p.innerHTML = `<strong>Admin [${time}]:</strong> ${msg}`;
  messagesDiv.appendChild(p);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

function sendUserMessage() {
  const input = document.getElementById('userMessage');
  const msg = input.value.trim();
  if (!msg) return;
  const timestamp = new Date().toISOString();
  socket.emit('user message', msg);
  const messagesDiv = document.getElementById('messages');
  const p = document.createElement('p');
  const time = new Date(timestamp).toLocaleTimeString();
  p.innerHTML = `<strong>Tú [${time}]:</strong> ${msg}`;
  messagesDiv.appendChild(p);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  input.value = '';
}
