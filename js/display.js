import { supabase } from './supabase-client.js';
import { requireAuth, updateUserEmailDisplay, setupLogout } from './auth.js';

async function init() {
    const authorized = await requireAuth('index.html');
    if (!authorized) return;

    updateUserEmailDisplay();
    setupLogout();

    const tableBody = document.getElementById('table-body');
    const emptyState = document.getElementById('empty-state');
    const loadingState = document.getElementById('loading-state');
    const connectionStatus = document.getElementById('connection-status');

    let channel = null;

    async function loadInitialData() {
        try {
            const { data, error } = await supabase
                .from('logistik_data')
                .select('id, nama_logistik, nopol_kendaraan, ukuran_ayam, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;

            renderTable(data || []);
        } catch (error) {
            console.error('Load data error:', error);
            showError('Gagal memuat data: ' + error.message);
        } finally {
            loadingState.style.display = 'none';
        }
    }

    function renderTable(items) {
        if (items.length === 0) {
            tableBody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        tableBody.innerHTML = items.map((item, index) => `
            <tr data-id="${item.id}">
                <td>${index + 1}</td>
                <td>${escapeHtml(item.nama_logistik)}</td>
                <td>${escapeHtml(item.nopol_kendaraan)}</td>
                <td><span class="grade-badge grade-${getGradeClass(item.ukuran_ayam)}">${escapeHtml(item.ukuran_ayam)}</span></td>
                <td>${formatDate(item.created_at)}</td>
            </tr>
        `).join('');
    }

    function addRow(item) {
        emptyState.style.display = 'none';
        const rowCount = tableBody.children.length + 1;
        const row = document.createElement('tr');
        row.dataset.id = item.id;
        row.innerHTML = `
            <td>${rowCount}</td>
            <td>${escapeHtml(item.nama_logistik)}</td>
            <td>${escapeHtml(item.nopol_kendaraan)}</td>
            <td><span class="grade-badge grade-${getGradeClass(item.ukuran_ayam)}">${escapeHtml(item.ukuran_ayam)}</span></td>
            <td>${formatDate(item.created_at)}</td>
        `;
        row.style.animation = 'fadeIn 0.3s ease';
        tableBody.insertBefore(row, tableBody.firstChild);
        updateRowNumbers();
    }

    function updateRowNumbers() {
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            row.cells[0].textContent = index + 1;
        });
    }

    function setupRealtime() {
        channel = supabase
            .channel('logistik_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'logistik_data'
                },
                (payload) => {
                    console.log('Real-time insert:', payload);
                    addRow(payload.new);
                }
            )
            .subscribe((status) => {
                console.log('Realtime status:', status);
                updateConnectionStatus(status);
            });
    }

    function updateConnectionStatus(status) {
        if (!connectionStatus) return;
        
        connectionStatus.className = 'connection-status';
        if (status === 'SUBSCRIBED') {
            connectionStatus.classList.add('connected');
            connectionStatus.textContent = 'Terhubung (Real-time)';
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            connectionStatus.classList.add('disconnected');
            connectionStatus.textContent = 'Terputus';
        } else {
            connectionStatus.classList.add('connecting');
            connectionStatus.textContent = 'Menghubungkan...';
        }
    }

    function showError(message) {
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
        emptyState.innerHTML = `<p style="color: var(--error);">${escapeHtml(message)}</p>`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getGradeClass(grade) {
        if (grade.includes('Grade 1')) return '1';
        if (grade.includes('Grade 2')) return '2';
        if (grade.includes('Grade 3')) return '3';
        return '';
    }

    function formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    await loadInitialData();
    setupRealtime();

    window.addEventListener('beforeunload', () => {
        if (channel) {
            supabase.removeChannel(channel);
        }
    });
}

init();