// ---- DATA ----
let members = [];

let memberFilter = 'Semua';

// ---- OBJECT MATH: Generate ID unik ----
function generateId() {
  return 'MBR-' + Math.floor(Math.random() * 900000 + 100000);
}

// ---- OBJECT STRING: Format nama ----
function capitalizeWords(str) {
  return str.trim().split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// ---- OBJECT DATE: Format tanggal ----
function formatDate(isoStr) {
  return new Date(isoStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

// ---- OBJECT DATE: Tambah bulan ke tanggal ----
function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

// ---- OBJECT DATE: Cek expired ----
function isExpired(expiredDate) {
  return new Date() > new Date(expiredDate);
}

// ---- OBJECT MATH: Hitung sisa hari ----
function daysLeft(expiredDate) {
  const diff = new Date(expiredDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ---- Durasi paket ----
function getMonths(pkg) {
  const map = { Basic: 1, Silver: 3, Gold: 6, Platinum: 12 };
  return map[pkg] || 1;
}

// ---- LIVE CLOCK (Object Date) ----
function updateClock() {
  const now = new Date();
  document.getElementById('live-time').textContent =
    now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.getElementById('live-date').textContent =
    now.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

// ---- NAVIGASI (Event DOM) ----
document.querySelectorAll('.nav-btn, .nav-btn-active').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.nav-btn, .nav-btn-active').forEach(b => {
      b.classList.remove('nav-btn-active');
      b.classList.add('nav-btn');
    });
    document.querySelectorAll('.page, .page-active').forEach(p => {
      p.classList.remove('page-active');
      p.classList.add('page');
    });
    this.classList.remove('nav-btn');
    this.classList.add('nav-btn-active');
    const target = document.getElementById('page-' + this.dataset.page);
    target.classList.remove('page');
    target.classList.add('page-active');
    updateDashboard();
  });
});

// ---- DASHBOARD ----
function updateDashboard() {
  const total    = members.length;
  const active   = members.filter(m => !isExpired(m.expiredAt)).length;
  const expired  = members.filter(m =>  isExpired(m.expiredAt)).length;
  const expiring = members.filter(m => {
    const days = daysLeft(m.expiredAt);
    return days >= 0 && days <= 7;
  }).length;

  document.getElementById('d-total').textContent    = total;
  document.getElementById('d-active').textContent   = active;
  document.getElementById('d-expired').textContent  = expired;
  document.getElementById('d-expiring').textContent = expiring;
}

// ---- RENDER TABEL MEMBER ----
function renderMembers() {
  const tbody  = document.getElementById('m-tbody');

  let filtered = members.filter(m => {
    return memberFilter === 'Semua' ||
      (memberFilter === 'Aktif'   && !isExpired(m.expiredAt)) ||
      (memberFilter === 'Expired' &&  isExpired(m.expiredAt));
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="9">Belum ada data member.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(m => {
    const expired  = isExpired(m.expiredAt);
    const pkgClass = 'pkg-' + m.package.toLowerCase();
    return `
      <tr>
        <td style="font-family:monospace;font-size:11px;color:#a0aec0">${m.id}</td>
        <td>
          <strong>${capitalizeWords(m.name)}</strong>
          <br>
          <span style="font-size:11px;color:#a0aec0">${m.phone}</span>
        </td>
        <td>${m.gender}</td>
        <td><span class="pkg-badge ${pkgClass}">${m.package}</span></td>
        <td>${m.infrastruktur || '-'}</td>
        <td>${formatDate(m.startAt)}</td>
        <td>${formatDate(m.expiredAt)}</td>
        <td><span class="status-badge ${expired ? 's-expired' : 's-aktif'}">${expired ? 'Expired' : 'Aktif'}</span></td>
        <td>
          <div class="action-btns">
            <button class="btn-edit" onclick="editMember('${m.id}')">✏️ Edit</button>
            <button class="btn-del"  onclick="deleteMember('${m.id}')">🗑️ Hapus</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ---- TAMBAH / EDIT MEMBER ----
document.getElementById('m-submit').addEventListener('click', function() {
  const name          = document.getElementById('m-name').value.trim();
  const phone         = document.getElementById('m-phone').value.trim();
  const gender        = document.getElementById('m-gender').value;
  const pkg           = document.getElementById('m-package').value;
  const infrastruktur = document.getElementById('m-infrastruktur').value;
  const start         = document.getElementById('m-start').value;
  const editId        = document.getElementById('m-edit-id').value;

  if (!name || !phone || !gender || !infrastruktur || !start) {
    alert('⚠️ Mohon lengkapi semua field yang wajib diisi!');
    return;
  }

  const expiredAt = addMonths(start, getMonths(pkg));

  if (editId) {
    // UPDATE
    const idx = members.findIndex(m => m.id === editId);
    if (idx !== -1) {
      members[idx] = {
        ...members[idx],
        name: capitalizeWords(name),
        phone, gender,
        package: pkg,
        infrastruktur,
        startAt: start,
        expiredAt
      };
      alert(`✅ Data member "${capitalizeWords(name)}" berhasil diperbarui!`);
    }
    cancelEdit();
  } else {
    // CREATE
    const newMember = {
      id: generateId(),
      name: capitalizeWords(name),
      phone, gender,
      package: pkg,
      infrastruktur,
      startAt: start,
      expiredAt,
      registeredAt: new Date().toISOString()
    };
    members.push(newMember);
    alert(`✅ Member berhasil didaftarkan!\n\nNama  : ${newMember.name}\nID    : ${newMember.id}\nPaket : ${pkg}\nExpired: ${formatDate(expiredAt)}`);
    clearForm();
  }

  renderMembers();
  updateDashboard();
});

// ---- EDIT MEMBER ----
function editMember(id) {
  const m = members.find(mb => mb.id === id);
  if (!m) return;

  document.getElementById('m-edit-id').value        = m.id;
  document.getElementById('m-name').value            = m.name;
  document.getElementById('m-phone').value           = m.phone;
  document.getElementById('m-gender').value          = m.gender;
  document.getElementById('m-package').value         = m.package;
  document.getElementById('m-infrastruktur').value   = m.infrastruktur || '';
  document.getElementById('m-start').value           = m.startAt;

  document.getElementById('member-form-title').textContent = '✏️ Edit Member';
  document.getElementById('member-badge').textContent      = 'Edit';
  document.getElementById('member-badge').classList.add('edit-mode');
  document.getElementById('m-cancel').style.display        = 'inline-block';
  document.getElementById('m-submit').textContent          = 'Simpan Perubahan';

  document.querySelector('.form-panel').scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- HAPUS MEMBER ----
function deleteMember(id) {
  const m = members.find(mb => mb.id === id);
  if (!m) return;

  const ok = confirm(`⚠️ Hapus member "${capitalizeWords(m.name)}"?\nTindakan ini tidak bisa dibatalkan.`);
  if (!ok) return;

  members = members.filter(mb => mb.id !== id);
  renderMembers();
  updateDashboard();
  alert(`🗑️ Member "${capitalizeWords(m.name)}" berhasil dihapus.`);
}

// ---- BATAL EDIT ----
function cancelEdit() {
  document.getElementById('m-edit-id').value               = '';
  document.getElementById('member-form-title').textContent = '➕ Daftar Member';
  document.getElementById('member-badge').textContent      = 'Baru';
  document.getElementById('member-badge').classList.remove('edit-mode');
  document.getElementById('m-cancel').style.display        = 'none';
  document.getElementById('m-submit').textContent          = 'Daftarkan';
  clearForm();
}

function clearForm() {
  document.getElementById('m-name').value          = '';
  document.getElementById('m-phone').value         = '';
  document.getElementById('m-gender').value        = '';
  document.getElementById('m-package').value       = 'Basic';
  document.getElementById('m-infrastruktur').value = '';
  document.getElementById('m-start').value         = '';
}

document.getElementById('m-cancel').addEventListener('click', cancelEdit);

// ---- FILTER TABS (Event DOM) ----
document.querySelectorAll('[data-mf]').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('[data-mf]').forEach(b => {
      b.classList.remove('tab-active');
      b.classList.add('tab');
    });
    this.classList.remove('tab');
    this.classList.add('tab-active');
    memberFilter = this.dataset.mf;
    renderMembers();
  });
});

updateDashboard();
renderMembers();