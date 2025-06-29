// server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'roots_secret',
  resave: false,
  saveUninitialized: false
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Datos en memoria:
const adminUser = 'admin';
const adminPass = '12345';
const users = {};
const connectedUsers = {};
const chatHistory = {};
const unreadCount = {};

// Rutas
app.get('/', (req, res) => res.render('index'));
app.get('/login', (req, res) => res.render('login', { error: null }));
app.post('/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === adminUser && pass === adminPass) {
    req.session.isAdmin = true;
    res.redirect('/admin-chat');
  } else {
    res.render('login', { error: 'Credenciales inválidas' });
  }
});
app.get('/admin-chat', (req, res) => {
  if (req.session.isAdmin) res.render('admin-chat');
  else res.redirect('/login');
});

app.get('/register', (req, res) => res.render('register', { error: null }));
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) {
    res.render('register', { error: 'Usuario ya existe' });
  } else {
    users[username] = password;
    chatHistory[username] = [];
    unreadCount[username] = 0;
    res.redirect('/user-login');
  }
});
app.get('/user-login', (req, res) => res.render('user-login', { error: null }));
app.post('/user-login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] === password) {
    req.session.isUser = true;
    req.session.username = username;
    res.redirect('/chat');
  } else {
    res.render('user-login', { error: 'Credenciales inválidas' });
  }
});
app.get('/chat', (req, res) => {
  if (req.session.isUser) res.render('user-chat', { username: req.session.username });
  else res.redirect('/user-login');
});
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Nuevas rutas para páginas estáticas
app.get('/trainings', (req, res) => {
  res.render('trainings');
});

app.get('/training/1', (req, res) => {
  res.render('training-1');
});

app.get('/training/2', (req, res) => {
  res.render('training-2');
});

app.get('/training/3', (req, res) => {
  res.render('training-3');
});

app.get('/training/4', (req, res) => {
  res.render('training-4');
});

// Socket.io
io.on('connection', (socket) => {
  socket.on('register user', (username) => {
  socket.username = username;
  connectedUsers[username] = socket.id;
  console.log(`🔵 Usuario conectado: ${username}`);
  console.log('🧠 Usuarios conectados:', connectedUsers);

  if (!chatHistory[username]) chatHistory[username] = [];
  socket.emit('chat history user', { history: chatHistory[username] });

  io.to('admin').emit('update users',
    Object.keys(chatHistory).map(u => ({ user: u, unread: unreadCount[u] || 0 }))
  );
});

  socket.on('join admin', () => {
    socket.join('admin');
    socket.emit('update users',
      Object.keys(chatHistory).map(u => ({ user: u, unread: unreadCount[u] || 0 }))
    );
  });

  socket.on('user message', (msg) => {
    const user = socket.username;
    const timestamp = new Date().toISOString();
    if (!chatHistory[user]) chatHistory[user] = [];
    chatHistory[user].push({ from: 'user', msg, timestamp });
    unreadCount[user] = (unreadCount[user] || 0) + 1;
    io.to('admin').emit('user message', { user, msg, timestamp });
    io.to('admin').emit('update users',
      Object.keys(chatHistory).map(u => ({ user: u, unread: unreadCount[u] || 0 }))
    );
  });

  socket.on('get history', (user) => {
    const history = chatHistory[user] || [];
    socket.emit('chat history', { user, history });
    unreadCount[user] = 0;
    io.to('admin').emit('update users',
      Object.keys(chatHistory).map(u => ({ user: u, unread: unreadCount[u] || 0 }))

    );
  });

  socket.on('admin message', ({ toUser, msg }) => {
    const timestamp = new Date().toISOString();
    if (!chatHistory[toUser]) chatHistory[toUser] = [];
    chatHistory[toUser].push({ from: 'admin', msg, timestamp });
    const toId = connectedUsers[toUser];
    if (toId) io.to(toId).emit('admin message', { msg, timestamp });
  });

  socket.on('disconnect', () => {
    const user = socket.username;
    if (user) {
      delete connectedUsers[user];
      io.to('admin').emit('update users',
        Object.keys(chatHistory).map(u => ({ user: u, unread: unreadCount[u] || 0 }))
      );
    }
  });
});

http.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000');
});
