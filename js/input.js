import { supabase } from './supabase-client.js';
import { requireAuth, updateUserEmailDisplay, setupLogout } from './auth.js';

async function init() {
    const authorized = await requireAuth('index.html');
    if (!authorized) return;

    updateUserEmailDisplay();
    setupLogout();

    const form = document.getElementById('input-form');
    const messageEl = document.getElementById('form-message');
    const recentList = document.getElementById('recent-list');

    await loadRecentData();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = {
            kode_logistik: formData.get('kode_logistik').trim(),
            nama_logistik: formData.get('nama_logistik').trim(),
            nopol_kendaraan: formData.get('nopol_kendaraan').trim().toUpperCase(),
            ukuran_ayam: formData.get('ukuran_ayam')
        };

        if (!data.kode_logistik || !data.nama_logistik || !data.nopol_kendaraan || !data.ukuran_ayam) {
            showMessage('Semua field wajib diisi', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';
        hideMessage();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            const { error } = await supabase
                .from('logistik_data')
                .insert([{
                    ...data,
                    created_by: user.id
                }]);

            if (error) throw error;

            showMessage('Data berhasil disimpan!', 'success');
            form.reset();
            await loadRecentData();
        } catch (error) {
            console.error('Insert error:', error);
            showMessage('Gagal menyimpan: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Simpan Data';
        }
    });

    async function loadRecentData() {
        try {
            const { data, error } = await supabase
                .from('logistik_data')
                .select('kode_logistik, nama_logistik, nopol_kendaraan, ukuran_ayam, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;

            renderRecentList(data || []);
        } catch (error) {
            console.error('Load recent error:', error);
            recentList.innerHTML = '<p class="empty-state">Gagal memuat data terbaru</p>';
        }
    }

    function renderRecentList(items) {
        if (items.length === 0) {
            recentList.innerHTML = '<p class="empty-state">Belum ada data</p>';
            return;
        }

        recentList.innerHTML = items.map(item => `
            <div class="recent-item">
                <div class="recent-item-info">
                    <span class="recent-item-logistik">${escapeHtml(item.nama_logistik)}</span>
                    <span class="recent-item-details">${escapeHtml(item.kode_logistik)} • ${escapeHtml(item.nopol_kendaraan)} • ${escapeHtml(item.ukuran_ayam)}</span>
                </div>
                <span class="recent-item-time">${formatDate(item.created_at)}</span>
            </div>
        `).join('');
    }

    function showMessage(text, type) {
        messageEl.textContent = text;
        messageEl.className = `form-message ${type}`;
    }

    function hideMessage() {
        messageEl.className = 'form-message';
        messageEl.textContent = '';
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

init();