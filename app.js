const SUPABASE_URL = 'https://gwcfzujfyzusyuaazslx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CXlvnbzmTyV_HuRVJNnB1A_SjRqfO2K';

let db;

function init() {
    try {
        db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        loadAllData();
    } catch (e) { console.error(e); }
}

async function loadAllData() {
    const teamsList = document.getElementById('teams-list');
    const docsList = document.getElementById('docs-list');
    const sidebarTeams = document.getElementById('sidebar-teams');
    const rosterList = document.getElementById('roster-list');
    const teamHeader = document.getElementById('team-header');

    // Get URL Parameters (for Team Detail page)
    const urlParams = new URLSearchParams(window.location.search);
    const teamId = urlParams.get('id');

    // A. FETCH TEAMS
    const { data: teams } = await db.from('teams').select('*').order('name');

    if (teams) {
        // Render Home Page Team Blocks
        if (teamsList) {
            teamsList.innerHTML = teams.map(t => `
                <a href="team-details.html?id=${t.id}" class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all group">
                    <h3 class="text-xl font-black group-hover:text-blue-600">${t.name}</h3>
                    <p class="text-sm text-slate-500 mt-1">Coach: ${t.coach_name || 'N/A'}</p>
                </a>
            `).join('');
        }

        // Render Sidebar Team Links
        if (sidebarTeams) {
            sidebarTeams.innerHTML = teams.map(t => `
                <a href="team-details.html?id=${t.id}" class="block p-3 rounded-xl text-sm font-bold ${teamId == t.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-200 dark:hover:bg-slate-800'} transition">
                    ${t.name}
                </a>
            `).join('');
        }
    }

    // B. FETCH TEAM SPECIFIC ROSTER
    if (teamId && rosterList) {
        const currentTeam = teams.find(t => t.id == teamId);
        if (currentTeam) {
            teamHeader.innerHTML = `<h1 class="text-5xl font-black tracking-tight">${currentTeam.name}</h1><p class="text-blue-600 font-bold uppercase tracking-widest mt-2">Coach: ${currentTeam.coach_name}</p>`;
        }

        const { data: players } = await db.from('players').select('*').eq('team_id', teamId);
        rosterList.innerHTML = players.length ? players.map(p => `
            <tr class="border-b border-slate-100 dark:border-slate-800">
                <td class="p-4 font-bold text-slate-800 dark:text-white">${p.name}</td>
                <td class="p-4 text-slate-500">${p.position || '--'}</td>
                <td class="p-4 text-slate-500">${p.age || '--'}</td>
            </tr>
        `).join('') : '<tr><td colspan="3" class="p-8 text-center text-slate-400">No players on roster yet.</td></tr>';
    }

    // C. FETCH DOCUMENTS & GROUP BY CATEGORY
    if (docsList) {
        const { data: docs } = await db.from('documents').select('*');
        if (docs) {
            const groups = {};
            docs.forEach(doc => {
                if (!groups[doc.category]) groups[doc.category] = [];
                groups[doc.category].push(doc);
            });

            docsList.innerHTML = Object.keys(groups).map(cat => `
                <div class="mb-8">
                    <h3 class="text-xs font-black uppercase text-slate-400 tracking-[.2em] mb-3">${cat}</h3>
                    <div class="space-y-2">
                        ${groups[cat].map(doc => `
                            <a href="${doc.file_url}" target="_blank" class="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-orange-500 transition">
                                <i data-lucide="file" class="w-4 h-4 text-orange-500"></i>
                                <span class="text-sm font-bold">${doc.title}</span>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }
    }
    lucide.createIcons();
    setupForms(); // Ensure forms are setup in admin
}
// (Include your setupForms, deleteTeam, editTeam from the previous app.js version)
window.addEventListener('load', init);