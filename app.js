const SUPABASE_URL = 'https://gwcfzujfyzusyuaazslx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CXlvnbzmTyV_HuRVJNnB1A_SjRqfO2K';

let db;

function init() {
    try {
        db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        loadAllData();
        setupForms();
        setupThemeToggle();
    } catch (e) { console.error(e); }
}

async function loadAllData() {
    const teamsList = document.getElementById('teams-list');
    const adminTeamsList = document.getElementById('admin-teams-list');
    const adminPlayersList = document.getElementById('admin-players-list');
    const docsList = document.getElementById('docs-list');
    const sidebarTeams = document.getElementById('sidebar-teams');
    const rosterList = document.getElementById('roster-list');
    const teamHeader = document.getElementById('team-header');
    const teamSelect = document.getElementById('team-select');

    const urlParams = new URLSearchParams(window.location.search);
    const teamId = urlParams.get('id');

    // 1. FETCH TEAMS
    const { data: teams } = await db.from('teams').select('*').order('name');
    if (teams) {
        if (teamsList) {
            teamsList.innerHTML = teams.map(t => `
                <a href="team-details.html?id=${t.id}" class="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all group shadow-sm">
                    <h3 class="text-2xl font-black group-hover:text-blue-600">${t.name}</h3>
                    <p class="text-xs text-slate-500 mt-2 font-bold uppercase tracking-widest">Coach: ${t.coach_name || 'TBD'}</p>
                </a>`).join('');
        }
        if (sidebarTeams) {
            sidebarTeams.innerHTML = teams.map(t => `
                <a href="team-details.html?id=${t.id}" class="block p-3 rounded-xl text-sm font-bold ${teamId == t.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'} transition">${t.name}</a>`).join('');
        }
        if (adminTeamsList) {
            adminTeamsList.innerHTML = teams.map(t => `
                <div class="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span class="font-bold text-sm">${t.name}</span>
                    <div class="flex gap-1">
                        <button onclick="editTeam(${t.id}, '${t.name}')" class="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                        <button onclick="deleteTeam(${t.id})" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </div>`).join('');
        }
        if (teamSelect) {
            teamSelect.innerHTML = '<option value="">Select Team...</option>' + teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        }
    }

    // 2. FETCH ROSTER (Team Details Page)
    if (teamId && rosterList) {
        const team = teams?.find(t => t.id == teamId);
        if (team) teamHeader.innerHTML = `<h1 class="text-5xl font-black">${team.name}</h1><p class="text-blue-600 font-bold uppercase tracking-widest mt-2 text-xs">Coach: ${team.coach_name}</p>`;

        const { data: players } = await db.from('players').select('*').eq('team_id', teamId).order('name');
        rosterList.innerHTML = players.map(p => `
            <tr class="border-b border-slate-100 dark:border-slate-800">
                <td class="p-5 font-bold">${p.name}</td>
                <td class="p-5 text-center text-slate-500">${p.position || '--'}</td>
                <td class="p-5 text-center text-slate-500">${p.age || '--'}</td>
                <td class="p-5 text-center font-mono text-blue-600 dark:text-blue-400 text-xs">${p.phone_number || '--'}</td>
            </tr>`).join('');
    }

    // 3. FETCH ALL PLAYERS (Admin Management)
    if (adminPlayersList) {
        const { data: allPlayers } = await db.from('players').select('*, teams(name)').order('name');
        adminPlayersList.innerHTML = allPlayers.map(p => `
            <tr>
                <td class="p-4 font-bold">${p.name}</td>
                <td class="p-4 text-[10px] uppercase text-slate-500">${p.teams?.name || 'No Team'}</td>
                <td class="p-4 text-right">
                    <button onclick="window.editPlayer(${p.id})" class="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                    <button onclick="window.deletePlayer(${p.id})" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>`).join('');
    }

    // 4. FETCH DOCUMENTS
    if (docsList) {
        const { data: docs } = await db.from('documents').select('*');
        if (docs) {
            const groups = {};
            docs.forEach(d => { if (!groups[d.category]) groups[d.category] = []; groups[d.category].push(d); });
            docsList.innerHTML = Object.keys(groups).map(cat => `
                <div class="mb-10">
                    <h3 class="text-[10px] font-black uppercase text-slate-400 tracking-[.3em] mb-4">${cat}</h3>
                    <div class="space-y-2">
                        ${groups[cat].map(doc => `
                        <a href="${doc.file_url}" target="_blank" class="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-orange-500 transition">
                            <i data-lucide="file-text" class="w-4 h-4 text-orange-500"></i>
                            <span class="text-sm font-bold">${doc.title}</span>
                        </a>`).join('')}
                    </div>
                </div>`).join('');
        }
    }
    lucide.createIcons();
}

// FORMS
function setupForms() {
    const importBtn = document.getElementById('import-btn');
    if (importBtn) {
        importBtn.addEventListener('click', async () => {
            const text = document.getElementById('import-area').value;
            if (!text.trim()) return;
            importBtn.innerText = "Importing...";
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

    const playerForm = document.getElementById('player-form');
    if (playerForm) {
        playerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Capture values from the form
            const team_id = parseInt(document.getElementById('team-select').value);
            const name = document.getElementById('player-name').value.trim();
            const age = parseInt(document.getElementById('player-age').value) || null;
            const position = document.getElementById('player-pos').value.trim();
            const phone_number = document.getElementById('player-phone').value.trim();

            // Check for duplicates on the same team
            const { data: existing } = await db.from('players')
                .select('id')
                .eq('team_id', team_id)
                .ilike('name', name);

            if (existing && existing.length > 0) {
                return alert("This player is already on this team's roster.");
            }

            // Insert into Supabase
            const { error } = await db.from('players').insert([{
                team_id,
                name,
                age,
                position,
                phone_number // Ensure this matches your database column name
            }]);

            if (error) {
                alert("Error adding player: " + error.message);
            } else {
                alert("Player added to roster!");
                playerForm.reset();
                loadAllData(); // Refresh the management list below
            }
        });
    }

    const teamForm = document.getElementById('team-form');
    if (teamForm) {
        teamForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('team-name').value.trim();
            const coach = document.getElementById('coach-name').value.trim();

            const { data: existing } = await db.from('teams').select('id').ilike('name', name);
            if (existing?.length) return alert("Team name already exists!");

            const { error } = await db.from('teams').insert([{ name, coach_name: coach }]);
            if (error) alert(error.message);
            else { teamForm.reset(); loadAllData(); }
        });
    }
}

// THEME
function setupThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('color-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
}

// GLOBAL MANAGEMENT
window.deleteTeam = async (id) => { if (confirm("Delete team?")) { await db.from('teams').delete().eq('id', id); location.reload(); } };
window.editTeam = async (id, name) => { const n = prompt("Rename:", name); if (n) { await db.from('teams').update({ name: n }).eq('id', id); location.reload(); } };
window.deletePlayer = async (id) => { if (confirm("Delete player?")) { await db.from('players').delete().eq('id', id); location.reload(); } };
// OPEN EDIT MODAL
window.editPlayer = async (id) => {
    const modal = document.getElementById('edit-modal');
    const editTeamSelect = document.getElementById('edit-player-team');

    // 1. Fetch current player data
    const { data: p, error } = await db.from('players').select('*').eq('id', id).single();
    if (error) return alert(error.message);

    // 2. Populate the Team dropdown in the modal (same as the main one)
    const { data: teams } = await db.from('teams').select('id, name').order('name');
    editTeamSelect.innerHTML = teams.map(t => `<option value="${t.id}" ${t.id === p.team_id ? 'selected' : ''}>${t.name}</option>`).join('');

    // 3. Fill the form fields
    document.getElementById('edit-player-id').value = p.id;
    document.getElementById('edit-player-name').value = p.name;
    document.getElementById('edit-player-age').value = p.age || '';
    document.getElementById('edit-player-pos').value = p.position || '';
    document.getElementById('edit-player-phone').value = p.phone_number || '';

    // 4. Show the modal
    modal.classList.remove('hidden');
    lucide.createIcons(); // Refresh close icon
};

// CLOSE MODAL
window.closeModal = () => {
    document.getElementById('edit-modal').classList.add('hidden');
};

// Add this inside your setupForms() function OR at the very bottom of app.js
const editPlayerForm = document.getElementById('edit-player-form');

if (editPlayerForm) {
    console.log("Edit Player Form listener attached."); // Debug log
    
    editPlayerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Save button clicked!"); // Debug log
        
        const id = document.getElementById('edit-player-id').value;
        
        // Construct the update object
        const updates = {
            name: document.getElementById('edit-player-name').value,
            team_id: parseInt(document.getElementById('edit-player-team').value),
            age: parseInt(document.getElementById('edit-player-age').value) || null,
            position: document.getElementById('edit-player-pos').value,
            phone_number: document.getElementById('edit-player-phone').value
        };

        console.log("Sending updates to Supabase for ID:", id, updates);

        // Perform the update
        const { data, error } = await db
            .from('players')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error("Supabase Update Error:", error.message);
            alert("Error updating player: " + error.message);
        } else {
            console.log("Update successful!");
            alert("Player updated successfully!");
            
            // 1. Close the modal
            window.closeModal(); 
            
            // 2. Refresh the data on the page
            if (typeof loadAllData === "function") {
                await loadAllData(); 
            } else {
                location.reload(); // Fallback if loadAllData isn't global
            }
        }
    });
}

window.addEventListener('load', init);