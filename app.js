// 1. CONFIGURATION
const SUPABASE_URL = 'https://gwcfzujfyzusyuaazslx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CXlvnbzmTyV_HuRVJNnB1A_SjRqfO2K';
                       
let db;

// 2. INITIALIZATION
function init() {
    try {
        // Initialize the Supabase client
        db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        // Run the data loading and form setup
        loadAllData();
        setupEventListeners();
    } catch (e) {
        console.error("Initialization error:", e);
    }
}

// 3. DATA LOADING & RENDERING
async function loadAllData() {
    // Determine which page we are on by checking for specific IDs
    const teamsList = document.getElementById('teams-list');         // Home Page
    const docsList = document.getElementById('docs-list');           // Home Page
    const adminTeamsList = document.getElementById('admin-teams-list'); // Admin Page
    const teamSelect = document.getElementById('team-select');       // Admin Page

    // A. FETCH TEAMS
    const { data: teams, error: tError } = await db.from('teams').select('*').order('name');
    if (tError) console.error("Teams error:", tError);

    if (teams) {
        // Render Teams on Public Homepage
        if (teamsList) {
            teamsList.innerHTML = teams.length ? teams.map(t => `
                <article class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition hover:shadow-md">
                    <div class="bg-blue-100 dark:bg-blue-900/30 w-10 h-10 flex items-center justify-center rounded-lg text-blue-600 dark:text-blue-400 mb-4">
                        <i data-lucide="shield" class="w-5 h-5"></i>
                    </div>
                    <h3 class="font-bold text-slate-800 dark:text-white">${t.name}</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">Coach: ${t.coach_name || 'Not assigned'}</p>
                </article>
            `).join('') : '<p class="text-slate-400 text-sm">No teams registered yet.</p>';
        }

        // Render Teams Management List on Admin Page
        if (adminTeamsList) {
            adminTeamsList.innerHTML = teams.map(t => `
                <div class="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div>
                        <p class="font-bold text-sm">${t.name}</p>
                        <p class="text-[10px] text-slate-400 uppercase font-bold">${t.coach_name || 'No Coach'}</p>
                    </div>
                    <div class="flex gap-1">
                        <button onclick="editTeam(${t.id}, '${t.name}')" class="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                        <button onclick="deleteTeam(${t.id})" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
            `).join('');
        }

        // Populate the Team Dropdown in Admin forms
        if (teamSelect) {
            teamSelect.innerHTML = '<option value="">Select Team...</option>' + 
                teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        }
    }

    // B. FETCH DOCUMENTS
    const { data: docs, error: dError } = await db.from('documents').select('*').order('created_at', { ascending: false });
    if (dError) console.error("Docs error:", dError);

    if (docs && docsList) {
        docsList.innerHTML = docs.length ? docs.map(doc => `
            <a href="${doc.file_url}" target="_blank" class="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-orange-500 transition group">
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-lg">
                        <i data-lucide="file-text" class="w-4 h-4"></i>
                    </div>
                    <div>
                        <p class="font-bold text-xs text-slate-800 dark:text-slate-200">${doc.title}</p>
                        <p class="text-[10px] text-slate-500 uppercase font-bold tracking-tight">${doc.category}</p>
                    </div>
                </div>
                <i data-lucide="external-link" class="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition"></i>
            </a>
        `).join('') : '<p class="text-slate-400 text-sm">No documents available.</p>';
    }

    // Refresh Lucide icons for all newly injected HTML
    lucide.createIcons();
}

// 4. FORM HANDLING
function setupEventListeners() {
    const teamForm = document.getElementById('team-form');
    const playerForm = document.getElementById('player-form');
    const docForm = document.getElementById('doc-form');

    // CREATE TEAM
    if (teamForm) {
        teamForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('team-name').value.trim();
            const coach = document.getElementById('coach-name').value.trim();

            // Duplicate Check
            const { data: existing } = await db.from('teams').select('id').ilike('name', name);
            if (existing && existing.length > 0) return alert("A team with this name already exists!");

            const { error } = await db.from('teams').insert([{ name, coach_name: coach }]);
            if (error) alert(error.message);
            else { alert('Team Saved!'); location.reload(); }
        });
    }

    // CREATE PLAYER
    if (playerForm) {
        playerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const team_id = parseInt(document.getElementById('team-select').value);
            const name = document.getElementById('player-name').value.trim();

            // Duplicate Check (on same team)
            const { data: existing } = await db.from('players').select('id').eq('team_id', team_id).ilike('name', name);
            if (existing && existing.length > 0) return alert("This player is already on this team's roster!");

            const { error } = await db.from('players').insert([{
                team_id, 
                name, 
                position: document.getElementById('player-pos').value,
                age: parseInt(document.getElementById('player-age').value) || null
            }]);

            if (error) alert(error.message);
            else { alert('Player Added!'); playerForm.reset(); }
        });
    }

    // UPLOAD DOCUMENT (Storage + Database)
    if (docForm) {
        docForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('doc-file');
            const title = document.getElementById('doc-title').value.trim();
            const category = document.getElementById('doc-category').value;
            const btn = document.querySelector('#doc-form button');

            if (!fileInput.files.length) return alert("Select a file first");
            const file = fileInput.files[0];

            btn.innerText = "Uploading...";
            btn.disabled = true;

            // Step A: Upload file to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `public/${fileName}`;

            const { data: uploadData, error: uploadError } = await db.storage
                .from('league-documents')
                .upload(filePath, file);

            if (uploadError) {
                alert("Upload failed: " + uploadError.message);
                btn.innerText = "Save Document";
                btn.disabled = false;
                return;
            }

            // Step B: Get the Public URL for that file
            const { data: urlData } = db.storage.from('league-documents').getPublicUrl(filePath);
            const publicUrl = urlData.publicUrl;

            // Step C: Save the record in the 'documents' table
            const { error: dbError } = await db.from('documents').insert([{
                title, 
                category, 
                file_url: publicUrl
            }]);

            if (dbError) {
                alert("Database Error: " + dbError.message);
                btn.innerText = "Save Document";
                btn.disabled = false;
            } else {
                alert("Document Uploaded!");
                location.reload();
            }
        });
    }
}

// 5. GLOBAL MANAGEMENT ACTIONS (Window scope needed for HTML onclicks)
window.deleteTeam = async (id) => {
    if (!confirm("Are you sure? This will delete the team and all associated players.")) return;
    const { error } = await db.from('teams').delete().eq('id', id);
    if (error) alert(error.message);
    else location.reload();
};

window.editTeam = async (id, currentName) => {
    const newName = prompt("Rename team to:", currentName);
    if (newName && newName.trim() !== "" && newName !== currentName) {
        const { error } = await db.from('teams').update({ name: newName }).eq('id', id);
        if (error) alert(error.message);
        else location.reload();
    }
};

// 6. START
window.addEventListener('load', init);