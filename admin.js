
/* 
==========================================
DESIGN THINKING BOOKLET - ADMIN JAVASCRIPT
==========================================

This file contains all the JavaScript functionality for the admin panel.
It handles content management, CRUD operations, and admin-specific features.

KEY ADMIN FUNCTIONALITIES:
- Stage Management: Create, edit, delete design thinking stages
- Method Management: Add, edit, delete methods with drag & drop reordering
- Section Management: Create hierarchical sections for methods
- Image Upload: Handle method images with preview functionality
- Color Management: Set and manage stage colors
- Undo System: 24-hour undo for deleted stages
- Auto-save: Automatic saving of changes

DRAG & DROP FEATURES:
- handleMethodDragStart(): Initiates drag operation
- handleMethodDragOver(): Handles drag over events
- handleMethodDrop(): Processes drop events and reorders methods
- updateMethodPositions(): Updates database with new positions

TEACHER NOTE: This file manages all the content that appears in the booklet.
Changes made here are immediately reflected in the main application.
*/

// Global Variables for Admin State Management
let currentStageId = null;
let currentMethodId = null;
let currentStageColor = null;

// Color Management for Dashboard
const DASHBOARD_COLORS = {};


function getStageColor(stageName, dbColor) {
    if (stageName && DASHBOARD_COLORS[stageName]) {
        return DASHBOARD_COLORS[stageName];
    }
    return dbColor || '#3b82f6';
}

function showSaveConfirmation(message) {
    const confirmation = document.createElement('div');
    confirmation.className = 'save-confirmation';
    confirmation.textContent = message;
    document.body.appendChild(confirmation);

    setTimeout(() => confirmation.classList.add('show'), 100);

    setTimeout(() => {
        confirmation.classList.remove('show');
        setTimeout(() => document.body.removeChild(confirmation), 300);
    }, 3000);
}


async function loadStages() {
    try {
        const res = await axios.get('api/admin_stages.php');
        const list = document.getElementById('stage-list');
        list.innerHTML = '';

        const sortedStages = res.data.sort((a, b) => (a.position || a.stage_id) - (b.position || b.stage_id));

        sortedStages.forEach((s, index) => {
            const b = document.createElement('button');
            b.className = 'stage-button';
            b.draggable = true;
            b.dataset.stageId = s.stage_id;
            b.dataset.position = index;
            b.textContent = `${s.stage_id}. ${s.name}`;

            const stageColor = getStageColor(s.name, s.color_code);
            b.style.borderLeftColor = stageColor;
            b.style.borderLeftWidth = '4px';
            b.style.borderLeftStyle = 'solid';

            b.addEventListener('dragstart', handleDragStart);
            b.addEventListener('dragover', handleDragOver);
            b.addEventListener('drop', handleDrop);
            b.addEventListener('dragend', handleDragEnd);

            b.onclick = () => selectStage(s);
            list.appendChild(b);
        });

        list.addEventListener('dragover', handleDragOver);
        list.addEventListener('drop', handleDrop);

    } catch (error) {
        console.error('Error loading stages:', error);
        const list = document.getElementById('stage-list');
        list.innerHTML = `<div style="color: red; padding: 1rem; text-align: center;">
      ❌ Error loading stages: ${error.response?.data?.error || error.message}<br>
      <small>Check if XAMPP MySQL is running and database exists</small>
    </div>`;
    }
}

function selectStage(s) {
    document.querySelectorAll('#stage-list button').forEach(btn => btn.classList.remove('selected'));
    document.querySelectorAll('#method-list button').forEach(btn => btn.classList.remove('selected'));

    currentStageId = s.stage_id;
    currentMethodId = null;

    currentStageColor = getStageColor(s.name, s.color_code);

    event.target.classList.add('selected');

    updateStageContext(s.name, currentStageColor);

    document.getElementById('stage-id').value = s.stage_id;
    document.getElementById('stage-name').value = s.name || '';
    document.getElementById('stage-desc').value = s.description || '';

    clearMethodForm();
    clearSectionForm();
    document.getElementById('method-list').innerHTML = '';
    document.getElementById('section-list').innerHTML = '';
    loadMethodsForStage();

    autoCheckStageMode();
}

function updateStageContext(stageName, color) {
    const contextEl = document.getElementById('stage-context');
    if (contextEl) {
        contextEl.textContent = `Current Stage: ${stageName}`;
        contextEl.style.setProperty('--stage-color', color);
    }
}

async function saveStage() {
    const id = document.getElementById('stage-id').value;
    const name = document.getElementById('stage-name').value;
    const finalColor = getStageColor(name, '');

    const payload = {
        name: name,
        description: document.getElementById('stage-desc').value,
        color_code: finalColor
    };

    if (id) { payload.stage_id = parseInt(id); await axios.put('api/admin_stages.php', payload); }
    else { await axios.post('api/admin_stages.php', payload); }
    await loadStages();

    await loadModeColors();

    showSaveConfirmation('Stage saved successfully!');

    if (currentStageId && id) {
        currentStageColor = finalColor;
        updateStageContext(name, finalColor);
    }
}

async function newStage() {
    currentStageId = null;
    currentMethodId = null;
    document.getElementById('stage-id').value = '';
    document.getElementById('stage-name').value = '';
    document.getElementById('stage-desc').value = '';

    document.getElementById('method-list').innerHTML = '';
    document.getElementById('section-list').innerHTML = '';

    updateStageContext('None', '#e5e7eb');
    updateMethodContext('None');

    document.querySelectorAll('#stage-list button').forEach(btn => btn.classList.remove('selected'));
    document.querySelectorAll('#method-list button').forEach(btn => btn.classList.remove('selected'));
}

async function deleteStage() {
    const id = document.getElementById('stage-id').value;
    if (!id) return;

    const stageName = document.getElementById('stage-name').value;
    const stageDesc = document.getElementById('stage-desc').value;
    const deletedStage = { id, name: stageName, description: stageDesc };

    const deletedStageWithTime = {
        ...deletedStage,
        deletedAt: Date.now() // Store current timestamp
    };
    localStorage.setItem('deletedStages', JSON.stringify([deletedStageWithTime]));

    await axios.delete('api/admin_stages.php?stage_id=' + id);
    await newStage();
    await loadStages();

    await loadModeColors();

    showSaveConfirmation('Stage deleted successfully!');

    showUndoButton();
}


let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();

    if (draggedElement === this) return;

    const list = document.getElementById('stage-list');
    const allButtons = Array.from(list.querySelectorAll('.stage-button'));
    const draggedIndex = allButtons.indexOf(draggedElement);
    const droppedIndex = allButtons.indexOf(this);

    if (draggedIndex === -1 || droppedIndex === -1) return;

    if (draggedIndex < droppedIndex) {
        this.parentNode.insertBefore(draggedElement, this.nextSibling);
    } else {
        this.parentNode.insertBefore(draggedElement, this);
    }

    updateStagePositions();
}

function handleDragEnd(e) {
    this.style.opacity = '1';
    draggedElement = null;
}

async function updateStagePositions() {
    const list = document.getElementById('stage-list');
    const allButtons = Array.from(list.querySelectorAll('.stage-button'));

    try {
        for (let i = 0; i < allButtons.length; i++) {
            const button = allButtons[i];
            const stageId = button.dataset.stageId;
            const newPosition = i;

            await axios.put('api/admin_stages.php', {
                stage_id: parseInt(stageId),
                position: newPosition
            });
        }

        showSaveConfirmation('Stage order updated successfully!');

        await loadStages();

        await loadModeColors();

    } catch (error) {
        console.error('Error updating stage positions:', error);
        alert('Error updating stage order: ' + error.message);
    }
}


async function loadMethodsForStage() {
    const stageIdAtRequest = currentStageId;
    if (!stageIdAtRequest) { document.getElementById('method-list').innerHTML = ''; return; }
    try {
        const res = await axios.get('api/admin_methods.php?stage_id=' + stageIdAtRequest);

        const list = document.getElementById('method-list');
        list.innerHTML = '';

        const dragHint = document.createElement('div');
        dragHint.className = 'drag-hint';
        dragHint.textContent = '💡 Drag methods to reorder them';
        list.appendChild(dragHint);

        if (stageIdAtRequest !== currentStageId) return; // stale response guard

        res.data.forEach((m, index) => {
            const b = document.createElement('button');
            b.textContent = `${m.method_id}. ${m.title}`;
            b.setAttribute('data-method-id', m.method_id);
            b.setAttribute('data-position', m.position || index);
            b.setAttribute('draggable', 'true');
            b.className = 'method-button';
            b.onclick = () => selectMethod(m);

            b.addEventListener('dragstart', handleMethodDragStart);
            b.addEventListener('dragover', handleMethodDragOver);
            b.addEventListener('drop', handleMethodDrop);
            b.addEventListener('dragend', handleMethodDragEnd);

            list.appendChild(b);
        });
    } catch (error) {
        console.error('Error loading methods:', error);
        const list = document.getElementById('method-list');
        list.innerHTML = `<div style="color: red; padding: 1rem; text-align: center;">
      ❌ Error loading methods: ${error.response?.data?.error || error.message}
    </div>`;
    }
}

function selectMethod(m) {
    document.querySelectorAll('#method-list button').forEach(btn => btn.classList.remove('selected'));

    currentMethodId = m.method_id;

    event.target.classList.add('selected');

    updateMethodContext(m.title);

    updateSectionsMethodContext(m.title);

    clearMethodForm();

    document.getElementById('method-id').value = m.method_id;
    document.getElementById('method-title').value = m.title || '';
    document.getElementById('method-short').value = m.short_desc || '';
    document.getElementById('method-long').value = m.long_desc || '';
    document.getElementById('method-resources').value = m.resources || '';

    loadMethodImage(m.method_id);

    loadMethodModes(m.method_id);

    autoCheckStageMode();

    clearSectionForm();
    loadSections();
}

function updateMethodContext(methodTitle) {
    const contextEl = document.getElementById('method-context');
    if (contextEl) {
        contextEl.textContent = `Current Method: ${methodTitle}`;
        contextEl.style.setProperty('--method-color', currentStageColor);
    }
}

function updateSectionsMethodContext(methodTitle) {
    const contextEl = document.getElementById('current-method-name');
    if (contextEl) {
        contextEl.textContent = methodTitle || 'None selected';
    }
}

async function saveMethod() {
    const selectedModes = [];
    document.querySelectorAll('.mode-checkbox input[type="checkbox"]:checked').forEach(cb => {
        selectedModes.push(cb.value);
    });

    let imageUrl = '';
    const imageFile = document.getElementById('method-image').files[0];
    if (imageFile) {
        console.log('🖼️ Processing image for save...');
        console.log('🖼️ File size:', imageFile.size, 'bytes');

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (imageFile.size > maxSize) {
            alert('Image file is too large. Please select an image smaller than 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            imageUrl = e.target.result;
            console.log('🖼️ Image converted to base64, length:', imageUrl.length);
        };

        reader.onerror = function () {
            console.error('❌ Error reading image file');
            alert('Error processing the image file. Please try again.');
        };

        reader.readAsDataURL(imageFile);

        await new Promise((resolve, reject) => {
            reader.onloadend = resolve;
            reader.onerror = reject;
        });
    }

    const payload = {
        method_id: parseInt(document.getElementById('method-id').value || 0),
        title: document.getElementById('method-title').value,
        short_desc: document.getElementById('method-short').value,
        long_desc: document.getElementById('method-long').value,
        resources: document.getElementById('method-resources').value,
        image_url: imageUrl,
        stage_id: currentStageId,
        modes: selectedModes
    };

    try {
        if (payload.method_id) {
            await axios.put('api/admin_methods.php', payload);
        } else {
            const r = await axios.post('api/admin_methods.php', payload);
            document.getElementById('method-id').value = r.data.method_id;
            currentMethodId = r.data.method_id;
        }

        await loadMethodsForStage();

        showSaveConfirmation('Method saved successfully!');

        if (currentMethodId) {
            await loadMethodModes(currentMethodId);
        }

    } catch (error) {
        console.error('Error saving method:', error);
        alert('Error saving method: ' + (error.response?.data?.error || error.message));
    }
}

function clearMethodForm() {
    document.getElementById('method-id').value = '';
    document.getElementById('method-title').value = '';
    document.getElementById('method-short').value = '';
    document.getElementById('method-long').value = '';
    document.getElementById('method-resources').value = '';

    document.getElementById('method-image').value = '';
    document.getElementById('current-image-preview').style.display = 'none';
    document.getElementById('image-preview').src = '';

    document.querySelectorAll('.mode-checkbox input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
}

async function newMethod() {
    currentMethodId = null;
    clearMethodForm();
    document.getElementById('section-list').innerHTML = '';
    clearSectionForm();
    updateMethodContext('None');

    document.querySelectorAll('#method-list button').forEach(btn => btn.classList.remove('selected'));

    const selectedStageBtn = document.querySelector('#stage-list button.selected');
    if (selectedStageBtn) {
        const currentStageName = selectedStageBtn.textContent.split('. ')[1]; // Extract name after "1. "
        console.log('Auto-checking mode for stage:', currentStageName);

        if (currentStageName) {
            const modeCheckbox = document.getElementById('mode-' + currentStageName.toLowerCase());

            if (modeCheckbox) {
                document.querySelectorAll('.mode-checkbox input[type="checkbox"]').forEach(cb => {
                    cb.checked = false;
                });

                modeCheckbox.checked = true;
                console.log('✅ Auto-checked mode:', currentStageName);
            }
        }
    }
}

async function deleteMethod() {
    const id = document.getElementById('method-id').value;
    if (!id) return;
    await axios.delete('api/admin_methods.php?method_id=' + id);
    await newMethod();
    await loadMethodsForStage();
    showSaveConfirmation('Method deleted successfully!');
}


let draggedMethod = null;

function handleMethodDragStart(e) {
    draggedMethod = e.target;
    e.target.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
}

function handleMethodDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleMethodDrop(e) {
    e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();

    if (draggedMethod !== e.target) {
        const methodList = document.getElementById('method-list');
        const draggedElement = draggedMethod;
        const targetElement = e.target;

        const methodButtons = Array.from(methodList.querySelectorAll('.method-button'));
        const draggedIndex = methodButtons.indexOf(draggedElement);
        const targetIndex = methodButtons.indexOf(targetElement);

        if (draggedIndex !== -1 && targetIndex !== -1) {
            methodList.removeChild(draggedElement);

            if (draggedIndex < targetIndex) {
                methodList.insertBefore(draggedElement, methodButtons[targetIndex + 1]);
            } else {
                methodList.insertBefore(draggedElement, methodButtons[targetIndex]);
            }
        }
    }

    return false;
}

function handleMethodDragEnd(e) {
    e.target.style.opacity = '';

    updateMethodPositions();
}

async function updateMethodPositions() {
    const methodList = document.getElementById('method-list');
    const methodButtons = Array.from(methodList.querySelectorAll('.method-button'));

    try {
        for (let i = 0; i < methodButtons.length; i++) {
            const button = methodButtons[i];
            const methodId = button.getAttribute('data-method-id');
            const newPosition = i;

            await axios.put('api/admin_methods.php', {
                method_id: parseInt(methodId),
                position: newPosition
            });
        }

        showSaveConfirmation('Method order updated successfully!');

    } catch (error) {
        console.error('Error updating method positions:', error);
        showSaveConfirmation('Error updating method order. Please try again.', 'error');
    }
}


async function loadSections() {
    const list = document.getElementById('section-list'); list.innerHTML = '';
    const methodIdAtRequest = currentMethodId;
    if (!methodIdAtRequest) return;
    try {
        const res = await axios.get('api/admin_sections.php?method_id=' + methodIdAtRequest);
        if (methodIdAtRequest !== currentMethodId) return; // stale response guard
        res.data.forEach(s => {
            const b = document.createElement('button');
            const label = s.parent_section_id ? `↳ ${s.title}` : `${s.section_id}. ${s.title}`;
            b.textContent = label; b.onclick = () => selectSection(s); list.appendChild(b);
        });
    } catch (error) {
        console.error('Error loading sections:', error);
        const list = document.getElementById('section-list');
        list.innerHTML = `<div style="color: red; padding: 1rem; text-align: center;">
      ❌ Error loading sections: ${error.response?.data?.error || error.message}
    </div>`;
    }
}

function selectSection(s) {
    clearSectionForm();
    document.getElementById('section-id').value = s.section_id;
    document.getElementById('section-title').value = s.title || '';
    document.getElementById('section-desc').value = s.description || '';
    document.getElementById('section-parent').value = s.parent_section_id || '';
}

async function saveSection() {
    const payload = {
        section_id: parseInt(document.getElementById('section-id').value || 0),
        method_id: currentMethodId,
        title: document.getElementById('section-title').value,
        description: document.getElementById('section-desc').value,
        parent_section_id: document.getElementById('section-parent').value || null
    };
    if (!payload.method_id) { alert('Select a method first'); return; }
    if (payload.section_id) { await axios.put('api/admin_sections.php', payload); } else { const r = await axios.post('api/admin_sections.php', payload); document.getElementById('section-id').value = r.data.section_id; }
    await loadSections();

    showSaveConfirmation('Section saved successfully!');

    if (currentMethodId) {
        await loadMethodsForStage();
        const currentMethod = document.querySelector('#method-list button.selected');
        if (currentMethod) {
            const methodId = currentMethod.getAttribute('data-method-id');
            if (methodId) {
                await selectMethod(parseInt(methodId));
            }
        }
    }

    clearSectionForm();
}

function clearSectionForm() {
    document.getElementById('section-id').value = '';
    document.getElementById('section-title').value = '';
    document.getElementById('section-desc').value = '';
    document.getElementById('section-parent').value = '';
}

async function newSection() { clearSectionForm(); }

async function deleteSection() {
    const id = document.getElementById('section-id').value;
    if (!id) return;
    await axios.delete('api/admin_sections.php?section_id=' + id);
    await newSection();
    await loadSections();
    showSaveConfirmation('Section deleted successfully!');
}


async function loadModeColors() {
    try {
        console.log('🔄 Starting loadModeColors...');

        const stagesRes = await axios.get('api/admin_stages.php');
        const stages = stagesRes.data;

        console.log('📋 Current stages from database:', stages);

        if (!stages || stages.length === 0) {
            console.log('⚠️ No stages found, cannot load mode colors');
            const modeList = document.getElementById('mode-color-list');
            if (modeList) {
                modeList.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 1rem;">No stages available to customize colors</p>';
            }
            return;
        }

        const modesFromStages = stages.map(stage => ({
            name: stage.name.toUpperCase(),
            color_code: stage.color_code || getStageColor(stage.name, '#3b82f6'),
            description: stage.description || `Mode for ${stage.name} stage`
        }));

        console.log('🎨 Modes created from stages:', modesFromStages);

        Object.keys(DASHBOARD_COLORS).forEach(key => delete DASHBOARD_COLORS[key]);
        modesFromStages.forEach(mode => {
            DASHBOARD_COLORS[mode.name] = mode.color_code;
        });

        const modeList = document.getElementById('mode-color-list');
        if (!modeList) {
            console.error('❌ mode-color-list element not found!');
            return;
        }

        console.log('✅ Found mode-color-list element, populating...');

        modeList.innerHTML = '';

        modesFromStages.forEach(mode => {
            const modeDiv = document.createElement('div');
            modeDiv.className = 'mode-color-item';
            modeDiv.style.cssText = 'border: 2px solid #e5e7eb; padding: 1rem; margin: 0.5rem 0; background: white;'; // Subtle styling
            modeDiv.innerHTML = `
        <div class="mode-color-display">
          <span class="mode-name" style="font-weight: bold; color: black;">${mode.name}</span>
          <div class="color-picker-wrapper">
            <div class="color-indicator" style="background: ${mode.color_code}; width: 32px; height: 32px; border-radius: 6px; border: 2px solid #e5e7eb; cursor: pointer; display: inline-block;" onclick="openColorPicker('${mode.name}')"></div>
            <input type="color" class="color-input" value="${mode.color_code}" onchange="updateStageColor('${mode.name}', this.value)" />
          </div>
        </div>
      `;
            modeList.appendChild(modeDiv);
            console.log('✅ Added mode color item for:', mode.name, 'with color:', mode.color_code);
        });

        populateModeCheckboxes(modesFromStages);

        console.log('✅ Mode colors loaded successfully:', DASHBOARD_COLORS);
        console.log('✅ Mode color list populated with', modesFromStages.length, 'items');

    } catch (error) {
        console.error('Error loading mode colors:', error);
        const modeList = document.getElementById('mode-color-list');
        if (modeList) {
            modeList.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 1rem;">Error loading mode colors: ' + error.message + '</p>';
        }
    }
}

function populateModeCheckboxes(modes) {
    const container = document.getElementById('dynamic-mode-checkboxes');
    if (!container) return;

    container.innerHTML = '';

    modes.forEach(mode => {
        const label = document.createElement('label');
        label.className = 'mode-checkbox';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `mode-${mode.name.toLowerCase()}`;
        checkbox.value = mode.name;

        const colorSpan = document.createElement('span');
        colorSpan.className = 'mode-color';
        colorSpan.style.background = mode.color_code;

        const textSpan = document.createElement('span');
        textSpan.textContent = mode.name;

        label.appendChild(checkbox);
        label.appendChild(colorSpan);
        label.appendChild(textSpan);

        container.appendChild(label);
    });

    console.log('✅ Dynamic mode checkboxes populated:', modes.length, 'modes');
}

async function loadMethodModes(methodId) {
    try {
        const res = await axios.get('api/admin_methods.php?method_id=' + methodId);
        const method = res.data;

        document.querySelectorAll('.mode-checkbox input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });

        if (method.modes) {
            method.modes.forEach(mode => {
                const checkbox = document.getElementById('mode-' + mode.toLowerCase());
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
    } catch (error) {
        console.error('Error loading method modes:', error);
    }
}

function autoCheckStageMode() {
    if (!currentStageId) return;

    const selectedStageBtn = document.querySelector('#stage-list button.selected');
    if (!selectedStageBtn) return;

    const currentStageName = selectedStageBtn.textContent.split('. ')[1]; // Extract name after "1. "
    console.log('Current stage name:', currentStageName); // Debug

    if (currentStageName) {
        const modeCheckbox = document.getElementById('mode-' + currentStageName.toLowerCase());
        console.log('Mode checkbox found:', modeCheckbox); // Debug

        if (modeCheckbox) {
            document.querySelectorAll('.mode-checkbox input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });

            modeCheckbox.checked = true;
            console.log('Auto-checked mode:', currentStageName); // Debug
        }
    }
}

function openColorPicker(stageName) {
    const colorInput = document.querySelector(`input[onchange*="${stageName}"]`);
    if (colorInput) {
        colorInput.click();
    }
}

async function updateStageColor(stageName, newColor) {
    try {
        const stagesRes = await axios.get('api/admin_stages.php');
        const stages = stagesRes.data;
        const stage = stages.find(s => s.name.toUpperCase() === stageName);

        if (stage) {
            await axios.put('api/admin_stages.php', {
                stage_id: stage.stage_id,
                color_code: newColor
            });

            showSaveConfirmation('Stage color updated!');

            DASHBOARD_COLORS[stageName] = newColor;

            await loadStages();
            await loadModeColors();

            if (currentStageId === stage.stage_id) {
                updateStageContext(stage.name, newColor);
            }

            console.log('🎨 Color updated for', stageName, 'to', newColor);
        }
    } catch (error) {
        console.error('Error updating stage color:', error);
        alert('Error updating stage color: ' + error.message);
    }
}


function previewImage(event) {
    const file = event.target.files[0];
    console.log('🖼️ File selected:', file ? file.name : 'No file');

    if (file) {
        console.log('🖼️ File size:', file.size, 'bytes');
        console.log('🖼️ File type:', file.type);

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert('Image file is too large. Please select an image smaller than 5MB.');
            event.target.value = ''; // Clear the file input
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            event.target.value = ''; // Clear the file input
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            console.log('🖼️ File read successfully, setting preview...');
            console.log('🖼️ Base64 data length:', e.target.result.length);
            console.log('🖼️ Base64 starts with:', e.target.result.substring(0, 50));

            const imagePreview = document.getElementById('image-preview');
            const imageContainer = document.getElementById('current-image-preview');

            if (imagePreview && imageContainer) {
                imagePreview.src = e.target.result;
                imageContainer.style.display = 'block';
                console.log('🖼️ Image preview set successfully');

                imagePreview.onerror = function () {
                    console.log('🖼️ Image preview failed to load, hiding silently');
                    const imageContainer = document.getElementById('current-image-preview');
                    if (imageContainer) {
                        imageContainer.style.display = 'none';
                    }
                };

                imagePreview.onload = function () {
                    console.log('✅ Image preview loaded successfully');
                    console.log('✅ Image dimensions:', imagePreview.naturalWidth, 'x', imagePreview.naturalHeight);
                };
            }
        };

        reader.onerror = function () {
            console.error('❌ Error reading file');
            alert('Error reading the image file.');
        };

        reader.readAsDataURL(file);
    } else {
        console.log('🖼️ No file selected, hiding preview');
        const imageContainer = document.getElementById('current-image-preview');
        if (imageContainer) {
            imageContainer.style.display = 'none';
        }
    }
}

function removeImage() {
    console.log('🖼️ Removing image...');
    document.getElementById('method-image').value = '';
    document.getElementById('current-image-preview').style.display = 'none';
    document.getElementById('image-preview').src = '';
    console.log('🖼️ Image removed successfully');
}

function loadMethodImage(methodId) {
    if (methodId) {
        console.log('🖼️ Loading image for method ID:', methodId);
        fetch(`api/admin_methods.php?method_id=${methodId}`)
            .then(response => response.json())
            .then(method => {
                console.log('🖼️ Method data received:', method);
                console.log('🖼️ Image URL exists:', !!method.image_url);
                console.log('🖼️ Image URL length:', method.image_url ? method.image_url.length : 0);

                if (method.image_url && method.image_url.trim() !== '' && method.image_url.trim().startsWith('data:image/') && method.image_url.trim().length > 100) {
                    console.log('🖼️ Valid image data found, setting preview...');
                    const imagePreview = document.getElementById('image-preview');
                    const imageContainer = document.getElementById('current-image-preview');

                    if (imagePreview && imageContainer) {
                        console.log('🖼️ Setting image source from database...');
                        console.log('🖼️ Image URL length:', method.image_url.length);
                        console.log('🖼️ Image URL starts with:', method.image_url.substring(0, 50));

                        let cleanImageUrl = method.image_url.trim();

                        imagePreview.src = cleanImageUrl;
                        imageContainer.style.display = 'block';
                        console.log('🖼️ Image preview container displayed');

                        imagePreview.onload = function () {
                            console.log('✅ Image from database loaded successfully');
                            console.log('✅ Image dimensions:', imagePreview.naturalWidth, 'x', imagePreview.naturalHeight);
                        };

                        imagePreview.onerror = function () {
                            console.log('🖼️ Image failed to load, hiding preview silently');
                            const imageContainer = document.getElementById('current-image-preview');
                            if (imageContainer) {
                                imageContainer.style.display = 'none';
                            }
                        };
                    } else {
                        console.log('🖼️ Image preview elements not found');
                    }
                } else {
                    console.log('🖼️ No valid image data found, hiding preview');
                    const imageContainer = document.getElementById('current-image-preview');
                    if (imageContainer) {
                        imageContainer.style.display = 'none';
                    }
                }
            })
            .catch(error => console.log('🖼️ Error loading method data:', error.message));
    } else {
        console.log('🖼️ No method ID, hiding preview');
        const imageContainer = document.getElementById('current-image-preview');
        if (imageContainer) {
            imageContainer.style.display = 'none';
        }
    }
}


function cleanupExpiredUndoData() {
    const deletedStages = localStorage.getItem('deletedStages');
    if (!deletedStages) return;

    try {
        const stages = JSON.parse(deletedStages);
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        const validStages = stages.filter(stage => {
            if (!stage.deletedAt) return false; // Remove stages without timestamp
            return (now - stage.deletedAt) < twentyFourHours;
        });

        if (validStages.length !== stages.length) {
            if (validStages.length === 0) {
                localStorage.removeItem('deletedStages');
            } else {
                localStorage.setItem('deletedStages', JSON.stringify(validStages));
            }
        }
    } catch (error) {
        console.error('Error cleaning up expired undo data:', error);
        localStorage.removeItem('deletedStages');
    }
}

function showUndoButton() {
    const undoBtn = document.getElementById('undo-stages-btn');

    cleanupExpiredUndoData();

    const deletedStages = localStorage.getItem('deletedStages');
    if (deletedStages && JSON.parse(deletedStages).length > 0) {
        undoBtn.style.display = 'inline-flex';

        updateUndoTimeRemaining();
    } else {
        undoBtn.style.display = 'none';
    }
}

function updateUndoTimeRemaining() {
    const deletedStages = localStorage.getItem('deletedStages');
    if (!deletedStages) return;

    try {
        const stages = JSON.parse(deletedStages);
        if (stages.length === 0) return;

        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        const oldestStage = stages.reduce((oldest, stage) => {
            if (!stage.deletedAt) return oldest;
            return (!oldest || stage.deletedAt < oldest.deletedAt) ? stage : oldest;
        }, null);

        if (oldestStage && oldestStage.deletedAt) {
            const timeElapsed = now - oldestStage.deletedAt;
            const timeRemaining = twentyFourHours - timeElapsed;

            if (timeRemaining > 0) {
                const hoursRemaining = Math.ceil(timeRemaining / (60 * 60 * 1000));
                const undoBtn = document.getElementById('undo-stages-btn');
                undoBtn.innerHTML = `
          <span class="undo-icon">↶</span>
          Undo Deleted Stages (${hoursRemaining}h left)
        `;
            }
        }
    } catch (error) {
        console.error('Error updating undo time remaining:', error);
    }
}

async function undoDeletedStages() {
    try {
        const undoBtn = document.getElementById('undo-stages-btn');
        const deletedStages = JSON.parse(localStorage.getItem('deletedStages') || '[]');
        if (deletedStages.length === 0) return;

        for (const stage of deletedStages) {
            await axios.post('api/admin_stages.php', {
                name: stage.name,
                description: stage.description
            });
        }

        localStorage.removeItem('deletedStages');

        undoBtn.style.display = 'none';

        await loadStages();

        await loadModeColors();

        showSaveConfirmation('Stages restored successfully!');
    } catch (error) {
        console.error('Error restoring stages:', error);
        alert('Error restoring stages: ' + error.message);
    }
}


window.addEventListener('DOMContentLoaded', async () => {
    await loadStages();
    await loadModeColors();

    updateStageContext('None', '#e5e7eb');
    updateMethodContext('None');

    document.getElementById('method-image').addEventListener('change', previewImage);

    showUndoButton();

    setInterval(cleanupExpiredUndoData, 60 * 60 * 1000); // 1 hour

    setInterval(updateUndoTimeRemaining, 5 * 60 * 1000); // 5 minutes
});
