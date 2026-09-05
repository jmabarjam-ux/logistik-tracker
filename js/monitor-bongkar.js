import { supabase } from './supabase-client.js';

const activeTrucks = document.getElementById('active-trucks');
const queueList = document.getElementById('queue-list');
const queueCount = document.getElementById('queue-count');
const monitorMessage = document.getElementById('monitor-message');

let channel;

async function loadQueue() {
    const { data, error } = await supabase
        .from('logistik_data')
        .select('id, kode_logistik, nama_logistik, nopol_kendaraan, ukuran_ayam, created_at, status_bongkar')
        .eq('status_bongkar', 'antri')
        .order('created_at', { ascending: true });

    if (error) throw error;
    renderQueue(data || []);
}

function renderQueue(items) {
    const activeItems = items.slice(0, 2);
    const waitingItems = items.slice(2);

    activeTrucks.innerHTML = activeItems.length
        ? activeItems.map((item, index) => renderActiveTruck(item, index)).join('')
        : '<div class="monitor-empty">Belum ada truk dalam antrean bongkar.</div>';

    queueCount.textContent = `${waitingItems.length} truk`;
    queueList.innerHTML = waitingItems.length
        ? waitingItems.map((item, index) => renderQueueItem(item, index + 3)).join('')
        : '<li class="monitor-empty queue-empty">Belum ada antrean berikutnya.</li>';
}

function renderActiveTruck(item, index) {
    return `
        <article class="monitor-truck-card" style="--card-delay: ${index * 0.1}s">
            <div class="truck-card-topline">
                <span class="truck-order">0${index + 1}</span>
                <span class="truck-status">Menunggu bongkar</span>
            </div>
            <div class="truck-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7zM6.5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17.5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M14 13h7"/></svg>
            </div>
            <p class="truck-expedition">${escapeHtml(item.nama_logistik)}</p>
            <div class="truck-details">
                <span><small>No. Polisi</small><strong>${escapeHtml(item.nopol_kendaraan)}</strong></span>
                <span><small>Ukuran Ayam</small><strong>${escapeHtml(item.ukuran_ayam)}</strong></span>
            </div>
        </article>
    `;
}

function renderQueueItem(item, position) {
    return `
        <li class="monitor-queue-item">
            <span class="queue-position">${String(position).padStart(2, '0')}</span>
            <span class="queue-info"><strong>${escapeHtml(item.nama_logistik)}</strong><small>${escapeHtml(item.nopol_kendaraan)} · ${escapeHtml(item.ukuran_ayam)}</small></span>
            <time datetime="${escapeHtml(item.created_at)}">${formatTime(item.created_at)}</time>
        </li>
    `;
}

function formatTime(value) {
    return new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value ?? '';
    return div.innerHTML;
}

function showError(error) {
    activeTrucks.innerHTML = '<div class="monitor-empty">Antrean belum bisa dimuat.</div>';
    queueList.innerHTML = '';
    monitorMessage.textContent = `Koneksi monitor gagal: ${error.message}`;
    monitorMessage.className = 'monitor-message error';
}

async function init() {
    try {
        await loadQueue();
        monitorMessage.textContent = '';
        monitorMessage.className = 'monitor-message';
    } catch (error) {
        console.error('Monitor queue error:', error);
        showError(error);
    }

    channel = supabase
        .channel('monitor_bongkar_queue')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'logistik_data' }, async () => {
            try {
                await loadQueue();
            } catch (error) {
                console.error('Queue refresh error:', error);
                showError(error);
            }
        })
        .subscribe();

    window.addEventListener('beforeunload', () => {
        if (channel) supabase.removeChannel(channel);
    });
}

init();
