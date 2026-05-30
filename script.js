const listBox = document.getElementById('list');
const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');
const task = document.getElementById('task');
const addBtn = document.querySelector('.add');
const wrong = document.getElementById('wrong');
const allSelect = document.getElementById('allSelect');
const allSelectedContainer = document.querySelector('.allSelected');
const deleteSelectedBtn = document.getElementById('deleteSelected');
const emptyState = document.getElementById('emptyState');
const undoStack = [];
const redoStack = [];
let nextTaskId = 1;
let activeTaskId = null;
const STORAGE_KEY = 'undoRedoTasks';

function generateTaskId() {
    return `task-${nextTaskId++}`;
}

function getBoxByTaskId(taskId) {
    return listBox.querySelector(`.box[data-task-id="${taskId}"]`);
}

function insertBoxAtIndex(box, index) {
    if (index >= listBox.children.length) {
        listBox.appendChild(box);
        return;
    }
    listBox.insertBefore(box, listBox.children[index]);
}

function getTasksFromDOM(){
    const boxes = listBox.querySelectorAll('.box');
    return Array.from(boxes).map(box => {
        const span = box.querySelector('span');
        return {
            teskId : box.dataset.taskId,
            content: span ? span.textContent: ''
        };
    });
}

function saveTasksToStorage() {
    const tasks = getTasksFromDOM();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTaskFromStorage(){
    const rawTasks = localStorage.getItem(STORAGE_KEY);
    if(!rawTasks){
        return;
    }

    let tasks = [];
    try{
        tasks = JSON.parse(rawTasks);
    }
    catch(error){
        tasks = [];
    }

    if(!Array.isArray(tasks)){
        tasks = [];
    }

    let maxTaskNumber = 0;
    tasks.forEach(entry => {
        if(!entry || typeof entry.content != 'string'){
            return;
        }

        const safeTaskId = typeof entry.taskId == 'string' && entry.taskId ? entry.taskId : generateTaskId();
        const box = createListItem(entry.content, safeTaskId);
        listBox.appendChild(box);

        const idParts = safeTaskId.split('-');
        const numericPart = Number(idParts[idParts.length - 1]);
        if(Number.isFinite(numericPart)){
            maxTaskNumber = Math.max(maxTaskNumber, numericPart);
        }
    });
    nextTaskId = Math.max(nextTaskId, maxTaskNumber + 1);
}

function updateSelectionControls() {
    if (activeTaskId && !getBoxByTaskId(activeTaskId)) {
        activeTaskId = null;
    }

    const taskCount = listBox.querySelectorAll('.box').length;
    allSelectedContainer.style.display = taskCount > 0 ? 'flex' : 'none';
    emptyState.style.display = taskCount > 0 ? 'none' : 'block';

    const checkboxes = listBox.querySelectorAll('input[type="checkbox"]');
    const checkedCount = Array.from(checkboxes).filter(checkbox => checkbox.checked).length;
    const anyChecked = checkedCount > 0;
    const allChecked = checkboxes.length > 0 && checkedCount === checkboxes.length;

    allSelect.checked = allChecked;
    deleteSelectedBtn.style.display = anyChecked ? 'inline-block' : 'none';
}

function getTaskBoxes() {
    return Array.from(listBox.querySelectorAll('.box'));
}

function getActiveTaskIndex(boxes) {
    if (!boxes.length) {
        return -1;
    }

    if (activeTaskId) {
        const activeIndex = boxes.findIndex(box => box.dataset.taskId === activeTaskId);
        if (activeIndex !== -1) {
            return activeIndex;
        }
    }

    const checkedIndex = boxes.findIndex(box => {
        const checkbox = box.querySelector('input[type="checkbox"]');
        return checkbox && checkbox.checked;
    });

    if (checkedIndex !== -1) {
        activeTaskId = boxes[checkedIndex].dataset.taskId;
    }

    return checkedIndex;
}

function selectAdjacentTask(direction) {
    const boxes = getTaskBoxes();
    if (!boxes.length) {
        return;
    }

    let currentIndex = getActiveTaskIndex(boxes);
    if (currentIndex === -1) {
        currentIndex = direction > 0 ? -1 : boxes.length;
    }

    const nextIndex = Math.max(0, Math.min(boxes.length - 1, currentIndex + direction));
    const nextBox = boxes[nextIndex];
    const nextCheckbox = nextBox.querySelector('input[type="checkbox"]');
    if (!nextCheckbox) {
        return;
    }

    nextCheckbox.checked = true;
    activeTaskId = nextBox.dataset.taskId;
    nextCheckbox.focus();
    updateSelectionControls();
}

function handleAddClick() {
    addTasks();
}

document.onkeydown = (e) => {
    if (!e.shiftKey) {
        return;
    }

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectAdjacentTask(1);
    }

    if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectAdjacentTask(-1);
    }
};

function addTasks(taskValue = task.value.trim()) {
    if (!taskValue) {
        wrong.style.display = 'block';
        wrong.style.color = 'red';
        wrong.style.fontSize = '20px';
        wrong.textContent = 'Please enter a task.';
        return;
    }
    wrong.style.display = 'none';
    redoStack.length = 0;
    const taskId = generateTaskId();
    const box = createListItem(taskValue, taskId);
    listBox.appendChild(box);
    undoStack.push({
        type: "add",
        value: taskValue,
        taskId: taskId
    });
    task.value = '';
    updateSelectionControls();
    saveTasksToStorage();
}

function mouseEvents(target, editBtn, deleteBtn, saveBtn, state) {
    target.onmouseenter = () => {
        if (state.isEditing) {
            return;
        }
        editBtn.style.display = 'inline-block';
        deleteBtn.style.display = 'inline-block';
    };
    target.onmouseleave = () => {
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
        if (!state.isEditing) {
            saveBtn.style.display = 'none';
        }
    };
}

function createListItem(task, taskId = generateTaskId()) {
    const box = document.createElement('div');
    box.classList.add('box');
    box.dataset.taskId = taskId;

    const checkBox = document.createElement('input');
    checkBox.type = 'checkbox';
    checkBox.id = 'selected';
    checkBox.name = 'selected';

    const li = document.createElement('li');

    const span = document.createElement('span');
    span.textContent = task;

    const actions = document.createElement('div');

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.classList.add('edit-btn');
    editBtn.style.display = 'none';

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.style.display = 'none';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.classList.add('save-btn');
    saveBtn.style.display = 'none';
    const state = { isEditing: false };
    actions.append(editBtn, deleteBtn, saveBtn);
    li.append(span, actions);
    box.append(checkBox, li);
    mouseEvents(box, editBtn, deleteBtn, saveBtn, state);
    editBtn.onclick = () => {
        const oldValue = span.textContent;
        state.isEditing = true;
        span.contentEditable = true;
        span.focus();
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
        saveBtn.onclick = () => {
            const newValue = span.textContent.trim();
            if (newValue && newValue !== oldValue) {
                redoStack.length = 0;
                span.textContent = newValue;
                undoStack.push({
                    type: "edit",
                    taskId: taskId,
                    oldValue: oldValue,
                    newValue: newValue
                });
                saveTasksToStorage();
            }
            span.contentEditable = false;
            state.isEditing = false;
            saveBtn.style.display = 'none';
            if (box.matches(':hover')) {
                editBtn.style.display = 'inline-block';
                deleteBtn.style.display = 'inline-block';
            }
        };
    };

    deleteBtn.onclick = () => {
        redoStack.length = 0;
        const index = [...listBox.children].indexOf(box);
        const content = span.textContent;
        undoStack.push({
            type: "delete",
            taskId: taskId,
            index: index,
            content: content
        });
        box.remove();
        updateSelectionControls();
        saveTasksToStorage();
    };

    checkBox.onclick = () => {
        activeTaskId = taskId;
    };

    checkBox.onfocus = () => {
        activeTaskId = taskId;
    };

    checkBox.onchange = () => {
        activeTaskId = taskId;
        updateSelectionControls();
    };

    return box;
}

function handleUndoClick() {
    if (!undoStack.length) {
        return;
    }
    const action = undoStack.pop();
    redoStack.push(action);
    switch (action.type) {
        case "add": {
            const box = getBoxByTaskId(action.taskId);
            if (box) {
                box.remove();
            }
            break;
        }
        case "edit": {
            const box = getBoxByTaskId(action.taskId);
            if (!box) {
                break;
            }
            const span = box.querySelector('span');
            span.textContent = action.oldValue;
            break;
        }
        case "delete": {
            const box = createListItem(action.content, action.taskId);
            insertBoxAtIndex(box, action.index);
            break;
        }
        case "deleteMultiple": {
            const orderedItems = [...action.items].sort((a, b) => a.index - b.index);
            orderedItems.forEach(entry => {
                const box = createListItem(entry.content, entry.taskId);
                insertBoxAtIndex(box, entry.index);
            });
            break;
        }
    }
    updateSelectionControls();
    saveTasksToStorage();
}

function handleRedoClick() {
    if (!redoStack.length) {
        return;
    }
    const action = redoStack.pop();
    undoStack.push(action);
    switch (action.type) {
        case "add": {
            const box = createListItem(action.value, action.taskId);
            listBox.appendChild(box);
            break;
        }
        case "edit": {
            const box = getBoxByTaskId(action.taskId);
            if (!box) {
                break;
            }
            const span = box.querySelector('span');
            span.textContent = action.newValue;
            break;
        }
        case "delete": {
            const box = getBoxByTaskId(action.taskId);
            if (box) {
                box.remove();
            }
            break;
        }
        case "deleteMultiple":
            action.items.forEach(entry => {
                const box = getBoxByTaskId(entry.taskId);
                if (box) {
                    box.remove();
                }
            });
        break;
    }
    updateSelectionControls();
    saveTasksToStorage();
}

function handleSelectAllChange(e) {
    const checkboxes = listBox.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
    });
    updateSelectionControls();
}

function handleDeleteSelectedClick() {
    redoStack.length = 0;
    const selectedItems = listBox.querySelectorAll('input[type="checkbox"]:checked');

    if (!selectedItems.length) {
        return;
    }

    undoStack.push({
        type: "deleteMultiple",
        items: Array.from(selectedItems).map(checkbox => {
            const box = checkbox.closest('.box');
            const content = box.querySelector('span').textContent;
            return {
                taskId: box.dataset.taskId,
                content: content,
                index: [...listBox.children].indexOf(box)
            };
        })
    });

    selectedItems.forEach(checkbox => {
        const box = checkbox.closest('.box');
        box.remove();
    });

    updateSelectionControls();
    saveTasksToStorage();
}

loadTaskFromStorage();
updateSelectionControls();
