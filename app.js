// 1. CONFIGURATION
const SUPABASE_URL = 'https://gwcfzujfyzusyuaazslx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CXlvnbzmTyV_HuRVJNnB1A_SjRqfO2K';

let db;

// 2. INITIALIZATION
function init() {
    try {
        db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        loadAllData();
        setupForms();
        setupThemeToggle();
    } catch (e) {
        console.error("Initialization failed:", e);
    }
}

// 3. DATA LOADING & RENDERING
async function loadAllData() {
    const teamsList = document.getElementById('teams-list');
    const adminTeamsList = document.getElementById('admin-teams-list');
    const adminPlayersList = document.getElementById('admin-players-list');
    const docsList = document.getElementById('docs-list');
    const sidebarTeams = document.getElementById('sidebar-teams');
    const rosterList = document.getElementById('roster-list');
    const teamHeader = document.getElementById('team-header');
    const teamSelect = document.getElementById('team-select');
    
    // Forum Elements
    const forumList = document.getElementById('forum-list');
    const adminForumList = document.getElementById('admin-forum-list');

    const urlParams = new URLSearchParams(window.location.search);
    const teamId = urlParams.get('id');

    // A. FETCH TEAMS
    const { data: teams } = await db.from('teams').select('*').order('name');
    if (teams) {
        if (teamsList) {
            teamsList.innerHTML = teams.map(t => `
                <a href="team-details.html?id=${t.id}" class="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all group shadow-sm">
                    <h3 class="text-2xl font-black group-hover:text-blue-600 transition">${t.name}</h3>
                    <p class="text-xs text-slate-500 mt-2 font-bold uppercase tracking-widest">Coach: ${t.coach_name || 'TBD'}</p>
                </a>`).join('');
        }
        if (sidebarTeams) {
            sidebarTeams.innerHTML = teams.map(t => `
                <a href="team-details.html?id=${t.id}" class="block p-3 rounded-xl text-sm font-bold ${teamId == t.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'} transition">
                    ${t.name}
                </a>`).join('');
        }
        if (adminTeamsList) {
            adminTeamsList.innerHTML = teams.map(t => `
                <div class="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span class="font-bold text-sm">${t.name}</span>
                    <div class="flex gap-1">
                        <button onclick="window.editTeam(${t.id}, '${t.name}')" class="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                        <button onclick="window.deleteTeam(${t.id})" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </div>`).join('');
        }
        if (teamSelect) {
            teamSelect.innerHTML = '<option value="">Select Team...</option>' + teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        }
    }

    // B. FETCH TEAM ROSTER
    if (teamId && rosterList) {
        const team = teams?.find(t => t.id == teamId);
        if (team) teamHeader.innerHTML = `<h1 class="text-6xl font-black tracking-tighter">${team.name}</h1><p class="text-blue-600 dark:text-blue-400 font-black uppercase tracking-[.3em] mt-2 text-xs">Coach: ${team.coach_name}</p>`;

        const { data: players } = await db.from('players').select('*').eq('team_id', teamId).order('name');
        rosterList.innerHTML = players.map(p => `
            <tr class="border-b border-slate-100 dark:border-slate-800">
                <td class="p-5 font-bold">${p.name}</td>
                <td class="p-5 text-center text-slate-500">${p.position || '--'}</td>
                <td class="p-5 text-center text-slate-500">${p.age || '--'}</td>
                <td class="p-5 text-center font-mono text-blue-600 dark:text-blue-400 text-xs font-bold">${p.phone_number || '--'}</td>
            </tr>`).join('');
    }

    // C. FETCH ALL PLAYERS (Admin)
    if (adminPlayersList) {
        const { data: allPlayers } = await db.from('players').select('*, teams(name)').order('name');
        adminPlayersList.innerHTML = allPlayers.map(p => `
            <tr>
                <td class="p-4 font-bold text-sm">${p.name}</td>
                <td class="p-4 text-[10px] uppercase font-black text-slate-400">${p.teams?.name || 'Unassigned'}</td>
                <td class="p-4 text-right">
                    <button onclick="window.editPlayer(${p.id})" class="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                    <button onclick="window.deletePlayer(${p.id})" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>`).join('');
    }

    // D. FETCH DOCUMENTS
    if (docsList) {
        const { data: docs } = await db.from('documents').select('*').order('created_at', { ascending: false });
        if (docs) {
            const groups = {};
            docs.forEach(d => { if (!groups[d.category]) groups[d.category] = []; groups[d.category].push(d); });
            docsList.innerHTML = Object.keys(groups).map(cat => `
                <div class="mb-10 text-left">
                    <h3 class="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[.3em] mb-4">${cat}</h3>
                    <div class="space-y-2">
                        ${groups[cat].map(doc => `
                        <a href="${doc.file_url}" target="_blank" class="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-orange-500 transition group">
                            <div class="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg text-orange-600"><i data-lucide="file-text" class="w-4 h-4"></i></div>
                            <span class="text-sm font-bold flex-1 text-left">${doc.title}</span>
                            <i data-lucide="download" class="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition"></i>
                        </a>`).join('')}
                    </div>
                </div>`).join('');
        }
    }

    // E. FETCH FORUM POSTS
    if (forumList || adminForumList) {
        const { data: posts } = await db.from('forum_posts').select('*').order('created_at', { ascending: false });
        if (posts) {
            if (forumList) {
                forumList.innerHTML = posts.map(p => `
                    <article class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-left">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="text-xl font-black text-slate-800 dark:text-white">${p.title}</h3>
                            <span class="text-[10px] font-bold text-slate-400 uppercase">${new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">${p.content}</p>
                        <div class="flex items-center gap-2 italic text-xs text-slate-500 font-bold">
                            <div class="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">${p.author_name[0]}</div>
                            Posted by ${p.author_name}
                        </div>
                    </article>`).join('');
            }
            if (adminForumList) {
                adminForumList.innerHTML = posts.map(p => `
                    <div class="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div class="text-left"><p class="font-bold text-sm">${p.title}</p><p class="text-[10px] text-slate-500 italic">by ${p.author_name}</p></div>
                        <button onclick="window.deletePost(${p.id})" class="p-2 text-red-500 hover:bg-red-50 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>`).join('');
            }
        }
    }

    lucide.createIcons();
}

// 4. FORM EVENT LISTENERS
function setupForms() {
    // A. BATCH IMPORT
    const importBtn = document.getElementById('import-btn');
    if (importBtn) {
        importBtn.addEventListener('click', async () => {
            const text = document.getElementById('import-area').value;
            if (!text.trim()) return;
            importBtn.innerText = "Processing..."; importBtn.disabled = true;
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
                        const m = line.match(/CONTACT:\s*([\d-]+)/);
                        if (m) currentPlayer.phone_number = m[1];
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

    // B. FORUM FORM
    const forumForm = document.getElementById('forum-form');
    if (forumForm) {
        forumForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                author_name: document.getElementById('post-author').value.trim(),
                title: document.getElementById('post-title').value.trim(),
                content: document.getElementById('post-content').value.trim()
            };
            const { error } = await db.from('forum_posts').insert([payload]);
            if (error) alert(error.message); else location.reload();
        });
    }

    // C. MANUAL TEAM FORM
    const teamForm = document.getElementById('team-form');
    if (teamForm) {
        teamForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('team-name').value.trim();
            const coach = document.getElementById('coach-name').value.trim();
            await db.from('teams').insert([{ name, coach_name: coach }]);
            location.reload();
        });
    }

    // D. MANUAL PLAYER FORM
    const playerForm = document.getElementById('player-form');
    if (playerForm) {
        playerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                team_id: parseInt(document.getElementById('team-select').value),
                name: document.getElementById('player-name').value.trim(),
                age: parseInt(document.getElementById('player-age').value) || null,
                position: document.getElementById('player-pos').value.trim(),
                phone_number: document.getElementById('player-phone').value.trim()
            };
            await db.from('players').insert([payload]);
            alert("Added!"); playerForm.reset(); loadAllData();
        });
    }

    // E. DOCUMENT UPLOAD
    const docForm = document.getElementById('doc-form');
    if (docForm) {
        docForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const file = document.getElementById('doc-file').files[0];
            const title = document.getElementById('doc-title').value;
            const category = document.getElementById('doc-category').value || 'General';
            const path = `public/${Date.now()}-${file.name}`;
            await db.storage.from('league-documents').upload(path, file);
            const { data } = db.storage.from('league-documents').getPublicUrl(path);
            await db.from('documents').insert([{ title, category, file_url: data.publicUrl }]);
            location.reload();
        });
    }
}

// 5. UTILITIES & GLOBAL ACTIONS
function setupThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('color-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
}

window.deleteTeam = async (id) => { if (confirm("Delete team?")) { await db.from('teams').delete().eq('id', id); location.reload(); } };
window.editTeam = async (id, name) => { const n = prompt("Rename:", name); if (n) { await db.from('teams').update({ name: n }).eq('id', id); location.reload(); } };
window.deletePlayer = async (id) => { if (confirm("Delete player?")) { await db.from('players').delete().eq('id', id); location.reload(); } };
window.deletePost = async (id) => { if (confirm("Delete post?")) { await db.from('forum_posts').delete().eq('id', id); location.reload(); } };

window.editPlayer = async (id) => {
    const modal = document.getElementById('edit-modal');
    const { data: p } = await db.from('players').select('*').eq('id', id).single();
    const { data: teams } = await db.from('teams').select('id, name').order('name');
    document.getElementById('edit-player-team').innerHTML = teams.map(t => `<option value="${t.id}" ${t.id === p.team_id ? 'selected' : ''}>${t.name}</option>`).join('');
    document.getElementById('edit-player-id').value = p.id;
    document.getElementById('edit-player-name').value = p.name;
    document.getElementById('edit-player-age').value = p.age || '';
    document.getElementById('edit-player-pos').value = p.position || '';
    document.getElementById('edit-player-phone').value = p.phone_number || '';
    modal.classList.remove('hidden');
    lucide.createIcons();
};

window.closeModal = () => document.getElementById('edit-modal').classList.add('hidden');

window.savePlayerEdit = async function() {
    const id = document.getElementById('edit-player-id').value;
    const updates = {
        name: document.getElementById('edit-player-name').value,
        team_id: parseInt(document.getElementById('edit-player-team').value),
        age: parseInt(document.getElementById('edit-player-age').value) || null,
        position: document.getElementById('edit-player-pos').value,
        phone_number: document.getElementById('edit-player-phone').value
    };
    await db.from('players').update(updates).eq('id', id);
    window.closeModal(); location.reload();
};

window.addEventListener('load', init);