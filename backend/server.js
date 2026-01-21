const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// =======================
// JWT CONFIG
// =======================
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_super_seguro_cambiar_en_produccion';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_super_seguro_cambiar';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// =======================
// MIDDLEWARES
// =======================
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// =======================
// DATABASE
// =======================
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sistema_roles',
  waitForConnections: true,
  connectionLimit: 10
});

// =======================
// CREATE REFRESH TABLE
// =======================
app.post('/api/auth/setup-tokens', async (req, res) => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        usuario_id INT NOT NULL,
        token VARCHAR(500) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        revoked BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);
    res.json({ message: 'Tabla creada correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error creando tabla' });
  }
});

// =======================
// TOKEN GENERATOR
// =======================
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user.id, rol: user.rol, type: 'access' },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

// =======================
// VERIFY TOKEN MIDDLEWARE
// =======================
const verifyToken = (roles = []) => {
  return async (req, res, next) => {
    try {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token requerido' });
      }

      const token = auth.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      if (decoded.type !== 'access') return res.status(401).json({ error: 'Token inválido' });

      const [users] = await pool.execute(
        'SELECT * FROM usuarios WHERE id = ? AND activo = TRUE',
        [decoded.userId]
      );

      if (!users.length) return res.status(401).json({ error: 'Usuario no válido' });

      if (roles.length && !roles.includes(users[0].rol)) {
        return res.status(403).json({ error: 'Sin permisos' });
      }

      req.user = users[0];
      next();
    } catch {
      res.status(401).json({ error: 'Token inválido o expirado' });
    }
  };
};

// =======================
// MULTER
// =======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads/avatars');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `avatar_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =======================
// REGISTER
// =======================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre_completo, email, password, rol } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    await pool.execute(
      'INSERT INTO usuarios (nombre_completo,email,password,rol) VALUES (?,?,?,?)',
      [nombre_completo, email, hashed, rol]
    );

    res.json({ message: 'Usuario creado correctamente' });
  } catch {
    res.status(500).json({ error: 'Error al registrar' });
  }
});

// =======================
// LOGIN CON TOKENS
// =======================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.execute(
      'SELECT * FROM usuarios WHERE email = ? AND activo = TRUE',
      [email]
    );

    if (!users.length) return res.status(401).json({ error: 'Credenciales inválidas' });

    const valid = await bcrypt.compare(password, users[0].password);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const { accessToken, refreshToken } = generateTokens(users[0]);

    await pool.execute(
      'INSERT INTO refresh_tokens (usuario_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
      [users[0].id, refreshToken]
    );

    res.json({
      accessToken,
      refreshToken,
      user: users[0]
    });
  } catch {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// =======================
// REFRESH TOKEN
// =======================
app.post('/api/auth/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Token requerido' });

  const [tokens] = await pool.execute(
    'SELECT * FROM refresh_tokens WHERE token = ? AND revoked = FALSE AND expires_at > NOW()',
    [refreshToken]
  );

  if (!tokens.length) return res.status(401).json({ error: 'Refresh inválido' });

  const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

  const [users] = await pool.execute('SELECT * FROM usuarios WHERE id = ?', [decoded.userId]);

  const { accessToken, refreshToken: newRefresh } = generateTokens(users[0]);

  await pool.execute('UPDATE refresh_tokens SET revoked = TRUE WHERE id = ?', [tokens[0].id]);
  await pool.execute(
    'INSERT INTO refresh_tokens (usuario_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
    [users[0].id, newRefresh]
  );

  res.json({ accessToken, refreshToken: newRefresh });
});

// =======================
// LOGOUT
// =======================
app.post('/api/auth/logout', verifyToken(), async (req, res) => {
  await pool.execute(
    'UPDATE refresh_tokens SET revoked = TRUE WHERE usuario_id = ?',
    [req.user.id]
  );

  res.json({ message: 'Logout exitoso' });
});

// =======================
// PERFIL (TODO FUNCIONA IGUAL)
// =======================
app.get('/api/user/profile', verifyToken(), async (req, res) => {
  const [users] = await pool.execute(
    `SELECT id,nombre_completo,email,rol,telefono,direccion,fecha_registro,ultimo_login,activo,verificado,avatar
     FROM usuarios WHERE id = ?`,
    [req.user.id]
  );

  const user = users[0];
  user.avatar_url = user.avatar && user.avatar !== 'default.png'
    ? `/uploads/avatars/${user.avatar}`
    : null;

  res.json({ user, permisos: [] });
});

// =======================
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
