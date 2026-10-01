const API_URL = 'http://localhost:3000';
const loginScreen = document.querySelector('#loginScreen');
const appShell = document.querySelector('#appShell');
const loginForm = document.querySelector('#loginForm');
const loginMessage = document.querySelector('#loginMessage');
const loginButton = document.querySelector('#loginButton');

function showLoginMessage(message, error = true) {
  loginMessage.textContent = message;
  loginMessage.className = `rounded-xl px-4 py-3 text-sm ${error
    ? 'bg-red-50 text-red-700'
    : 'bg-green-50 text-green-700'}`;
}

function showApp(user) {
  loginScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
  window.currentUser = user;
  const userName = document.querySelector('#userName');
  if (userName) userName.textContent = `Olá, ${user.nome}`;
}

function showLogin() {
  loginScreen.classList.remove('hidden');
  appShell.classList.add('hidden');
}

document.querySelector('#logoutButton').addEventListener('click', () => {
  sessionStorage.removeItem('musicArchiveUser');
  window.currentUser = null;
  showLogin();
  loginForm.reset();
  loginMessage.classList.add('hidden');
});

async function login(email, senha) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.erro || 'Não foi possível entrar.');
  return data;
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginButton.disabled = true;
  loginButton.textContent = 'Entrando…';
  loginMessage.classList.add('hidden');

  try {
    const form = new FormData(loginForm);
    const user = await login(form.get('email'), form.get('senha'));
    sessionStorage.setItem('musicArchiveUser', JSON.stringify(user));
    showApp(user);
    loadProducts();
  } catch (error) {
    showLoginMessage(error.message);
    loginMessage.classList.remove('hidden');
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = 'Entrar';
  }
});

const savedUser = sessionStorage.getItem('musicArchiveUser');
if (savedUser) {
  try {
    showApp(JSON.parse(savedUser));
  } catch {
    sessionStorage.removeItem('musicArchiveUser');
    showLogin();
  }
}

const productsEl = document.querySelector('#products');
const noticeEl = document.querySelector('#notice');
const cartPanel = document.querySelector('#cartPanel');
const overlay = document.querySelector('#overlay');
let products = [];
let cart = [];
let activeFilter = 'todos';

const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function categoryType(p) {
  if (p.artista || p.album) return 'vinis';
  if (p.tipo || p.modelo || p.material) return 'instrumentos';
  const c = String(p.categoria || '').toLowerCase();
  return c.includes('vin') || c.includes('disco') ? 'vinis' : 'instrumentos';
}
function renderProducts() {
  const visible = products.filter(p => activeFilter === 'todos' || categoryType(p) === activeFilter);
  if (!visible.length) { productsEl.innerHTML = '<div class="empty">Nenhum produto encontrado nesta categoria.</div>'; return; }
  productsEl.innerHTML = visible.map(p => {
    const type = categoryType(p);
    const subtitle = type === 'vinis' ? [p.artista, p.album].filter(Boolean).join(' · ') : [p.marca, p.tipo, p.modelo].filter(Boolean).join(' · ');
    const image = p.imagem_url ? `<img src="${escapeHTML(p.imagem_url)}" alt="${escapeHTML(p.nome)}" loading="lazy" onerror="this.remove()">` : '<span class="product-placeholder">♫</span>';
    return `<article class="product-card"><div class="product-image">${image}<span class="product-type">${type === 'vinis' ? 'Disco de vinil' : 'Instrumento'}</span></div><div class="product-info"><div><h3>${escapeHTML(p.nome)}</h3><p>${escapeHTML(subtitle || p.categoria || 'Music Archive')}</p></div><span class="price">${money(p.preco)}</span></div><button class="add-button" data-add="${Number(p.id_produto)}">Adicionar à sacola　＋</button></article>`;
  }).join('');
}
async function loadProducts() {
  try {
    const response = await fetch(`${API_URL}/produtos`);
    if (!response.ok) throw new Error(`API respondeu ${response.status}`);
    products = await response.json();
    noticeEl.textContent = `${products.length} produto(s) no catálogo`;
    renderProducts();
  } catch (error) {
    noticeEl.textContent = 'Não foi possível carregar o catálogo. Verifique se a API está rodando em http://localhost:3000.';
    productsEl.innerHTML = '<div class="empty">Inicie o Back-End e confirme a conexão com o PostgreSQL para visualizar os produtos.</div>';
  }
}
function renderCart() {
  document.querySelector('#cartCount').textContent = cart.reduce((s, x) => s + x.qty, 0);
  document.querySelector('#cartTotal').textContent = money(cart.reduce((s, x) => s + x.price * x.qty, 0));
  document.querySelector('#cartItems').innerHTML = cart.length ? cart.map(x => `<div class="cart-row"><div>${escapeHTML(x.name)}<small>${x.qty} × ${money(x.price)}</small></div><button data-remove="${x.id}">Remover</button></div>`).join('') : '<p class="notice">Sua sacola está vazia.</p>';
}
productsEl.addEventListener('click', e => {
  const b = e.target.closest('[data-add]'); if (!b) return;
  const p = products.find(x => Number(x.id_produto) === Number(b.dataset.add)); if (!p) return;
  const existing = cart.find(x => x.id === Number(p.id_produto));
  if (existing) existing.qty++; else cart.push({ id: Number(p.id_produto), name: p.nome, price: Number(p.preco), qty: 1 });
  renderCart(); openCart();
});
document.querySelector('#cartItems').addEventListener('click', e => {
  const b = e.target.closest('[data-remove]'); if (!b) return;
  cart = cart.filter(x => x.id !== Number(b.dataset.remove)); renderCart();
});
document.querySelectorAll('.filter').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach(x => x.classList.remove('active')); b.classList.add('active');
  activeFilter = b.dataset.filter; renderProducts();
}));
function openCart() { cartPanel.classList.add('open'); overlay.classList.add('show'); cartPanel.setAttribute('aria-hidden', 'false') }
function closeCart() { cartPanel.classList.remove('open'); overlay.classList.remove('show'); cartPanel.setAttribute('aria-hidden', 'true') }
document.querySelector('#cartButton').addEventListener('click', openCart);
document.querySelector('#closeCart').addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);
renderCart();
if (sessionStorage.getItem('musicArchiveUser')) loadProducts();