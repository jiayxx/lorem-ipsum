/* 
==========================================
DESIGN THINKING BOOKLET - MAIN JAVASCRIPT
==========================================

This file contains all the JavaScript functionality for the main application.
It handles user interactions, data loading, and the interactive booklet features.

KEY FUNCTIONALITIES:
- Loading stages and methods from the database
- Search functionality across all content
- Interactive booklet with page flipping (mobile)
- Mobile sidebar navigation
- Swipe gestures for mobile users
- Mode color management and display

BOOKLET FUNCTIONS:
- openMethodBooklet(): Opens the booklet modal with method details
- loadAndRenderSections(): Loads and displays method sections
- renderSectionNode(): Creates the visual structure of sections
- Mobile page flipping: showPage(), flipPage(), updatePageIndicator()
- Mobile swipe back: initMobileSwipeBack()

TEACHER NOTE: This is the main logic file that makes the booklet interactive.
The booklet modal is controlled by functions starting around line 330.
*/

// DOM Element References
const stageDetailSection = document.getElementById('stage-detail-section');
const overviewSection = document.getElementById('stages-overview-section');
const stagesContainer = document.getElementById('stages-container');
const methodsContainer = document.getElementById('methods-container');
const backBtn = document.getElementById('back-to-overview');
const sidebarStages = document.getElementById('sidebar-stages');
const modal = document.getElementById('method-modal'); // MAIN BOOKLET MODAL
const bookletEl = document.getElementById('booklet'); // BOOKLET CONTAINER
const bookletRibbon = document.getElementById('booklet-ribbon');
const methodStageEl = document.getElementById('method-stage');
const methodTitleEl = document.getElementById('method-title');
const methodShortEl = document.getElementById('method-short');
const methodLongEl = document.getElementById('method-long');

const methodSectionsEl = document.getElementById('method-sections'); // BOOKLET SECTIONS

// Mode Colors Storage (loaded from database)
const MODE_COLORS = {};

function getModeColor(modeName) {
    return MODE_COLORS[modeName] || '#6b7280';
}

async function loadModeColors() {
    try {
        const response = await axios.get('http://localhost/lorem%20ipsum/api/admin_stages.php');
        const stages = response.data;

        Object.keys(MODE_COLORS).forEach(key => delete MODE_COLORS[key]);

        stages.forEach(stage => {
            MODE_COLORS[stage.name.toUpperCase()] = stage.color_code || '#3b82f6';
        });

        console.log('🎨 Mode colors loaded from stages (same as admin):', MODE_COLORS);


    } catch (error) {
        console.error('❌ Error loading mode colors:', error);
    }
}



function getStageColorByName(name, fallback) {
    if (!name) return fallback || '#3b82f6';
    return fallback || '#3b82f6';
}

function loadStagesFromAPI() {
    const timestamp = new Date().getTime();

    console.log('🔍 Fetching fresh stages data...');

    axios.get(`http://localhost/lorem%20ipsum/api/admin_stages.php?t=${timestamp}`)
        .then(res => {
            const stages = res.data;
            overviewSection.style.display = "block";

            console.log('📊 Raw API response:', res);
            console.log('📋 Stages data:', stages);
            console.log('🔢 Number of stages:', stages ? stages.length : 0);

            stagesContainer.innerHTML = '';
            sidebarStages.innerHTML = '';

            console.log('🧹 Cleared existing content');

            if (stages && stages.length > 0) {
                console.log('✅ Found stages, updating process modules and cards...');

                overviewSection.style.display = "block";

                updateProcessModules(stages);

                updateHeroContent(stages);

                updateSearchData(stages);

                stages.forEach((stage, index) => {
                    console.log(`🎯 Creating card ${index + 1}:`, stage.name);
                    const stageColor = getStageColorByName(stage.name, stage.color_code);
                    const card = document.createElement('div');
                    card.className = 'card';
                    card.innerHTML = `
        <h4>${stage.name}</h4>
            <p>${stage.description || ''}</p>
        <div class="tag" style="background:${stageColor}">${stage.name}</div>
      `;

                    card.onclick = () => {
                        overviewSection.style.display = "none";
                        stageDetailSection.style.display = "block";
                        loadStage(stage.stage_id);
                    };

                    stagesContainer.appendChild(card);

                    const btn = document.createElement('button');

                    const colorIndicator = document.createElement('div');
                    colorIndicator.className = 'color-indicator';
                    colorIndicator.style.background = stageColor;

                    btn.appendChild(colorIndicator);
                    btn.appendChild(document.createTextNode(stage.name));

                    btn.onclick = () => {
                        overviewSection.style.display = "none";
                        stageDetailSection.style.display = "block";
                        loadStage(stage.stage_id);
                        setActiveStageButton(btn, stageColor);
                    };
                    sidebarStages.appendChild(btn);
                });

                console.log('✅ All stage cards created successfully');
            } else {
                console.log('⚠️ No stages found, showing message');
                overviewSection.style.display = "block";
                stagesContainer.innerHTML = '<p>No stages available</p>';
                clearProcessModules();
                updateHeroContent([]);
            }
        })
        .catch(err => {
            console.error('❌ Error loading stages from admin API:', err);
            console.error('❌ Error details:', err.response ? err.response.data : 'No response data');
            console.error('❌ Error status:', err.response ? err.response.status : 'No status');
            console.error('❌ Full error object:', err);

            overviewSection.style.display = "block";
            stagesContainer.innerHTML = '<p>Error loading stages</p>';
            clearProcessModules();
            updateHeroContent([]);
        });
}

loadStagesFromAPI();
loadModeColors(); // Load mode colors from database




function updateProcessModules(stages) {
    const chipsContainer = document.getElementById('process-modules-chips');
    const legendContainer = document.getElementById('process-modules-legend');

    if (!chipsContainer || !legendContainer) return;

    chipsContainer.innerHTML = '';
    legendContainer.innerHTML = '';

    if (!stages || stages.length === 0) {
        chipsContainer.innerHTML = '<p class="no-modules">No process modules available</p>';
        return;
    }

    stages.forEach((stage, index) => {
        const stageColor = getStageColorByName(stage.name, stage.color_code);

        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.style.setProperty('--chip', stageColor);
        chip.textContent = stage.name;
        chip.style.animationDelay = `${index * 0.1}s`; // Stagger animation
        chip.style.cursor = 'pointer';

        chip.onclick = () => {
            const stageCards = document.querySelectorAll('.card');
            const targetCard = Array.from(stageCards).find(card =>
                card.querySelector('h4').textContent === stage.name
            );

            if (targetCard) {
                targetCard.click();
            }
        };

        chip.title = `Click to open ${stage.name} stage`;

        chipsContainer.appendChild(chip);

        const swatch = document.createElement('span');
        swatch.className = 'swatch';
        swatch.style.setProperty('--c', stageColor);
        swatch.setAttribute('title', `${stage.name} stage`);
        legendContainer.appendChild(swatch);
    });

    console.log(`✅ Process modules updated: ${stages.length} stages`);
}

setInterval(() => {
    if (overviewSection.style.display !== 'none') {
        loadStagesFromAPI();
    }
}, 10000);

function clearProcessModules() {
    const chipsContainer = document.getElementById('process-modules-chips');
    const legendContainer = document.getElementById('process-modules-legend');

    if (chipsContainer) chipsContainer.innerHTML = '<p>No process modules available</p>';
    if (legendContainer) legendContainer.innerHTML = '';
}

function updateHeroContent(stages) {
    const heroContent = document.getElementById('hero-content');
    if (!heroContent) return;

    if (stages && stages.length > 0) {
        heroContent.innerHTML = `
      <h1 class="hero-title">Design Thinking Booklet</h1>
      <p>A set of tools and methods that we keep in our back pockets, and now you can do the same.</p>
      <p>These methods were developed by teaching team members, students, as well as designers from around the world.</p>
      <p>It's a digital booklet, so you can start wherever you want. We think of these methods as a set of tools that constantly evolves.</p>
      <h3 class="hero-sub">Process Modules</h3>
      <p>The diagram below shows ${stages.length} "stages" that we identify as the components of design thinking. Each method in this booklet stems from one (or more) of these stages, and will be color coded at the bottom of each booklet, in the lower right corner.</p>
    `;
    } else {
        heroContent.innerHTML = `
      <h1 class="hero-title">Design Thinking Booklet</h1>
      <p>A set of tools and methods that we keep in our back pockets, and now you can do the same.</p>
      <p>These methods were developed by teaching team members, students, as well as designers from around the world.</p>
      <p>Currently, no stages are available. Please add stages through the admin panel to get started.</p>
    `;
    }
}

window.forceRefresh = function () {
    console.log('🚀 Manual force refresh triggered...');
    stagesContainer.innerHTML = '';
    sidebarStages.innerHTML = '';
    clearProcessModules();

    loadStagesFromAPI();

    console.log('🔄 Force refresh completed');
};



function showSaveConfirmation(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    font-weight: 500;
    animation: slideIn 0.3s ease;
  `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

function loadStage(stageId) {
    axios.get('http://localhost/lorem%20ipsum/api/admin_stages.php')
        .then(res => {
            const stages = res.data;
            const stage = stages.find(s => s.stage_id == stageId);
            if (stage) {
                document.getElementById('stage-title').textContent = stage.name;
                document.getElementById('stage-description').textContent = stage.description;
                const stageColor = getStageColorByName(stage.name, stage.color_code);
                bookletRibbon.style.background = stageColor;
                if (bookletEl) bookletEl.style.setProperty('--accent', stageColor);
                document.documentElement.style.setProperty('--accent', stageColor);
                methodStageEl.textContent = stage.name;
            }
        });

    axios.get('http://localhost/lorem%20ipsum/api/admin_methods.php?stage_id=' + stageId)
        .then(res => {
            const methods = res.data;
            methodsContainer.innerHTML = "";

            if (!methods || methods.length === 0) {
                methodsContainer.innerHTML = "<p>No methods available for this stage yet.</p>";
            } else {
                methods.forEach(m => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    card.innerHTML = `
            <h4>${m.title}</h4>
            <p>${m.short_desc || ''}</p>
            <div class="tag" style="background:#3b82f6">Method</div>
          `;
                    card.onclick = () => openMethodBooklet(m.method_id);
                    methodsContainer.appendChild(card);
                });
            }
        })
        .catch(err => console.error("Methods API error:", err));
}

backBtn.onclick = () => {
    stageDetailSection.style.display = "none";
    overviewSection.style.display = "block";
};

function openMethodBooklet(methodId) {
    window.currentMethodId = methodId;

    axios.get('http://localhost/lorem%20ipsum/api/admin_methods.php?method_id=' + methodId)
        .then(res => {
            const m = res.data;
            methodTitleEl.textContent = m.title || 'Untitled Method';
            methodShortEl.textContent = m.short_desc || '';
            methodLongEl.textContent = m.long_desc || '';

            const imageContainer = document.getElementById('method-image-container');
            const methodImage = document.getElementById('method-image');
            console.log('🖼️ Method image data:', m.image_url ? 'Present' : 'Missing');
            console.log('🖼️ Image URL length:', m.image_url ? m.image_url.length : 0);

            if (m.image_url && m.image_url.trim() !== '') {
                console.log('🖼️ Setting image source...');
                methodImage.src = m.image_url;
                imageContainer.style.display = 'block';
                console.log('🖼️ Image container displayed');

                methodImage.onerror = function () {
                    console.error('❌ Failed to load image');
                    imageContainer.style.display = 'none';
                };

                methodImage.onload = function () {
                    console.log('✅ Image loaded successfully');
                };
            } else {
                console.log('🖼️ No image data, hiding container');
                imageContainer.style.display = 'none';
            }

            if (m.stage_name) {
                methodStageEl.textContent = m.stage_name;
            } else {
                methodStageEl.textContent = '';
            }

            getMethodModes(methodId).then(methodModes => {
                if (methodModes && methodModes.length > 0) {
                    updateFooterModeButtons(methodModes, MODE_COLORS);
                } else {
                    clearFooterModeButtons();
                }
            });

            loadAndRenderSections(methodId);
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';

            if (window.innerWidth <= 768) {
                preventAutoReset = false;
                resetBookletToPage1();
            }
        })
        .catch(() => {
            methodTitleEl.textContent = 'Error loading method';
            methodShortEl.textContent = '';
            methodLongEl.textContent = '';

            modal.classList.add('open');
        });
}

function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
}

modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

function setActiveStageButton(activeBtn, color) {
    Array.from(sidebarStages.querySelectorAll('button')).forEach(b => {
        b.classList.remove('active');
        b.style.setProperty('--active-color', '');
    });
    activeBtn.classList.add('active');
    if (color) activeBtn.style.setProperty('--active-color', color);
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
    }
});

window.addEventListener('storage', (e) => {
    if (e.key === 'method_updated' && modal.classList.contains('open')) {
        const methodId = currentMethodId || getCurrentMethodId();
        if (methodId) {
            openMethodBooklet(methodId);
        }
    }
});

function getCurrentMethodId() {
    return window.currentMethodId || null;
}

function updateFooterModeButtons(modes, modeColors) {
    const footerButtons = document.getElementById('footer-mode-buttons');
    footerButtons.innerHTML = '';

    modes.forEach(mode => {
        const color = getModeColor(mode);
        const button = document.createElement('button');
        button.className = 'mode-btn';
        button.textContent = mode;
        button.style.background = color;
        footerButtons.appendChild(button);
    });
}

function clearFooterModeButtons() {
    const footerButtons = document.getElementById('footer-mode-buttons');
    footerButtons.innerHTML = '';
}

function loadAndRenderSections(methodId) {
    methodSectionsEl.innerHTML = '';
    axios.get('http://localhost/lorem%20ipsum/api/admin_sections.php?method_id=' + methodId)
        .then(res => {
            const sections = Array.isArray(res.data) ? res.data : [];
            hasSections = sections.length > 0;

            if (sections.length === 0) {
                methodSectionsEl.innerHTML = '<p class="meta">No sections available.</p>';
            } else {
                const fragment = document.createDocumentFragment();
                sections.forEach(s => fragment.appendChild(renderSectionNode(s)));
                methodSectionsEl.appendChild(fragment);
            }

            if (window.innerWidth > 768) {
                const page1 = document.getElementById('page-1');
                const page2 = document.getElementById('page-2');
                const pagesContainer = document.querySelector('.booklet .pages');
                if (page1 && page2) {
                    page1.style.display = 'block';
                    page2.style.display = 'block';
                    if (hasSections) {
                        if (pagesContainer) {
                            pagesContainer.classList.remove('single-page');
                        }
                    } else {
                        if (pagesContainer) {
                            pagesContainer.classList.add('single-page');
                        }
                    }
                }
            }
        })
        .catch((error) => {
            console.error('Error loading sections:', error);
            methodSectionsEl.innerHTML = '<p class="meta">Error loading sections: ' + (error.response?.data?.error || error.message) + '</p>';
            hasSections = false;

            if (window.innerWidth > 768) {
                const page1 = document.getElementById('page-1');
                const page2 = document.getElementById('page-2');
                const pagesContainer = document.querySelector('.booklet .pages');
                if (page1 && page2) {
                    page1.style.display = 'block';
                    page2.style.display = 'block';
                    if (pagesContainer) {
                        pagesContainer.classList.add('single-page');
                    }
                }
            }
        });
}

function renderSectionNode(node) {
    const wrap = document.createElement('div');
    wrap.className = 'section-item';

    if (node.title && node.title.trim()) {
        const title = document.createElement('div');
        title.className = 'section-title';
        title.textContent = node.title;
        wrap.appendChild(title);
    }

    if (node.description && node.description.trim()) {
        const desc = document.createElement('div');
        desc.className = 'section-desc';
        desc.innerHTML = node.description.replace(/\n/g, '<br>');
        wrap.appendChild(desc);
    }

    if (node.children && node.children.length) {
        const children = document.createElement('div');
        children.className = 'section-children';
        node.children.forEach(c => children.appendChild(renderSectionNode(c)));
        wrap.appendChild(children);
    }

    return wrap;
}

let allMethods = []; // Store all methods for search
let allStages = []; // Store all stages for search

async function loadAllMethodsForSearch() {
    try {
        const response = await axios.get('http://localhost/lorem%20ipsum/api/admin_methods.php');
        const methods = response.data || [];

        const uniqueMethods = [];
        const seenTitles = new Set();

        methods.forEach(method => {
            if (method.method_id && method.title) {
                if (!seenTitles.has(method.title.toLowerCase())) {
                    seenTitles.add(method.title.toLowerCase());
                    uniqueMethods.push(method);
                } else {
                    console.log('🚫 Skipping duplicate method:', method.title);
                }
            }
        });

        allMethods = uniqueMethods;
        console.log('🔍 Loaded methods for search:', allMethods.length);
        console.log('🔍 Methods loaded:', allMethods.map(m => ({ id: m.method_id, title: m.title })));
    } catch (error) {
        console.error('❌ Error loading methods for search:', error);
    }
}

async function performSearch(searchTerm) {
    if (!searchTerm.trim()) {
        hideSearchResults();
        return;
    }

    const term = searchTerm.toLowerCase();
    const results = [];
    const seenMethodIds = new Set(); // Track seen methods to avoid duplicates

    allMethods.forEach(method => {
        if (seenMethodIds.has(method.method_id)) {
            return;
        }

        let score = 0;
        let matchedFields = [];

        if (method.title && method.title.toLowerCase().includes(term)) {
            score += 10;
            matchedFields.push('Title');
        }

        if (method.short_desc && method.short_desc.toLowerCase().includes(term)) {
            score += 5;
            matchedFields.push('Short Description');
        }

        if (method.long_desc && method.long_desc.toLowerCase().includes(term)) {
            score += 3;
            matchedFields.push('Long Description');
        }

        if (method.resources && method.resources.toLowerCase().includes(term)) {
            score += 2;
            matchedFields.push('Resources');
        }

        if (score > 0) {
            seenMethodIds.add(method.method_id); // Mark as seen
            results.push({
                type: 'method',
                data: method,
                score: score,
                matchedFields: matchedFields
            });
        }
    });

    allStages.forEach(stage => {
        let score = 0;
        let matchedFields = [];

        if (stage.name && stage.name.toLowerCase().includes(term)) {
            score += 8;
            matchedFields.push('Stage Name');
        }

        if (stage.description && stage.description.toLowerCase().includes(term)) {
            score += 4;
            matchedFields.push('Stage Description');
        }

        if (score > 0) {
            results.push({
                type: 'stage',
                data: stage,
                score: score,
                matchedFields: matchedFields
            });
        }
    });

    await searchSections(term, results);

    results.sort((a, b) => b.score - a.score);

    await displaySearchResults(results);
}

async function displaySearchResults(results) {
    const resultsContainer = document.getElementById('search-results');

    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No results found for your search.</div>';
        resultsContainer.style.display = 'block';
        return;
    }

    let html = '<div class="search-results-header">';
    html += `<h3>Found ${results.length} result${results.length !== 1 ? 's' : ''}</h3>`;
    html += '</div>';

    for (const result of results) {
        if (result.type === 'method') {
            const method = result.data;
            const methodModes = await getMethodModes(method.method_id);

            html += `
              <div class="search-result-item method-result" onclick="openMethodBooklet(${method.method_id})">
                <div class="result-icon">📋</div>
                <div class="result-content">
                  <div class="result-title">${method.title || 'Untitled Method'}</div>
                  <div class="result-description">${method.short_desc || 'No description'}</div>
                  <div class="result-meta">
                    <div class="result-labels">
                      <span class="result-type">Method</span>
                      <span class="matched-fields">Matched: ${getCleanMatchedFields(result.matchedFields)}</span>
                    </div>
                    <div class="result-color-palette">
                      ${methodModes.map(mode =>
                `<div class="color-dot" style="background: ${getModeColor(mode)}" title="${mode}"></div>`
            ).join('')}
                    </div>
                  </div>
                </div>
              </div>
            `;
        } else if (result.type === 'stage') {
            const stage = result.data;
            const stageColor = getModeColor(stage.name) || '#3b82f6';

            html += `
              <div class="search-result-item stage-result" onclick="openStageFromSearch('${stage.name}')">
                <div class="result-icon">🎯</div>
                <div class="result-content">
                  <div class="result-title">${stage.name}</div>
                  <div class="result-description">${stage.description || 'No description'}</div>
                  <div class="result-meta">
                    <div class="result-labels">
                      <span class="result-type">Stage</span>
                      <span class="matched-fields">Matched: ${getCleanMatchedFields(result.matchedFields)}</span>
                    </div>
                    <div class="result-color-palette">
                      <div class="color-dot" style="background: ${stageColor}"></div>
                    </div>
                  </div>
                </div>
              </div>
            `;
        } else if (result.type === 'section') {
            const section = result.data;

            html += `
              <div class="search-result-item section-result" onclick="openSectionFromSearch(${section.section_id}, ${section.method_id})">
                <div class="result-icon">📄</div>
                <div class="result-content">
                  <div class="result-title">${section.title || 'Untitled Section'}</div>
                  <div class="result-description">${section.description || 'No content'}</div>
                  <div class="result-meta">
                    <div class="result-labels">
                      <span class="result-type">Section</span>
                      <span class="matched-fields">Matched: ${getCleanMatchedFields(result.matchedFields)}</span>
                    </div>
                  </div>
                </div>
              </div>
            `;
        }
    }

    resultsContainer.innerHTML = html;
    resultsContainer.style.display = 'block';
}

function hideSearchResults() {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.style.display = 'none';
}

function openStageFromSearch(stageName) {
    const stageButtons = document.querySelectorAll('#sidebar-stages button');
    const targetButton = Array.from(stageButtons).find(btn =>
        btn.textContent.toLowerCase() === stageName.toLowerCase()
    );

    if (targetButton) {
        targetButton.click();
    }

    hideSearchResults();
}

function openSectionFromSearch(sectionId, methodId) {
    openMethodBooklet(methodId);

    hideSearchResults();

    console.log(`Opening method ${methodId} to show section ${sectionId}`);
}

document.addEventListener('DOMContentLoaded', async () => {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const searchResults = document.getElementById('search-results');

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            await performSearch(e.target.value);
        }, 300);
    });

    searchBtn.addEventListener('click', async () => {
        await performSearch(searchInput.value);
    });

    searchInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            await performSearch(searchInput.value);
        }
    });



    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchBtn.contains(e.target) && !searchResults.contains(e.target)) {
            hideSearchResults();
        }
    });

    await loadAllMethodsForSearch();

    console.log('🔄 Search data loaded and ready');


});

function updateSearchData(stages) {
    allStages = stages || [];
    console.log('🔍 Updated stages for search:', allStages.length);

    loadAllMethodsForSearch();


}

function getMethodStageColor(stageId) {
    const stage = allStages.find(s => s.stage_id == stageId);
    return stage ? (stage.color_code || '#3b82f6') : '#3b82f6';
}

function getCleanMatchedFields(fields) {
    return fields.map(field => {
        switch (field) {
            case 'Long Description':
                return 'Description';
            case 'Short Description':
                return 'Summary';
            case 'Stage Description':
                return 'Description';
            case 'Section Title':
                return 'Title';
            case 'Section Content':
                return 'Content';
            default:
                return field;
        }
    }).join(', ');
}

async function getMethodModes(methodId) {
    try {
        const response = await axios.get(`http://localhost/lorem%20ipsum/api/admin_methods.php?method_id=${methodId}`);
        const method = response.data;

        if (method && method.modes && Array.isArray(method.modes)) {
            return method.modes;
        }

        return [];
    } catch (error) {
        console.error('Error getting method modes:', error);
        return [];
    }
}

async function searchSections(searchTerm, results) {
    try {
        const response = await axios.get('http://localhost/lorem%20ipsum/api/admin_sections.php');
        const sections = response.data || [];

        sections.forEach(section => {
            let score = 0;
            let matchedFields = [];

            if (section.title && section.title.toLowerCase().includes(searchTerm)) {
                score += 7;
                matchedFields.push('Section Title');
            }

            if (section.description && section.description.toLowerCase().includes(searchTerm)) {
                score += 4;
                matchedFields.push('Section Content');
            }

            if (score > 0) {
                results.push({
                    type: 'section',
                    data: section,
                    score: score,
                    matchedFields: matchedFields
                });
            }
        });
    } catch (error) {
        console.error('Error searching sections:', error);
    }
}

function initMobileSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (!sidebarToggle || !sidebar || !sidebarOverlay) return;

    function showSidebar() {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function hideSidebar() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function toggleSidebar() {
        if (sidebar.classList.contains('open')) {
            hideSidebar();
        } else {
            showSidebar();
        }
    }

    sidebarToggle.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', hideSidebar);

    function checkMobile() {
        if (window.innerWidth <= 768) {
            sidebarToggle.style.display = 'block';
        } else {
            sidebarToggle.style.display = 'none';
            hideSidebar();
        }
    }

    checkMobile();
    window.addEventListener('resize', checkMobile);
}

let bookletInitialized = false;
let currentPage = 1;
let preventAutoReset = false;
let hasSections = false;

function initBookletPages() {
    if (bookletInitialized) return;

    const page1 = document.getElementById('page-1');
    const page2 = document.getElementById('page-2');
    const booklet = document.getElementById('booklet');

    function isMobile() {
        return window.innerWidth <= 768;
    }

    function showPage(pageNumber) {
        const pageNumberEl = document.getElementById('page-number');

        if (isMobile()) {
            if (pageNumber === 1) {
                page1.style.display = 'block';
                page2.style.display = 'none';
            } else if (pageNumber === 2) {
                page1.style.display = 'none';
                page2.style.display = 'block';
            }
            currentPage = pageNumber;

            if (pageNumberEl) {
                pageNumberEl.textContent = pageNumber;
            }
        } else {
            const pagesContainer = document.querySelector('.booklet .pages');
            page1.style.display = 'block';
            page2.style.display = 'block';
            if (hasSections) {
                if (pagesContainer) {
                    pagesContainer.classList.remove('single-page');
                }
            } else {
                if (pagesContainer) {
                    pagesContainer.classList.add('single-page');
                }
            }
        }
    }


    function flipPage() {
        if (isMobile()) {
            preventAutoReset = true;
            if (currentPage === 1) {
                if (hasSections) {
                    showPage(2);
                }
            } else {
                showPage(1);
            }
        }
    }

    if (booklet) {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        let lastTapTime = 0;

        booklet.addEventListener('click', function (e) {
            if (e.target.closest('.booklet-exit-left') || e.target.closest('.booklet-exit-right')) {
                return;
            }
            if (isMobile()) {
                const now = Date.now();
                if (now - lastTapTime > 500) {
                    lastTapTime = now;
                    flipPage();
                }
            }
        });

        booklet.addEventListener('touchstart', function (e) {
            if (e.target.closest('.booklet-exit-left') || e.target.closest('.booklet-exit-right')) {
                return;
            }

            if (isMobile()) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }
        });

        booklet.addEventListener('touchend', function (e) {
            if (e.target.closest('.booklet-exit-left') || e.target.closest('.booklet-exit-right')) {
                return;
            }

            if (isMobile()) {
                touchEndX = e.changedTouches[0].clientX;
                touchEndY = e.changedTouches[0].clientY;

                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;
                const minSwipeDistance = 80;
                const maxVerticalDistance = 100;

                if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaY) < maxVerticalDistance) {
                    closeModal();
                } else if (Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) {
                    const now = Date.now();
                    if (now - lastTapTime > 500) {
                        lastTapTime = now;
                        flipPage();
                    }
                }
            }
        });
    }

    showPage(1);
    bookletInitialized = true;
}

function resetBookletToPage1() {
    if (preventAutoReset) {
        return;
    }

    const page1 = document.getElementById('page-1');
    const page2 = document.getElementById('page-2');
    const pageNumberEl = document.getElementById('page-number');
    if (page1 && page2) {
        if (window.innerWidth <= 768) {
            page1.style.display = 'block';
            page2.style.display = 'none';
            currentPage = 1;
            if (pageNumberEl) {
                pageNumberEl.textContent = '1';
            }
        } else {
            const pagesContainer = document.querySelector('.booklet .pages');
            page1.style.display = 'block';
            page2.style.display = 'block';
            if (hasSections) {
                if (pagesContainer) {
                    pagesContainer.classList.remove('single-page');
                }
            } else {
                if (pagesContainer) {
                    pagesContainer.classList.add('single-page');
                }
            }
        }
    }
}

function initMobileSwipeBack() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', function (e) {
        if (window.innerWidth <= 768) {
            const modal = document.getElementById('method-modal');
            if (modal && modal.classList.contains('open')) {
                const booklet = document.getElementById('booklet');
                if (!booklet.contains(e.target)) {
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                }
            }
        }
    });

    document.addEventListener('touchend', function (e) {
        if (window.innerWidth <= 768) {
            const modal = document.getElementById('method-modal');
            if (modal && modal.classList.contains('open')) {
                const booklet = document.getElementById('booklet');
                if (!booklet.contains(e.target)) {
                    touchEndX = e.changedTouches[0].clientX;
                    touchEndY = e.changedTouches[0].clientY;

                    const deltaX = touchEndX - touchStartX;
                    const deltaY = touchEndY - touchStartY;
                    const minSwipeDistance = 100;
                    const maxVerticalDistance = 150;

                    if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaY) < maxVerticalDistance) {
                        closeModal();
                    }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    initMobileSidebar();
    initBookletPages();
    initMobileSwipeBack();

    window.addEventListener('resize', function () {
        if (bookletInitialized) {
            const page1 = document.getElementById('page-1');
            const page2 = document.getElementById('page-2');
            if (page1 && page2) {
                if (window.innerWidth <= 768) {
                    if (currentPage === 1) {
                        page1.style.display = 'block';
                        page2.style.display = 'none';
                    } else {
                        page1.style.display = 'none';
                        page2.style.display = 'block';
                    }
                } else {
                    const pagesContainer = document.querySelector('.booklet .pages');
                    page1.style.display = 'block';
                    page2.style.display = 'block';
                    if (hasSections) {
                        if (pagesContainer) {
                            pagesContainer.classList.remove('single-page');
                        }
                    } else {
                        if (pagesContainer) {
                            pagesContainer.classList.add('single-page');
                        }
                    }
                }
            }
        }
    });
});
