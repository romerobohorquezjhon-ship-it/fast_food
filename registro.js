// ============================================================
// FAST FOOD SERVICE — Sistema de Gestión v2.0
// Stack: Vanilla JS + localStorage (sin backend requerido)
// ============================================================

// ─────────────────────────────────────────
// SISTEMA DE TOASTS (reemplaza alert())
// ─────────────────────────────────────────
function showToast(msg, type = 'success') {
    document.querySelectorAll('.ff-toast').forEach(t => t.remove());
    const cfg = {
        success: { bg: 'linear-gradient(135deg,#059669,#047857)', icon: '✅' },
        error:   { bg: 'linear-gradient(135deg,#dc2626,#b91c1c)', icon: '❌' },
        warning: { bg: 'linear-gradient(135deg,#d97706,#b45309)', icon: '⚠️' },
        info:    { bg: 'linear-gradient(135deg,#0891b2,#0e7490)', icon: '💬' }
    }[type] || { bg: '#059669', icon: '✅' };

    const el = document.createElement('div');
    el.className = 'ff-toast';
    el.style.cssText = `
        position:fixed; top:20px; right:20px; z-index:99999;
        background:${cfg.bg}; color:#fff;
        padding:12px 18px; border-radius:14px;
        font-weight:700; font-size:13px;
        display:flex; align-items:center; gap:10px;
        box-shadow:0 8px 32px rgba(0,0,0,0.45);
        animation:ffToastIn 0.35s cubic-bezier(0.34,1.56,0.64,1);
        max-width:320px; font-family:'DM Sans',sans-serif;
        border:1px solid rgba(255,255,255,0.15);
    `;
    el.innerHTML = `<span style="font-size:18px;flex-shrink:0">${cfg.icon}</span><span>${msg}</span>`;
    document.body.appendChild(el);

    setTimeout(() => {
        el.style.transition = 'all 0.3s ease';
        el.style.opacity = '0';
        el.style.transform = 'translateX(110%)';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function formatCOP(n) {
    return '$' + Number(n).toLocaleString('es-CO');
}

function nextOrderNum() {
    const n = (parseInt(localStorage.getItem('ff_counter') || '0')) + 1;
    localStorage.setItem('ff_counter', n);
    return String(n).padStart(3, '0');
}

function timeAgo(timestamp) {
    const mins = Math.floor((Date.now() - (timestamp || Date.now())) / 60000);
    if (mins < 1)  return '< 1 min';
    if (mins === 1) return '1 min';
    return `${mins} min`;
}

// ─────────────────────────────────────────
// AUTENTICACIÓN
// ─────────────────────────────────────────
function getUsers()          { return JSON.parse(localStorage.getItem('ff_users') || '[]'); }
function saveUsers(u)        { localStorage.setItem('ff_users', JSON.stringify(u)); }
function getSession()        { return localStorage.getItem('ff_session'); }
function requireAuth() {
    if (!getSession()) { window.location.href = 'index.html'; return false; }
    return true;
}
function logout() {
    localStorage.removeItem('ff_session');
    window.location.href = 'index.html';
}

// Migración de datos viejos (localStorage antiguo → nuevo esquema)
function migrarDatosAntiguos() {
    const oldUser = localStorage.getItem('usuario');
    if (oldUser && !getSession()) {
        localStorage.setItem('ff_session', oldUser);
        const users = getUsers();
        if (!users.find(u => u.nombre === oldUser)) {
            const emp = JSON.parse(localStorage.getItem('empleadoActivo') || '{}');
            users.push({
                nombre: oldUser, apellidos: emp.apellidos || '', telefono: emp.telefono || '',
                correo: emp.correo || '', password: '1234',
                fechaRegistro: emp.fechaRegistro || new Date().toLocaleDateString('es-CO')
            });
            saveUsers(users);
        }
    }
    const oldOrders = localStorage.getItem('pedidos');
    if (oldOrders && !localStorage.getItem('ff_orders')) {
        try {
            const orders = JSON.parse(oldOrders).map(o => ({
                ...o, estado: o.estado || 'pendiente',
                numero: o.numero || String(o.id).slice(-3),
                timestamp: o.timestamp || Date.now(),
                items: o.items.map(i => ({ ...i, qty: i.qty || i.cantidad || 1 }))
            }));
            localStorage.setItem('ff_orders', JSON.stringify(orders));
        } catch(e) { /* ignore */ }
    }
}

// ─────────────────────────────────────────
// DATOS DEL MENÚ
// ─────────────────────────────────────────
const MENU = [
    {
        categoria: "🍔 Hamburguesas",
        items: [
            { n: "Sencilla",       p: 15000 },
            { n: "Doble Carne",    p: 22000 },
            { n: "BBQ Crispy",     p: 24000 },
            { n: "Pollo Crispy",   p: 20000 }
        ]
    },
    {
        categoria: "🍟 Acompañantes",
        items: [
            { n: "Papas Medianas", p: 8000  },
            { n: "Papas Grandes",  p: 10000 },
            { n: "Nuggets x6",     p: 12000 },
            { n: "Aros de Cebolla",p: 9000  }
        ]
    },
    {
        categoria: "🥤 Bebidas",
        items: [
            { n: "Gaseosa",        p: 5000  },
            { n: "Agua",           p: 3000  },
            { n: "Jugo Natural",   p: 7000  },
            { n: "Malteada",       p: 9000  }
        ]
    },
    {
        categoria: "🍨 Postres",
        items: [
            { n: "Helado Vainilla",p: 6000  },
            { n: "Sundae Choco",   p: 8000  },
            { n: "Brownie",        p: 7000  }
        ]
    }
];

// ─────────────────────────────────────────
// LÓGICA DEL MESERO
// ─────────────────────────────────────────
let pedido = [];

function renderMenu() {
    const c = document.getElementById('contenedor-menu');
    if (!c) return;
    c.innerHTML = MENU.map(cat => `
        <div class="mb-5">
            <h3 class="text-cyan-500 text-[10px] font-black mb-3 uppercase tracking-widest
                        flex items-center gap-2 border-b border-gray-800 pb-2">
                ${cat.categoria}
            </h3>
            <div class="grid grid-cols-2 gap-2">
                ${cat.items.map(p => `
                    <button onclick="addItem('${p.n.replace(/'/g,"\\'")}', ${p.p})"
                        class="menu-item-btn bg-gray-800 hover:bg-gray-750 active:scale-95
                               p-3 rounded-xl border border-gray-700 hover:border-cyan-600
                               text-left transition-all group relative overflow-hidden">
                        <span class="block font-bold text-xs text-white group-hover:text-cyan-300 transition-colors leading-tight">${p.n}</span>
                        <span class="text-cyan-400 font-black text-sm mt-1 block">${formatCOP(p.p)}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function addItem(nombre, precio) {
    const ex = pedido.find(i => i.nombre === nombre);
    if (ex) { ex.qty++; }
    else { pedido.push({ id: Date.now() + Math.random(), nombre, precio, qty: 1 }); }
    renderTicket();
    // Feedback visual en el botón
    const btns = document.querySelectorAll('.menu-item-btn');
    btns.forEach(btn => {
        if (btn.querySelector('span')?.textContent === nombre) {
            btn.style.borderColor = '#06b6d4';
            btn.style.backgroundColor = '#164e63';
            setTimeout(() => { btn.style.borderColor = ''; btn.style.backgroundColor = ''; }, 400);
        }
    });
}

function removeItem(id) {
    pedido = pedido.filter(i => i.id !== id);
    renderTicket();
}

function changeQty(id, d) {
    const item = pedido.find(i => i.id === id);
    if (!item) return;
    item.qty += d;
    if (item.qty <= 0) pedido = pedido.filter(i => i.id !== id);
    renderTicket();
}

function clearOrder() {
    if (pedido.length === 0) return;
    if (confirm('¿Vaciar el pedido actual?')) { pedido = []; renderTicket(); }
}

function renderTicket() {
    const lista    = document.getElementById('lista-seleccionada');
    const totalEl  = document.getElementById('total-precio');
    const countEl  = document.getElementById('item-count');
    if (!lista) return;

    if (pedido.length === 0) {
        lista.innerHTML = `<div class="text-center py-6">
            <p class="text-4xl mb-2">🧾</p>
            <p class="text-gray-600 text-xs italic">Selecciona productos del menú</p>
        </div>`;
    } else {
        lista.innerHTML = pedido.map(item => `
            <div class="flex items-center gap-2 bg-black/30 p-2.5 rounded-xl border border-gray-800/50">
                <div class="flex-1 min-w-0">
                    <p class="text-white text-xs font-bold truncate leading-tight">${item.nombre}</p>
                    <p class="text-cyan-400 text-xs font-bold mt-0.5">${formatCOP(item.precio * item.qty)}</p>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                    <button onclick="changeQty(${item.id}, -1)"
                        class="w-6 h-6 bg-gray-700 hover:bg-red-800 rounded-lg text-xs font-black
                               flex items-center justify-center transition-colors text-white">−</button>
                    <span class="w-6 text-center text-cyan-300 font-black text-xs">${item.qty}</span>
                    <button onclick="changeQty(${item.id}, 1)"
                        class="w-6 h-6 bg-gray-700 hover:bg-emerald-800 rounded-lg text-xs font-black
                               flex items-center justify-center transition-colors text-white">+</button>
                </div>
            </div>
        `).join('');
    }

    const total      = pedido.reduce((a, c) => a + c.precio * c.qty, 0);
    const totalItems = pedido.reduce((a, c) => a + c.qty, 0);

    if (totalEl) totalEl.textContent = formatCOP(total);
    if (countEl) {
        countEl.textContent = totalItems > 0 ? totalItems : '';
        countEl.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function submitOrder() {
    if (pedido.length === 0) { showToast('El pedido está vacío', 'warning'); return; }

    const mesa = document.getElementById('mesa')?.value || 'General';
    const obs  = document.getElementById('observaciones')?.value.trim() || '';
    const num  = nextOrderNum();

    const ticket = {
        id: Date.now(),
        numero: num,
        mesa,
        mesero: getSession() || 'Anónimo',
        items: pedido.map(i => ({ ...i })),
        notas: obs,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        estado: 'pendiente',
        timestamp: Date.now()
    };

    const cola = JSON.parse(localStorage.getItem('ff_orders') || '[]');
    cola.push(ticket);
    localStorage.setItem('ff_orders', JSON.stringify(cola));

    showToast(`Pedido #${num} enviado a cocina — ${mesa} 🍳`, 'success');

    // Reset
    pedido = [];
    if (document.getElementById('observaciones')) document.getElementById('observaciones').value = '';
    renderTicket();

    // Animación botón
    const btn = document.getElementById('btn-enviar');
    if (btn) {
        btn.innerHTML = '✓ ¡Enviado!';
        btn.style.background = '#059669';
        setTimeout(() => {
            btn.innerHTML = '🚀 Confirmar Pedido';
            btn.style.background = '';
        }, 2000);
    }
}

// Alias para compatibilidad
const enviarPedido = submitOrder;
const limpiarPedido = clearOrder;

// ─────────────────────────────────────────
// LÓGICA DE COCINA
// ─────────────────────────────────────────
const ESTADO_CFG = {
    pendiente:  {
        label: 'Pendiente',
        border: 'border-amber-500',
        badge:  'bg-amber-500/10 text-amber-400 border border-amber-500/30',
        btnCls: 'bg-blue-600 hover:bg-blue-500',
        btnTxt: '⚡ Iniciar Preparación',
        next:   'preparando'
    },
    preparando: {
        label: 'En Preparación',
        border: 'border-blue-500',
        badge:  'bg-blue-500/10 text-blue-400 border border-blue-500/30',
        btnCls: 'bg-emerald-600 hover:bg-emerald-500',
        btnTxt: '✓ Marcar como Listo',
        next:   'listo'
    },
    listo: {
        label: '✓ Listo para entregar',
        border: 'border-emerald-500',
        badge:  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
        btnCls: 'bg-violet-600 hover:bg-violet-500',
        btnTxt: '🚚 Despachar al mesero',
        next:   'despachado'
    }
};

function loadOrders() {
    const c = document.getElementById('listaPedidos');
    if (!c) return;

    const orders = JSON.parse(localStorage.getItem('ff_orders') || '[]');
    updateKitchenStats(orders);

    if (orders.length === 0) {
        c.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-24 text-center">
                <span class="text-8xl mb-5 block animate-bounce">🍽️</span>
                <p class="text-slate-500 font-black uppercase tracking-widest text-sm">Sin pedidos activos</p>
                <p class="text-slate-600 text-xs mt-2">El monitor se actualiza cada 2 segundos</p>
            </div>`;
        return;
    }

    c.innerHTML = orders.map(p => {
        const est = p.estado || 'pendiente';
        const cfg = ESTADO_CFG[est] || ESTADO_CFG.pendiente;
        const total = p.items.reduce((a, i) => a + (i.precio || i.p || 0) * (i.qty || i.cantidad || 1), 0);
        const mins = Math.floor((Date.now() - (p.timestamp || Date.now())) / 60000);
        const timerClass = mins >= 15 ? 'text-red-400 animate-pulse' : mins >= 8 ? 'text-amber-400' : 'text-emerald-400';

        return `
        <div class="bg-slate-800/90 backdrop-blur rounded-2xl border-t-8 ${cfg.border}
                    p-5 shadow-2xl ticket-animado flex flex-col gap-3 min-w-0">

            <!-- Header del ticket -->
            <div class="flex justify-between items-start">
                <div>
                    <h2 class="text-3xl font-black text-white leading-none"
                        style="font-family:'Bebas Neue',sans-serif">${p.mesa}</h2>
                    <span class="text-[10px] text-slate-500 font-mono mt-0.5 block">#${p.numero || p.id}</span>
                </div>
                <div class="text-right flex flex-col items-end gap-1">
                    <span class="font-mono text-xs bg-slate-900 text-slate-400 px-2 py-0.5 rounded-lg">${p.hora}</span>
                    <span class="font-black text-xs ${timerClass}">⏱ ${mins}m</span>
                </div>
            </div>

            <!-- Badge de estado -->
            <span class="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full w-fit ${cfg.badge}">
                ${cfg.label}
            </span>

            <!-- Mesero -->
            <div class="bg-slate-700/40 rounded-xl p-2.5">
                <p class="text-[9px] text-amber-400 font-black uppercase tracking-widest">Mesero</p>
                <p class="text-white font-bold text-sm mt-0.5">${p.mesero}</p>
            </div>

            <!-- Ítems -->
            <ul class="space-y-1.5 flex-grow">
                ${p.items.map(i => `
                    <li class="flex justify-between items-baseline text-sm">
                        <span class="text-slate-200 truncate flex-1">
                            • ${i.nombre || i.n}
                            ${(i.qty || i.cantidad || 1) > 1
                                ? `<span class="text-cyan-400 font-bold ml-1">×${i.qty || i.cantidad}</span>`
                                : ''}
                        </span>
                        <span class="text-slate-500 text-xs ml-2 flex-shrink-0">
                            ${formatCOP((i.precio || i.p || 0) * (i.qty || i.cantidad || 1))}
                        </span>
                    </li>
                `).join('')}
            </ul>

            <!-- Notas -->
            ${p.notas ? `
                <div class="bg-amber-950/40 border border-amber-800/30 text-amber-300 p-2.5 rounded-xl text-xs italic">
                    📝 ${p.notas}
                </div>` : ''}

            <!-- Total -->
            <div class="border-t border-slate-700 pt-2.5 flex justify-between items-center">
                <span class="text-slate-500 text-xs uppercase font-bold">Total</span>
                <span class="text-cyan-400 font-black text-lg">${formatCOP(total)}</span>
            </div>

            <!-- Botón de avance -->
            <button onclick="advanceOrder(${p.id})"
                class="${cfg.btnCls} py-3 rounded-xl font-black text-white uppercase text-[11px]
                       tracking-widest transition-all active:scale-95 shadow-lg">
                ${cfg.btnTxt}
            </button>
        </div>`;
    }).join('');
}

function updateKitchenStats(orders) {
    const s = {
        pendiente:  orders.filter(o => (o.estado||'pendiente') === 'pendiente').length,
        preparando: orders.filter(o => o.estado === 'preparando').length,
        listo:      orders.filter(o => o.estado === 'listo').length,
        total:      orders.length
    };
    ['pendiente','preparando','listo','total'].forEach(k => {
        const el = document.getElementById(`ks-${k}`);
        if (el) el.textContent = s[k];
    });
}

function advanceOrder(id) {
    let orders = JSON.parse(localStorage.getItem('ff_orders') || '[]');
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) return;

    const o = orders[idx];
    const est = o.estado || 'pendiente';

    if (est === 'listo') {
        // Mover a completados
        let done = JSON.parse(localStorage.getItem('ff_completed') || '[]');
        done.unshift({
            ...o, estado: 'despachado',
            horaDespacho: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
        });
        if (done.length > 100) done = done.slice(0, 100);
        localStorage.setItem('ff_completed', JSON.stringify(done));
        orders.splice(idx, 1);
        showToast(`✓ Pedido #${o.numero} despachado con éxito`, 'success');
    } else {
        const nextState = ESTADO_CFG[est].next;
        orders[idx].estado = nextState;
        showToast(`Pedido #${o.numero} → ${ESTADO_CFG[nextState]?.label || nextState}`, 'info');
    }

    localStorage.setItem('ff_orders', JSON.stringify(orders));
    loadOrders();
}

// Alias legacy
function entregar(id) { advanceOrder(id); }

// ─────────────────────────────────────────
// PANEL DE ADMINISTRACIÓN
// ─────────────────────────────────────────
function loadAdminPanel() {
    const completed = JSON.parse(localStorage.getItem('ff_completed') || '[]');
    const active    = JSON.parse(localStorage.getItem('ff_orders')    || '[]');
    const users     = getUsers();

    const totalRevenue = completed.reduce((a, o) =>
        a + o.items.reduce((b, i) => b + (i.precio||i.p||0) * (i.qty||i.cantidad||1), 0), 0);
    const avgOrder = completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0;

    // Stats
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('adm-completed', completed.length);
    setEl('adm-active',    active.length);
    setEl('adm-revenue',   formatCOP(totalRevenue));
    setEl('adm-avg',       formatCOP(avgOrder));
    setEl('adm-employees', users.length);

    // Tabla pedidos completados
    const tbody = document.getElementById('adm-orders-tbody');
    if (tbody) {
        if (completed.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-slate-500 text-sm">
                No hay pedidos completados aún.</td></tr>`;
        } else {
            tbody.innerHTML = completed.slice(0, 25).map(o => {
                const t = o.items.reduce((a, i) => a + (i.precio||i.p||0) * (i.qty||i.cantidad||1), 0);
                const itemCount = o.items.reduce((a, i) => a + (i.qty||i.cantidad||1), 0);
                return `
                <tr class="border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-4 text-cyan-400 font-mono font-black text-sm">#${o.numero||o.id}</td>
                    <td class="py-3 px-4 text-white font-semibold text-sm">${o.mesa}</td>
                    <td class="py-3 px-4 text-slate-300 text-sm">${o.mesero}</td>
                    <td class="py-3 px-4 text-xs text-slate-400">${itemCount} ítem(s)</td>
                    <td class="py-3 px-4 text-emerald-400 font-black text-sm">${formatCOP(t)}</td>
                    <td class="py-3 px-4 text-slate-500 text-xs font-mono">${o.horaDespacho||o.hora}</td>
                </tr>`;
            }).join('');
        }
    }

    // Tabla empleados
    const etbody = document.getElementById('adm-emp-tbody');
    if (etbody) {
        if (users.length === 0) {
            etbody.innerHTML = `<tr><td colspan="4" class="text-center py-10 text-slate-500 text-sm">
                No hay empleados registrados.</td></tr>`;
        } else {
            etbody.innerHTML = users.map((u, i) => `
                <tr class="border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center
                                        text-white text-xs font-black flex-shrink-0">
                                ${u.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p class="text-white font-bold text-sm">${u.nombre} ${u.apellidos}</p>
                                <p class="text-slate-500 text-xs">${u.correo||'—'}</p>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 px-4 text-slate-400 text-sm">${u.telefono||'—'}</td>
                    <td class="py-3 px-4 text-slate-500 text-xs">${u.fechaRegistro||'—'}</td>
                    <td class="py-3 px-4">
                        <button onclick="deleteEmployee('${u.nombre}')"
                            class="text-xs text-red-500 hover:text-red-300 transition-colors font-bold uppercase">
                            Eliminar
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }
}

function deleteEmployee(nombre) {
    const session = getSession();
    if (nombre === session) {
        showToast('No puedes eliminar tu propia cuenta', 'error');
        return;
    }
    if (!confirm(`¿Eliminar al empleado "${nombre}"?`)) return;
    const users = getUsers().filter(u => u.nombre !== nombre);
    saveUsers(users);
    showToast(`Empleado "${nombre}" eliminado`, 'warning');
    loadAdminPanel();
}

function clearAllData() {
    if (!confirm('⚠️ ¿REINICIAR TODO el sistema?\n\nSe borrarán pedidos, empleados y configuración.\nEsta acción NO se puede deshacer.')) return;
    ['ff_orders','ff_completed','ff_counter','ff_users','ff_session',
     'pedidos','usuario','empleadoActivo'].forEach(k => localStorage.removeItem(k));
    showToast('Sistema reiniciado', 'warning');
    setTimeout(() => window.location.href = 'index.html', 1500);
}

function exportarDatos() {
    const data = {
        exportado: new Date().toISOString(),
        pedidosCompletados: JSON.parse(localStorage.getItem('ff_completed') || '[]'),
        pedidosActivos:     JSON.parse(localStorage.getItem('ff_orders')    || '[]'),
        empleados:          getUsers().map(u => ({ nombre:u.nombre, apellidos:u.apellidos, correo:u.correo, telefono:u.telefono }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `fastfood-export-${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
    showToast('Datos exportados como JSON', 'success');
}

// ─────────────────────────────────────────
// DOMContentLoaded — INICIALIZACIÓN
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    migrarDatosAntiguos();

    // ── LOGIN (index.html) ──
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        if (getSession()) { window.location.href = 'roles1.html'; return; }

        loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const nombre = document.getElementById('login-nombre').value.trim();
    const pass   = document.getElementById('login-pass').value;
    
    if (!nombre || !pass) { 
        showToast('Completa todos los campos', 'error'); 
        return; 
    }

    try {
        const response = await fetch('api.php?action=login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: nombre, pass })
        });
        
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('ff_session', result.nombre);
            showToast(`¡Bienvenido de nuevo, ${result.nombre}! 👋`, 'success');
            setTimeout(() => window.location.href = 'roles1.html', 900);
        } else {
            showToast('Usuario o contraseña incorrectos', 'error');
            document.getElementById('login-pass').value = '';
            document.getElementById('login-pass').focus();
        }
    } catch (error) {
        showToast('Error de conexión con el servidor', 'error');
    }
});

        // Mostrar contador de empleados registrados
        const userCount = getUsers().length;
        const countEl = document.getElementById('user-count');
        if (countEl) countEl.textContent = userCount > 0
            ? `${userCount} empleado${userCount > 1 ? 's' : ''} registrado${userCount > 1 ? 's' : ''}`
            : 'Sin empleados aún — regístrate primero';
    }

    
    // ── REGISTRO (registro1.html) ──
  // ── REGISTRO (registro1.html) ──
const regForm = document.getElementById('regForm');
if (regForm && !regForm.dataset.handled) {
    regForm.dataset.handled = 'true';
    regForm.addEventListener('submit', async e => {
        e.preventDefault();
        const nombre    = document.getElementById('nombre').value.trim();
        const apellidos = document.getElementById('apellidos').value.trim();
        const telefono  = document.getElementById('telefono').value.trim();
        const correo    = document.getElementById('correo_electronico').value.trim();
        const pass      = document.getElementById('password').value;
        const pass2     = document.getElementById('password2').value;

        if (!nombre || !apellidos || !telefono || !correo || !pass) {
            showToast('Completa todos los campos obligatorios', 'error'); return;
        }
        if (pass.length < 4) {
            showToast('La contraseña debe tener al menos 4 caracteres', 'warning'); return;
        }
        if (pass !== pass2) {
            showToast('Las contraseñas no coinciden', 'error'); return;
        }

        try {
            // Enviar a la BD vía API
            const response = await fetch('api.php?action=register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, apellidos, telefono, correo, password: pass })
            });
            
            const result = await response.json();
            
            if (result.success) {
                localStorage.setItem('ff_session', nombre);
                showToast(`¡Bienvenido al equipo, ${nombre}! 🎉`, 'success');
                setTimeout(() => window.location.href = 'roles1.html', 900);
            } else {
                showToast(result.error || 'Error al registrar', 'error');
            }
        } catch (error) {
            showToast('Error de conexión con el servidor', 'error');
            console.error(error);
        }
    });
}

    // ── SELECCIÓN DE ROL (roles1.html) ──
    const nombreEl = document.getElementById('nombreUsuario');
    if (nombreEl) {
        if (!requireAuth()) return;
        nombreEl.textContent = getSession();
    }

    // ── MESERO (meseros1.html) ──
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        if (!requireAuth()) return;
        userNameEl.textContent = getSession();
        renderMenu();
        renderTicket();
    }

    // ── ADMIN (admin.html) ──
    const adminEl = document.getElementById('adm-panel-trigger');
    if (adminEl) {
        if (!requireAuth()) return;
        const nameEl = document.getElementById('adm-username');
        if (nameEl) nameEl.textContent = getSession();
        loadAdminPanel();
        setInterval(loadAdminPanel, 5000);
    }
});

// ── COCINA (cosina1.html) ──
if (document.getElementById('listaPedidos')) {
    if (!localStorage.getItem('ff_session') && !localStorage.getItem('usuario')) {
        window.location.href = 'index.html';
    }
    window.addEventListener('load', loadOrders);
    setInterval(loadOrders, 2000);
}
