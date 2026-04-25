const SUPABASE_URL = 'https://gwcfzujfyzusyuaazslx.supabase.co';
const SUPABASE_KEY = 'YOUR_KEY_HERE'; 
let db;

function init() {
    try {
        db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        renderHeader();
        loadAllData();
        setupForms();
        setupThemeToggle();
    } catch (e) { console.error(e); }
}

async function renderHeader() {
    const wrap = document.getElementById('header-wrap');
    if (!wrap) return;
    const path = window.location.pathname;
    const isHome = path.endsWith('index.html') || path === '/' || path.length < 5;
    
    // FETCH STATUS FOR BADGE
    const { data: s } = await db.from('settings').select('value').eq('id', 'field_status').single();
    const statusHtml = (isHome && s) ? `
        <div class="flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${s.value === 'ON' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}">
            Games are ${s.value === 'ON' ? 'ON' : 'CANCELLED'}
        </div>` : '';

    wrap.innerHTML = `
    <nav class="fixed top-0 left-0 w-full z-[100] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-2">
        <div class="max-w-full mx-auto px-6 flex justify-between items-center">
            <a href="index.html" class="flex items-center gap-3 group">
                <img src="YOUR_LOGO_URL" alt="Logo" class="w-10 h-10 rounded-full border-2 border-blue-600">
                <div class="hidden sm:block">
                    <span class="font-black text-lg tracking-tighter block leading-none dark:text-white uppercase">Irondequoit</span>
                    <span class="text-[9px] font-bold text-blue-600 uppercase tracking-widest leading-none">Senior Softball</span>
                </div>
            </a>
            <div class="flex items-center gap-6">
                ${statusHtml}
                <div class="hidden md:flex gap-6 text-[10px] font-black uppercase tracking-widest">
                    <a href="index.html" class="text-slate-400">Home</a>
                    <a href="forum.html" class="text-slate-400">Forum</a>
                </div>
                <button id="theme-toggle" class="p-2 rounded-full bg-slate-100 dark:bg-slate-800"><i data-lucide="sun" class="w-4 h-4 hidden dark:block"></i><i data-lucide="moon" class="w-4 h-4 dark:hidden"></i></button>
                <a href="admin.html" class="bg-slate-900 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase">Admin</a>
            </div>
        </div>
    </nav><div class="h-[60px]"></div>`;
    lucide.createIcons();
}

async function loadAllData() {
    const teamsList = document.getElementById('teams-list');
    const adminTeamsList = document.getElementById('admin-teams-list');
    const adminPlayersList = document.getElementById('admin-players-list');
    const docsList = document.getElementById('docs-list');
    const sidebarTeams = document.getElementById('sidebar-teams');
    const rosterList = document.getElementById('roster-list');
    const emailAllBtn = document.getElementById('email-all-players');
    const { data: teams } = await db.from('teams').select('*').order('name');
    const urlParams = new URLSearchParams(window.location.search);
    const teamId = urlParams.get('id');

    if (teams) {
        if (teamsList) teamsList.innerHTML = teams.map(t => `<a href="team-details.html?id=${t.id}" class="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm"><h3 class="text-2xl font-black">${t.name}</h3><p class="text-xs text-slate-500 uppercase font-bold mt-2">Coach: ${t.coach_name || 'TBD'}</p></a>`).join('');
        if (sidebarTeams) sidebarTeams.innerHTML = teams.map(t => `<a href="team-details.html?id=${t.id}" class="block p-3 rounded-xl text-sm font-bold ${teamId == t.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}">${t.name}</a>`).join('');
        if (adminTeamsList) adminTeamsList.innerHTML = teams.map(t => `<div class="flex justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800"><span class="font-bold text-sm">${t.name}</span><div class="flex gap-1"><button onclick="window.editTeam(${t.id},'${t.name.replace(/'/g, "\\'")}')" class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><i data-lucide="edit-2" class="w-4 h-4"></i></button><button onclick="window.deleteTeam(${t.id})" class="p-2 text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div></div>`).join('');
        const ts = document.getElementById('team-select');
        if (ts) ts.innerHTML = '<option value="">Select Team...</option>' + teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    }

    if (teamId && rosterList) {
        const team = teams?.find(t => t.id == teamId);
        const { data: players } = await db.from('players').select('*').eq('team_id', teamId).order('name');
        if (team) {
            const ems = players.map(p => p.email).filter(e => e && e.includes('@')).join(',');
            document.getElementById('team-header').innerHTML = `<div class="flex justify-between items-end"><div><h1 class="text-6xl font-black tracking-tighter">${team.name}</h1><p class="text-blue-600 font-black uppercase tracking-[.3em] mt-2 text-xs">Coach: ${team.coach_name}</p></div><a href="mailto:?bcc=${encodeURIComponent(ems)}" class="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Email Team</a></div>`;
        }
        rosterList.innerHTML = players.map(p => `<tr class="border-b border-slate-100 dark:border-slate-800"><td class="p-5 font-bold">${p.name}</td><td class="p-5 text-center text-slate-500">${p.position || '--'}</td><td class="p-5 text-center text-slate-500">${p.age || '--'}</td><td class="p-5 text-center font-mono text-blue-600 text-xs font-bold">${p.phone_number || '--'}</td></tr>`).join('');
    }

    if (adminPlayersList) {
        const { data: allP } = await db.from('players').select('*, teams(name)').order('name');
        adminPlayersList.innerHTML = allP.map(p => `<tr><td class="p-4 font-bold text-sm">${p.name}</td><td class="p-4 text-[10px] uppercase font-black text-slate-400">${p.teams?.name || 'Unassigned'}</td><td class="p-4 text-right"><button onclick="window.editPlayer(${p.id})" class="p-2 text-blue-500 mx-1"><i data-lucide="edit-2" class="w-4 h-4"></i></button><button onclick="window.deletePlayer(${p.id})" class="p-2 text-red-500 mx-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td></tr>`).join('');
    }

    if (emailAllBtn) {
        const { data: ap } = await db.from('players').select('email');
        const allE = ap.map(p => p.email).filter(e => e && e.includes('@')).join(',');
        emailAllBtn.href = `mailto:?bcc=${encodeURIComponent(allE)}`;
    }

    if (docsList) {
        const { data: docs } = await db.from('documents').select('*').order('created_at', { ascending: false });
        const groups = {};
        docs?.forEach(d => { if (!groups[d.category]) groups[d.category] = []; groups[d.category].push(d); });
        docsList.innerHTML = Object.keys(groups).map(cat => `<div class="mb-10 text-left"><h3 class="text-[10px] font-black uppercase text-slate-400 tracking-[.3em] mb-4">${cat}</h3><div class="space-y-2">${groups[cat].map(doc => `<a href="${doc.file_url}" target="_blank" class="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-orange-500 transition group"><i data-lucide="file-text" class="w-4 h-4 text-orange-500"></i><span class="text-sm font-bold flex-1">${doc.title}</span><i data-lucide="download" class="w-4 h-4 text-slate-300"></i></a>`).join('')}</div></div>`).join('');
    }

    const annList = document.getElementById('announcements-list');
    if (annList) {
        const { data: allPosts } = await db.from('forum_posts').select('*').order('created_at', { ascending: false });
        const news = allPosts?.filter(p => p.post_type === 'announcement') || [];
        annList.innerHTML = news.map(p => `<article class="bg-white dark:bg-slate-900 p-8 rounded-3xl border-l-4 border-l-blue-600 shadow-sm text-left mb-4"><h3 class="text-2xl font-black mb-2">${p.title}</h3><p class="text-sm text-slate-600 dark:text-slate-400 mb-4">${p.content}</p><span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update • ${new Date(p.created_at).toLocaleDateString()}</span></article>`).join('');
    }

    lucide.createIcons();
}

function setupForms() {
    const docForm = document.getElementById('doc-form');
    if (docForm) {
        docForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const file = document.getElementById('doc-file').files[0];
            const title = document.getElementById('doc-title').value;
            const cat = document.getElementById('doc-category').value || 'General';
            const path = `public/${Date.now()}-${file.name}`;
            await db.storage.from('league-documents').upload(path, file);
            const { data } = db.storage.from('league-documents').getPublicUrl(path);
            await db.from('documents').insert([{ title, category: cat, file_url: data.publicUrl }]);
            location.reload();
        });
    }
    // ... Add manual Team/Player/Import/Forum listeners here as in previous app.js ...
}

window.toggleFieldStatus = async (val) => { await db.from('settings').update({ value: val }).eq('id', 'field_status'); location.reload(); };
window.editTeam = async (id, name) => { const n = prompt("Rename team:", name); if (n) { await db.from('teams').update({ name: n }).eq('id', id); location.reload(); } };
window.deleteTeam = async (id) => { if (confirm("Delete team?")) { await db.from('teams').delete().eq('id', id); location.reload(); } };
window.deletePlayer = async (id) => { if (confirm("Delete player?")) { await db.from('players').delete().eq('id', id); location.reload(); } };
window.editPlayer = async (id) => {
    const { data: p } = await db.from('players').select('*').eq('id', id).single();
    document.getElementById('edit-player-id').value = p.id;
    document.getElementById('edit-player-name').value = p.name;
    document.getElementById('edit-player-phone').value = p.phone_number || '';
    document.getElementById('edit-modal').classList.remove('hidden');
};
window.savePlayerEdit = async () => {
    const upd = { name: document.getElementById('edit-player-name').value, phone_number: document.getElementById('edit-player-phone').value };
    await db.from('players').update(upd).eq('id', document.getElementById('edit-player-id').value);
    location.reload();
};
window.closeModal = () => document.getElementById('edit-modal').classList.add('hidden');
function setupThemeToggle() {
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('color-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
}
window.addEventListener('load', init);