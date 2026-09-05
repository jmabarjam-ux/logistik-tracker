import { supabase } from './supabase-client.js';
import { requireAuth, setupLogout, getUser } from './auth.js';

const body = document.getElementById('record-body');
const empty = document.getElementById('record-empty');
const loading = document.getElementById('record-loading');
const search = document.getElementById('record-search');
const count = document.getElementById('record-count');
let records = [];
let channel;

async function init() {
    if (!await requireAuth('index.html')) return;
    setupLogout();
    setupSidebar();

    const user = await getUser();
    if (user) {
        const name = user.user_metadata?.name || user.email.split('@')[0];
        document.getElementById('user-name').textContent = name;
        document.getElementById('user-email').textContent = user.email;
        document.getElementById('user-avatar').textContent = name.charAt(0).toUpperCase();
    }

    search.addEventListener('input', render);
    await loadRecords();
    channel = supabase.channel('bongkar_records').on('postgres_changes', { event: '*', schema: 'public', table: 'logistik_data' }, loadRecords).subscribe();
    window.addEventListener('beforeunload', () => channel && supabase.removeChannel(channel));
}

async function loadRecords() {
    const { data, error } = await supabase.from('logistik_data')
        .select('id, kode_logistik, nama_logistik, nopol_kendaraan, ukuran_ayam, created_at')
        .eq('status_bongkar', 'selesai')
        .order('created_at', { ascending: false });
    loading.style.display = 'none';
    if (error) {
        empty.textContent = `Gagal memuat record: ${error.message}`;
        empty.style.display = 'block';
        return;
    }
    records = data || [];
    render();
}

function render() {
    const query = search.value.toLowerCase().trim();
    const visible = records.filter(item => [item.kode_logistik, item.nama_logistik, item.nopol_kendaraan, item.ukuran_ayam].some(value => value.toLowerCase().includes(query)));
    count.textContent = records.length;
    empty.style.display = visible.length ? 'none' : 'block';
    body.innerHTML = visible.map((item, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(item.nama_logistik)}</td><td>${escapeHtml(item.nopol_kendaraan)}</td><td><span class="grade-badge grade-${gradeClass(item.ukuran_ayam)}">${escapeHtml(item.ukuran_ayam)}</span></td><td>${formatDate(item.created_at)}</td></tr>`).join('');
}

function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const close = () => { sidebar.classList.remove('open'); overlay.classList.remove('open'); };
    document.getElementById('menu-toggle').addEventListener('click', () => { sidebar.classList.add('open'); overlay.classList.add('open'); });
    document.getElementById('sidebar-toggle').addEventListener('click', close);
    overlay.addEventListener('click', close);
}
function gradeClass(value) { return value.includes('Grade 1') ? '1' : value.includes('Grade 2') ? '2' : '3'; }
function formatDate(value) { return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }); }
function escapeHtml(value) { const div = document.createElement('div'); div.textContent = value ?? ''; return div.innerHTML; }

init();
