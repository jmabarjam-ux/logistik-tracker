import { supabase } from './supabase-client.js';
import { requireAuth, updateUserEmailDisplay, setupLogout, getUser } from './auth.js';

async function init() {
    const authorized = await requireAuth('index.html');
    if (!authorized) return;

    updateUserEmailDisplay();
    setupLogout();
    setupSidebar();

    const user = await getUser();
    if (user) {
        const name = user.user_metadata?.name || user.email.split('@')[0];
        const nameEl = document.getElementById('user-name');
        const avatarEl = document.getElementById('user-avatar');
        if (nameEl) nameEl.textContent = name;
        if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
    }

    const tableBody = document.getElementById('table-body');
    const emptyState = document.getElementById('empty-state');
    const loadingState = document.getElementById('loading-state');
    const connectionStatus = document.getElementById('connection-status');

    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const editMessage = document.getElementById('edit-message');
    const deleteModal = document.getElementById('delete-modal');
    const deleteMessage = document.getElementById('delete-message');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const deleteNamaLogistik = document.getElementById('delete-nama-logistik');
    const searchInput = document.getElementById('search-input');
    const totalCount = document.getElementById('total-count');
    const todayCount = document.getElementById('today-count');

    let channel = null;
    let deleteTargetId = null;
    let currentUser = null;
    let allData = [];

    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;

    async function loadInitialData() {
        try {
            const { data, error } = await supabase
                .from('logistik_data')
                .select('id, kode_logistik, nama_logistik, nopol_kendaraan, ukuran_ayam, created_at, created_by')
                .order('created_at', { ascending: false });

            if (error) throw error;

            allData = data || [];
            updateMetrics();
            renderTable(allData);
            setupSearch();
        } catch (error) {
            console.error('Load data error:', error);
            showError('Gagal memuat data: ' + error.message);
        } finally {
            loadingState.style.display = 'none';
        }
    }

    function setupSearch() {
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query === '') {
                renderTable(allData);
            } else {
                const filtered = allData.filter(item => 
                    item.nama_logistik.toLowerCase().includes(query) ||
                    item.nopol_kendaraan.toLowerCase().includes(query) ||
                    item.kode_logistik.toLowerCase().includes(query) ||
                    item.ukuran_ayam.toLowerCase().includes(query)
                );
                renderTable(filtered);
            }
        });
    }

    function renderTable(items) {
        if (items.length === 0) {
            tableBody.innerHTML = '';
            emptyState.style.display = 'block';
            if (searchInput && searchInput.value.trim() !== '') {
                emptyState.innerHTML = '<p>Tidak ada data yang cocok dengan pencarian.</p>';
            } else {
                emptyState.innerHTML = '<p>Belum ada data. <a href="input.html">Tambah data pertama</a></p>';
            }
            return;
        }

        emptyState.style.display = 'none';
        tableBody.innerHTML = items.map((item, index) => `
            <tr data-id="${item.id}" data-created-by="${item.created_by}">
                <td>${index + 1}</td>
                <td>${escapeHtml(item.nama_logistik)}</td>
                <td>${escapeHtml(item.nopol_kendaraan)}</td>
                <td><span class="grade-badge grade-${getGradeClass(item.ukuran_ayam)}">${escapeHtml(item.ukuran_ayam)}</span></td>
                <td>${formatDate(item.created_at)}</td>
                <td>
                    <div class="action-buttons">
                        ${currentUser && item.created_by === currentUser.id ? `
                            <button class="btn btn-sm btn-secondary edit-btn" data-id="${item.id}" aria-label="Edit ${escapeHtml(item.nama_logistik)}">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${item.id}" data-nama="${escapeHtml(item.nama_logistik)}" aria-label="Hapus ${escapeHtml(item.nama_logistik)}">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        ` : '<span class="text-muted">-</span>'}
                    </div>
                </td>
            </tr>
        `).join('');

        attachActionListeners();
    }

    function attachActionListeners() {
        tableBody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                openEditModal(id);
            });
        });

        tableBody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const nama = btn.dataset.nama;
                openDeleteModal(id, nama);
            });
        });
    }

    function addRow(item) {
        allData.unshift(item);
        updateMetrics();
        emptyState.style.display = 'none';
        const rowCount = tableBody.children.length + 1;
        const row = document.createElement('tr');
        row.dataset.id = item.id;
        row.dataset.createdBy = item.created_by;
        row.innerHTML = `
            <td>${rowCount}</td>
            <td>${escapeHtml(item.nama_logistik)}</td>
            <td>${escapeHtml(item.nopol_kendaraan)}</td>
            <td><span class="grade-badge grade-${getGradeClass(item.ukuran_ayam)}">${escapeHtml(item.ukuran_ayam)}</span></td>
            <td>${formatDate(item.created_at)}</td>
            <td>
                <div class="action-buttons">
                    ${currentUser && item.created_by === currentUser.id ? `
                        <button class="btn btn-sm btn-secondary edit-btn" data-id="${item.id}" aria-label="Edit ${escapeHtml(item.nama_logistik)}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${item.id}" data-nama="${escapeHtml(item.nama_logistik)}" aria-label="Hapus ${escapeHtml(item.nama_logistik)}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    ` : '<span class="text-muted">-</span>'}
                </div>
            </td>
        `;
        row.style.animation = 'fadeIn 0.3s ease';
        tableBody.insertBefore(row, tableBody.firstChild);
        updateRowNumbers();
        attachActionListeners();
    }

    function updateRowNumbers() {
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            row.cells[0].textContent = index + 1;
        });
    }

    async function openEditModal(id) {
        try {
            const { data, error } = await supabase
                .from('logistik_data')
                .select('id, kode_logistik, nama_logistik, nopol_kendaraan, ukuran_ayam')
                .eq('id', id)
                .single();

            if (error) throw error;

            document.getElementById('edit-id').value = data.id;
            document.getElementById('edit-kode-logistik').value = data.kode_logistik;
            document.getElementById('edit-nama-logistik').value = data.nama_logistik;
            document.getElementById('edit-nopol-kendaraan').value = data.nopol_kendaraan;
            document.getElementById('edit-ukuran-ayam').value = data.ukuran_ayam;
            editMessage.textContent = '';
            editMessage.className = 'form-message';

            editModal.classList.add('open');
            document.body.style.overflow = 'hidden';
            document.getElementById('edit-kode-logistik').focus();
        } catch (error) {
            console.error('Load edit data error:', error);
            alert('Gagal memuat data: ' + error.message);
        }
    }

    function closeEditModal() {
        editModal.classList.remove('open');
        document.body.style.overflow = '';
        editForm.reset();
    }

    function openDeleteModal(id, nama) {
        deleteTargetId = id;
        deleteNamaLogistik.textContent = nama;
        deleteMessage.textContent = '';
        deleteMessage.className = 'form-message';
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Hapus';

        deleteModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeDeleteModal() {
        deleteModal.classList.remove('open');
        document.body.style.overflow = '';
        deleteTargetId = null;
    }

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('edit-id').value;
        const formData = new FormData(editForm);
        const data = {
            kode_logistik: formData.get('kode_logistik').trim(),
            nama_logistik: formData.get('nama_logistik').trim(),
            nopol_kendaraan: formData.get('nopol_kendaraan').trim().toUpperCase(),
            ukuran_ayam: formData.get('ukuran_ayam')
        };

        if (!data.kode_logistik || !data.nama_logistik || !data.nopol_kendaraan || !data.ukuran_ayam) {
            showEditMessage('Semua field wajib diisi', 'error');
            return;
        }

        const submitBtn = editForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';

        try {
            const { error } = await supabase
                .from('logistik_data')
                .update(data)
                .eq('id', id);

            if (error) throw error;

            showEditMessage('Data berhasil diperbarui!', 'success');
            setTimeout(() => {
                closeEditModal();
                loadInitialData();
            }, 1000);
        } catch (error) {
            console.error('Update error:', error);
            showEditMessage('Gagal memperbarui: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Simpan Perubahan';
        }
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        if (!deleteTargetId) return;

        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.textContent = 'Menghapus...';

        try {
            const { error } = await supabase
                .from('logistik_data')
                .delete()
                .eq('id', deleteTargetId);

            if (error) throw error;

            showDeleteMessage('Data berhasil dihapus!', 'success');
            setTimeout(() => {
                closeDeleteModal();
                loadInitialData();
            }, 1000);
        } catch (error) {
            console.error('Delete error:', error);
            showDeleteMessage('Gagal menghapus: ' + error.message, 'error');
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.textContent = 'Hapus';
        }
    });

    function showEditMessage(text, type) {
        editMessage.textContent = text;
        editMessage.className = `form-message ${type}`;
    }

    function showDeleteMessage(text, type) {
        deleteMessage.textContent = text;
        deleteMessage.className = `form-message ${type}`;
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
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'logistik_data'
                },
                (payload) => {
                    console.log('Real-time update:', payload);
                    updateRow(payload.new);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'logistik_data'
                },
                (payload) => {
                    console.log('Real-time delete:', payload);
                    removeRow(payload.old.id);
                }
            )
            .subscribe((status) => {
                console.log('Realtime status:', status);
                updateConnectionStatus(status);
            });
    }

    function updateRow(item) {
        const row = tableBody.querySelector(`tr[data-id="${item.id}"]`);
        if (!row) return;

        // Update allData
        const index = allData.findIndex(d => d.id === item.id);
        if (index !== -1) {
            allData[index] = item;
        }

        row.cells[1].textContent = escapeHtml(item.nama_logistik);
        row.cells[2].textContent = escapeHtml(item.nopol_kendaraan);
        row.cells[3].innerHTML = `<span class="grade-badge grade-${getGradeClass(item.ukuran_ayam)}">${escapeHtml(item.ukuran_ayam)}</span>`;
        row.cells[4].textContent = formatDate(item.created_at);
        row.style.animation = 'flash 0.5s ease';
    }

    function removeRow(id) {
        const row = tableBody.querySelector(`tr[data-id="${id}"]`);
        if (!row) return;

        // Remove from allData
        allData = allData.filter(d => d.id !== id);
        updateMetrics();

        row.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            row.remove();
            updateRowNumbers();
            if (tableBody.children.length === 0) {
                emptyState.style.display = 'block';
            }
        }, 300);
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

    function updateMetrics() {
        if (totalCount) totalCount.textContent = allData.length;
        if (todayCount) {
            const now = new Date();
            const count = allData.filter(item => {
                const date = new Date(item.created_at);
                return date.getFullYear() === now.getFullYear()
                    && date.getMonth() === now.getMonth()
                    && date.getDate() === now.getDate();
            }).length;
            todayCount.textContent = count;
        }
    }

    function setupSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const menuToggle = document.getElementById('menu-toggle');
        const sidebarToggle = document.getElementById('sidebar-toggle');

        const closeSidebar = () => {
            sidebar?.classList.remove('open');
            overlay?.classList.remove('open');
        };

        menuToggle?.addEventListener('click', () => {
            sidebar?.classList.add('open');
            overlay?.classList.add('open');
        });
        sidebarToggle?.addEventListener('click', closeSidebar);
        overlay?.addEventListener('click', closeSidebar);

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeSidebar();
        });
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

    // Modal event listeners
    document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
        el.addEventListener('click', () => {
            closeEditModal();
            closeDeleteModal();
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeEditModal();
            closeDeleteModal();
        }
    });

    await loadInitialData();
    setupRealtime();

    window.addEventListener('beforeunload', () => {
        if (channel) {
            supabase.removeChannel(channel);
        }
    });
}

init();