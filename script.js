const listBox = document.getElementById('list');
const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');
const saveBtn = document.createElement('button');
saveBtn.style.display = 'none';
const task = document.getElementById('task');
const addBtn = document.querySelector('.add');
const undoStack = [];
const redoStack = [];

addBtn.addEventListener('click', () => {
    const taskValue = task.value.trim();
    if (taskValue) {
        addTasks(taskValue);
        task.value = '';
    }
});

function addTasks(task) {
    if (!task) {
        return;
    }
    redoStack.length = 0;
    const li = createListItem(task);
    listBox.appendChild(li);
    undoStack.push({
        type: "add",
        element: li,
        value: task
    });
}

function createListItem(task) {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = task;
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.classList.add('edit-btn');
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.classList.add('delete-btn');
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.style.display = 'none';
    li.append(span, editBtn, deleteBtn);
    editBtn.addEventListener('click', () => {
        const oldValue = span.textContent;
        span.contentEditable = true;
        span.focus();
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
        saveBtn.classList.add('save-btn');
        li.appendChild(saveBtn);
        saveBtn.addEventListener('click', () => {
            const newValue = span.textContent.trim();
            if (newValue && newValue !== oldValue) {
                redoStack.length = 0;
                span.textContent = newValue;
                undoStack.push({
                    type: "edit",
                    element: li,
                    oldValue: oldValue,
                    newValue: newValue
                });
            }
            editBtn.style.display = 'inline-block';
            deleteBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
            li.appendChild(editBtn);
            li.appendChild(deleteBtn);
        });
    });

    deleteBtn.addEventListener('click', () => {
        redoStack.length = 0;
        const index = [...listBox.children].indexOf(li);
        undoStack.push({
            type: "delete",
            element: li,
            index: index
        });
        li.remove();
    });
    return li;
}

undoBtn.addEventListener('click', () => {
    if (!undoStack.length) {
        return;
    }

    const action = undoStack.pop();
    redoStack.push(action);
    switch (action.type) {
        case "add":
            action.element.remove();
            break;
        case "edit":
            action.element.querySelector('span').textContent =action.oldValue;
            break;
        case "delete":
            const children = listBox.children;
            if (action.index >= children.length) {
                listBox.appendChild(action.element);
            }
            else {
                listBox.insertBefore(action.element,children[action.index]);
            }
            break;
    }
});

redoBtn.addEventListener('click', () => {
    if (!redoStack.length) return;
    const action = redoStack.pop();
    undoStack.push(action);

    switch (action.type) {
        case "add":
            listBox.appendChild(action.element);
            break;
        case "edit":
            action.element.querySelector('span').textContent =action.newValue;
            break;
        case "delete":
            action.element.remove();
        break;
    }
});