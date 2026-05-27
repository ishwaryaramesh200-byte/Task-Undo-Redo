const listBox = document.getElementById('list');
const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');
const task = document.getElementById('task');
const addBtn = document.querySelector('.add');
const wrong = document.getElementById('wrong');
const allSelect = document.getElementById('allSelect');
const deleteSelectedBtn = document.getElementById('deleteSelected');
const undoStack = [];
const redoStack = [];

addBtn.addEventListener('click', () => {
    addTasks();
});

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
    const box = createListItem(taskValue);
    listBox.appendChild(box);
    undoStack.push({
        type: "add",
        value: taskValue
    });
    task.value = '';
}

function mouseEvents(target, editBtn, deleteBtn, saveBtn, state) {
    target.addEventListener('mouseenter', () => {
        if (state.isEditing) {
            return;
        }
        editBtn.style.display = 'inline-block';
        deleteBtn.style.display = 'inline-block';
    });
    target.addEventListener('mouseleave', () => {
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
        if (!state.isEditing) {
            saveBtn.style.display = 'none';
        }
    });
}

function createListItem(task) {
    const box = document.createElement('div');
    box.classList.add('box');

    const checkBox = document.createElement('input');
    checkBox.type = 'checkbox';
    checkBox.id = 'selected';

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
    editBtn.addEventListener('click', () => {
        const oldValue = span.textContent;
        state.isEditing = true;
        span.contentEditable = true;
        span.focus();
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
        saveBtn.addEventListener('click', () => {
            const newValue = span.textContent.trim();
            if (newValue && newValue !== oldValue) {
                redoStack.length = 0;
                span.textContent = newValue;
                undoStack.push({
                    type: "edit",
                    oldValue: oldValue,
                    newValue: newValue
                });
            }
            span.contentEditable = false;
            state.isEditing = false;
            saveBtn.style.display = 'none';
            if (box.matches(':hover')) {
                editBtn.style.display = 'inline-block';
                deleteBtn.style.display = 'inline-block';
            }
        });
    });

    deleteBtn.addEventListener('click', () => {
        redoStack.length = 0;
        const index = [...listBox.children].indexOf(box);
        const content = span.textContent;
        undoStack.push({
            type: "delete",
            index: index,
            content: content
        });
        box.remove();
    });

    checkBox.addEventListener('change', () => {
        const checkboxes = listBox.querySelectorAll('input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
        allSelect.checked = allChecked;
        deleteSelectedBtn.style.display = Array.from(checkboxes).some(checkbox => checkbox.checked) ? 'inline-block' : 'none';
    });

    return box;
}

undoBtn.addEventListener('click', () => {
    if (!undoStack.length) {
        return;
    }
    const action = undoStack.pop();
    redoStack.push(action);
    switch (action.type) {
        case "add":
            listBox.removeChild(listBox.lastChild);
            break;
        case "edit":
            const items = listBox.querySelectorAll('span');
            items.forEach(item => {
                if (item.textContent === action.newValue) {
                    item.textContent = action.oldValue;
                }
            });
            break;
        case "delete":
            const box = createListItem(action.content);
            listBox.insertBefore(box, listBox.children[action.index]);
            break;
        case "deleteMultiple":
            action.items.forEach(entry => {
                const box = createListItem(entry.content);
                listBox.insertBefore(box, listBox.children[entry.index]);
            });
            break;
    }
});

redoBtn.addEventListener('click', () => {
    if (!redoStack.length) {
        return;
    }
    const action = redoStack.pop();
    undoStack.push(action);
    switch (action.type) {
        case "add":
            const box = createListItem(action.value);
            listBox.appendChild(box);
            break;
        case "edit":
            const items = listBox.querySelectorAll('span');
            items.forEach(item => {
                if (item.textContent === action.oldValue) {
                    item.textContent = action.newValue;
                }
            });
            break;
        case "delete":
            const item = listBox.querySelectorAll('.box');
            item.forEach((entry) => {
                const content = entry.querySelector('span');
                if (content && content.textContent === action.content) {
                    entry.remove();
                }
            });
            break;
        case "deleteMultiple":
            action.items.forEach(entry => {
                const item = listBox.querySelectorAll('.box');
                item.forEach((box) => {
                    const content = box.querySelector('span');
                    if (content && content.textContent === entry.content) {
                        box.remove();
                    }
                });
            });
        break;
    }
});

allSelect.addEventListener('change', (e) => {
    const checkboxes = listBox.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
    });
    deleteSelectedBtn.style.display = e.target.checked ? 'inline-block' : 'none';
    deleteSelectedBtn.addEventListener('click', () => {
        redoStack.length = 0;
        const selectedItems = listBox.querySelectorAll('input[type="checkbox"]:checked');
        undoStack.push({
            type: "deleteMultiple",
            items: Array.from(selectedItems).map(checkbox => {
                const box = checkbox.closest('.box');
                const content = box.querySelector('span').textContent;
                return { content, index: [...listBox.children].indexOf(box) };
            })
        });
        selectedItems.forEach(checkbox => {
            const box = checkbox.closest('.box');
            box.remove();
        });
        e.target.checked = false;
        deleteSelectedBtn.style.display = 'none';
    })
});
