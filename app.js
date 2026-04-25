// 1. CONFIGURATION
const SUPABASE_URL = 'https://gwcfzujfyzusyuaazslx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CXlvnbzmTyV_HuRVJNnB1A_SjRqfO2K'; 

let db;

// 2. INITIALIZATION
function init() {
    try {
        db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        renderHeader(); // Draws the shared header
        loadAllData();  // Fetches and draws all page-specific data
        setupForms();   // Attaches listeners to forms
        setupThemeToggle(); // Handles the dark mode button
    } catch (e) { console.error("Initialization failed:", e); }
}

// 3. UNIVERSAL DYNAMIC HEADER
function renderHeader() {
    const headerWrap = document.getElementById('header-wrap');
    if (!headerWrap) return;

    const path = window.location.pathname;
    // Page detection
    const isHome = path.endsWith('index.html') || path === '/' || path.endsWith('team-details.html');
    const isForum = path.endsWith('forum.html');
    const isAdmin = path.endsWith('admin.html');

    const activeClass = "text-blue-600 dark:text-blue-400 font-black cursor-default border-b-2 border-blue-600 pb-1";
    const inactiveClass = "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition";

    headerWrap.innerHTML = `
    <nav class="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-2">
        <div class="max-w-full mx-auto px-6 flex justify-between items-center">
            <a href="index.html" class="flex items-center gap-3 group">
                <img src="YOUR_LOGO_URL" alt="ISS Logo" class="w-10 h-10 rounded-full border-2 border-blue-600 transition group-hover:scale-105">
                <div>
                    <span class="font-black text-lg tracking-tighter block leading-none dark:text-white uppercase">Irondequoit</span>
                    <span class="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Senior Softball</span>
                </div>
            </a>
            <div class="flex items-center gap-8">
                <div class="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-widest items-center">
                    ${isHome ? `<span class="${activeClass}">Home</span>` : `<a href="index.html" class="${inactiveClass}">Home</a>`}
                    ${isForum ? `<span class="${activeClass}">Forum</span>` : `<a href="forum.html" class="${inactiveClass}">Forum</a>`}
                </div>
                <div class="flex items-center gap-4 border-l border-slate-200 dark:border-slate-800 pl-6">
                    <button id="theme-toggle" class="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:ring-2 ring-blue-500 transition">
                        <i data-lucide="sun" class="w-4 h-4 hidden dark:block"></i>
                        <i data-lucide="moon" class="w-4 h-4 dark:hidden"></i>
                    </button>
                    ${isAdmin ? 
                        `<span class="bg-blue-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest cursor-default">Admin</span>` : 
                        `<a href="admin.html" class="bg-slate-900 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition">Admin</a>`
                    }
                </div>
            </div>
        </div>
    </nav>`;
    lucide.createIcons();
}

// 4. DATA LOADING
async function loadAllData() {
    const teamsList = document.getElementById('teams-list');
    const adminTeamsList = document.getElementById('admin-teams-list');
    const adminPlayersList = document.getElementById('admin-players-list');
    const docsList = document.getElementById('docs-list');
    const sidebarTeams = document.getElementById('sidebar-teams');
    const rosterList = document.getElementById('roster-list');
    const teamHeader = document.getElementById('team-header');
    const teamSelect = document.getElementById('team-select');
    const annList = document.getElementById('announcements-list');
    const forumList = document.getElementById('forum-list');
    const adminForumList = document.getElementById('admin-forum-list');

    const urlParams = new URLSearchParams(window.location.search);
    const teamId = urlParams.get('id');

    // FIELD STATUS FETCH
    const { data: statusData } = await db.from('settings').select('value').eq('id', 'field_status').single();
    const statusBox = document.getElementById('field-status-box');
    if (statusBox && statusData) {
        const isOn = statusData.value === 'ON';
        statusBox.innerHTML = `
            <div class="flex items-center gap-2 px-6 py-2 rounded-full border font-black text-[10px] uppercase tracking-widest ${isOn ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}">
                Games are ${isOn ? 'ON' : 'CANCELLED'}
            </div>`;
    }

    // TEAMS FETCH
    const { data: teams } = await db.from('teams').select('*').order('name');
    if (teams) {
        if (teamsList) {
            teamsList.innerHTML = teams.map(t => `
                <a href="team-details.html?id=${t.id}" class="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all shadow-sm">
                    <h3 class="text-2xl font-black">${t.name}</h3>
                    <p class="text-xs text-slate-500 mt-2 font-bold uppercase tracking-widest">Coach: ${t.coach_name || 'TBD'}</p>
                </a>`).join('');
        }
        if (sidebarTeams) {
            sidebarTeams.innerHTML = teams.map(t => `
                <a href="team-details.html?id=${t.id}" class="block p-3 rounded-xl text-sm font-bold ${teamId == t.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'} transition">${t.name}</a>`).join('');
        }
        if (adminTeamsList) {
            adminTeamsList.innerHTML = teams.map(t => `<div class="flex justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800"><span class="font-bold text-sm">${t.name}</span><button onclick="window.deleteTeam(${t.id})" class="text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div>`).join('');
        }
        if (teamSelect) teamSelect.innerHTML = '<option value="">Select Team...</option>' + teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    }

    // ROSTER & TEAM EMAIL
    if (teamId && rosterList) {
        const team = teams?.find(t => t.id == teamId);
        const { data: players } = await db.from('players').select('*').eq('team_id', teamId).order('name');
        if (team) {
            const emails = players.map(p => p.email).filter(e => e && e !== 'N/A').join(',');
            teamHeader.innerHTML = `
                <div class="flex justify-between items-end mb-8">
                    <div><h1 class="text-6xl font-black tracking-tighter">${team.name}</h1><p class="text-blue-600 font-bold uppercase tracking-[.3em] mt-2 text-xs">Coach: ${team.coach_name}</p></div>
                    <a href="mailto:?bcc=${emails}" class="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Email Team</a>
                </div>`;
        }
        rosterList.innerHTML = players.map(p => `
            <tr class="border-b border-slate-100 dark:border-slate-800">
                <td class="p-5 font-bold">${p.name}</td>
                <td class="p-5 text-center text-slate-500">${p.position || '--'}</td>
                <td class="p-5 text-center text-slate-500">${p.age || '--'}</td>
                <td class="p-5 text-center font-mono text-blue-600 text-xs font-bold">${p.phone_number || '--'}</td>
            </tr>`).join('');
    }

    // EMAIL ALL (Admin Page)
    const emailAllBtn = document.getElementById('email-all-players');
    if (emailAllBtn) {
        const { data: allPlayers } = await db.from('players').select('email');
        const allEmails = allPlayers.map(p => p.email).filter(e => e && e !== 'N/A').join(',');
        emailAllBtn.href = `mailto:?bcc=${allEmails}`;
    }

    // ADMIN PLAYER LIST
    if (adminPlayersList) {
        const { data: allPlayers } = await db.from('players').select('*, teams(name)').order('name');
        adminPlayersList.innerHTML = allPlayers.map(p => `
            <tr><td class="p-4 font-bold text-sm">${p.name}</td><td class="p-4 text-[10px] uppercase font-black text-slate-400">${p.teams?.name || 'Unassigned'}</td><td class="p-4 text-right"><button onclick="window.editPlayer(${p.id})" class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><i data-lucide="edit-2" class="w-4 h-4"></i></button><button onclick="window.deletePlayer(${p.id})" class="p-2 text-red-500 hover:bg-red-50 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td></tr>`).join('');
    }

    // DOCUMENTS
    if (docsList) {
        const { data: docs } = await db.from('documents').select('*').order('created_at', { ascending: false });
        if (docs) {
            const groups = {};
            docs.forEach(d => { if (!groups[d.category]) groups[d.category] = []; groups[d.category].push(d); });
            docsList.innerHTML = Object.keys(groups).map(cat => `
                <div class="mb-10 text-left"><h3 class="text-[10px] font-black uppercase text-slate-400 tracking-[.3em] mb-4">${cat}</h3><div class="space-y-2">
                ${groups[cat].map(doc => `<a href="${doc.file_url}" target="_blank" class="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-orange-500 transition group"><i data-lucide="file-text" class="w-4 h-4 text-orange-500"></i><span class="text-sm font-bold flex-1">${doc.title}</span><i data-lucide="download" class="w-4 h-4 text-slate-300 group-hover:text-orange-500"></i></a>`).join('')}</div></div>`).join('');
        }
    }

    // FORUM & ANNOUNCEMENTS
    if (annList || forumList || adminForumList) {
        const { data: allPosts } = await db.from('forum_posts').select('*').order('created_at', { ascending: false });
        if (allPosts) {
            if (annList) {
                const news = allPosts.filter(p => p.post_type === 'announcement');
                annList.innerHTML = news.map(p => `<article class="bg-white dark:bg-slate-900 p-8 rounded-3xl border-l-4 border-l-blue-600 shadow-sm text-left"><h3 class="text-2xl font-black mb-2">${p.title}</h3><p class="text-sm text-slate-600 dark:text-slate-400 mb-4">${p.content}</p><span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update • ${new Date(p.created_at).toLocaleDateString()}</span></article>`).join('');
            }
            if (forumList) {
                const topLevel = allPosts.filter(p => p.post_type !== 'announcement' && !p.parent_id);
                forumList.innerHTML = topLevel.map(p => {
                    const replies = allPosts.filter(r => r.parent_id === p.id);
                    return `<div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8 text-left"><div class="p-8"><h3 class="text-2xl font-black mb-2">${p.title}</h3><p class="text-sm text-slate-600 dark:text-slate-400 mb-6">${p.content}</p><div class="flex justify-between items-center"><span class="text-xs font-bold text-slate-400 italic">Posted by ${p.author_name}</span><button onclick="window.openReplyModal(${p.id}, '${p.title}')" class="text-xs font-black text-blue-600 uppercase tracking-widest">Reply</button></div></div>${replies.length ? `<div class="bg-slate-50 dark:bg-slate-800/30 p-6 border-t border-slate-100 dark:border-slate-800 space-y-4">${replies.map(r => `<div class="pl-4 border-l-2 border-slate-200 dark:border-slate-700"><p class="text-xs text-slate-600 dark:text-slate-300 font-medium">${r.content}</p><p class="text-[9px] font-bold text-slate-400 uppercase mt-1">— ${r.author_name}</p></div>`).join('')}</div>` : ''}</div>`;
                }).join('');
            }
            if (adminForumList) {
                adminForumList.innerHTML = allPosts.map(p => `<div class="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200"><div class="text-left"><p class="font-bold text-sm">${p.title || 'Reply'}</p></div><button onclick="window.deletePost(${p.id})" class="text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div>`).join('');
            }
        }
    }
    lucide.createIcons();
}

// 5. FORMS
function setupForms() {
    const importBtn = document.getElementById('import-btn');
    if (importBtn) {
        importBtn.addEventListener('click', async () => {
            const text = document.getElementById('import-area').value;
            if (!text.trim()) return;
            importBtn.innerText = "Processing...";
            const blocks = text.split(/MANAGER:/g).filter(b => b.trim().length > 10);
            for (let block of blocks) {
                const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                const manager = lines[0].replace(/-+/g, '').trim();
                let { data: team } = await db.from('teams').select('id').ilike('name', manager).maybeSingle();
                if (!team) {
                    const { data: nt } = await db.from('teams').insert([{ name: manager, coach_name: manager }]).select().single();
                    team = nt;
                }
                let currentPlayer = null;
                for (let line of lines) {
                    if (/^\d+\.\s+/.test(line)) {
                        if (currentPlayer) await db.from('players').insert([currentPlayer]);
                        currentPlayer = { team_id: team.id, name: line.replace(/^\d+\.\s+/, '').trim() };
                    } else if (line.includes('CONTACT:')) {
                        const pm = line.match(/CONTACT:\s*([\d-]+)/);
                        const em = line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                        if (pm) currentPlayer.phone_number = pm[1];
                        if (em) currentPlayer.email = em[1];
                    } else if (line.includes('DATA:')) {
                        const m = line.match(/\[Age:\s*(\d+)\]/);
                        if (m) currentPlayer.age = parseInt(m[1]);
                    } else if (line.includes('FIELD:')) {
                        const m = line.match(/\[Pos:\s*([^\]]+)\]/);
                        if (m) currentPlayer.position = m[1];
                    }
                }
                if (currentPlayer) await db.from('players').insert([currentPlayer]);
            }
            location.reload();
        });
    }

    const forumForm = document.getElementById('forum-form');
    if (forumForm) {
        forumForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                author_name: document.getElementById('post-author').value,
                title: document.getElementById('post-parent-id')?.value ? "" : document.getElementById('post-title').value,
                content: document.getElementById('post-content').value,
                post_type: document.getElementById('post-is-announcement')?.checked ? 'announcement' : 'discussion',
                parent_id: parseInt(document.getElementById('post-parent-id')?.value) || null
            };
            await db.from('forum_posts').insert([payload]);
            location.reload();
        });
    }
}

// 6. GLOBAL HELPERS
window.toggleFieldStatus = async (status) => {
    await db.from('settings').update({ value: status }).eq('id', 'field_status');
    location.reload();
};
window.editPlayer = async (id) => {
    const { data: p } = await db.from('players').select('*').eq('id', id).single();
    document.getElementById('edit-player-id').value = p.id;
    document.getElementById('edit-player-name').value = p.name;
    document.getElementById('edit-player-age').value = p.age || '';
    document.getElementById('edit-player-pos').value = p.position || '';
    document.getElementById('edit-player-phone').value = p.phone_number || '';
    document.getElementById('edit-modal').classList.remove('hidden');
};
window.savePlayerEdit = async () => {
    const upd = { name: document.getElementById('edit-player-name').value, age: parseInt(document.getElementById('edit-player-age').value) || null, position: document.getElementById('edit-player-pos').value, phone_number: document.getElementById('edit-player-phone').value };
    await db.from('players').update(upd).eq('id', document.getElementById('edit-player-id').value);
    location.reload();
};
window.deleteTeam = async (id) => { if (confirm("Delete?")) { await db.from('teams').delete().eq('id', id); location.reload(); } };
window.deletePlayer = async (id) => { if (confirm("Delete?")) { await db.from('players').delete().eq('id', id); location.reload(); } };
window.deletePost = async (id) => { if (confirm("Delete?")) { await db.from('forum_posts').delete().eq('id', id); location.reload(); } };
window.closeModal = () => document.getElementById('edit-modal').classList.add('hidden');
window.openReplyModal = (id, title) => {
    document.getElementById('post-modal').classList.remove('hidden');
    document.getElementById('post-title').value = "Re: " + title;
    let pid = document.getElementById('post-parent-id');
    if (!pid) { pid = document.createElement('input'); pid.type = 'hidden'; pid.id = 'post-parent-id'; document.getElementById('forum-form').appendChild(pid); }
    pid.value = id;
};
function setupThemeToggle() {
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('color-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
}
window.addEventListener('load', init);