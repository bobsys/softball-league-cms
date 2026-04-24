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
    } catch (e) { console.error(e); }
}

// 3. DATA LOADING & ROUTING
async function loadAllData() {
    // Elements for Home/Team Detail Pages
    const teamsList = document.getElementById('teams-list');
    const docsList = document.getElementById('docs-list');
    const sidebarTeams = document.getElementById('sidebar-teams');
    const rosterList = document.getElementById('roster-list');
    const teamHeader = document.getElementById('team-header');
    
    // Elements for Admin Page
    const adminTeamsList = document.getElementById('admin-teams-list');
    const teamSelect = document.getElementById('team-select');

    // Get URL Parameters (for Team Detail page)
    const urlParams = new URLSearchParams(window.location.search);
    const teamId = urlParams.get('id');

    // A. FETCH ALL TEAMS
    const { data: teams, error: tError } = await db.from('teams').select('*').order('name');
    if (tError) return console.error(tError);

    if (teams) {
        // Render Home Page Team Blocks
        if (teamsList) {
            teamsList.innerHTML = teams.map(t => `
                <a href="team-details.html?id=${t.id}" class="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all group shadow-sm">
                    <div class="bg-blue-50 dark:bg-blue-900/20 w-12 h-12 flex items-center justify-center rounded-2xl mb-6 text-blue-600">
                        <i data-lucide="shield" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-2xl font-black group-hover:text-blue-600 transition">${t.name}</h3>
                    <p class="text-sm text-slate-500 mt-2 font-medium uppercase tracking-wider">Coach: ${t.coach_name || 'TBD'}</p>
                </a>
            `).join('');
        }

        // Render Sidebar Team Links (Team Details Page)
        if (sidebarTeams) {
            sidebarTeams.innerHTML = teams.map(t => `
                <a href="team-details.html?id=${t.id}" class="block p-3 rounded-xl text-sm font-bold ${teamId == t.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'} transition">
                    ${t.name}
                </a>
            `).join('');
        }

        // Render Admin Management List
        if (adminTeamsList) {
            adminTeamsList.innerHTML = teams.map(t => `
                <div class="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span class="font-black text-sm">${t.name}</span>
                    <div class="flex gap-1">
                        <button onclick="editTeam(${t.id}, '${t.name}')" class="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                        <button onclick="deleteTeam(${t.id})" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
            `).join('');
        }

        // Populate Dropdowns
        if (teamSelect) {
            teamSelect.innerHTML = '<option value="">Select Team...</option>' + 
                teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        }

        // A. Update the team-details.html rendering 
        if (teamId && rosterList) {
            // ... (existing team header code) ...
            const { data: players } = await db.from('players').select('*').eq('team_id', teamId).order('name');
            rosterList.innerHTML = players.map(p => `
                <tr class="border-b border-slate-100 dark:border-slate-800">
                    <td class="p-5 font-bold text-slate-800 dark:text-white">${p.name}</td>
                    <td class="p-5 text-center font-medium text-slate-500">${p.position || '--'}</td>
                    <td class="p-5 text-center font-medium text-slate-500">${p.age || '--'}</td>
                    <td class="p-5 text-center font-mono text-blue-600 dark:text-blue-400 text-[11px]">${p.phone_number || '--'}</td>
                </tr>
            `).join('');
        }

        // B. Add Player Management for Admin Page (inside loadAllData)
        const adminPlayersList = document.getElementById('admin-players-list');
        if (adminPlayersList) {
            const { data: allPlayers } = await db.from('players').select('*, teams(name)').order('name');
            adminPlayersList.innerHTML = allPlayers.map(p => `
                <tr>
                    <td class="p-4 font-bold">${p.name}</td>
                    <td class="p-4 text-slate-500 uppercase text-[10px]">${p.teams?.name || 'No Team'}</td>
                    <td class="p-4 text-right">
                        <button onclick="editPlayer(${p.id}, '${p.name}')" class="text-blue-500 hover:text-blue-700 mx-2"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                        <button onclick="deletePlayer(${p.id})" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </td>
                </tr>
            `).join('');
        }

    }

    // B. FETCH TEAM SPECIFIC ROSTER (If on team-details.html)
    if (teamId && rosterList) {
        const currentTeam = teams.find(t => t.id == teamId);
        if (currentTeam) {
            teamHeader.innerHTML = `
                <h1 class="text-6xl font-black tracking-tighter">${currentTeam.name}</h1>
                <p class="text-blue-600 dark:text-blue-400 font-black uppercase tracking-[.3em] mt-2 text-xs">Coach: ${currentTeam.coach_name}</p>
            `;
        }

        const { data: players } = await db.from('players').select('*').eq('team_id', teamId).order('name');
        if (players) {
            rosterList.innerHTML = players.length ? players.map(p => `
                <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td class="p-5 font-bold text-slate-800 dark:text-white">${p.name}</td>
                    <td class="p-5 text-center font-medium text-slate-500">${p.position || '--'}</td>
                    <td class="p-5 text-center font-medium text-slate-500">${p.age || '--'}</td>
                </tr>
            `).join('') : '<tr><td colspan="3" class="p-12 text-center text-slate-400 italic">No players registered on this roster.</td></tr>';
        }
    }

    // C. FETCH DOCUMENTS & GROUP BY CATEGORY
    if (docsList) {
        const { data: docs } = await db.from('documents').select('*').order('created_at', { ascending: false });
        if (docs) {
            const groups = {};
            docs.forEach(doc => {
                if (!groups[doc.category]) groups[doc.category] = [];
                groups[doc.category].push(doc);
            });

            docsList.innerHTML = Object.keys(groups).map(cat => `
                <div class="mb-10">
                    <h3 class="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[.3em] mb-4">${cat}</h3>
                    <div class="grid grid-cols-1 gap-2">
                        ${groups[cat].map(doc => `
                            <a href="${doc.file_url}" target="_blank" class="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-orange-500 hover:shadow-lg transition group">
                                <div class="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg text-orange-600"><i data-lucide="file-text" class="w-4 h-4"></i></div>
                                <span class="text-sm font-bold flex-1">${doc.title}</span>
                                <i data-lucide="download" class="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition"></i>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }
    }

    lucide.createIcons();
}

// 4. FORM LOGIC (ADMIN)
function setupForms() {
    const teamForm = document.getElementById('team-form');
    const playerForm = document.getElementById('player-form');
    const docForm = document.getElementById('doc-form');

    if (teamForm) {
        teamForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('team-name').value.trim();
            const coach = document.getElementById('coach-name').value.trim();
            const { data: existing } = await db.from('teams').select('id').ilike('name', name);
            if (existing?.length) return alert("Team name already exists!");
            const { error } = await db.from('teams').insert([{ name, coach_name: coach }]);
            if (error) alert(error.message); else location.reload();
        });
    }

    if (playerForm) {
        playerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const team_id = parseInt(document.getElementById('team-select').value);
            const name = document.getElementById('player-name').value.trim();
            const { data: existing } = await db.from('players').select('id').eq('team_id', team_id).ilike('name', name);
            if (existing?.length) return alert("Player already on this roster!");
            const { error } = await db.from('players').insert([{
                team_id, name, position: document.getElementById('player-pos').value,
                age: parseInt(document.getElementById('player-age').value) || null
            }]);
            if (error) alert(error.message); else { alert("Player Added!"); playerForm.reset(); }
        });
    }

    if (docForm) {
        docForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('doc-file');
            const title = document.getElementById('doc-title').value;
            const category = document.getElementById('doc-category').value || 'General';
            const btn = e.target.querySelector('button');

            if (!fileInput.files.length) return alert("Select a file");
            const file = fileInput.files[0];
            btn.innerText = "Uploading..."; btn.disabled = true;

            const filePath = `public/${Date.now()}-${file.name}`;
            const { error: upErr } = await db.storage.from('league-documents').upload(filePath, file);
            if (upErr) { alert(upErr.message); btn.innerText = "Save Document"; btn.disabled = false; return; }

            const { data: urlData } = db.storage.from('league-documents').getPublicUrl(filePath);
            const { error: dbErr } = await db.from('documents').insert([{ title, category, file_url: urlData.publicUrl }]);
            if (dbErr) alert(dbErr.message); else location.reload();
        });
    }
}

// 5. GLOBAL ACTIONS
window.deleteTeam = async (id) => {
    if (!confirm("Delete team and all associated players?")) return;
    const { error } = await db.from('teams').delete().eq('id', id);
    if (error) alert(error.message); else location.reload();
};

window.editTeam = async (id, currentName) => {
    const newName = prompt("Rename team:", currentName);
    if (newName && newName !== currentName) {
        const { error } = await db.from('teams').update({ name: newName }).eq('id', id);
        if (error) alert(error.message); else location.reload();
    }
};

// Add this at the bottom of app.js
function setupThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('color-theme', isDark ? 'dark' : 'light');
    });
}

// Add to setupForms() or near the end of app.js
const importBtn = document.getElementById('import-btn');
if (importBtn) {
    importBtn.addEventListener('click', async () => {
        const text = document.getElementById('import-area').value;
        const status = document.getElementById('import-status');
        if (!text) return alert("Paste some text first!");

        status.innerText = "Parsing and Importing... please wait.";
        status.classList.remove('hidden');
        importBtn.disabled = true;

        // 1. Split into Team Blocks
        const teamBlocks = text.split(/MANAGER:/g).filter(block => block.trim().length > 0);
        
        for (const block of teamBlocks) {
            const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            
            // 2. Extract Manager/Team Name
            const teamName = lines[0].replace(/-+/g, '').trim();
            
            // Check if Team Exists
            let { data: teamData } = await db.from('teams').select('id').ilike('name', teamName).single();
            let teamId;

            if (!teamData) {
                const { data: newTeam, error: tErr } = await db.from('teams').insert([{ name: teamName, coach_name: teamName }]).select().single();
                if (tErr) { console.error(tErr); continue; }
                teamId = newTeam.id;
            } else {
                teamId = teamData.id;
            }

            // 3. Extract Players
            const playersToInsert = [];
            let currentPlayer = null;

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];

                // New Player Detected (Starts with number.)
                if (/^\d+\./.test(line)) {
                    if (currentPlayer) playersToInsert.push(currentPlayer);
                    currentPlayer = { 
                        team_id: teamId, 
                        name: line.replace(/^\d+\.\s+/, '').trim() 
                    };
                } 
                // Contact Data
                else if (line.includes('CONTACT:')) {
                    const phone = line.match(/CONTACT:\s*([\d-]+)/);
                    if (phone) currentPlayer.phone_number = phone[1];
                } 
                // Age Data
                else if (line.includes('DATA:')) {
                    const age = line.match(/\[Age:\s*(\d+)\]/);
                    if (age) currentPlayer.age = parseInt(age[1]);
                }
                // Position Data
                else if (line.includes('FIELD:')) {
                    const pos = line.match(/\[Pos:\s*([^\]]+)\]/);
                    if (pos) currentPlayer.position = pos[1];
                }
            }
            // Add the last player of the block
            if (currentPlayer) playersToInsert.push(currentPlayer);

            // 4. Batch Insert Players (Duplicate check handled by checking names)
            for (const p of playersToInsert) {
                const { data: exists } = await db.from('players').select('id').eq('team_id', teamId).ilike('name', p.name);
                if (!exists || exists.length === 0) {
                    await db.from('players').insert([p]);
                }
            }
        }

        // DELETE PLAYER
        window.deletePlayer = async (id) => {
            if (!confirm("Are you sure you want to remove this player?")) return;
            const { error } = await db.from('players').delete().eq('id', id);
            if (error) alert(error.message);
            else location.reload();
        };

        // EDIT PLAYER (Quick Edit)
        window.editPlayer = async (id, currentName) => {
            const newName = prompt("Update player name:", currentName);
            if (newName && newName !== currentName) {
                const { error } = await db.from('players').update({ name: newName }).eq('id', id);
                if (error) alert(error.message);
                else location.reload();
            }
        };

        status.innerText = "Import Complete!";
        alert("Import finished successfully.");
        location.reload();
    });
}
window.addEventListener('load', init);