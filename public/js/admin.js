// public/js/admin.js
const socket = io();

socket.on('connect', () => {
  socket.emit('join admin');
});

// Mostrar lista de todos los usuarios con historial (no solo los conectados)
socket.on('update users', (users) => {
  const userList = document.getElementById('userList');
  userList.innerHTML = '';
  if (users.length === 0) {
    userList.innerHTML = '<p>No hay usuarios registrados</p>';
    return;
  }
  users.forEach(({ user, unread }) => {
    const p = document.createElement('p');
    p.textContent = `${user}` + (unread > 0 ? ` (${unread})` : '');
    p.onclick = () => selectUser(user);
    userList.appendChild(p);
  });
});

let currentChatUser = null;

function selectUser(user) {
  currentChatUser = user;
  document.getElementById('chatWith').innerText = user;
  document.getElementById('chatWindow').style.display = 'block';
  document.getElementById('messages').innerHTML = '';
  socket.emit('get history', user);
}

socket.on('chat history', ({ user, history }) => {
  if (user !== currentChatUser) return;
  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML = '';
  history.forEach(({ from, msg, timestamp }) => {
    const p = document.createElement('p');
    const time = new Date(timestamp).toLocaleTimeString();
    if (from === 'admin') {
      p.innerHTML = `<strong>Admin [${time}]:</strong> ${msg}`;
    } else {
      p.innerHTML = `<strong>${user} [${time}]:</strong> ${msg}`;
    }
    messagesDiv.appendChild(p);
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

socket.on('user message', ({ user, msg, timestamp }) => {
  if (user !== currentChatUser) return;
  const messagesDiv = document.getElementById('messages');
  const p = document.createElement('p');
  const time = new Date(timestamp).toLocaleTimeString();
  p.innerHTML = `<strong>${user} [${time}]:</strong> ${msg}`;
  messagesDiv.appendChild(p);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

function sendAdminMessage() {
  const input = document.getElementById('adminMessage');
  const msg = input.value.trim();
  if (!msg || !currentChatUser) return;
  socket.emit('admin message', { toUser: currentChatUser, msg });
  const messagesDiv = document.getElementById('messages');
  const p = document.createElement('p');
  const time = new Date().toLocaleTimeString();
  p.innerHTML = `<strong>Admin [${time}]:</strong> ${msg}`;
  messagesDiv.appendChild(p);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  input.value = '';
}
