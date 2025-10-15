import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

console.log('🚀 Iniciando servidor...');
console.log('📝 Configurações:');
console.log('   - PORT:', PORT);
console.log('   - JWT_SECRET:', JWT_SECRET ? '✓ Configurado' : '✗ Não configurado');
console.log('   - DB_HOST:', process.env.DB_HOST || 'postgres.aws-resource.svc.cluster.local');
console.log('   - DB_NAME:', process.env.DB_NAME || 'aws_resource_db');
console.log('   - DB_USER:', process.env.DB_USER || 'postgres');

// Configuração do PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres.aws-resource.svc.cluster.local',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'aws_resource_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Primeiroacesso_2022',
});

// Testar conexão com o banco
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erro ao conectar com PostgreSQL:', err.message);
  } else {
    console.log('✅ Conectado ao PostgreSQL em:', res.rows[0].now);
  }
});

app.use(cors());
app.use(express.json());

// Middleware de autenticação
const authMiddleware = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Buscar usuário do auth.users
    const authUserResult = await pool.query(
      'SELECT id, email FROM auth.users WHERE id = $1',
      [decoded.userId]
    );

    if (authUserResult.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // Buscar perfil do usuário
    const profileResult = await pool.query(
      'SELECT * FROM public.users_profile WHERE auth_user_id = $1',
      [decoded.userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(401).json({ error: 'Perfil do usuário não encontrado' });
    }

    // Combinar dados do auth e do perfil
    req.user = {
      id: authUserResult.rows[0].id,
      email: authUserResult.rows[0].email,
      ...profileResult.rows[0]
    };
    
    next();
  } catch (error) {
    console.error('❌ [AUTH MIDDLEWARE] Erro:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// ==================== ROTAS DE AUTENTICAÇÃO ====================

// Sign Up
app.post('/auth/signup', async (req, res) => {
  console.log('📥 [SIGNUP] Requisição recebida:', { email: req.body.email, name: req.body.name });
  try {
    const { email, password, name } = req.body;

    // Verificar se usuário já existe
    console.log('🔍 [SIGNUP] Verificando se email já existe...');
    const existingUser = await pool.query('SELECT * FROM auth.users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.log('⚠️  [SIGNUP] Email já cadastrado:', email);
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    console.log('🔐 [SIGNUP] Gerando hash da senha...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    console.log('👤 [SIGNUP] Criando usuário em auth.users...');
    const userResult = await pool.query(
      `INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data) 
       VALUES ($1, $2, now(), $3) RETURNING *`,
      [email, hashedPassword, JSON.stringify({ name })]
    );

    const user = userResult.rows[0];
    console.log('✅ [SIGNUP] Usuário criado:', user.id);

    // Criar token
    console.log('🎫 [SIGNUP] Gerando JWT token...');
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // Buscar perfil criado pelo trigger
    console.log('👔 [SIGNUP] Buscando perfil criado pelo trigger...');
    const profileResult = await pool.query(
      'SELECT * FROM public.users_profile WHERE auth_user_id = $1',
      [user.id]
    );

    const profile = profileResult.rows[0];
    
    if (!profile) {
      console.error('❌ [SIGNUP] ERRO: Perfil não foi criado pelo trigger!');
      return res.status(500).json({ error: 'Erro ao criar perfil do usuário' });
    }
    
    console.log('✅ [SIGNUP] Perfil encontrado:', profile.id);
    console.log('📤 [SIGNUP] Enviando resposta com sucesso');
    
    res.json({
      user: {
        id: user.id,
        email: user.email
      },
      profile: profile,
      session: {
        access_token: token
      }
    });
  } catch (error: any) {
    console.error('❌ [SIGNUP] ERRO CRÍTICO:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Sign In
app.post('/auth/signin', async (req, res) => {
  console.log('📥 [SIGNIN] Requisição recebida:', { email: req.body.email });
  try {
    const { email, password } = req.body;

    // Buscar usuário
    console.log('🔍 [SIGNIN] Buscando usuário...');
    const userResult = await pool.query('SELECT * FROM auth.users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      console.log('⚠️  [SIGNIN] Usuário não encontrado:', email);
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const user = userResult.rows[0];
    console.log('✅ [SIGNIN] Usuário encontrado:', user.id);

    // Verificar senha
    console.log('🔐 [SIGNIN] Verificando senha...');
    const isValid = await bcrypt.compare(password, user.encrypted_password);
    if (!isValid) {
      console.log('⚠️  [SIGNIN] Senha incorreta para:', email);
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }
    console.log('✅ [SIGNIN] Senha válida');

    // Atualizar último login
    console.log('📅 [SIGNIN] Atualizando último login...');
    await pool.query(
      'UPDATE public.users_profile SET last_login = now() WHERE auth_user_id = $1',
      [user.id]
    );

    // Criar token
    console.log('🎫 [SIGNIN] Gerando JWT token...');
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // Buscar perfil
    console.log('👔 [SIGNIN] Buscando perfil...');
    const profileResult = await pool.query(
      'SELECT * FROM public.users_profile WHERE auth_user_id = $1',
      [user.id]
    );

    const profile = profileResult.rows[0];
    
    if (!profile) {
      console.error('❌ [SIGNIN] ERRO: Perfil não encontrado!');
      return res.status(500).json({ error: 'Perfil não encontrado' });
    }
    
    console.log('✅ [SIGNIN] Perfil encontrado:', profile.id);
    console.log('📤 [SIGNIN] Enviando resposta com sucesso');
    
    res.json({
      user: {
        id: user.id,
        email: user.email
      },
      profile: profile,
      session: {
        access_token: token
      }
    });
  } catch (error: any) {
    console.error('❌ [SIGNIN] ERRO CRÍTICO:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Get Current User
app.get('/auth/user', authMiddleware, async (req: any, res) => {
  console.log('📥 [GET USER] Requisição recebida para usuário:', req.user?.id);
  try {
    const profileResult = await pool.query(
      'SELECT * FROM public.users_profile WHERE auth_user_id = $1',
      [req.user.id]
    );

    const profile = profileResult.rows[0];
    
    if (!profile) {
      console.error('❌ [GET USER] Perfil não encontrado para usuário:', req.user.id);
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }
    
    console.log('✅ [GET USER] Perfil retornado:', profile.id);
    
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email
      },
      profile: profile
    });
  } catch (error: any) {
    console.error('❌ [GET USER] ERRO:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sign Out
app.post('/auth/signout', authMiddleware, (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
});

// Update Profile
app.patch('/auth/profile', authMiddleware, async (req: any, res) => {
  try {
    const { name, phone } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount}`);
      values.push(phone);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(req.user.id);
    await pool.query(
      `UPDATE public.users_profile SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    const profileResult = await pool.query(
      'SELECT * FROM public.users_profile WHERE id = $1',
      [req.user.id]
    );

    res.json({ profile: profileResult.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ROTAS DE DADOS ====================

// Clusters
app.get('/clusters', authMiddleware, async (req: any, res) => {
  try {
    let query = 'SELECT * FROM public.clusters';
    const params: any[] = [];

    // Se não for admin, filtrar por permissões
    if (req.user.role !== 'admin') {
      query = `
        SELECT DISTINCT c.* 
        FROM public.clusters c
        INNER JOIN public.user_cluster_permissions ucp ON c.id = ucp.cluster_id
        WHERE ucp.user_id = $1 AND ucp.can_view = true
      `;
      params.push(req.user.id);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/clusters', authMiddleware, async (req: any, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const { name, is_active } = req.body;
    const result = await pool.query(
      'INSERT INTO public.clusters (name, is_active) VALUES ($1, $2) RETURNING *',
      [name, is_active ?? true]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/clusters/:id', authMiddleware, async (req: any, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const { id } = req.params;
    const { name, is_active } = req.body;
    const result = await pool.query(
      'UPDATE public.clusters SET name = COALESCE($1, name), is_active = COALESCE($2, is_active) WHERE id = $3 RETURNING *',
      [name, is_active, id]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Resources Created
app.get('/resources-created', authMiddleware, async (req: any, res) => {
  try {
    const { cluster_id, run_id } = req.query;
    let query = 'SELECT * FROM public.resources_created WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (cluster_id) {
      query += ` AND cluster_id = $${paramCount}`;
      params.push(cluster_id);
      paramCount++;
    }
    if (run_id) {
      query += ` AND run_id = $${paramCount}`;
      params.push(run_id);
      paramCount++;
    }

    // Filtrar por permissões se não for admin
    if (req.user.role !== 'admin') {
      query += ` AND cluster_id IN (
        SELECT cluster_id FROM public.user_cluster_permissions 
        WHERE user_id = $${paramCount} AND can_view = true
      )`;
      params.push(req.user.id);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Resources Unused
app.get('/resources-unused', authMiddleware, async (req: any, res) => {
  try {
    const { cluster_id, run_id, type } = req.query;
    let query = 'SELECT * FROM public.resources_unused WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (cluster_id) {
      query += ` AND cluster_id = $${paramCount}`;
      params.push(cluster_id);
      paramCount++;
    }
    if (run_id) {
      query += ` AND run_id = $${paramCount}`;
      params.push(run_id);
      paramCount++;
    }
    if (type) {
      query += ` AND type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    // Filtrar por permissões se não for admin
    if (req.user.role !== 'admin') {
      query += ` AND cluster_id IN (
        SELECT cluster_id FROM public.user_cluster_permissions 
        WHERE user_id = $${paramCount} AND can_view = true
      )`;
      params.push(req.user.id);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard Stats
app.get('/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.v_dashboard_totals');
    res.json(result.rows[0] || {});
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/dashboard/unused-by-type', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.v_unused_by_type');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Runs
app.get('/runs', authMiddleware, async (req: any, res) => {
  try {
    const { cluster_id, limit } = req.query;
    let query = 'SELECT * FROM public.runs WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (cluster_id) {
      query += ` AND cluster_id = $${paramCount}`;
      params.push(cluster_id);
      paramCount++;
    }

    // Filtrar por permissões se não for admin
    if (req.user.role !== 'admin') {
      query += ` AND cluster_id IN (
        SELECT cluster_id FROM public.user_cluster_permissions 
        WHERE user_id = $${paramCount} AND can_view = true
      )`;
      params.push(req.user.id);
      paramCount++;
    }

    query += ' ORDER BY run_ts DESC';
    
    if (limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(limit);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin - Users
app.get('/admin/users', authMiddleware, async (req: any, res) => {
  try {
    if (!req.user.can_manage_users) {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const result = await pool.query('SELECT * FROM public.users_profile ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/admin/users/:id', authMiddleware, async (req: any, res) => {
  console.log('📥 [UPDATE USER] Requisição recebida para atualizar usuário:', req.params.id);
  console.log('📝 [UPDATE USER] Dados para atualização:', req.body);
  try {
    if (!req.user.can_manage_users) {
      console.log('⚠️  [UPDATE USER] Usuário sem permissão:', req.user.id);
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const { id } = req.params;
    const { role, is_active } = req.body;
    
    console.log('🔄 [UPDATE USER] Atualizando perfil do usuário...');
    const result = await pool.query(
      'UPDATE public.users_profile SET role = COALESCE($1, role), is_active = COALESCE($2, is_active) WHERE id = $3 RETURNING *',
      [role, is_active, id]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ [UPDATE USER] Usuário não encontrado:', id);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    console.log('✅ [UPDATE USER] Usuário atualizado com sucesso:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('❌ [UPDATE USER] ERRO:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin - Change user password
app.patch('/admin/users/:id/password', authMiddleware, async (req: any, res) => {
  console.log('📥 [CHANGE PASSWORD] Requisição recebida para alterar senha do usuário:', req.params.id);
  try {
    if (!req.user.can_manage_users) {
      console.log('⚠️  [CHANGE PASSWORD] Usuário sem permissão:', req.user.id);
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      console.log('⚠️  [CHANGE PASSWORD] Senha muito curta');
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    // Buscar auth_user_id do usuário
    console.log('🔍 [CHANGE PASSWORD] Buscando auth_user_id...');
    const userResult = await pool.query(
      'SELECT auth_user_id, email FROM public.users_profile WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ [CHANGE PASSWORD] Usuário não encontrado no perfil:', id);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const authUserId = userResult.rows[0].auth_user_id;
    const email = userResult.rows[0].email;
    console.log('✅ [CHANGE PASSWORD] Usuário encontrado:', { authUserId, email });

    // Atualizar senha no auth.users
    console.log('🔐 [CHANGE PASSWORD] Gerando hash da nova senha...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('💾 [CHANGE PASSWORD] Atualizando senha no banco de dados...');
    const updateResult = await pool.query(
      'UPDATE auth.users SET encrypted_password = $1 WHERE id = $2 RETURNING id',
      [hashedPassword, authUserId]
    );

    if (updateResult.rows.length === 0) {
      console.log('❌ [CHANGE PASSWORD] Falha ao atualizar senha - usuário não encontrado em auth.users:', authUserId);
      return res.status(404).json({ error: 'Usuário não encontrado na tabela de autenticação' });
    }

    console.log('✅ [CHANGE PASSWORD] Senha alterada com sucesso para usuário:', email);
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error: any) {
    console.error('❌ [CHANGE PASSWORD] ERRO:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Admin - Delete user
app.delete('/admin/users/:id', authMiddleware, async (req: any, res) => {
  console.log('📥 [DELETE USER] Requisição recebida para excluir usuário:', req.params.id);
  try {
    if (!req.user.can_manage_users) {
      console.log('⚠️  [DELETE USER] Usuário sem permissão:', req.user.id);
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const { id } = req.params;

    // Buscar auth_user_id do usuário
    console.log('🔍 [DELETE USER] Buscando dados do usuário...');
    const userResult = await pool.query(
      'SELECT auth_user_id, email FROM public.users_profile WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ [DELETE USER] Usuário não encontrado no perfil:', id);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const authUserId = userResult.rows[0].auth_user_id;
    const email = userResult.rows[0].email;
    console.log('✅ [DELETE USER] Usuário encontrado:', { authUserId, email });

    // Deletar do auth.users (cascade vai deletar do users_profile)
    console.log('🗑️  [DELETE USER] Excluindo usuário do banco de dados...');
    const deleteResult = await pool.query(
      'DELETE FROM auth.users WHERE id = $1 RETURNING id',
      [authUserId]
    );

    if (deleteResult.rows.length === 0) {
      console.log('❌ [DELETE USER] Falha ao excluir - usuário não encontrado em auth.users:', authUserId);
      return res.status(404).json({ error: 'Usuário não encontrado na tabela de autenticação' });
    }

    console.log('✅ [DELETE USER] Usuário excluído com sucesso:', email);
    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error: any) {
    console.error('❌ [DELETE USER] ERRO:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// User Cluster Permissions
app.get('/user-cluster-permissions', authMiddleware, async (req: any, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const result = await pool.query('SELECT * FROM public.user_cluster_permissions');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/user-cluster-permissions', authMiddleware, async (req: any, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const { user_id, cluster_id, can_view } = req.body;
    const result = await pool.query(
      `INSERT INTO public.user_cluster_permissions (user_id, cluster_id, can_view) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (user_id, cluster_id) 
       DO UPDATE SET can_view = $3 
       RETURNING *`,
      [user_id, cluster_id, can_view]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/user-cluster-permissions/:user_id/:cluster_id', authMiddleware, async (req: any, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const { user_id, cluster_id } = req.params;
    await pool.query(
      'DELETE FROM public.user_cluster_permissions WHERE user_id = $1 AND cluster_id = $2',
      [user_id, cluster_id]
    );
    res.json({ message: 'Permissão removida' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Backend API RODANDO com sucesso!');
  console.log('📡 Porta:', PORT);
  console.log('🌍 Ambiente: Kubernetes');
  console.log('='.repeat(60) + '\n');
});
