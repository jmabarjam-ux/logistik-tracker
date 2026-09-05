import { supabase } from './supabase-client.js';
import { requireAuth, updateUserEmailDisplay, setupLogout, getUser } from './auth.js';

async function init() {
    const authorized = await requireAuth('index.html');
    if (!authorized) return;

    // Update user display in sidebar and top bar
    const user = await getUser();
    if (user) {
        const name = user.user_metadata?.name || user.email.split('@')[0];
        const initial = name.charAt(0).toUpperCase();
        
        document.getElementById('user-name').textContent = name;
        document.getElementById('user-email').textContent = user.email;
        document.getElementById('user-avatar').textContent = initial;
    }

    setupLogout();
    setupSidebar();

    const form = document.getElementById('input-form');
    const messageEl = document.getElementById('form-message');
    const recentList = document.getElementById('recent-list');
    const emptyRecent = document.getElementById('empty-recent');
    const recentCount = document.getElementById('recent-count');
    const submitBtn = document.getElementById('submit-btn');

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

        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        const btnText = submitBtn.querySelector('span');
        if (btnText) btnText.textContent = 'Menyimpan...';
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
            // Clear validation styles
            form.querySelectorAll('input, select').forEach(el => {
                el.style.borderColor = '';
            });
            await loadRecentData();
        } catch (error) {
            console.error('Insert error:', error);
            showMessage('Gagal menyimpan: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            if (btnText) btnText.textContent = 'Simpan Data';
        }
    });

    // Reset button handler
    document.getElementById('reset-btn')?.addEventListener('click', () => {
        hideMessage();
        form.querySelectorAll('input, select').forEach(el => {
            el.style.borderColor = '';
        });
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
            if (recentCount) {
                recentCount.textContent = `${data?.length || 0} data`;
            }
        } catch (error) {
            console.error('Load recent error:', error);
            recentList.innerHTML = '';
            if (emptyRecent) emptyRecent.style.display = 'block';
            emptyRecent.innerHTML = '<p>Gagal memuat data terbaru</p>';
        }
    }

    function renderRecentList(items) {
        if (items.length === 0) {
            recentList.innerHTML = '';
            if (emptyRecent) emptyRecent.style.display = 'block';
            return;
        }

        if (emptyRecent) emptyRecent.style.display = 'none';
        
        recentList.innerHTML = items.map(item => `
            <div class="recent-item">
                <div class="recent-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                </div>
                <div class="recent-item-info">
                    <span class="recent-item-logistik">${escapeHtml(item.nama_logistik)}</span>
                    <div class="recent-item-meta">
                        <span>${escapeHtml(item.kode_logistik)}</span>
                        <span>${escapeHtml(item.nopol_kendaraan)}</span>
                        <span class="recent-item-grade grade-${getGradeClass(item.ukuran_ayam)}">${escapeHtml(item.ukuran_ayam)}</span>
                    </div>
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

    function setupSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const menuToggle = document.getElementById('menu-toggle');
        const sidebarToggle = document.getElementById('sidebar-toggle');

        function openSidebar() {
            sidebar.classList.add('open');
            overlay.classList.add('open');
        }

        function closeSidebar() {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
        }

        menuToggle?.addEventListener('click', openSidebar);
        sidebarToggle?.addEventListener('click', closeSidebar);
        overlay?.addEventListener('click', closeSidebar);

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeSidebar();
        });

        // Set active nav item
        const currentPage = window.location.pathname.split('/').pop() || 'input.html';
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('href') === currentPage);
        });
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
            minute: '2-digit'
        });
    }
}

init();